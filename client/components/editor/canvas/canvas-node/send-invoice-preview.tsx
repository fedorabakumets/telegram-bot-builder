/**
 * @fileoverview Превью узла «Выставить счёт» на холсте
 * @module components/editor/canvas/canvas-node/send-invoice-preview
 */

import { getNodeName } from '../../shared/node-registry';
import {
  isStaticStarsCurrency,
  normalizeInvoiceCurrency,
} from '../../properties/components/configuration/invoice-currency-utils';

/** Пропсы превью счёта */
interface SendInvoicePreviewProps {
  /** Данные узла */
  data: any;
}

/**
 * Проверяет плейсхолдер переменной вида `{name}`
 * @param url - Строка URL или переменной
 * @returns true если это переменная
 */
function isVariablePlaceholder(url: string): boolean {
  return url.startsWith('{') && url.endsWith('}');
}

/**
 * Бейдж источника токена без секрета
 * @param data - Data узла
 * @returns Подпись или null для XTR
 */
function providerBadge(data: any): string | null {
  if (isStaticStarsCurrency(data?.invoiceCurrency)) return null;
  return data?.invoiceProviderSource === 'env' ? 'env' : 'токен';
}

/**
 * Бейджи запроса данных покупателя (фиат)
 * @param data - Data узла
 * @returns Список коротких меток
 */
function orderInfoBadges(data: any): string[] {
  if (isStaticStarsCurrency(data?.invoiceCurrency)) return [];
  const badges: string[] = [];
  if (data?.invoiceNeedName) badges.push('ФИО');
  if (data?.invoiceNeedEmail) badges.push('email');
  if (data?.invoiceNeedPhone) badges.push('тел');
  return badges;
}

/**
 * Карточка счёта на холсте: валюта, товар, цена
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SendInvoicePreview({ data }: SendInvoicePreviewProps) {
  const typeLabel = getNodeName('send_invoice');
  const title = (data?.invoiceTitle || 'Товар').trim() || 'Товар';
  const description = (data?.invoiceDescription || '').trim();
  const amount = (data?.invoiceAmount || '1').trim() || '1';
  const rawCurrency = String(data?.invoiceCurrency ?? 'XTR').trim() || 'XTR';
  const currency = rawCurrency.includes('{') ? rawCurrency : normalizeInvoiceCurrency(rawCurrency);
  const isStars = isStaticStarsCurrency(rawCurrency);
  const tokenHint = providerBadge(data);
  const needBadges = orderInfoBadges(data);
  const photoUrl = typeof data?.invoicePhotoUrl === 'string' ? data.invoicePhotoUrl.trim() : '';

  return (
    <div className="px-2.5 py-2 text-xs space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 text-yellow-700 dark:text-yellow-300">
        <i className={`fas ${isStars ? 'fa-star' : 'fa-receipt'} text-base shrink-0`} />
        <span className="font-semibold text-sm leading-tight">{typeLabel}</span>
        <span className="shrink-0 rounded bg-yellow-200/90 dark:bg-yellow-800/80 px-1 py-0.5 text-[9px] font-semibold text-yellow-900 dark:text-yellow-100">
          {currency}
        </span>
        {tokenHint && (
          <span className="shrink-0 rounded bg-slate-200/90 dark:bg-slate-700/80 px-1 py-0.5 text-[9px] font-medium text-slate-700 dark:text-slate-200">
            {tokenHint}
          </span>
        )}
        {needBadges.map((b) => (
          <span
            key={b}
            className="shrink-0 rounded bg-sky-200/90 dark:bg-sky-800/80 px-1 py-0.5 text-[9px] font-medium text-sky-900 dark:text-sky-100"
          >
            {b}
          </span>
        ))}
      </div>

      {photoUrl && isVariablePlaceholder(photoUrl) && (
        <div className="rounded-lg border border-amber-200/80 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/30 px-2 py-1.5 flex items-center gap-1.5">
          <i className="fas fa-image text-amber-500 text-[10px]" />
          <span className="font-mono text-[10px] text-amber-800 dark:text-amber-200 truncate">
            {photoUrl}
          </span>
        </div>
      )}

      {photoUrl && !isVariablePlaceholder(photoUrl) && (
        <div className="rounded-lg overflow-hidden border border-yellow-300/70 dark:border-yellow-700/50 shadow-sm">
          <img
            src={photoUrl}
            alt={title}
            className="w-full h-auto max-h-24 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="rounded-lg bg-yellow-50/80 dark:bg-yellow-950/40 border border-yellow-200/60 dark:border-yellow-800/40 px-2 py-1.5 space-y-1">
        <div className="font-semibold text-[11px] text-yellow-900 dark:text-yellow-100 truncate">
          {title}
        </div>
        {description ? (
          <div className="text-[10px] text-yellow-800/70 dark:text-yellow-200/60 line-clamp-2 leading-snug">
            {description}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-400/90 dark:bg-yellow-500/80 px-1.5 py-0.5 text-[10px] font-bold text-yellow-950">
            {isStars && <i className="fas fa-star text-[8px]" />}
            {amount}
            {!isStars && <span className="font-semibold opacity-80">{currency}</span>}
          </span>
          <span className="text-[9px] font-medium text-yellow-700 dark:text-yellow-300 truncate">
            Оплатить
          </span>
        </div>
      </div>
    </div>
  );
}
