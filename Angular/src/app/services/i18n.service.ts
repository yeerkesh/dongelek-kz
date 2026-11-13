import { Injectable, signal } from '@angular/core';
import { LANGUAGES, Lang, TRANSLATIONS } from '../i18n/translations';

/** Simple translation service: RU / EN / KZ. The chosen language is remembered. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly languages = LANGUAGES;
  readonly lang = signal<Lang>('ru');

  constructor() {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'ru' || saved === 'en' || saved === 'kk') this.lang.set(saved);
    } catch { /* storage not available */ }
    document.documentElement.lang = this.lang();
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }

  /** Returns the text for the key in the current language (Russian is the fallback). */
  t(key: string, params?: Record<string, string | number>): string {
    let text = TRANSLATIONS[this.lang()][key] ?? TRANSLATIONS['ru'][key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  }
}
