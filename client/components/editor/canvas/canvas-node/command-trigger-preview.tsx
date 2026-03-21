/**
 * @fileoverview Preview-компонент узла триггера команды для холста
 *
 * Отображает только саму команду (например /start) без иконки и обёртки —
 * компактный вид для карточки узла command_trigger на холсте.
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
 * Показывает только команду моноширинным шрифтом без лишних обёрток.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент с отображением команды
 */
export function CommandTriggerPreview({ node }: CommandTriggerPreviewProps) {
  /** Команда триггера, например "/start" */
  const command = node.data?.command || '/start';

  return (
    <div className="flex items-center">
      <span className="font-mono text-sm font-semibold text-yellow-300">
        {command}
      </span>
    </div>
  );
}
