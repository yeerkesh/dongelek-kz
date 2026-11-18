import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PricePipe } from '../../pipes/price.pipe';
import { SearchService, SellerPage } from '../../services/search.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [TPipe, RouterLink, DatePipe, PricePipe],
  templateUrl: './seller.component.html',
  styleUrl: './seller.component.css'
})
export class SellerComponent implements OnInit {
  private i18n = inject(I18nService);

  seller: SellerPage | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.searchService.getSeller(id).subscribe({
      next: s => { this.seller = s; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => {
        this.errorMessage = this.i18n.t('error.sellerNotFound');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
