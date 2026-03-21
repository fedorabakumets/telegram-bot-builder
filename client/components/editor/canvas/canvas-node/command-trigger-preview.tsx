/**
 * @fileoverview Preview-компонент узла триггера команды для холста
 *
 * Отображает только саму команду (например /start) на карточке узла.
 * Каждый узел — одна команда, синонимы не используются.
 * @module components/editor/canvas/canvas-node/command-trigger-preview
 */

import { Node } from '@/types/bot';

/**
 * Пропсы компонента CommandTriggerPreview
 */
interface CommandTriggerPreviewProps {
  /** Узел типа command_trigger */
  node: Node;
}

/**
 * Preview-компонент для узла триггера команды
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент с отображением команды
 */
export function CommandTriggerPreview({ node }: CommandTriggerPreviewProps) {
  /** Команда триггера, например "/start" */
  const command = node.data?.command || '/start';

  return (
    <div className="mt-2">
      {/* Команда */}
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <i className="fas fa-terminal text-yellow-600 dark:text-yellow-400 text-xs" />
        <span className="font-mono text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          {command}
        </span>
      </div>
    </div>
  );
}
