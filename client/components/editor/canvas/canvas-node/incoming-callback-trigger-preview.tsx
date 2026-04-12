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

/** Человекочитаемые метки для типов сопоставления */
const MATCH_TYPE_LABELS: Record<string, string> = {
  startsWith: 'начинается с',
  equals: '=',
  contains: 'содержит',
};

/**
 * Превью узла триггера нажатия кнопки — отображает паттерн фильтрации если задан
 * @param props - Пропсы компонента
 * @returns JSX элемент превью
 */
export function IncomingCallbackTriggerPreview({ node }: IncomingCallbackTriggerPreviewProps) {
  const pattern = (node.data as any)?.callbackPattern as string | undefined;
  const matchType = (node.data as any)?.callbackMatchType as string | undefined;
  const matchLabel = matchType ? MATCH_TYPE_LABELS[matchType] ?? matchType : null;

  if (pattern) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-orange-300 font-medium">Триггер inline-кнопки</span>
        <span className="text-[11px] text-orange-400/80 font-mono">
          {matchLabel ? `${matchLabel} ` : ''}&quot;{pattern}&quot;
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-orange-300 font-medium">Триггер нажатия кнопки</span>
      <span className="text-[10px] text-orange-400/60">(любая)</span>
    </div>
  );
}
