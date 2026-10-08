import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MissionDto, EmployeeDto, VehicleDto } from '../models/api.models';

export interface MissionFeatures {
  dayOfWeek:          number;   // 0–6
  month:              number;   // 1–12
  plannedDays:        number;   // dateFin - dateDebut
  vehicleStatus:      number;   // 0=Available 1=OnMission 2=Maintenance 3=OutOfService
  employeeRate:       number;   // historical completion rate 0–1
  concurrentMissions: number;   // overlapping missions count
}

export interface DatasetRecord {
  dayOfWeek:          number;
  month:              number;
  plannedDays:        number;
  vehicleStatus:      number;
  employeeRate:       number;
  concurrentMissions: number;
  label:              number;   // 0=OK, 1=delayed/cancelled
}

export interface PredictionResult {
  delayProbability: number;
  riskLevel:        'Low' | 'Medium' | 'High';
  riskColor:        string;
  confidence:       number;
  explanation:      string[];
}

export interface TrainingResult {
  epochs:          number;
  finalLoss:       number;
  samples:         number;
  accuracy:        number;
  datasetSamples:  number;
  realSamples:     number;
  modelSaved:      boolean;
}

const STORAGE_KEY = 'fs_ml_model_v2';

@Injectable({ providedIn: 'root' })
export class MlService {

  private model: any        = null;
  private tf: any           = null;
  private _isTrained        = false;
  private _trainingSamples  = 0;
  private _datasetSamples   = 0;
  private _accuracy         = 0;

  constructor(private http: HttpClient) {}

  // ── 1. Lazy-load TensorFlow.js ───────────────────────────────────
  private async loadTf(): Promise<any> {
    if (!this.tf) {
      this.tf = await import('@tensorflow/tfjs');
    }
    return this.tf;
  }

