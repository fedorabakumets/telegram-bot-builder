/**
 * @fileoverview Превью узла триггера сообщения в группе на холсте
 * @module components/editor/canvas/canvas-node/group-message-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента GroupMessageTriggerPreview */
interface GroupMessageTriggerPreviewProps {
  /** Узел типа group_message_trigger */
  node: Node;
}

/** Превью узла — отображает ID группы если задан */
export function GroupMessageTriggerPreview({ node }: GroupMessageTriggerPreviewProps) {
  const groupChatId = (node.data as any).groupChatId;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-violet-300 font-medium">Сообщение в группе</span>
      {groupChatId && (
        <span className="font-mono text-xs text-violet-400/70">{groupChatId}</span>
      )}
    </div>
  );
}
