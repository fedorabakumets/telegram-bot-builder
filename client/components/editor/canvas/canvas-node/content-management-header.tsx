/**
 * @fileoverview Компонент заголовка узла управления контентом
 */

import { Node } from '@/types/bot';

type ContentManagementType = 'pin_message' | 'unpin_message' | 'delete_message' | 'forward_message' | 'create_forum_topic';

interface ContentManagementHeaderProps {
  node: Node;
  type: ContentManagementType;
}

export function ContentManagementHeader({ node, type }: ContentManagementHeaderProps) {
  const shouldShowCommandChip = type !== 'forward_message' && type !== 'create_forum_topic';

  const labels: Record<ContentManagementType, string> = {
    pin_message: 'Управление контентом',
    unpin_message: 'Управление контентом',
    delete_message: 'Управление контентом',
    forward_message: 'Переслать сообщение',
    create_forum_topic: 'Создать топик',
  };

  const chipClasses: Record<ContentManagementType, string> = {
    pin_message: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
    unpin_message: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
    delete_message: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    forward_message: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    create_forum_topic: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
  };

  const targets: any[] = (node.data as any).targetChatTargets ?? [];
  const sourceIdSource: string = (node.data as any).sourceMessageIdSource ?? 'current_message';
  const disableNotification: boolean = (node.data as any).disableNotification ?? false;
  const hideAuthor: boolean = (node.data as any).hideAuthor ?? false;

  const sourceLabel: Record<string, string> = {
    current_message: 'текущее',
    variable: 'из переменной',
    node: 'из узла',
  };

  const targetTypeIcon: Record<string, string> = {
    user: 'fa-user',
    group: 'fa-users',
    channel: 'fa-bullhorn',
  };

  return (
    <span className="flex flex-col gap-2">
      {shouldShowCommandChip && (
        <span className={`font-mono text-sm px-2 py-1 rounded-lg border inline-block w-fit ${chipClasses[type]}`}>
          {node.data.command || `/${type}`}
        </span>
      )}
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
        {labels[type]}
      </span>

      {type === 'forward_message' && (
        <span className="flex flex-col gap-1.5 mt-0.5">
          {/* Источник */}
          <span className="flex items-center gap-1.5 bg-amber-900/10 border border-amber-700/20 rounded-md px-2 py-1">
            <i className="fas fa-inbox text-amber-500/80 text-[10px]" />
            <span className="text-[10px] text-slate-400">сообщение:</span>
            <span className="text-[10px] text-amber-300/90 font-mono">
              {sourceIdSource === 'variable'
                ? ((node.data as any).sourceMessageVariableName || 'переменная')
                : sourceLabel[sourceIdSource] ?? sourceIdSource}
            </span>
          </span>

          {/* Цели */}
          {targets.length > 0 && (
            <span className="flex flex-col gap-1 border-t border-amber-800/20 pt-1.5">
              <span className="flex items-center gap-1 mb-0.5">
                <i className="fas fa-paper-plane text-amber-500/70 text-[10px]" />
                <span className="text-[10px] text-slate-400">чат назначения:</span>
              </span>
              <span className="flex flex-wrap gap-1">
                {targets.map((t: any, i: number) => {
                  const icon = targetTypeIcon[t.targetChatType] ?? 'fa-paper-plane';
                  const label =
                    t.targetChatIdSource === 'variable'
                      ? `{${t.targetChatVariableName || 'переменная'}}`
                      : t.targetChatId
                        ? String(t.targetChatId)
                        : '—';
                  const thread =
                    t.targetThreadIdSource === 'variable' && t.targetThreadIdVariable
                      ? t.targetThreadIdVariable
                      : null;
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-1 bg-amber-900/20 border border-amber-700/30 rounded-full px-2 py-0.5"
                    >
                      <i className={`fas ${icon} text-amber-400/70 text-[9px]`} />
                      <span className="font-mono text-[10px] text-amber-300/90">{label}</span>
                      {thread && (
                        <>
                          <i className="fas fa-link text-purple-500/50 text-[9px]" />
                          <span className="font-mono text-[10px] text-purple-300/70">{thread}</span>
                        </>
                      )}
                    </span>
                  );
                })}
              </span>
            </span>
          )}

          {/* Флаги — inline-бейджи в одну строку */}
          {(disableNotification || hideAuthor) && (
            <span className="flex items-center gap-1 flex-wrap border-t border-slate-700/30 pt-1">
              {disableNotification && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-slate-800/60 border border-slate-600/30 rounded-full px-1.5 py-0.5 text-slate-400">
                  <i className="fas fa-bell-slash text-[8px]" />
                  без уведомления
                </span>
              )}
              {hideAuthor && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-slate-800/60 border border-slate-600/30 rounded-full px-1.5 py-0.5 text-slate-400">
                  <i className="fas fa-user-secret text-[8px]" />
                  скрыть автора
                </span>
              )}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
