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
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-comments text-violet-400 text-xs" />
        </div>
        <span className="text-sm font-semibold text-violet-300 leading-tight">
          Сообщение в теме группы
        </span>
      </div>

      {groupLabel && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-hashtag text-violet-500/70 text-[10px]" />
          <span className="font-mono text-xs text-violet-300/80 bg-violet-900/30 border border-violet-700/40 rounded px-1.5 py-0.5">
            {groupLabel}
          </span>
        </div>
      )}

      {(threadIdVariable || resolvedUserIdVariable) && (
        <div className="flex flex-col gap-1 border-t border-violet-800/30 pt-1.5">
          {threadIdVariable && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-link text-purple-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">thread</span>
              <span className="font-mono text-[10px] text-purple-300/80">{threadIdVariable}</span>
            </div>
          )}
          {resolvedUserIdVariable && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-user-check text-emerald-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">user_id</span>
              <span className="font-mono text-[10px] text-emerald-300/80">{resolvedUserIdVariable}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
