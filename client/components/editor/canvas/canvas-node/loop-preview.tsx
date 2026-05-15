/**
 * @fileoverview Превью узла Loop (цикл по массиву) на холсте
 * Отображает источник, элемент, два выходных порта: "Тело" и "Далее"
 * @module components/editor/canvas/canvas-node/loop-preview
 */

import { Node } from '@/types/bot';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';

/** Пропсы компонента LoopPreview */
interface LoopPreviewProps {
  /** Узел типа loop */
  node: Node;
  /** Обработчик начала перетаскивания от порта */
  onPortMouseDown?: (
    e: React.MouseEvent,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number }
  ) => void;
  /** Узел является источником активного drag-соединения */
  isConnectionSource?: boolean;
  /** Колбэк при монтировании порта */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Превью узла цикла на холсте с двумя выходными портами
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function LoopPreview({ node, onPortMouseDown, isConnectionSource, onButtonPortMount }: LoopPreviewProps) {
  const data = node.data as any;
  const source: string = data?.sourceVariable || '';
  const item: string = data?.itemVariable || 'item';
  const parallel: boolean = data?.parallel || false;

  return (
    <div className="space-y-2">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <i className="fas fa-sync-alt text-violet-600 dark:text-violet-400 text-sm" />
        </div>
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Цикл</span>
        {parallel && (
          <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">
            ⚡ parallel
          </span>
        )}
      </div>

      {/* Источник → элемент */}
      {source ? (
        <div className="flex items-center gap-1 text-xs">
          <code className="bg-violet-500/20 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
            {source}
          </code>
          <span className="text-slate-500">→</span>
          <code className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[60px]">
            {item}
          </code>
        </div>
      ) : (
        <span className="text-xs text-slate-400 italic">Источник не указан</span>
      )}

      {/* Два выхода: Тело и Далее */}
      <div className="space-y-1 mt-3">
        {/* Порт "Тело цикла" */}
        <div
          className="relative flex items-center justify-between rounded-lg px-2 py-1.5 text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
          style={{ overflow: 'visible' }}
        >
          <span className="font-medium">↻ Тело</span>
          <div className="absolute" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}>
            <OutputPort
              portType="button-goto"
              buttonId="loop-body"
              onPortMouseDown={onPortMouseDown}
              isActive={isConnectionSource}
              onMount={onButtonPortMount}
            />
          </div>
        </div>

        {/* Порт "После цикла" */}
        <div
          className="relative flex items-center justify-between rounded-lg px-2 py-1.5 text-xs bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-gray-400"
          style={{ overflow: 'visible' }}
        >
          <span className="font-medium">→ Далее</span>
          <div className="absolute" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}>
            <OutputPort
              portType="button-goto"
              buttonId="loop-after"
              onPortMouseDown={onPortMouseDown}
              isActive={isConnectionSource}
              onMount={onButtonPortMount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
