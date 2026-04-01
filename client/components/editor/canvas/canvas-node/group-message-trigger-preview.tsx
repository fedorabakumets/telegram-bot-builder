/**
 * @fileoverview Превью узла триггера сообщения в теме группы на холсте
 * @module components/editor/canvas/canvas-node/group-message-trigger-preview
 */

import { Node } from '@/types/bot';

interface GroupMessageTriggerPreviewProps {
  node: Node;
}

export function GroupMessageTriggerPreview({ node }: GroupMessageTriggerPreviewProps) {
  const data = node.data as any;
  const groupChatIdSource = data.groupChatIdSource ?? 'manual';
  const groupChatId = data.groupChatId;
  const groupChatVariableName = data.groupChatVariableName;
  const threadIdVariable = data.threadIdVariable;
  const resolvedUserIdVariable = data.resolvedUserIdVariable;

  return (
    <div className="flex flex-col gap-2 w-full px-1">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-comments text-violet-400 text-[10px]" />
        </div>
        <span className="text-xs font-semibold text-violet-300">Триггер входящего сообщения в теме группы</span>
      </div>

      {/* ID группы */}
      {groupChatIdSource === 'manual' && groupChatId && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-hashtag text-violet-500/60 text-[10px]" />
          <span className="font-mono text-[10px] text-violet-300/80 bg-violet-900/30 border border-violet-700/40 rounded px-1.5 py-0.5">
            {groupChatId}
          </span>
        </div>
      )}
      {groupChatIdSource === 'variable' && groupChatVariableName && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-code text-violet-500/60 text-[10px]" />
          <span className="font-mono text-[10px] text-violet-300/80 bg-violet-900/30 border border-violet-700/40 rounded px-1.5 py-0.5">
            {'{' + groupChatVariableName + '}'}
          </span>
        </div>
      )}

      {/* Переменные */}
      {(threadIdVariable || resolvedUserIdVariable) && (
        <div className="flex flex-col gap-1 border-t border-violet-800/30 pt-1.5">
          {threadIdVariable && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-link text-purple-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">thread →</span>
              <span className="font-mono text-[10px] text-purple-300/80">{threadIdVariable}</span>
            </div>
          )}
          {resolvedUserIdVariable && (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-user-check text-emerald-500/60 text-[10px]" />
              <span className="text-[10px] text-slate-400">user_id →</span>
              <span className="font-mono text-[10px] text-emerald-300/80">{resolvedUserIdVariable}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
