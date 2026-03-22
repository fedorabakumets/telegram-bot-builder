/**
 * @fileoverview Превью узла условия на холсте редактора
 *
 * Отображает переменную и список веток с выходными портами.
 * Каждая ветка имеет собственный порт выхода (output port).
 * Ветка "Иначе" выделена отдельным цветом.
 *
 * @module components/editor/canvas/canvas-node/condition-node-preview
 */

import { Node } from '@/types/bot';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';
import type { ConditionBranch } from '@shared/types/condition-node';

/**
 * Пропсы компонента ConditionNodePreview
 */
interface ConditionNodePreviewProps {
  /** Узел типа condition */
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
 * Превью узла условия на холсте
 *
 * Показывает заголовок с иконкой, переменную и список веток.
 * Каждая ветка имеет выходной порт справа.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью узла условия
 */
export function ConditionNodePreview({
  node,
  onPortMouseDown,
  isConnectionSource,
  onButtonPortMount,
}: ConditionNodePreviewProps) {
  const data = node.data as any;
  const variable: string = data?.variable || '';
  const branches: ConditionBranch[] = data?.branches || [];

  return (
    <div className="space-y-2">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <i className="fas fa-code-branch text-violet-600 dark:text-violet-400 text-sm" />
        </div>
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Условие</span>
      </div>

      {/* Переменная */}
      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-slate-800 rounded px-2 py-1">
        {variable ? variable : <span className="italic text-gray-400">переменная не задана</span>}
      </div>

      {/* Ветки */}
      <div className="space-y-1 mt-2">
        {branches.map((branch) => {
          const isElse = branch.operator === 'else';
          return (
            <div
              key={branch.id}
              className={`relative flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                isElse
                  ? 'bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-gray-400'
                  : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
              }`}
              style={{ overflow: 'visible' }}
            >
              <span className="font-medium truncate max-w-[120px]">{branch.label}</span>
              {!isElse && (
                <span className="ml-1 text-[10px] opacity-60 font-mono shrink-0">
                  {branch.operator} {branch.value}
                </span>
              )}
              {/* Выходной порт ветки */}
              <div className="absolute" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}>
                <OutputPort
                  portType="button-goto"
                  buttonId={branch.id}
                  onPortMouseDown={onPortMouseDown}
                  isActive={isConnectionSource}
                  onMount={onButtonPortMount}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
