/**
 * @fileoverview Превью узла текстового триггера на холсте
 *
 * Отображает только теги слов без заголовка и режима совпадения —
 * компактный вид для карточки узла text_trigger на холсте.
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
 * Показывает первые 4 текста в виде тегов, остальные скрывает за счётчиком.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function TextTriggerPreview({ node }: TextTriggerPreviewProps) {
  const texts: string[] = (node.data as any)?.textSynonyms || [];

  /** Показываем максимум 4 тега, остальные скрываем */
  const visible = texts.slice(0, 4);
  const hidden = texts.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
      {texts.length === 0 ? (
        <span className="text-xs text-slate-400 italic">Нет текстов</span>
      ) : (
        <>
          {visible.map((text, i) => (
            <span
              key={i}
              className="inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium"
            >
              {text}
            </span>
          ))}
          {hidden > 0 && (
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs">
              +{hidden}
            </span>
          )}
        </>
      )}
    </div>
  );
}
