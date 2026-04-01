/**
 * @fileoverview Компонент заголовка узла управления контентом
 * 
 * Отображает заголовок для узлов управления контентом:
 * закрепление/открепление сообщения, удаление сообщения и пересылка.
 */

import { Node } from '@/types/bot';

/**
 * Типы узлов управления контентом
 */
type ContentManagementType = 'pin_message' | 'unpin_message' | 'delete_message' | 'forward_message' | 'create_forum_topic';

/**
 * Интерфейс свойств компонента ContentManagementHeader
 *
 * @interface ContentManagementHeaderProps
 * @property {Node} node - Узел с данными
 * @property {ContentManagementType} type - Тип узла
 */
interface ContentManagementHeaderProps {
  node: Node;
  type: ContentManagementType;
}

/**
 * Компонент заголовка управления контентом
 *
 * @component
 * @description Отображает заголовок для узлов управления контентом
 *
 * @param {ContentManagementHeaderProps} props - Свойства компонента
 * @param {Node} props.node - Узел с данными
 * @param {ContentManagementType} props.type - Тип узла
 *
 * @returns {JSX.Element} Компонент заголовка
 */
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

  // Данные для forward_message
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
          <span className="flex items-center gap-1.5">
            <i className="fas fa-inbox text-amber-500/70 text-[10px]" />
            <span className="text-[10px] text-slate-400">источник:</span>
            <span className="text-[10px] text-amber-300/80 font-mono">
              {sourceIdSource === 'variable'
                ? ((node.data as any).sourceMessageVariableName || 'переменная')
                : sourceLabel[sourceIdSource] ?? sourceIdSource}
            </span>
          </span>

          {/* Цели */}
          {targets.length > 0 && (
            <span className="flex flex-col gap-1 border-t border-amber-800/20 pt-1">
              <span className="flex items-center gap-1.5">
                <i className="fas fa-paper-plane text-amber-500/70 text-[10px]" />
                <span className="text-[10px] text-slate-400">чат назначения:</span>
              </span>
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
                  <span key={i} className="flex items-center gap-1.5">
                    <i className={`fas ${icon} text-amber-500/60 text-[10px]`} />
                    <span className="font-mono text-[10px] text-amber-300/80">{label}</span>
                    {thread && (
                      <>
                        <i className="fas fa-link text-purple-500/50 text-[10px]" />
                        <span className="font-mono text-[10px] text-purple-300/70">{thread}</span>
                      </>
                    )}
                  </span>
                );
              })}
            </span>
          )}
          {/* Флаги */}
          {(disableNotification || hideAuthor) && (
            <span className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {disableNotification && (
                <span className="flex items-center gap-1 text-[10px] bg-slate-700/50 border border-slate-600/40 rounded px-1.5 py-0.5 text-slate-300">
                  <i className="fas fa-bell-slash text-[9px]" />
                  без уведомления
                </span>
              )}
              {hideAuthor && (
                <span className="flex items-center gap-1 text-[10px] bg-slate-700/50 border border-slate-600/40 rounded px-1.5 py-0.5 text-slate-300">
                  <i className="fas fa-user-secret text-[9px]" />
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
