import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="remove(toast.id)">
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      animation: slideIn 0.3s ease;
      min-width: 280px;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .toast-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
    .toast-error   { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
    .toast-warning { background: #fffbeb; color: #92400e; border-left: 4px solid #f59e0b; }
    .toast-info    { background: #eff6ff; color: #1e40af; border-left: 4px solid #3b82f6; }
    .toast-icon { font-size: 18px; }
    .toast-message { flex: 1; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      font-size: 18px; opacity: 0.6; padding: 0;
      color: inherit;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  private sub!: Subscription;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts.subscribe(toast => {
      this.toasts.push(toast);
      const timer = setTimeout(() => this.remove(toast.id), toast.duration ?? 4000);
      this.timers.set(toast.id, timer);
    });
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.timers.forEach(t => clearTimeout(t));
  }
}
