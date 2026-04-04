/**
 * @fileoverview Превью узла триггера исходящего сообщения на холсте
 * @module components/editor/canvas/canvas-node/outgoing-message-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента OutgoingMessageTriggerPreview */
interface OutgoingMessageTriggerPreviewProps {
  /** Узел типа outgoing_message_trigger */
  node: Node;
}

/**
 * Превью узла триггера исходящего сообщения — отображает статичный лейбл
 * @param props - Пропсы компонента
 * @returns JSX элемент превью
 */
export function OutgoingMessageTriggerPreview({ node: _ }: OutgoingMessageTriggerPreviewProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-purple-300 font-medium">Триггер исходящего сообщения</span>
    </div>
  );
}
