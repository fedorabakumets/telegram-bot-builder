/**
 * @fileoverview Превью узла edit_star_subscription с тремя портами
 * @module components/editor/canvas/canvas-node/edit-star-subscription-preview
 */

import { getNodeName } from '../../shared/node-registry';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';

/** Порт исхода */
interface SubPortRow {
  /** Подпись */
  label: string;
  /** Id порта */
  buttonId: string;
  /** Классы строки */
  rowClass: string;
}

const SUB_PORTS: SubPortRow[] = [
  {
    label: 'Успех',
    buttonId: 'sub-success',
    rowClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Пустой код',
    buttonId: 'sub-empty',
    rowClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  },
  {
    label: 'Ошибка',
    buttonId: 'sub-error',
    rowClass: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
  },
];

/** Пропсы превью */
interface EditStarSubscriptionPreviewProps {
  /** Данные узла */
  data: any;
  /** Drag от порта */
  onPortMouseDown?: (
    e: React.MouseEvent,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number },
  ) => void;
  /** Источник соединения */
  isConnectionSource?: boolean;
  /** Монтирование порта */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Превью: действие, кому, код и порты
 * @param props - Пропсы
 * @returns JSX
 */
export function EditStarSubscriptionPreview({
  data,
  onPortMouseDown,
  isConnectionSource,
  onButtonPortMount,
}: EditStarSubscriptionPreviewProps) {
  const typeLabel = getNodeName('edit_star_subscription');
  const action = data?.subscriptionAction === 'enable' ? 'Включить' : 'Отменить';
  const source = data?.subscriptionUserSource || 'current_user';
  const who =
    source === 'custom' ? (data?.subscriptionUserId || 'ID…') : 'текущий пользователь';
  const charge = data?.subscriptionChargeId || 'код не задан';

  return (
    <div className="px-3 py-2 space-y-2 text-[11px] leading-snug">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
        <i className="fas fa-sync-alt text-base" />
        <span className="font-semibold truncate text-sm flex-1">{typeLabel}</span>
        <span className="shrink-0 rounded bg-amber-200/90 dark:bg-amber-800/80 px-1 py-0.5 text-[9px] font-semibold text-amber-900 dark:text-amber-100">
          {action}
        </span>
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
        {SUB_PORTS.map((port) => (
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
