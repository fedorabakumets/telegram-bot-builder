/**
 * @fileoverview Превью узла триггера входящего callback_query на холсте
 * @module components/editor/canvas/canvas-node/incoming-callback-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента IncomingCallbackTriggerPreview */
interface IncomingCallbackTriggerPreviewProps {
  /** Узел типа incoming_callback_trigger */
  node: Node;
}

/**
 * Превью узла триггера нажатия кнопки — отображает статичный лейбл
 * @param props - Пропсы компонента
 * @returns JSX элемент превью
 */
export function IncomingCallbackTriggerPreview({ node: _ }: IncomingCallbackTriggerPreviewProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-orange-300 font-medium">Триггер нажатия кнопки</span>
    </div>
  );
}
