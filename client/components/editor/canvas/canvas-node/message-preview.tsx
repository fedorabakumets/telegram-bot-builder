/**
 * @fileoverview Компонент превью текстового сообщения
 *
 * Отображает визуальное представление текстового сообщения
 * с форматированием текста (HTML или Markdown).
 * Если задано поле saveMessageIdTo — показывает индикатор сохранения ID.
 */

import { Node } from '@/types/bot';
import { FormattedText } from '@/components/editor/inline-rich/components/FormattedText';

/** Пропсы компонента MessagePreview */
interface MessagePreviewProps {
  /** Узел с текстовым сообщением */
  node: Node;
}

/**
 * Компонент превью сообщения.
 * Отображает текст сообщения и индикатор сохранения ID если задан saveMessageIdTo.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null если нет текста
 */
export function MessagePreview({ node }: MessagePreviewProps) {
  if (!node.data.messageText) {
    return null;
  }

  const saveMessageIdTo: string = (node.data as any)?.saveMessageIdTo || '';

  return (
    <div className="mb-4">
      <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
          <FormattedText value={node.data.messageText} lineClamp={8} />
        </div>
      </div>

      {/* Индикатор сохранения ID сообщения */}
      {saveMessageIdTo && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 px-1">
          <i className="fas fa-bookmark text-[10px]" />
          <span>ID → <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded text-xs font-mono">{saveMessageIdTo}</code></span>
        </div>
      )}
    </div>
  );
}
