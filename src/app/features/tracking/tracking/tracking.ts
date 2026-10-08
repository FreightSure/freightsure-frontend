import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackingService } from '../../../core/services/tracking.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MissionService } from '../../../core/services/mission.service';
import { VehicleTrackingDto, CreateVehicleTrackingCommand, VehicleDto, MissionDto } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { TrackingMapComponent, MapMarker } from '../../../shared/map/tracking-map.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, TrackingMapComponent, PaginationComponent],
  templateUrl: './tracking.html',
  styleUrls: ['./tracking.css']
})
export class Tracking implements OnInit {

  trackings: VehicleTrackingDto[] = [];
  vehicles: VehicleDto[] = [];
  missions: MissionDto[] = [];
  searchTerm = '';
  isLoading = false;
  submitError = '';
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  deleteConfirmId: string | null = null;
  deleteConfirmName = '';
  showMap = true;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  form: CreateVehicleTrackingCommand & { id?: string } = this.emptyForm();

  constructor(
    private trackingService: TrackingService,
    private vehicleService: VehicleService,
    private missionService: MissionService,
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit(): void { this.load(); this.loadVehicles(); this.loadMissions(); }

  load(): void {
    this.isLoading = true;
    this.trackingService.getAll().subscribe({
      next: (data) => { this.trackings = data; this.isLoading = false; },
      error: (err) => { this.toast.error(`Failed to load tracking data (HTTP ${err.status})`); this.isLoading = false; }
    });
  }

  loadVehicles(): void { this.vehicleService.getAll().subscribe({ next: (d) => { this.vehicles = d; } }); }
  loadMissions(): void { this.missionService.getAll().subscribe({ next: (d) => { this.missions = d; } }); }

  getVehicleLabel(id: string): string {
    const v = this.vehicles.find(v => v.id === id);
    return v ? v.immatriculation : id.substring(0, 8) + '...';
  }

  getMissionLabel(id: string): string {
    const m = this.missions.find(m => m.id === id);
    return m ? `${m.origine} → ${m.destination}` : id.substring(0, 8) + '...';
  }

  get filteredTrackings(): VehicleTrackingDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.trackings;
    return this.trackings.filter(t =>
      this.getVehicleLabel(t.vehicleId).toLowerCase().includes(s) ||
      this.getMissionLabel(t.missionId).toLowerCase().includes(s)
    );
  }

  // Pagination
  get pagedTrackings(): VehicleTrackingDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTrackings.slice(start, start + this.pageSize);
  }
  onPageChange(page: number): void    { this.currentPage = page; }
  onPageSizeChange(size: number): void { this.pageSize = size; this.currentPage = 1; }

  // Map markers
  get mapMarkers(): MapMarker[] {
    return this.trackings
      .filter(t => t.latitude && t.longitude)
      .map(t => ({
        lat: t.latitude, lng: t.longitude,
        label: this.getVehicleLabel(t.vehicleId),
        vehicleId: t.vehicleId,
        date: t.trackingDate
      }));
  }

  openAddModal(): void {
    this.form = this.emptyForm(); this.submitError = '';
    this.isEditing = false; this.showModal = true;
  }

  openEditModal(t: VehicleTrackingDto): void {
    this.form = {
      id: t.id, vehicleId: t.vehicleId, missionId: t.missionId,
      latitude: t.latitude, longitude: t.longitude,
      trackingDate: t.trackingDate.substring(0, 10)
    };
    this.submitError = ''; this.isEditing = true; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitForm(): void {
    this.submitError = '';
    if (!this.form.vehicleId) { this.submitError = 'Please select a vehicle.'; return; }
    if (!this.form.missionId) { this.submitError = 'Please select a mission.'; return; }
    this.isSubmitting = true;

    if (this.isEditing && this.form.id) {
      this.trackingService.update(this.form as any).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Tracking updated!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    } else {
      this.trackingService.create(this.form).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Tracking point added!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    }
  }

  confirmDelete(t: VehicleTrackingDto): void {
    this.deleteConfirmId = t.id;
    this.deleteConfirmName = `${this.getVehicleLabel(t.vehicleId)} — ${t.trackingDate.substring(0, 10)}`;
  }
  cancelDelete(): void { this.deleteConfirmId = null; this.deleteConfirmName = ''; }

  deleteTracking(): void {
    if (!this.deleteConfirmId) return;
    const id = this.deleteConfirmId; const name = this.deleteConfirmName;
    this.deleteConfirmId = null; this.deleteConfirmName = '';
    this.trackingService.delete(id).subscribe({
      next: () => { this.trackings = this.trackings.filter(t => t.id !== id); this.toast.success(`Tracking "${name}" deleted.`); },
      error: (err) => { this.toast.error(err.error?.message || `Delete failed (HTTP ${err.status})`); }
    });
  }

  private emptyForm(): CreateVehicleTrackingCommand {
    return { vehicleId: '', missionId: '', latitude: 0, longitude: 0, trackingDate: new Date().toISOString().substring(0, 10) };
  }
}
