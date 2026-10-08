import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private _collapsed = new BehaviorSubject<boolean>(false);
  collapsed$ = this._collapsed.asObservable();

  get isCollapsed(): boolean {
    return this._collapsed.value;
  }

  toggle(): void {
    this._collapsed.next(!this._collapsed.value);
  }

  setCollapsed(value: boolean): void {
    this._collapsed.next(value);
  }
}
