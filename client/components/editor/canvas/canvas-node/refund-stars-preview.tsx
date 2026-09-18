/**
 * @fileoverview Превью узла refund_stars с четырьмя выходными портами
 * @module components/editor/canvas/canvas-node/refund-stars-preview
 */

import { getNodeName } from '../../shared/node-registry';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';

/** Порт выхода возврата звёзд */
interface RefundPortRow {
  /** Подпись на холсте (русский) */
  label: string;
  /** Технический id порта */
  buttonId: string;
  /** Классы строки */
  rowClass: string;
}

/** Четыре фиксированных выхода */
const REFUND_PORTS: RefundPortRow[] = [
  {
    label: 'Успех',
    buttonId: 'refund-success',
    rowClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Пустой код',
    buttonId: 'refund-empty',
    rowClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  },
  {
    label: 'Код не найден',
    buttonId: 'refund-not-found',
    rowClass: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  },
  {
    label: 'Уже возвращён',
    buttonId: 'refund-already',
    rowClass: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
  },
];

/** Пропсы превью возврата */
interface RefundStarsPreviewProps {
  /** Данные узла */
  data: any;
  /** Начало drag от порта */
  onPortMouseDown?: (
    e: React.MouseEvent,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number },
  ) => void;
  /** Узел — источник активного соединения */
  isConnectionSource?: boolean;
  /** Монтирование порта для якоря линии */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Превью: название, кому / код + порты исходов
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RefundStarsPreview({
  data,
  onPortMouseDown,
  isConnectionSource,
  onButtonPortMount,
}: RefundStarsPreviewProps) {
  const typeLabel = getNodeName('refund_stars');
  const source = data?.refundUserSource || 'current_user';
  const who =
    source === 'custom' ? (data?.refundUserId || 'ID…') : 'текущий пользователь';
  const charge = data?.refundChargeId || 'код не задан';

  return (
    <div className="px-3 py-2 space-y-2 text-[11px] leading-snug">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
        <i className="fas fa-undo text-base" />
        <span className="font-semibold truncate text-sm">{typeLabel}</span>
      </div>
      <div className="space-y-0.5 text-[10px]">
        <div className="truncate">
          <span className="text-muted-foreground">Кому: </span>
          <span className="text-foreground/80">{who}</span>
        </div>
        <div className="truncate font-mono">
          <span className="font-sans text-muted-foreground">Код: </span>
          <span className="text-foreground/80">{charge}</span>
        </div>
      </div>

      <div className="space-y-1 mt-1">
        {REFUND_PORTS.map((port) => (
          <div
            key={port.buttonId}
            className={`relative flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${port.rowClass}`}
            style={{ overflow: 'visible' }}
          >
            <span className="font-medium">{port.label}</span>
            <div className="absolute" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}>
              <OutputPort
                portType="button-goto"
                buttonId={port.buttonId}
                onPortMouseDown={onPortMouseDown}
                isActive={isConnectionSource}
                onMount={onButtonPortMount}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
