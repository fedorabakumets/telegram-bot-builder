/**
 * @fileoverview Превью узла триггера любого сообщения на холсте
 * @module components/editor/canvas/canvas-node/any-message-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента AnyMessageTriggerPreview */
interface AnyMessageTriggerPreviewProps {
  /** Узел типа any_message_trigger */
  node: Node;
}

/** Превью узла — отображает статичный лейбл */
export function AnyMessageTriggerPreview({ node: _ }: AnyMessageTriggerPreviewProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-green-300 font-medium">Любое сообщение</span>
    </div>
  );
}
