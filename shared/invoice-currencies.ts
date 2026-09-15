/**
 * @fileoverview Валюты счёта Telegram Payments (XTR + ISO 4217 из Bot API)
 * @see https://core.telegram.org/bots/payments#supported-currencies
 * @module shared/invoice-currencies
 */

/** Опция селекта валюты */
export interface InvoiceCurrencyOption {
  /** Код валюты */
  code: string;
  /** Подпись в UI */
  label: string;
}

/** Фиатные коды из currencies.json Telegram */
export const INVOICE_FIAT_CURRENCIES = [
  "EUR",
  "RUB",
  "USD",
  "UAH",
  "BYN",
  "KZT",
  "GBP",
  "CNY",
  "TRY",
  "PLN",
  "GEL",
  "AMD",
  "AZN",
  "AED",
  "AFN",
  "ALL",
  "ARS",
  "AUD",
  "BAM",
  "BDT",
  "BGN",
  "BHD",
  "BND",
  "BOB",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "COP",
  "CRC",
  "CZK",
  "DKK",
  "DOP",
  "DZD",
  "EGP",
  "ETB",
  "GHS",
  "GTQ",
  "HKD",
  "HNL",
  "HRK",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "IQD",
  "IRR",
  "ISK",
  "JMD",
  "JOD",
  "JPY",
  "KES",
  "KGS",
  "KRW",
  "LBP",
  "LKR",
  "MAD",
  "MDL",
  "MMK",
  "MNT",
  "MOP",
  "MUR",
  "MVR",
  "MXN",
  "MYR",
  "MZN",
  "NGN",
  "NIO",
  "NOK",
  "NPR",
  "NZD",
  "PAB",
  "PEN",
  "PHP",
  "PKR",
  "PYG",
  "QAR",
  "RON",
  "RSD",
  "SAR",
  "SEK",
  "SGD",
  "SYP",
  "THB",
  "TJS",
  "TTD",
  "TWD",
  "TZS",
  "UGX",
  "UYU",
  "UZS",
  "VND",
  "YER",
  "ZAR"
] as const;

/** Все коды счёта: XTR и фиат */
export const INVOICE_CURRENCIES = ['XTR', ...INVOICE_FIAT_CURRENCIES] as const;

/** Код валюты счёта */
export type InvoiceCurrencyCode = (typeof INVOICE_CURRENCIES)[number];

