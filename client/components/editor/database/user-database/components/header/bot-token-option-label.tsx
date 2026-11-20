/** @fileoverview Подпись бота с количеством пользователей и отдельным состоянием Telegram. */
import type { BotToken } from '@shared/schema';
import { IdBadge } from './project-name-label';
import { botShortStatusLabel } from '@shared/bot-availability-label';
import { statusAppearance } from '@shared/status-appearance';
/**
 * Даёт короткий статус без смешивания заморозки, отказа токена и локального отключения.
 * @param token - Состояние бота из общего справочника.
 * @returns Подпись и пояснение статуса.
 */
export function botSelectorStatus(token: BotToken): string {
  return botShortStatusLabel(token.authorizationError, token.isActive);
}
/**
 * Сохраняет видимость количества и статуса при сокращении длинного имени.
 * @param props - Бот и количество профилей либо подтверждённой аудитории.
 * @returns Общая подпись раскрытого пункта и выбранного бота.
 */
export function BotTokenOptionLabel({ token, count, audience, disconnected, runtimeLabel }: {
  /** Текущий бот. */ token: BotToken;
  /** Количество пользователей. */ count?: number;
  /** Счётчик подтверждённой аудитории. */ audience: boolean;
  /** Исполнитель не подтвердил связь. */ disconnected?: boolean;
  /** Статус выполнения для областей, где важно состояние процесса. */ runtimeLabel?: string;
}) {
  const name = token.botFirstName && token.botUsername ? `${token.botFirstName} (@${token.botUsername})`
    : token.botFirstName || (token.botUsername ? `@${token.botUsername}` : token.name || `Бот №${token.id}`);
  const availability = botSelectorStatus(token);
  const status = runtimeLabel ?? (disconnected && availability === 'Активен' ? 'Нет связи' : availability);
  /** Цвет берётся из того же справочника, что и остальные статусы интерфейса. */
  const { color: statusColor } = statusAppearance(status);
  return <span className="flex min-w-0 items-center gap-2" title={`${name} ${status}`}>
    {/** Название и идентификатор образуют общую подпись, а показатели прижаты вправо. */}
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <span className="min-w-0 truncate">{name}</span>
      <IdBadge id={token.id} className="bot-selector-id" />
    </span>
    {/** Место счётчика не исчезает до загрузки; неизвестное значение не выдаётся за ноль. */}
    <span className="shrink-0 tabular-nums" title={count === undefined ? 'Количество пользователей пока не получено' : `Пользователей: ${count.toLocaleString('ru-RU')}`}>
      {audience ? '' : 'профилей: '}{count === undefined ? '—' : count.toLocaleString('ru-RU')}
    </span>
    <span className="bot-selector-status shrink-0 text-xs" style={{ color: statusColor }} title={status === 'Ошибка токена' ? 'Telegram отклонил токен: 401 Unauthorized' : status}>{status}</span>
  </span>;
}
