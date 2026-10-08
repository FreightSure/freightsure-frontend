import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlService, PredictionResult, TrainingResult } from '../../../core/services/ml.service';
import { MissionService } from '../../../core/services/mission.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MissionDto, EmployeeDto, VehicleDto } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights.html',
  styleUrls: ['./insights.css']
})
export class Insights implements OnInit {

  missions:  MissionDto[]  = [];
  employees: EmployeeDto[] = [];
  vehicles:  VehicleDto[]  = [];

  isLoading      = false;
  isTraining     = false;
  trainingDone   = false;
  modelLoaded    = false;  // loaded from localStorage
  trainingResult: TrainingResult | null = null;

  // Training progress
  trainingPhase     = '';
  trainingProgress  = 0;
  currentEpoch      = 0;
  totalEpochs       = 100;   // 60 dataset + 40 finetune
  currentLoss       = 0;
  phaseProgress     = 0;

  // Prediction
  selectedMissionId = '';
  isPredicting      = false;
  prediction: PredictionResult | null = null;
  predictionError   = '';

  // Batch scan
  batchResults: { mission: MissionDto; result: PredictionResult }[] = [];
  isBatchRunning = false;

  get labeledCount(): number {
    return this.missions.filter(m => m.status === 2 || m.status === 3).length;
  }
  get pendingMissions(): MissionDto[] {
    return this.missions.filter(m => m.status === 0 || m.status === 1);
  }
  get completedMissions(): MissionDto[] {
    return this.missions.filter(m => m.status === 2 || m.status === 3);
  }

  constructor(
    public  ml:              MlService,
    private missionService:  MissionService,
    private employeeService: EmployeeService,
    private vehicleService:  VehicleService,
    private toast:           ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadData();
    // Auto-load saved model from localStorage
    const loaded = await this.ml.loadSavedModel();
    if (loaded) {
      this.modelLoaded = true;
      this.trainingDone = true;
      this.toast.success(`✅ AI Model loaded from memory (${this.ml.sampleCount} samples trained)`);
    }
  }

  loadData(): void {
    this.isLoading = true;
    let n = 0;
    const done = () => { if (++n === 3) this.isLoading = false; };
    this.missionService.getAll().subscribe({  next: d => { this.missions  = d; done(); }, error: () => done() });
    this.employeeService.getAll().subscribe({ next: d => { this.employees = d; done(); }, error: () => done() });
    this.vehicleService.getAll().subscribe({  next: d => { this.vehicles  = d; done(); }, error: () => done() });
  }

  getMissionLabel(m: MissionDto): string {
    const emp  = this.employees.find(e => e.id === m.employeeId);
    return `${m.origine ?? '?'} → ${m.destination ?? '?'} (${emp?.matricule ?? '?'})`;
  }

  // ── TRAIN ─────────────────────────────────────────────────────────
  async trainModel(): Promise<void> {
    this.isTraining     = true;
    this.trainingDone   = false;
    this.trainingResult = null;
    this.prediction     = null;
    this.trainingProgress = 0;
    this.phaseProgress    = 0;
    this.currentEpoch     = 0;

    try {
      const result = await this.ml.train(
        this.missions, this.employees, this.vehicles,
        (epoch, loss, phase) => {
          this.trainingPhase = phase;
          this.currentEpoch  = epoch;
          this.currentLoss   = loss;

          if (phase.includes('pre')) {
            // Phase 1: epochs 1-60
            this.phaseProgress    = Math.round((epoch / 60) * 100);
            this.trainingProgress = Math.round((epoch / this.totalEpochs) * 100);
          } else {
            // Phase 2: fine-tuning
            const ftTotal = Math.min(40, this.labeledCount * 5);
            this.phaseProgress    = Math.round((epoch / ftTotal) * 100);
            this.trainingProgress = Math.round(((60 + epoch) / this.totalEpochs) * 100);
          }
        }
      );
      this.trainingResult = result;
      this.trainingDone   = true;
      this.modelLoaded    = false;
      const acc = Math.round(result.accuracy * 100);
      this.toast.success(
        `✅ Model trained! Dataset:${result.datasetSamples} + Real:${result.realSamples} samples · ${acc}% accuracy${result.modelSaved ? ' · 💾 Saved!' : ''}`
      );
    } catch (err: any) {
      this.toast.error(err.message || 'Training failed');
    } finally {
      this.isTraining       = false;
      this.trainingProgress = 100;
      this.phaseProgress    = 100;
    }
  }

  // ── PREDICT ───────────────────────────────────────────────────────
  async predict(): Promise<void> {
    if (!this.selectedMissionId) { this.predictionError = 'Please select a mission.'; return; }
    const mission = this.missions.find(m => m.id === this.selectedMissionId);
    if (!mission) return;
    this.isPredicting    = true;
    this.predictionError = '';
    this.prediction      = null;
    try {
      this.prediction = await this.ml.predict(mission, this.missions, this.employees, this.vehicles);
    } catch (err: any) {
      this.predictionError = err.message;
    } finally {
      this.isPredicting = false;
    }
  }

  // ── BATCH SCAN ────────────────────────────────────────────────────
  async batchPredict(): Promise<void> {
    if (!this.ml.isModelTrained) { this.toast.error('Train the model first!'); return; }
    this.isBatchRunning = true;
    this.batchResults   = [];
    for (const m of this.pendingMissions) {
      try {
        const r = await this.ml.predict(m, this.missions, this.employees, this.vehicles);
        this.batchResults.push({ mission: m, result: r });
      } catch {}
    }
    this.batchResults.sort((a, b) => b.result.delayProbability - a.result.delayProbability);
    this.isBatchRunning = false;
    this.toast.success(`Scanned ${this.batchResults.length} active missions`);
  }

  pctBar(val: number): number { return Math.round(val * 100); }
}
