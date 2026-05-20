/**
 * @fileoverview Превью ноды userbot_inline_query на канвасе
 */

import { Node } from '@/types/bot';

/** Пропсы компонента */
interface UserbotInlineQueryPreviewProps {
  /** Узел userbot_inline_query */
  node: Node;
}

/**
 * Превью inline-запроса юзерботом на канвасе
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotInlineQueryPreview({ node }: UserbotInlineQueryPreviewProps) {
  const data = node.data as any;
  const bot = data.botUsername || '';
  const query = data.query || '';

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
          inline
        </span>
        {bot && (
          <span className="text-xs text-violet-400/70 font-mono truncate max-w-[120px]">
            {bot}
          </span>
        )}
      </div>
      {query && (
        <div className="rounded-lg p-2 bg-violet-100/50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/30">
          <span className="text-xs font-mono text-violet-700 dark:text-violet-300 truncate block">
            {query}
          </span>
        </div>
      )}
      {!bot && !query && (
        <div className="text-xs text-muted-foreground/50 italic px-2">
          Настройте inline-запрос
        </div>
      )}
    </div>
  );
}
