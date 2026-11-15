import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subscription, of, switchMap, tap, catchError } from 'rxjs';
import { SearchResult, SearchService } from '../../services/search.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nService);

  query = '';
  input = '';
  result: SearchResult | null = null;
  isLoading = false;
  errorMessage = '';
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // the search is repeated every time the address (?q=...) changes
    this.sub = this.route.queryParamMap.pipe(
      tap(params => {
        this.query = (params.get('q') || '').trim();
        this.input = this.query;
        this.errorMessage = '';
        this.result = null;
        this.isLoading = this.query.length >= 2;
        this.cdr.detectChanges();
      }),
      switchMap(() =>
        this.query.length < 2
          ? of(null)
          : this.searchService.search(this.query).pipe(
              catchError(() => {
                this.errorMessage = this.i18n.t('error.search');
                return of(null);
              })
            )
      )
    ).subscribe(res => {
      this.result = res;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  submit(): void {
    this.router.navigate(['/search'], { queryParams: { q: this.input.trim() } });
  }

  get total(): number {
    return this.result ? this.result.cars.length + this.result.brands.length + this.result.sellers.length : 0;
  }
}
