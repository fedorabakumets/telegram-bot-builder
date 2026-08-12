/**
 * @fileoverview Оценка пересечения аудиторий нескольких ботов «большой рассылки»
 * @module botIntegration/handlers/broadcasts/overlap-estimate
 */

/** Аудитория одного бота кампании */
export interface TokenAudience {
  /** ID токена бота */
  tokenId: number;
  /** Telegram user_id получателей этого бота */
  userIds: string[];
}

/** Результат оценки пересечения аудиторий */
export interface OverlapEstimate {
  /** Сумма получателей по всем ботам (с дублями — столько сообщений уйдёт) */
  total: number;
  /** Количество уникальных пользователей среди всех ботов */
  uniqueCount: number;
  /** Количество пользователей, присутствующих более чем у одного бота */
  overlapEstimate: number;
  /** Размер аудитории по каждому боту */
  perBot: Array<{ tokenId: number; count: number }>;
}

/**
 * Считает суммарную, уникальную и пересекающуюся аудиторию по ботам.
 * Дубли внутри одного бота не учитываются как пересечение.
 * @param audiences - Аудитории по каждому боту
 * @returns Оценка суммарной аудитории и пересечения
 */
export function estimateAudienceOverlap(audiences: TokenAudience[]): OverlapEstimate {
  /** Число ботов, у которых встречается userId */
  const botsPerUser = new Map<string, number>();
  let total = 0;

  for (const audience of audiences) {
    total += audience.userIds.length;
    for (const userId of new Set(audience.userIds)) {
      botsPerUser.set(userId, (botsPerUser.get(userId) ?? 0) + 1);
    }
  }

  let overlapEstimate = 0;
  for (const botCount of botsPerUser.values()) {
    if (botCount > 1) overlapEstimate++;
  }

  return {
    total,
    uniqueCount: botsPerUser.size,
    overlapEstimate,
    perBot: audiences.map((audience) => ({
      tokenId: audience.tokenId,
      count: audience.userIds.length,
    })),
  };
}
