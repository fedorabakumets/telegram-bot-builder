/** @fileoverview Подстроки ботов с отдельными показателями под общей строкой пользователя. */
import { Bot } from 'lucide-react';
import type { UserBotData } from '@shared/schema';
import type { VariableToQuestionMap } from '../../types';
import { TableRow, TableCell } from '@/components/ui/table';
import { DesktopMetricCells } from './desktop-metric-cells';
import { userBotRecord } from '../../utils/user-bot-record';
/**
 * Показывает каждый бот отдельной строкой, сохраняя общую группировку человека.
 * @param props - Пользователь, вопросы и переход к выбранному боту.
 * @returns Строки ботов либо отсутствие подстрок.
 */
export function UserBotRows({ user, variableToQuestionMap, onNavigate }: {
  /** Сводный пользователь. */ user: UserBotData;
  /** Подписи вопросов. */ variableToQuestionMap?: VariableToQuestionMap;
  /** Переход к диалогу конкретного бота. */ onNavigate?: (user: UserBotData) => void;
}) {
  if ((user.botMemberships?.length ?? 0) < 2) return null;
  return <>{user.botMemberships!.map(bot => {
    const record = userBotRecord(user, bot);
    return <TableRow key={bot.tokenId} className="users-bot-row" data-user-id={user.userId} data-bot-id={bot.tokenId}>
      <TableCell><div className="users-bot-name"><Bot className="h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0"><button type="button" className="users-copy-value block max-w-full truncate text-sm"
          onClick={() => onNavigate?.(record)} title={bot.username ? `@${bot.username}` : bot.name}
          aria-label={`Открыть диалог с ${user.firstName || user.userId} в боте ${bot.username || bot.name}`}>
          {bot.name}</button>{bot.username && <p className="truncate text-xs text-muted-foreground">@{bot.username}</p>}
        </div></div></TableCell>
      <DesktopMetricCells user={record} variableToQuestionMap={variableToQuestionMap} />
      <TableCell />
    </TableRow>;
  })}</>;
}
