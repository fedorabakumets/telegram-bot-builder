/**
 * @fileoverview Компонент заголовка узла триггера сообщения в группе
 * @module components/editor/canvas/canvas-node/group-message-trigger-header
 */

import { Node } from '@/types/bot';

/** Пропсы компонента GroupMessageTriggerHeader */
interface GroupMessageTriggerHeaderProps {
  /** Узел с данными */
  node: Node;
}

/**
 * Заголовок узла group_message_trigger
 *
 * Показывает иконку, название и chip с ID группы (если задан).
 *
 * @param {GroupMessageTriggerHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок узла
 */
export function GroupMessageTriggerHeader({ node }: GroupMessageTriggerHeaderProps) {
  const groupChatId = (node.data as any).groupChatId;

  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5">
        <i className="fas fa-comments text-violet-600 dark:text-violet-400 text-xs" />
        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          Триггер входящего сообщения в теме группы
        </span>
      </span>
      {groupChatId && (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 w-fit">
          {groupChatId}
        </span>
      )}
    </span>
  );
}
