/**
 * @fileoverview Превью узла триггера управляемого бота на холсте
 * @module components/editor/canvas/canvas-node/managed-bot-updated-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента превью триггера управляемого бота */
interface ManagedBotUpdatedTriggerPreviewProps {
  /** Узел триггера */
  node: Node;
}

/**
 * Превью узла триггера управляемого бота.
 * Отображает заголовок, фильтр по userId и список переменных.
 * @param {ManagedBotUpdatedTriggerPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Превью узла
 */
export function ManagedBotUpdatedTriggerPreview({ node }: ManagedBotUpdatedTriggerPreviewProps) {
  const data = node.data as any;
  const filterByUserId: string = data.filterByUserId ?? '';
  const saveBotIdTo: string = data.saveBotIdTo ?? '';
  const saveBotUsernameTo: string = data.saveBotUsernameTo ?? '';
  const saveCreatorIdTo: string = data.saveCreatorIdTo ?? '';

  return (
    <div className="flex flex-col gap-2 w-full px-1">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-robot text-indigo-400 text-[10px]" />
        </div>
        <span className="text-xs font-semibold text-indigo-300">Триггер управляемого бота</span>
      </div>

      {/* Фильтр по userId */}
      {filterByUserId && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-filter text-indigo-500/60 text-[10px]" />
          <span className="font-mono text-[10px] text-indigo-300/80 bg-indigo-900/30 border border-indigo-700/40 rounded px-1.5 py-0.5">
            user: {filterByUserId}
          </span>
        </div>
      )}

      {/* Переменные */}
      {(saveBotIdTo || saveBotUsernameTo || saveCreatorIdTo) && (
        <div className="flex flex-col gap-1 border-t border-indigo-800/30 pt-1.5">
          {saveBotIdTo && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-robot text-indigo-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">bot_id →</span>
              <span className="font-mono text-[10px] text-indigo-300/80">{saveBotIdTo}</span>
            </div>
          )}
          {saveBotUsernameTo && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-at text-indigo-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">username →</span>
              <span className="font-mono text-[10px] text-indigo-300/80">{saveBotUsernameTo}</span>
            </div>
          )}
          {saveCreatorIdTo && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-user text-violet-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">creator →</span>
              <span className="font-mono text-[10px] text-violet-300/80">{saveCreatorIdTo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
