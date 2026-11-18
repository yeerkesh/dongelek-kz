import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/**
 * For text fields that must contain a number:
 *   <input appDigits>               - only digits 0-9 (no minus, no letters, no arrows)
 *   <input appDigits="decimal">     - digits and one dot (2.0)
 * Combine with maxlength to limit the length.
 */
@Directive({ selector: 'input[appDigits]', standalone: true })
export class DigitsDirective {
  @Input('appDigits') mode: '' | 'decimal' = '';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    let cleaned: string;

    if (this.mode === 'decimal') {
      cleaned = input.value.replace(',', '.').replace(/[^0-9.]/g, '');
      const dot = cleaned.indexOf('.');
      if (dot !== -1) cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
    } else {
      cleaned = input.value.replace(/\D/g, '');
    }

    if (cleaned !== input.value) {
      input.value = cleaned;
      input.dispatchEvent(new Event('input'));   // let ngModel see the cleaned value
    }
  }
}
