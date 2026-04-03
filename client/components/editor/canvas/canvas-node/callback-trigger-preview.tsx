/**
 * @fileoverview Превью узла триггера inline-кнопки на холсте
 *
 * Отображает значение callback_data моноширинным шрифтом в оранжевом цвете.
 * Если режим совпадения — startswith, добавляет символ * в конце.
 * @module components/editor/canvas/canvas-node/callback-trigger-preview
 */

import { Node } from '@/types/bot';

/**
 * Пропсы компонента CallbackTriggerPreview
 */
interface CallbackTriggerPreviewProps {
  /** Узел типа callback_trigger */
  node: Node;
}

/**
 * Превью-компонент для узла триггера inline-кнопки
 *
 * Показывает callback_data моноширинным шрифтом.
 * При matchType === 'startswith' добавляет * в конце.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент с отображением callback_data
 */
export function CallbackTriggerPreview({ node }: CallbackTriggerPreviewProps) {
  /** Значение callback_data кнопки */
  const callbackData: string = (node.data as any)?.callbackData || 'my_callback';

  /** Режим совпадения: exact или startswith */
  const matchType: string = (node.data as any)?.matchType || 'exact';

  /** Отображаемый текст с суффиксом * для режима startswith */
  const displayText = matchType === 'startswith' ? `${callbackData}*` : callbackData;

  return (
    <div className="flex items-center">
      <span className="font-mono text-sm font-semibold text-orange-300">
        {displayText}
      </span>
    </div>
  );
}