/** Опции для UI (популярные сверху) */
export const INVOICE_CURRENCY_OPTIONS: readonly InvoiceCurrencyOption[] = [
  {
    "code": "XTR",
    "label": "XTR — звёзды Telegram"
  },
  {
    "code": "EUR",
    "label": "EUR — евро"
  },
  {
    "code": "RUB",
    "label": "RUB — рубли"
  },
  {
    "code": "USD",
    "label": "USD — доллары"
  },
  {
    "code": "UAH",
    "label": "UAH — гривны"
  },
  {
    "code": "BYN",
    "label": "BYN — бел. рубли"
  },
  {
    "code": "KZT",
    "label": "KZT — тенге"
  },
  {
    "code": "GBP",
    "label": "GBP — фунты стерлингов"
  },
  {
    "code": "CNY",
    "label": "CNY — юани"
  },
  {
    "code": "TRY",
    "label": "TRY — лиры"
  },
  {
    "code": "PLN",
    "label": "PLN — злотые"
  },
  {
    "code": "GEL",
    "label": "GEL — лари"
  },
  {
    "code": "AMD",
    "label": "AMD — драмы"
  },
  {
    "code": "AZN",
    "label": "AZN — манаты"
  },
  {
    "code": "AED",
    "label": "AED — дирхамы ОАЭ"
  },
  {
    "code": "AFN",
    "label": "AFN — Afghan Afghani"
  },
  {
    "code": "ALL",
    "label": "ALL — Albanian Lek"
  },
  {
    "code": "ARS",
    "label": "ARS — Argentine Peso"
  },
  {
    "code": "AUD",
    "label": "AUD — австрал. доллары"
  },
  {
    "code": "BAM",
    "label": "BAM — Bosnia & Herzegovina Convertible Mark"
  },
  {
    "code": "BDT",
    "label": "BDT — Bangladeshi Taka"
  },
  {
    "code": "BGN",
    "label": "BGN — левы"
  },
  {
    "code": "BHD",
    "label": "BHD — Bahraini dinar"
  },
  {
    "code": "BND",
    "label": "BND — Brunei Dollar"
  },
  {
    "code": "BOB",
    "label": "BOB — Bolivian Boliviano"
  },
  {
    "code": "BRL",
    "label": "BRL — реалы"
  },
  {
    "code": "CAD",
    "label": "CAD — канад. доллары"
  },
  {
    "code": "CHF",
    "label": "CHF — франки"
  },
  {
    "code": "CLP",
    "label": "CLP — Chilean Peso"
  },
  {
    "code": "COP",
    "label": "COP — Colombian Peso"
  },
  {
    "code": "CRC",
    "label": "CRC — Costa Rican Colón"
  },
  {
    "code": "CZK",
    "label": "CZK — чеш. кроны"
  },
  {
    "code": "DKK",
    "label": "DKK — дат. кроны"
  },
  {
    "code": "DOP",
    "label": "DOP — Dominican Peso"
  },
  {
    "code": "DZD",
    "label": "DZD — Algerian Dinar"
  },
  {
    "code": "EGP",
    "label": "EGP — Egyptian Pound"
  },
  {
    "code": "ETB",
    "label": "ETB — Ethiopian Birr"
  },
  {
    "code": "GHS",
    "label": "GHS — Ghanaian cedi"
  },
  {
    "code": "GTQ",
    "label": "GTQ — Guatemalan Quetzal"
  },
  {
    "code": "HKD",
    "label": "HKD — гонгк. доллары"
  },
  {
    "code": "HNL",
    "label": "HNL — Honduran Lempira"
  },
  {
    "code": "HRK",
    "label": "HRK — Croatian Kuna"
  },
  {
    "code": "HUF",
    "label": "HUF — форинты"
  },
  {
    "code": "IDR",
    "label": "IDR — Indonesian Rupiah"
  },
  {
    "code": "ILS",
    "label": "ILS — шекели"
  },
  {
    "code": "INR",
    "label": "INR — рупии"
  },
  {
    "code": "IQD",
    "label": "IQD — Iraqi dinar"
  },
  {
    "code": "IRR",
    "label": "IRR — Iranian rial"
  },
  {
    "code": "ISK",
    "label": "ISK — Icelandic Króna"
  },
  {
    "code": "JMD",
    "label": "JMD — Jamaican Dollar"
  },
  {
    "code": "JOD",
    "label": "JOD — Jordanian dinar"
  },
  {
    "code": "JPY",
    "label": "JPY — иены"
  },
  {
    "code": "KES",
    "label": "KES — Kenyan Shilling"
  },
  {
    "code": "KGS",
    "label": "KGS — сомы"
  },
  {
    "code": "KRW",
    "label": "KRW — воны"
  },
  {
    "code": "LBP",
    "label": "LBP — Lebanese Pound"
  },
  {
    "code": "LKR",
    "label": "LKR — Sri Lankan Rupee"
  },
  {
    "code": "MAD",
    "label": "MAD — Moroccan Dirham"
  },
  {
    "code": "MDL",
    "label": "MDL — Moldovan Leu"
  },
  {
    "code": "MMK",
    "label": "MMK — Myanmar kyat"
  },
  {
    "code": "MNT",
    "label": "MNT — Mongolian Tögrög"
  },
  {
    "code": "MOP",
    "label": "MOP — Macanese pataca"
  },
  {
    "code": "MUR",
    "label": "MUR — Mauritian Rupee"
  },
  {
    "code": "MVR",
    "label": "MVR — Maldivian Rufiyaa"
  },
  {
    "code": "MXN",
    "label": "MXN — мекс. песо"
  },
  {
    "code": "MYR",
    "label": "MYR — Malaysian Ringgit"
  },
  {
    "code": "MZN",
    "label": "MZN — Mozambican Metical"
  },
  {
    "code": "NGN",
    "label": "NGN — Nigerian Naira"
  },
  {
    "code": "NIO",
    "label": "NIO — Nicaraguan Córdoba"
  },
  {
    "code": "NOK",
    "label": "NOK — норв. кроны"
  },
  {
    "code": "NPR",
    "label": "NPR — Nepalese Rupee"
  },
  {
    "code": "NZD",
    "label": "NZD — новозел. доллары"
  },
  {
    "code": "PAB",
    "label": "PAB — Panamanian Balboa"
  },
  {
    "code": "PEN",
    "label": "PEN — Peruvian Nuevo Sol"
  },
  {
    "code": "PHP",
    "label": "PHP — Philippine Peso"
  },
  {
    "code": "PKR",
    "label": "PKR — Pakistani Rupee"
  },
  {
    "code": "PYG",
    "label": "PYG — Paraguayan Guaraní"
  },
  {
    "code": "QAR",
    "label": "QAR — Qatari Riyal"
  },
  {
    "code": "RON",
    "label": "RON — леи"
  },
  {
    "code": "RSD",
    "label": "RSD — Serbian Dinar"
  },
  {
    "code": "SAR",
    "label": "SAR — риялы"
  },
  {
    "code": "SEK",
    "label": "SEK — швед. кроны"
  },
  {
    "code": "SGD",
    "label": "SGD — синг. доллары"
  },
  {
    "code": "SYP",
    "label": "SYP — Syrian pound"
  },
  {
    "code": "THB",
    "label": "THB — баты"
  },
  {
    "code": "TJS",
    "label": "TJS — сомони"
  },
  {
    "code": "TTD",
    "label": "TTD — Trinidad and Tobago Dollar"
  },
  {
    "code": "TWD",
    "label": "TWD — New Taiwan Dollar"
  },
  {
    "code": "TZS",
    "label": "TZS — Tanzanian Shilling"
  },
  {
    "code": "UGX",
    "label": "UGX — Ugandan Shilling"
  },
  {
    "code": "UYU",
    "label": "UYU — Uruguayan Peso"
  },
  {
    "code": "UZS",
    "label": "UZS — сумы"
  },
  {
    "code": "VND",
    "label": "VND — Vietnamese Đồng"
  },
  {
    "code": "YER",
    "label": "YER — Yemeni Rial"
  },
  {
    "code": "ZAR",
    "label": "ZAR — South African Rand"
  }
] as const;

const _set = new Set<string>(INVOICE_CURRENCIES as readonly string[]);

/**
 * Проверяет, что код — допустимая валюта счёта
 * @param code - Код валюты
 * @returns true если код известен
 */
export function isInvoiceCurrencyCode(code: string): code is InvoiceCurrencyCode {
  return _set.has(code);
}

/**
 * Нормализует валюту; неизвестная → XTR
 * @param raw - Сырое значение
 * @returns Код валюты
 */
export function normalizeInvoiceCurrency(raw: unknown): InvoiceCurrencyCode {
  const c = String(raw || 'XTR').toUpperCase();
  if (isInvoiceCurrencyCode(c)) return c;
  return 'XTR';
}
