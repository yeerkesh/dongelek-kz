import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TPipe } from '../../pipes/t.pipe';

@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [TPipe],
  template: `
    <div class="pager">
      <span class="total">{{ 'admin.total' | t: { n: count } }}</span>
      @if (pages > 1) {
        <button type="button" (click)="go(page - 1)" [disabled]="page <= 1">‹</button>
        <span>{{ 'admin.page' | t: { page: page, pages: pages } }}</span>
        <button type="button" (click)="go(page + 1)" [disabled]="page >= pages">›</button>
      }
    </div>
  `
})
export class PagerComponent {
  @Input() page = 1;
  @Input() count = 0;
  @Input() pageSize = 10;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number {
    return Math.max(1, Math.ceil(this.count / this.pageSize));
  }

  go(page: number): void {
    if (page >= 1 && page <= this.pages) this.pageChange.emit(page);
  }
}
