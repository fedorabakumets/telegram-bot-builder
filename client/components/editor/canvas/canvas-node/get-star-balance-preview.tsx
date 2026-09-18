/**
 * @fileoverview Превью узла get_star_balance с двумя портами
 * @module components/editor/canvas/canvas-node/get-star-balance-preview
 */

import { getNodeName } from '../../shared/node-registry';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';

/** Порт исхода */
interface BalPortRow {
  /** Подпись */
  label: string;
  /** Id порта */
  buttonId: string;
  /** Классы строки */
  rowClass: string;
}

const BAL_PORTS: BalPortRow[] = [
  {
    label: 'Успех',
    buttonId: 'bal-success',
    rowClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Ошибка',
    buttonId: 'bal-error',
    rowClass: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
  },
];

/** Пропсы превью */
interface GetStarBalancePreviewProps {
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
 * Превью: переменная баланса и порты успех/ошибка
 * @param props - Пропсы
 * @returns JSX
 */
export function GetStarBalancePreview({
  data,
  onPortMouseDown,
  isConnectionSource,
  onButtonPortMount,
}: GetStarBalancePreviewProps) {
  const typeLabel = getNodeName('get_star_balance');
  const saveTo = (data?.saveStarBalanceTo || 'star_balance').trim() || 'star_balance';

  return (
    <div className="px-3 py-2 space-y-2 text-[11px] leading-snug">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
        <i className="fas fa-coins text-base" />
        <span className="font-semibold truncate text-sm flex-1">{typeLabel}</span>
      </div>
      <div className="truncate font-mono text-[10px]">
        <span className="font-sans text-muted-foreground">→ </span>
        <span className="text-foreground/80">{`{${saveTo}}`}</span>
      </div>
      <div className="space-y-1 mt-1">
        {BAL_PORTS.map((port) => (
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
