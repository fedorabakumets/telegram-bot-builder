/** @fileoverview Отдельные строки ботов внутри компактной карточки пользователя. */
import { UserContactOrigin } from '../desktop/user-contact-origin';
import { Bot } from 'lucide-react';
import type { UserBotData } from '@shared/schema';
import type { VariableToQuestionMap } from '../../types';
import { userBotRecord } from '../../utils/user-bot-record';
import { MobileUserStats } from './mobile-user-stats';
import { MobileUserBadges } from './mobile-user-badges';
import { UserVariables } from '../details/user-variables';
/**
 * Сохраняет общую запись и показывает показатели каждого бота на узком экране.
 * @param props - Пользователь, вопросы и переход к диалогу.
 * @returns Разбивка по ботам.
 */
export function MobileBotBreakdown({ user, variableToQuestionMap, onNavigate }: {
  /** Общая запись человека. */ user: UserBotData;
  /** Подписи вопросов сценария. */ variableToQuestionMap?: VariableToQuestionMap;
  /** Переход к диалогу конкретного бота. */ onNavigate?: (user: UserBotData) => void;
}) {
  if ((user.botMemberships?.length ?? 0) < 2) return null;
  return <div className="space-y-4">{user.botMemberships!.map(bot => {
    const record = userBotRecord(user, bot);
    return <section key={bot.tokenId} className="space-y-3 border-t border-border pt-4">
      <button type="button" className="flex max-w-full items-center gap-2 text-left text-sm"
        onClick={() => onNavigate?.(record)}><Bot className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{bot.username ? `@${bot.username}` : bot.name}</span></button>
      <MobileUserBadges user={record} /><UserContactOrigin user={record} /><MobileUserStats user={record} />
      <UserVariables user={record} variableToQuestionMap={variableToQuestionMap} />
    </section>;
  })}</div>;
}
