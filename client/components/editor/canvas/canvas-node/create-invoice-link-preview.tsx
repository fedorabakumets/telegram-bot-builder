/**
 * @fileoverview Превью узла «Ссылка на счёт» с двумя портами
 * @module components/editor/canvas/canvas-node/create-invoice-link-preview
 */

import { getNodeName } from '../../shared/node-registry';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';

/** Порт выхода ссылки на счёт */
interface LinkPortRow {
  /** Подпись */
  label: string;
  /** Id порта */
  buttonId: string;
  /** Классы строки */
  rowClass: string;
}

const LINK_PORTS: LinkPortRow[] = [
  {
    label: 'Ссылка готова',
    buttonId: 'invoice-link-created',
    rowClass: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
  },
  {
    label: 'После оплаты',
    buttonId: 'invoice-link-after-pay',
    rowClass: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  },
];

/** Пропсы превью */
interface CreateInvoiceLinkPreviewProps {
  /** Данные узла */
  data: any;
  /** Drag от порта */
  onPortMouseDown?: (
    e: React.MouseEvent,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number },
  ) => void;
  /** Узел — источник соединения */
  isConnectionSource?: boolean;
  /** Монтирование порта */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Превью: товар, цена и порты «ссылка готова» / «после оплаты»
 * @param props - Пропсы
 * @returns JSX
 */
export function CreateInvoiceLinkPreview({
  data,
  onPortMouseDown,
  isConnectionSource,
  onButtonPortMount,
}: CreateInvoiceLinkPreviewProps) {
  const typeLabel = getNodeName('create_invoice_link');
  const title = (data?.invoiceTitle || 'Товар').trim() || 'Товар';
  const amount = (data?.invoiceAmount || '1').trim() || '1';
  const isSubscription = Boolean(data?.invoiceSubscription);
  const linkVar = (data?.saveInvoiceLinkTo || 'invoice_url').trim() || 'invoice_url';

  return (
    <div className="px-3 py-2 space-y-2 text-[11px] leading-snug">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
        <i className="fas fa-link text-base" />
        <span className="font-semibold truncate text-sm flex-1">{typeLabel}</span>
        {isSubscription && (
          <span className="shrink-0 rounded bg-amber-200/90 dark:bg-amber-800/80 px-1 py-0.5 text-[9px] font-semibold text-amber-900 dark:text-amber-100">
            30 дн.
          </span>
        )}
      </div>
      <div className="rounded-lg bg-yellow-50/80 dark:bg-yellow-950/40 border border-yellow-200/60 dark:border-yellow-800/40 px-2 py-1.5 space-y-1">
        <div className="font-semibold text-[11px] truncate">{title}</div>
        <div className="flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-400/90 px-1.5 py-0.5 text-[10px] font-bold text-yellow-950">
            <i className="fas fa-star text-[8px]" />
            {amount}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground truncate">→ {linkVar}</span>
        </div>
      </div>
      <div className="space-y-1 mt-1">
        {LINK_PORTS.map((port) => (
          <div
            key={port.buttonId}
            className={`relative flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${port.rowClass}`}
            style={{ overflow: 'visible' }}
          >
            <span className="truncate">{port.label}</span>
            <OutputPort
              portType="button-goto"
              buttonId={port.buttonId}
              onPortMouseDown={onPortMouseDown}
              isActive={isConnectionSource}
              onMount={onButtonPortMount}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
