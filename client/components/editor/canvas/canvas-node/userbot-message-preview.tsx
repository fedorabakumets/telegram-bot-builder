/**
 * @fileoverview Превью ноды userbot_message на канвасе
 * Показывает текст сообщения и получателя
 */

import { Node } from '@/types/bot';
import { FormattedText } from '@/components/editor/inline-rich/components/FormattedText';

/** Пропсы компонента UserbotMessagePreview */
interface UserbotMessagePreviewProps {
  /** Узел userbot_message */
  node: Node;
}

/**
 * Превью сообщения юзербота на канвасе
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotMessagePreview({ node }: UserbotMessagePreviewProps) {
  const data = node.data as any;
  const entity = data.userbotEntity || '';
  const messageText = data.messageText || '';

  return (
    <div className="mb-3">
      {/* Получатель */}
      {entity && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] text-violet-500 dark:text-violet-400">→</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-mono truncate max-w-[160px]">
            {entity}
          </span>
        </div>
      )}

      {/* Текст сообщения */}
      {messageText && (
        <div className="rounded-xl p-3 bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800/30">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 mt-1.5 flex-shrink-0"></div>
            <FormattedText value={messageText} lineClamp={6} enableMarkdown={data.markdown} />
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {!messageText && !entity && (
        <div className="text-xs text-muted-foreground/50 italic px-2">
          Настройте получателя и текст
        </div>
      )}
    </div>
  );
}
