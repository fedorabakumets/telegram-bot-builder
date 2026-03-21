/**
 * @fileoverview Превью узла текстового триггера на холсте
 *
 * Отображает список текстов и режим совпадения
 * внутри карточки узла text_trigger на холсте.
 * @module components/editor/canvas/canvas-node/text-trigger-preview
 */

import { Node } from '@/types/bot';

/**
 * Пропсы компонента TextTriggerPreview
 */
interface TextTriggerPreviewProps {
  /** Узел типа text_trigger */
  node: Node;
}

/**
 * Компонент превью текстового триггера
 *
 * Показывает первые несколько текстов из списка и режим совпадения.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function TextTriggerPreview({ node }: TextTriggerPreviewProps) {
  const texts: string[] = (node.data as any)?.textSynonyms || [];
  const matchType: 'exact' | 'contains' = (node.data as any)?.textMatchType || 'exact';

  if (texts.length === 0) {
    return (
      <div className="mt-2 text-xs text-gray-400 italic">
        Нет текстов для срабатывания
      </div>
    );
  }

  /** Показываем максимум 3 тега, остальные скрываем */
  const visible = texts.slice(0, 3);
  const hidden = texts.length - visible.length;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {visible.map((text, i) => (
          <span
            key={i}
            className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
          >
            {text}
          </span>
        ))}
        {hidden > 0 && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
            +{hidden}
          </span>
        )}
      </div>
      <div className="text-[10px] text-gray-400">
        {matchType === 'exact' ? 'Точное совпадение' : 'Содержит текст'}
      </div>
    </div>
  );
}