  // ── 2. Build model architecture ──────────────────────────────────
  private async buildModel(): Promise<any> {
    const tf = await this.loadTf();
    const model = tf.sequential();

    // Layer 1: 6 → 32 (wider for dataset pre-training)
    model.add(tf.layers.dense({
      inputShape: [6], units: 32, activation: 'relu',
      kernelInitializer: 'glorotUniform',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.25 }));

    // Layer 2: 32 → 16
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.15 }));

    // Layer 3: 16 → 8
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));

    // Output: sigmoid probability
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.005),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  // ── 3. Normalize 6 features → [0,1] ──────────────────────────────
  private normalize(f: MissionFeatures | DatasetRecord): number[] {
    return [
      ('dayOfWeek' in f ? f.dayOfWeek : 0)         / 6,
      ((f.month - 1))                               / 11,
      Math.min(f.plannedDays, 30)                   / 30,
      f.vehicleStatus                               / 3,
      f.employeeRate,
      Math.min(f.concurrentMissions, 10)            / 10
    ];
  }

  // ── 4. Extract features from a real mission ───────────────────────
  extractFeatures(
    mission: MissionDto,
    allMissions: MissionDto[],
    employees: EmployeeDto[],
    vehicles: VehicleDto[]
  ): MissionFeatures {
    const start      = mission.dateDebut ? new Date(mission.dateDebut) : new Date();
    const end        = mission.dateFin   ? new Date(mission.dateFin)   : new Date();
    const plannedDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));

    const empMissions   = allMissions.filter(m => m.employeeId === mission.employeeId && m.id !== mission.id);
    const completed     = empMissions.filter(m => m.status === 2).length;
    const employeeRate  = empMissions.length > 0 ? completed / empMissions.length : 0.6;

    const vehicle    = vehicles.find(v => v.id === mission.vehicleId);
    const vStatusMap: Record<string, number> = {
      'Available': 0, 'OnMission': 1, 'Maintenance': 2, 'OutOfService': 3
    };
    const vehicleStatus = vehicle ? (vStatusMap[vehicle.status] ?? 0) : 0;

    const concurrentMissions = allMissions.filter(m => {
      if (m.id === mission.id || m.status === 3) return false;
      const mS = m.dateDebut ? new Date(m.dateDebut) : null;
      const mE = m.dateFin   ? new Date(m.dateFin)   : null;
      if (!mS || !mE) return false;
      return mS <= end && mE >= start;
    }).length;

    return {
      dayOfWeek: start.getDay(),
      month: start.getMonth() + 1,
      plannedDays,
      vehicleStatus,
      employeeRate,
      concurrentMissions
    };
  }

  // ── 5. Load synthetic dataset from assets ────────────────────────
  private async loadDataset(): Promise<DatasetRecord[]> {
    try {
      const data = await firstValueFrom(
        this.http.get<DatasetRecord[]>('/assets/ml-dataset.json')
      );
      return data;
    } catch (e) {
      console.warn('Could not load ml-dataset.json, using fallback');
      return [];
    }
  }

  // ── 6. PHASE 1 — Pre-train on synthetic dataset ───────────────────
  private async pretrainOnDataset(
    onProgress?: (epoch: number, loss: number, phase: string) => void
  ): Promise<{ samples: number; accuracy: number }> {
    const tf      = await this.loadTf();
    const dataset = await this.loadDataset();
    if (dataset.length === 0) return { samples: 0, accuracy: 0 };

    // Shuffle dataset
    const shuffled = [...dataset].sort(() => Math.random() - 0.5);

    const xData = shuffled.map(d => this.normalize(d));
    const yData = shuffled.map(d => d.label);

    const xs = tf.tensor2d(xData);
    const ys = tf.tensor2d(yData, [yData.length, 1]);

    let finalAcc = 0;
    const epochs = 60;

    await this.model.fit(xs, ys, {
      epochs,
      batchSize: 32,
      validationSplit: 0.15,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          finalAcc = logs?.val_acc ?? logs?.val_accuracy ?? logs?.acc ?? logs?.accuracy ?? 0;
          if (onProgress) onProgress(epoch + 1, logs?.loss ?? 1, 'Dataset pre-training');
        }
      }
    });

    xs.dispose();
    ys.dispose();

    return { samples: dataset.length, accuracy: finalAcc };
  }

  // ── 7. PHASE 2 — Fine-tune on real mission data ───────────────────
  private async finetune(
    missions: MissionDto[],
    employees: EmployeeDto[],
    vehicles: VehicleDto[],
    onProgress?: (epoch: number, loss: number, phase: string) => void
  ): Promise<{ samples: number; accuracy: number }> {
    const tf     = await this.loadTf();
    const labeled = missions.filter(m => m.status === 2 || m.status === 3);
    if (labeled.length === 0) return { samples: 0, accuracy: 0 };

    const xData: number[][] = [];
    const yData: number[]   = [];

    for (const m of labeled) {
      const features = this.extractFeatures(m, missions, employees, vehicles);
      xData.push(this.normalize(features));
      yData.push(m.status === 3 ? 1 : 0);
    }

    const xs = tf.tensor2d(xData);
    const ys = tf.tensor2d(yData, [yData.length, 1]);

    // Lower learning rate for fine-tuning
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    let finalAcc  = 0;
    const epochs  = Math.min(40, labeled.length * 5);

    await this.model.fit(xs, ys, {
      epochs,
      batchSize: Math.min(8, labeled.length),
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          finalAcc = logs?.acc ?? logs?.accuracy ?? 0;
          if (onProgress) onProgress(epoch + 1, logs?.loss ?? 1, 'Fine-tuning on your data');
        }
      }
    });

    xs.dispose();
    ys.dispose();

    return { samples: labeled.length, accuracy: finalAcc };
  }

  // ── 8. SAVE model to localStorage ────────────────────────────────
  private async saveModel(): Promise<boolean> {
    try {
      const tf = await this.loadTf();
      await this.model.save(`localstorage://${STORAGE_KEY}`);
      localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify({
        trained: true,
        samples: this._trainingSamples,
        dataset: this._datasetSamples,
        accuracy: this._accuracy,
        date: new Date().toISOString()
      }));
      return true;
    } catch (e) {
      console.warn('Could not save model to localStorage:', e);
      return false;
    }
  }

  // ── 9. LOAD model from localStorage ──────────────────────────────
  async loadSavedModel(): Promise<boolean> {
    try {
      const tf   = await this.loadTf();
      const meta = localStorage.getItem(`${STORAGE_KEY}_meta`);
      if (!meta) return false;

      this.model = await tf.loadLayersModel(`localstorage://${STORAGE_KEY}`);
      const m    = JSON.parse(meta);
      this._isTrained       = true;
      this._trainingSamples = m.samples ?? 0;
      this._datasetSamples  = m.dataset ?? 0;
      this._accuracy        = m.accuracy ?? 0;
      console.log(`✅ ML model loaded from localStorage (trained ${m.date})`);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── 10. MAIN TRAIN — Dataset pre-train + fine-tune ───────────────
  async train(
    missions: MissionDto[],
    employees: EmployeeDto[],
    vehicles: VehicleDto[],
    onProgress?: (epoch: number, loss: number, phase: string) => void
  ): Promise<TrainingResult> {
    const tf = await this.loadTf();

    // Build fresh model
    this.model = await this.buildModel();

    // Phase 1: pre-train on 400-sample synthetic dataset
    const dsResult = await this.pretrainOnDataset(onProgress);

    // Phase 2: fine-tune on real mission data
    const ftResult = await this.finetune(missions, employees, vehicles, onProgress);

    this._isTrained       = true;
    this._trainingSamples = dsResult.samples + ftResult.samples;
    this._datasetSamples  = dsResult.samples;
    this._accuracy        = ftResult.accuracy > 0 ? ftResult.accuracy : dsResult.accuracy;

    // Save to localStorage for persistence
    const saved = await this.saveModel();

    return {
      epochs:         60 + Math.min(40, ftResult.samples * 5),
      finalLoss:      0,
      samples:        this._trainingSamples,
      accuracy:       this._accuracy,
      datasetSamples: dsResult.samples,
      realSamples:    ftResult.samples,
      modelSaved:     saved
    };
  }

  // ── 11. PREDICT ──────────────────────────────────────────────────
  async predict(
    mission: MissionDto,
    allMissions: MissionDto[],
    employees: EmployeeDto[],
    vehicles: VehicleDto[]
  ): Promise<PredictionResult> {
    if (!this._isTrained || !this.model) {
      throw new Error('Model not trained. Click "Train Model" first.');
    }

    const tf         = await this.loadTf();
    const features   = this.extractFeatures(mission, allMissions, employees, vehicles);
    const normalized = this.normalize(features);

    const inputTensor  = tf.tensor2d([normalized]);
    const outputTensor = this.model.predict(inputTensor) as any;
    const [[probability]] = await outputTensor.array();
    inputTensor.dispose();
    outputTensor.dispose();

    const confidence = Math.min(0.97, 0.75 + (this._trainingSamples / 1000) * 0.22);
    const riskLevel  = probability >= 0.65 ? 'High' : probability >= 0.35 ? 'Medium' : 'Low';
    const riskColor  = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981';

    const explanation: string[] = [];
    if (features.vehicleStatus === 2) explanation.push('⚠ Vehicle is in maintenance');
    if (features.vehicleStatus === 3) explanation.push('🔴 Vehicle is out of service');
    if (features.employeeRate < 0.4)  explanation.push('⚠ Employee has low success history (<40%)');
    else if (features.employeeRate < 0.6) explanation.push('ℹ Employee success rate is average');
    else explanation.push('✓ Employee has good track record');
    if (features.plannedDays > 20)    explanation.push('⚠ Very long mission duration (>20 days)');
    else if (features.plannedDays > 12) explanation.push('ℹ Longer mission — moderate risk');
    if (features.concurrentMissions > 6) explanation.push('⚠ Heavy concurrent mission load');
    if (features.month >= 6 && features.month <= 8) explanation.push('ℹ Summer period — historically higher risk');
    if (features.dayOfWeek === 0 || features.dayOfWeek === 6) explanation.push('ℹ Weekend start');
    if (explanation.filter(e => e.startsWith('✓')).length === 1 && explanation.length === 1)
      explanation.push('✓ All other indicators look normal');

    return { delayProbability: probability, riskLevel, riskColor, confidence, explanation };
  }

  // ── Getters ───────────────────────────────────────────────────────
  get isModelTrained(): boolean { return this._isTrained; }
  get sampleCount():    number  { return this._trainingSamples; }
  get datasetCount():   number  { return this._datasetSamples; }
  get modelAccuracy():  number  { return this._accuracy; }
}
