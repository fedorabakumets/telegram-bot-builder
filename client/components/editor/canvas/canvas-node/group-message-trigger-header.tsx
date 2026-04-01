import { Node } from '@/types/bot';

interface GroupMessageTriggerHeaderProps {
  node: Node;
}

export function GroupMessageTriggerHeader({ node }: GroupMessageTriggerHeaderProps) {
  const data = node.data as any;
  const groupChatIdSource: string = data.groupChatIdSource ?? 'manual';
  const groupChatId: string = data.groupChatId ?? '';
  const groupChatVariableName: string = data.groupChatVariableName ?? '';
  const threadIdVariable: string = data.threadIdVariable ?? '';
  const resolvedUserIdVariable: string = data.resolvedUserIdVariable ?? '';

  const groupLabel =
    groupChatIdSource === 'variable' && groupChatVariableName
      ? `{${groupChatVariableName}}`
      : groupChatId || '';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Заголовок: иконка + название + подпись */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-comments text-violet-400 text-sm" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-violet-300">Сообщение в теме</span>
          <span className="text-[10px] text-violet-400/60">триггер входящего</span>
        </div>
        {groupChatIdSource === 'variable' && (
          <i className="fas fa-code text-violet-400/50 text-[10px] ml-auto" title="из переменной" />
        )}
      </div>

      {/* ID группы */}
      {groupLabel && (
        <div className="flex items-center gap-1.5 bg-violet-900/20 border border-violet-700/30 rounded-md px-2 py-1">
          <i className="fas fa-hashtag text-violet-500/70 text-[10px]" />
          <span className="text-[10px] text-slate-400">группа:</span>
          <span className="font-mono text-[10px] text-violet-300/90 bg-violet-900/40 border border-violet-700/40 rounded px-1.5 py-0.5">
            {groupLabel}
          </span>
        </div>
      )}

      {/* Переменные: тема и пользователь */}
      {(threadIdVariable || resolvedUserIdVariable) && (
        <div className="flex flex-col gap-1 border-t border-violet-800/30 pt-1.5">
          {threadIdVariable && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-link text-purple-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">тема топика:</span>
              <span className="font-mono text-[10px] text-purple-300/80">{threadIdVariable}</span>
            </div>
          )}
          {resolvedUserIdVariable && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-user-check text-emerald-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">сохранить user_id:</span>
              <span className="font-mono text-[10px] text-emerald-300/80">{resolvedUserIdVariable}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
