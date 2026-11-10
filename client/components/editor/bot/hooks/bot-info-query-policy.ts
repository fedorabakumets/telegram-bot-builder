/**
 * @fileoverview Выбор токена и периодичности безопасного обновления профиля бота.
 */
import type { BotToken } from '@shared/schema';
import type { BotStatusResponse } from '../bot-types';

/** Достаточные для запроса поля токена, без самого секрета. */
type ProfileToken = Pick<BotToken, 'id' | 'isDefault' | 'isActive' | 'authorizationError'>;

/**
 * Выбирает профиль проекта, не обращаясь к отключённому или отклонённому токену.
 * @param tokens - Токены в порядке, полученном от сервера
 * @param statuses - Статусы процессов всех проектов
 * @param includeBotInfo - Нужен ли профиль текущему экрану
 * @returns Токен, разрешение запроса и интервал только для выбранного работающего бота
 */
export function botInfoQueryPolicy(tokens: ProfileToken[], statuses: BotStatusResponse[], includeBotInfo: boolean) {
  const token = tokens.find(item => item.isDefault === 1) ?? tokens[0];
  const enabled = includeBotInfo && !!token && token.isActive !== 0
    && token.authorizationError !== 'unauthorized';
  const running = !!token && statuses.some(status =>
    (status.tokenId ?? status.instance?.tokenId) === token.id && status.status === 'running');
  return { tokenId: token?.id, enabled, refetchInterval: enabled && running ? 60000 : false as number | false };
}
