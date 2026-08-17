/**
 * @fileoverview Убирает из выбора рассылки ботов с недействительным токеном
 * @module client/components/editor/broadcast/hooks/use-strip-inactive-token-ids
 */

import { useEffect } from 'react';
import type { BotToken } from '@shared/schema';
import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';

/**
 * Снимает выбор с ботов, у которых токен помечен неактивным
 * @param tokens - Токены проекта
 * @param selectedTokenIds - Текущий выбор в форме
 * @param onChange - Обновление выбора
 */
export function useStripInactiveTokenIds(
  tokens: BotToken[],
  selectedTokenIds: number[],
  onChange: (tokenIds: number[]) => void,
): void {
  useEffect(() => {
    if (tokens.length === 0 || selectedTokenIds.length === 0) return;
    const next = selectedTokenIds.filter((id) => {
      const token = tokens.find((item) => item.id === id);
      return !token || isTokenActiveForBroadcast(token.isActive);
    });
    if (next.length !== selectedTokenIds.length) onChange(next);
  }, [tokens, selectedTokenIds, onChange]);
}
