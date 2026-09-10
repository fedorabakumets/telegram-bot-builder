/**
 * @fileoverview Превью узла триггера входа/выхода участника на холсте
 * @module components/editor/canvas/canvas-node/member-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента превью триггера участника */
interface MemberTriggerPreviewProps {
  /** Узел триггера */
  node: Node;
}

/**
 * Превью узла триггера участника группы.
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function MemberTriggerPreview({ node }: MemberTriggerPreviewProps) {
  const data = node.data as any;
  const memberEventType: string = data.memberEventType ?? 'join';
  const groupChatIdSource = data.groupChatIdSource ?? 'manual';
  const groupChatId = data.groupChatId;
  const groupChatVariableName = data.groupChatVariableName;

  const eventLabels: Record<string, string> = {
    join: 'Вход',
    leave: 'Выход',
    both: 'Вход и выход',
  };

  return (
    <div className="flex flex-col gap-2 w-full px-1">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user-plus text-emerald-400 text-[10px]" />
        </div>
        <span className="text-xs font-semibold text-emerald-300">Участник вошёл или вышел</span>
      </div>

      <div className="flex items-center gap-1.5">
        <i className="fas fa-bolt text-emerald-500/60 text-[10px]" />
        <span className="font-mono text-[10px] text-emerald-300/80 bg-emerald-900/30 border border-emerald-700/40 rounded px-1.5 py-0.5">
          {eventLabels[memberEventType] ?? memberEventType}
        </span>
      </div>

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
    </div>
  );
}
