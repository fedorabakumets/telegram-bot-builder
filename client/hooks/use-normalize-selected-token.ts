/**
 * @fileoverview Нормализация выбранного tokenId в селекторе бота
 * `null` = «Все боты» (валидный выбор). Сбрасывает только удалённый id.
 * @module hooks/use-normalize-selected-token
 */

import { useEffect } from "react";

/**
 * Если выбранный tokenId отсутствует в списке токенов — сбрасывает на null («Все боты»).
 * Не подменяет null дефолтным ботом (иначе селектор «Все боты» сразу прыгает назад).
 * @param tokens - Токены текущего проекта
 * @param selectedTokenId - Текущий выбор (null = все боты)
 * @param onReset - Колбэк сброса (обычно onSelectToken(null))
 */
export function useNormalizeSelectedTokenId(
  tokens: Array<{ id: number }>,
  selectedTokenId: number | null | undefined,
  onReset: (tokenId: null) => void,
): void {
  useEffect(() => {
    if (tokens.length === 0) return;
    if (selectedTokenId == null) return;
    if (tokens.some((token) => token.id === selectedTokenId)) return;
    onReset(null);
  }, [tokens, selectedTokenId, onReset]);
}
