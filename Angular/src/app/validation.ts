/** Limits for all forms. The same numbers are used on the server (webdevdj/api/validators.py). */
export const LIMITS = {
  yearMin: 1950,
  priceMin: 10_000,
  priceMax: 1_000_000_000,
  mileageMax: 1_500_000,
  engineMin: 0.1,
  engineMax: 10,
  titleMin: 3,
  titleMax: 100,
  descMin: 10,
  descMax: 5000,
  cityMax: 100,
  phoneMax: 20,
  emailMax: 254,
  messageMax: 2000,
  usernameMin: 3,
  usernameMax: 30,
  passwordMin: 8,
  passwordMax: 128,
  maxPhotos: 10,
};

/** The newest allowed model year: next year. */
export const yearMax = (): number => new Date().getFullYear() + 1;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_RE = /^[\p{L}\p{N}_.\-]+$/u;
export const PHONE_RE = /^\+?[\d\s\-()]{10,20}$/;
export const CITY_RE = /^[^\d_!@#$%^&*+=<>?/\\|{}\[\]~`"]*$/;

export type Translate = (key: string, params?: Record<string, string | number>) => string;

const fmt = (n: number) => n.toLocaleString('ru-RU');

const toNumber = (x: unknown): number =>
  x === '' || x === null || x === undefined ? NaN : Number(x);

export function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '').length;
  return PHONE_RE.test(value) && digits >= 10 && digits <= 15;
}

export interface CarValues {
  title?: string;
  year?: unknown;
  price?: unknown;
  mileage?: unknown;
  engineVolume?: unknown;
  description?: string;
  city?: string;
  phone?: string;
  imageUrl?: string;
  extraImages?: string;   // one link per line
}

/** Returns error messages for the fields that are filled in but wrong. */
export function carErrors(v: CarValues, t: Translate): Record<string, string> {
  const e: Record<string, string> = {};
  const range = (min: number, max: number) => t('limit.range', { min: fmt(min), max: fmt(max) });
  const length = (min: number, max: number) => t('limit.length', { min, max });

  const title = (v.title ?? '').trim();
  if (title && (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax)) {
    e['title'] = length(LIMITS.titleMin, LIMITS.titleMax);
  }

  if (v.year !== '' && v.year != null) {
    const y = toNumber(v.year);
    if (!(y >= LIMITS.yearMin && y <= yearMax())) e['year'] = range(LIMITS.yearMin, yearMax());
  }
  if (v.price !== '' && v.price != null) {
    const p = toNumber(v.price);
    if (!(p >= LIMITS.priceMin && p <= LIMITS.priceMax)) e['price'] = range(LIMITS.priceMin, LIMITS.priceMax);
  }
  if (v.mileage !== '' && v.mileage != null) {
    const m = toNumber(v.mileage);
    if (!(m >= 0 && m <= LIMITS.mileageMax)) e['mileage'] = range(0, LIMITS.mileageMax);
  }
  if (v.engineVolume !== '' && v.engineVolume != null) {
    const en = toNumber(v.engineVolume);
    if (!(en >= LIMITS.engineMin && en <= LIMITS.engineMax)) {
      e['engineVolume'] = t('limit.range', { min: LIMITS.engineMin, max: LIMITS.engineMax });
    }
  }

  const description = (v.description ?? '').trim();
  if (description && (description.length < LIMITS.descMin || description.length > LIMITS.descMax)) {
    e['description'] = length(LIMITS.descMin, LIMITS.descMax);
  }

  const city = (v.city ?? '').trim();
  if (city && (city.length > LIMITS.cityMax || !CITY_RE.test(city))) e['city'] = t('limit.city');

  const phone = (v.phone ?? '').trim();
  if (phone && !isPhone(phone)) e['phone'] = t('limit.phone');

  const image = (v.imageUrl ?? '').trim();
  if (image && !isUrl(image)) e['imageUrl'] = t('limit.url');

  const extra = (v.extraImages ?? '').split('\n').map(u => u.trim()).filter(u => u);
  if (extra.length > LIMITS.maxPhotos) e['extraImages'] = t('limit.maxPhotos', { max: LIMITS.maxPhotos });
  else if (extra.some(u => !isUrl(u))) e['extraImages'] = t('limit.url');

  return e;
}
