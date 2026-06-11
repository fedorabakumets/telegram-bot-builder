/**
 * @fileoverview Превью узла параллельного запуска на холсте редактора
 *
 * Отображает список веток с выходными портами — каждая ветка
 * запускается одновременно с остальными (fan-out без точки сбора).
 *
 * @module components/editor/canvas/canvas-node/parallel-split-preview
 */

import { Node } from '@/types/bot';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';
import type { ParallelBranch } from '@shared/types/parallel-split-node';

/**
 * Пропсы компонента ParallelSplitPreview
 */
interface ParallelSplitPreviewProps {
  /** Узел типа parallel_split */
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
  /** Колбэк при монтировании порта ветки */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Превью узла параллельного запуска на холсте.
 *
 * Показывает заголовок с иконкой, лимит одновременности и список веток.
 * Каждая ветка имеет выходной порт справа.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью узла параллельного запуска
 */
export function ParallelSplitPreview({
  node,
  onPortMouseDown,
  isConnectionSource,
  onButtonPortMount,
}: ParallelSplitPreviewProps) {
  const data = node.data as any;
  const branches: ParallelBranch[] = data?.parallelBranches || [];
  const maxConcurrent: number = data?.maxConcurrent ?? 5;
  const awaitAll: boolean = data?.awaitAll ?? false;

  return (
    <div className="space-y-2">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
          <i className="fas fa-sitemap text-rose-600 dark:text-rose-400 text-sm" />
        </div>
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">⚡ Параллельная группа</span>
      </div>

      {/* Метаданные запуска */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded px-2 py-1">
        Одновременно: {maxConcurrent === 0 ? 'без лимита' : maxConcurrent}
        {awaitAll ? ' · ждать всех' : ''}
      </div>

      {/* Ветки */}
      <div className="space-y-1 mt-2">
        {branches.map((branch, index) => (
          <div
            key={branch.id}
            className="relative flex items-center justify-between rounded-lg px-2 py-1.5 text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"
            style={{ overflow: 'visible' }}
          >
            <span className="font-medium break-words pr-4">
              {branch.label || `Ветка ${index + 1}`}
            </span>
            {/* Выходной порт ветки */}
            <div className="absolute" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}>
              <OutputPort
                portType="button-goto"
                buttonId={branch.id}
                onPortMouseDown={onPortMouseDown}
                isActive={isConnectionSource}
                onMount={onButtonPortMount}
                layoutKey={branches.length}
              />
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic px-2 py-1">
            Нет веток — добавьте в панели свойств
          </div>
        )}
      </div>
    </div>
  );
}
