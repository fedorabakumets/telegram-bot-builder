/**
 * @fileoverview Превью узла «Выставить счёт в звёздах» на холсте
 * @module components/editor/canvas/canvas-node/send-invoice-preview
 */

/** Пропсы превью счёта в звёздах */
interface SendInvoicePreviewProps {
  /** Данные узла */
  data: any;
}

/**
 * Компактное превью счёта: название и цена в звёздах
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SendInvoicePreview({ data }: SendInvoicePreviewProps) {
  const title = (data?.invoiceTitle || 'Товар').trim() || 'Товар';
  const amount = (data?.invoiceAmount || '1').trim() || '1';

  return (
    <div className="px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-1.5">
        <i className="fas fa-star text-yellow-500 text-[10px]" />
        <span className="font-semibold text-yellow-700 dark:text-yellow-300 text-[11px]">
          Счёт в звёздах
        </span>
      </div>
      <div className="font-medium text-yellow-800 dark:text-yellow-200 truncate">
        {title}
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-[10px]">
        {amount} ⭐
      </div>
    </div>
  );
}
