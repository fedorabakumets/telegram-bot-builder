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

  /** Показываем максимум 3 тега, остальные скрываем */
  const visible = texts.slice(0, 3);
  const hidden = texts.length - visible.length;

  return (
    <div className="mt-2 space-y-2">
      {/* Теги текстов */}
      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 min-h-[36px] flex flex-wrap gap-1 items-center">
        {texts.length === 0 ? (
          <span className="text-xs text-blue-400 dark:text-blue-500 italic">Нет текстов</span>
        ) : (
          <>
            {visible.map((text, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-medium"
              >
                {text}
              </span>
            ))}
            {hidden > 0 && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs">
                +{hidden}
              </span>
            )}
          </>
        )}
      </div>

      {/* Режим совпадения */}
      <div className="flex items-center gap-1.5 text-[10px] text-blue-500 dark:text-blue-400">
        <i className="fas fa-filter text-[9px]" />
        {matchType === 'exact' ? 'Точное совпадение' : 'Содержит текст'}
      </div>
    </div>
  );
}
