import { Pipe, PipeTransform } from '@angular/core';

/** 12000000 -> "12 000 000" (as on Kolesa.kz) */
@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return Math.round(value).toLocaleString('ru-RU').replace(/\u202F/g, '\u00A0');
  }
}
