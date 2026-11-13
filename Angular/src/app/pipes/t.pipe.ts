import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

/** Usage in templates:  {{ 'nav.ads' | t }}  or  [placeholder]="'home.search' | t" */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    this.i18n.lang(); // re-render when the language changes
    return this.i18n.t(key, params);
  }
}
