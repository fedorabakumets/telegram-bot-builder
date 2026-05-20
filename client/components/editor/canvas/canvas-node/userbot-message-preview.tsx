/**
 * @fileoverview Превью ноды userbot_message на канвасе
 * Компактная метка «userbot» + текст сообщения + получатель
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
      {/* Компактная метка userbot */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
          userbot
        </span>
        {entity && (
          <span className="text-xs text-violet-400/70 font-mono truncate max-w-[140px]">
            → {entity}
          </span>
        )}
      </div>

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
