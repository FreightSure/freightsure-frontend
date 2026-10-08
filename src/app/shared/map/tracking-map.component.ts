import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  vehicleId: string;
  date: string;
}

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div class="map-header">
        <h3>🗺 Live Map</h3>
        <span class="marker-count">{{ markers.length }} tracking point(s)</span>
      </div>
      <div id="tracking-map" class="leaflet-map"></div>
      @if (markers.length === 0) {
        <div class="map-empty">No tracking points to display</div>
      }
    </div>
  `,
  styles: [`
    .map-wrapper { border-radius: 14px; overflow: hidden; border: 1px solid #e3e8f1; background: #fff; }
    .map-header  { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #e3e8f1; }
    .map-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #10213f; }
    .marker-count { font-size: 12px; color: #6b7a99; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; }
    .leaflet-map { height: 420px; width: 100%; z-index: 0; }
    .map-empty   { text-align: center; padding: 30px; color: #94a1b8; font-size: 13px; }

    :host-context(html.dark) .map-wrapper { background: #1e293b; border-color: #334155; }
    :host-context(html.dark) .map-header  { border-bottom-color: #334155; }
    :host-context(html.dark) .map-header h3 { color: #f1f5f9; }
    :host-context(html.dark) .marker-count { background: #334155; color: #94a3b8; }
  `]
})
export class TrackingMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() markers: MapMarker[] = [];

  private map: any = null;
  private leafletMarkers: any[] = [];
  private L: any = null;

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['markers'] && this.map) {
      this.updateMarkers();
    }
  }

  private async initMap(): Promise<void> {
    try {
      this.L = await import('leaflet');
      const L = this.L;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      this.map = L.map('tracking-map', { zoomControl: true, scrollWheelZoom: true });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18
      }).addTo(this.map);

      // Default view — Tunisia center
      this.map.setView([33.8869, 9.5375], 6);

      this.updateMarkers();
    } catch (e) {
      console.error('Leaflet init error:', e);
    }
  }

  private updateMarkers(): void {
    if (!this.map || !this.L) return;
    const L = this.L;

    // Clear old markers
    this.leafletMarkers.forEach(m => m.remove());
    this.leafletMarkers = [];

    if (this.markers.length === 0) return;

    const bounds: [number, number][] = [];

    this.markers.forEach(marker => {
      if (!marker.lat || !marker.lng) return;

      // Custom colored icon
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:#2563eb;border:2px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);font-size:14px;">🚛</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const m = L.marker([marker.lat, marker.lng], { icon })
        .addTo(this.map)
        .bindPopup(`
          <div style="font-size:13px;line-height:1.6">
            <strong>🚛 ${marker.label}</strong><br>
            📍 ${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}<br>
            📅 ${new Date(marker.date).toLocaleDateString('fr-FR')}
          </div>
        `);

      this.leafletMarkers.push(m);
      bounds.push([marker.lat, marker.lng]);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }

  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); this.map = null; }
  }
}
