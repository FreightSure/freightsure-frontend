import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (totalPages > 1 || showAlways) {
      <div class="pagination-bar">
        <div class="page-size-selector">
          <span>Rows per page:</span>
          <select [(ngModel)]="currentPageSize" (ngModelChange)="onPageSizeChange($event)">
            <option [ngValue]="10">10</option>
            <option [ngValue]="25">25</option>
            <option [ngValue]="50">50</option>
            <option [ngValue]="100">100</option>
          </select>
        </div>

        <div class="page-info">
          {{ rangeStart }}–{{ rangeEnd }} of {{ totalItems }}
        </div>

        <div class="page-controls">
          <button class="page-btn" [disabled]="currentPage === 1" (click)="go(1)" title="First">«</button>
          <button class="page-btn" [disabled]="currentPage === 1" (click)="go(currentPage - 1)" title="Previous">‹</button>

          @for (p of pages; track p) {
            <button class="page-btn" [class.active]="p === currentPage" (click)="go(p)">{{ p }}</button>
          }

          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="go(currentPage + 1)" title="Next">›</button>
          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="go(totalPages)" title="Last">»</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-top: 1px solid #e3e8f1;
      background: #f8fafc; flex-wrap: wrap; gap: 10px;
    }
    .page-size-selector { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #65738e; }
    .page-size-selector select { border: 1px solid #d5deeb; border-radius: 6px; padding: 4px 8px; font-size: 13px; color: #273858; outline: none; }
    .page-info { font-size: 13px; color: #65738e; }
    .page-controls { display: flex; gap: 4px; }
    .page-btn {
      width: 32px; height: 32px; border: 1px solid #d5deeb; background: #fff;
      border-radius: 7px; font-size: 13px; cursor: pointer; color: #374151;
      display: flex; align-items: center; justify-content: center;
      transition: 0.15s;
    }
    .page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
    .page-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 700; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    :host-context(html.dark) .pagination-bar { background: #1e293b; border-top-color: #334155; }
    :host-context(html.dark) .page-info     { color: #94a3b8; }
    :host-context(html.dark) .page-size-selector { color: #94a3b8; }
    :host-context(html.dark) .page-size-selector select { background: #0f172a; border-color: #475569; color: #f1f5f9; }
    :host-context(html.dark) .page-btn { background: #1e293b; border-color: #475569; color: #e2e8f0; }
    :host-context(html.dark) .page-btn:hover:not(:disabled) { background: #334155; }
    :host-context(html.dark) .page-btn.active { background: #2563eb; color: #fff; }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() showAlways = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  currentPageSize = 10;
  pages: number[] = [];
  totalPages = 1;

  get rangeStart(): number { return Math.min((this.currentPage - 1) * this.pageSize + 1, this.totalItems); }
  get rangeEnd(): number   { return Math.min(this.currentPage * this.pageSize, this.totalItems); }

  ngOnChanges(): void {
    this.currentPageSize = this.pageSize;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    this.buildPages();
  }

  buildPages(): void {
    const max = 7;
    const half = Math.floor(max / 2);
    let start = Math.max(1, this.currentPage - half);
    let end   = Math.min(this.totalPages, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    this.pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(Number(size));
  }
}
