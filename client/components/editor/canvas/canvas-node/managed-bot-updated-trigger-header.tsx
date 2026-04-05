/**
 * @fileoverview Заголовок узла триггера управляемого бота на холсте
 * @module components/editor/canvas/canvas-node/managed-bot-updated-trigger-header
 */

import { Node } from '@/types/bot';

/** Пропсы компонента заголовка триггера управляемого бота */
interface ManagedBotUpdatedTriggerHeaderProps {
  /** Узел триггера */
  node: Node;
}

/**
 * Заголовок узла триггера управляемого бота.
 * Показывает иконку, название, подпись и опциональный фильтр по userId.
 * @param {ManagedBotUpdatedTriggerHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок узла
 */
export function ManagedBotUpdatedTriggerHeader({ node }: ManagedBotUpdatedTriggerHeaderProps) {
  const data = node.data as any;
  const filterByUserId: string = data.filterByUserId ?? '';
  const saveBotIdTo: string = data.saveBotIdTo ?? 'bot_id';
  const saveCreatorIdTo: string = data.saveCreatorIdTo ?? 'creator_id';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Заголовок: иконка + название + подпись */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-robot text-indigo-400 text-sm" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-indigo-300">Управляемый бот</span>
          <span className="text-[10px] text-indigo-400/60">триггер апдейта</span>
        </div>
      </div>

      {/* Фильтр по userId */}
      {filterByUserId && (
        <div className="flex items-center gap-1.5 bg-indigo-900/20 border border-indigo-700/30 rounded-md px-2 py-1">
          <i className="fas fa-filter text-indigo-500/70 text-[10px]" />
          <span className="text-[10px] text-slate-400">user_id:</span>
          <span className="font-mono text-[10px] text-indigo-300/90 bg-indigo-900/40 border border-indigo-700/40 rounded px-1.5 py-0.5">
            {filterByUserId}
          </span>
        </div>
      )}

      {/* Переменные: bot_id и creator_id */}
      {(saveBotIdTo || saveCreatorIdTo) && (
        <div className="flex flex-col gap-1 border-t border-indigo-800/30 pt-1.5">
          {saveBotIdTo && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-robot text-indigo-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">bot_id →</span>
              <span className="font-mono text-[10px] text-indigo-300/80">{saveBotIdTo}</span>
            </div>
          )}
          {saveCreatorIdTo && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-user text-violet-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">creator_id →</span>
              <span className="font-mono text-[10px] text-violet-300/80">{saveCreatorIdTo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
