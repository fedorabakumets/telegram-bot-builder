/** @fileoverview Переключение ленты и бота для ответа внутри общей личной переписки. */
import type { BotToken } from '@shared/schema';
import type { UserBotMembership } from '@shared/user-bot-membership';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { statusAppearance } from '@shared/status-appearance';
import { botAvailabilityLabel } from '@shared/bot-availability-label';

/** Область истории и конкретный бот отправки. */
export interface DialogHistoryBotSelectProps {
  /** Только боты с сохранённой перепиской собеседника. */ tokens?: BotToken[];
  /** Сведения о пользователе в каждом боте. */ memberships?: UserBotMembership[];
  /** Бот ленты; null объединяет сохранённые сообщения всех ботов. */ historyTokenId?: number | null;
  /** Изменение области истории. */ onHistoryTokenChange?: (id: number | null) => void;
  /** Конкретный бот для ответа в объединённой ленте. */ replyTokenId?: number | null;
  /** Явный выбор отправителя ответа. */ onReplyTokenChange?: (id: number) => void;
}

/**
 * Показывает имя и username бота без смешивания его статуса с соседними ботами.
 * @param props - Бот и сведения о переписке пользователя.
 * @returns Читаемая подпись пункта.
 */
function BotLabel({ token }: {
  /** Бот выбранного проекта. */ token: BotToken;
}) {
  const name = token.botFirstName || token.name || `Бот #${token.id}`;
  const username = token.botUsername?.replace(/^@/, '');
  /** В пункте бота показывается только его собственная недоступность, без активности пользователя. */
  const status = botAvailabilityLabel(token.authorizationError, token.isActive);
  return <span className="flex min-w-0 items-center gap-2">
    <span className="min-w-0 truncate">{name}{username ? ` (@${username})` : ''}</span>
    {status && <span className="shrink-0 text-[11px]" style={statusAppearance(status)}>{status}</span>}
  </span>;
}

/**
 * Сохраняет общий список людей при переключении истории конкретного собеседника.
 * @param props - Боты истории и обработчики явного выбора.
 * @returns Компактные селекторы ленты и отправителя.
 */
export function DialogHistoryBotSelect({ tokens = [], historyTokenId,
  onHistoryTokenChange, replyTokenId, onReplyTokenChange }: DialogHistoryBotSelectProps) {
  if (!onHistoryTokenChange || tokens.length < 2) return null;
  return <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-muted-foreground">Лента:</span>
      <Select value={historyTokenId == null ? 'all' : String(historyTokenId)}
        onValueChange={value => onHistoryTokenChange(value === 'all' ? null : Number(value))}>
        <SelectTrigger aria-label="Боты в ленте диалога" className="h-8 min-w-0 max-w-[min(26rem,70vw)] gap-2 px-2 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent className="users-portal">
          <SelectItem value="all">Все боты · {tokens.length}</SelectItem>
          {tokens.map(token => <SelectItem key={token.id} value={String(token.id)}>
            <BotLabel token={token} />
          </SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    {historyTokenId == null && onReplyTokenChange && <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-muted-foreground">Ответить через:</span>
      <Select value={replyTokenId == null ? '' : String(replyTokenId)} onValueChange={value => onReplyTokenChange(Number(value))}>
        <SelectTrigger aria-label="Бот для ответа" className="h-8 min-w-0 max-w-[min(26rem,70vw)] gap-2 px-2 text-xs"><SelectValue placeholder="Выберите бота" /></SelectTrigger>
        <SelectContent className="users-portal">{tokens.map(token => <SelectItem key={token.id} value={String(token.id)}>
          <BotLabel token={token} />
        </SelectItem>)}</SelectContent>
      </Select>
    </div>}
  </div>;
}
