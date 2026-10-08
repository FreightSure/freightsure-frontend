import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new Subject<Toast>();
  private counter = 0;

  readonly toasts = this.toasts$.asObservable();

  success(message: string, duration = 4000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 6000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 5000): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.show('info', message, duration);
  }

  private show(type: Toast['type'], message: string, duration: number): void {
    this.toasts$.next({ id: ++this.counter, type, message, duration });
  }
}
