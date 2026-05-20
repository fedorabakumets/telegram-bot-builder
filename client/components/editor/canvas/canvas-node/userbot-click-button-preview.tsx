/**
 * @fileoverview Превью ноды userbot_click_button на канвасе
 */

import { Node } from '@/types/bot';

/** Пропсы компонента */
interface UserbotClickButtonPreviewProps {
  /** Узел userbot_click_button */
  node: Node;
}

/**
 * Превью нажатия кнопки юзерботом на канвасе
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotClickButtonPreview({ node }: UserbotClickButtonPreviewProps) {
  const data = node.data as any;
  const entity = data.userbotEntity || '';
  const clickValue = data.clickValue || '';
  const clickMode = data.clickMode || 'text';

  const modeLabel = clickMode === 'text' ? '📝' : clickMode === 'data' ? '🔗' : '🔢';

  return (
    <div className="mb-3">
      {/* Метка userbot */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
          click
        </span>
        {entity && (
          <span className="text-xs text-violet-400/70 font-mono truncate max-w-[120px]">
            {entity}
          </span>
        )}
      </div>

      {/* Значение кнопки */}
      {clickValue && (
        <div className="rounded-lg p-2 bg-violet-100/50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{modeLabel}</span>
            <span className="text-xs font-mono text-violet-700 dark:text-violet-300 truncate">
              {clickValue}
            </span>
          </div>
        </div>
      )}

      {!clickValue && !entity && (
        <div className="text-xs text-muted-foreground/50 italic px-2">
          Настройте кнопку для нажатия
        </div>
      )}
    </div>
  );
}
