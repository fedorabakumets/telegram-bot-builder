/**
 * @fileoverview Хук подстановки всех ботов проекта в форму рассылки по умолчанию
 * @module client/components/editor/broadcast/hooks/use-default-token-ids
 */

import { useEffect, useRef } from 'react';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';

/**
 * Подставляет всех ботов проекта в выбор по умолчанию — один раз,
 * как только список ботов загрузился и в форме ещё ничего не выбрано.
 *
 * @param projectId - Идентификатор проекта
 * @param selectedTokenIds - Текущий выбор ботов в форме
 * @param onChange - Обработчик установки ботов по умолчанию
 * @returns void
 */
export function useDefaultTokenIds(
  projectId: number,
  selectedTokenIds: number[],
  onChange: (tokenIds: number[]) => void,
): void {
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];
  /** Защита от повторной подстановки после того, как пользователь снял всех ботов */
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    if (tokens.length === 0) return;
    if (selectedTokenIds.length > 0) {
      applied.current = true;
      return;
    }
    applied.current = true;
    const activeIds = tokens
      .filter((token) => isTokenActiveForBroadcast(token.isActive))
      .map((token) => token.id);
    if (activeIds.length > 0) onChange(activeIds);
  }, [tokens.length, selectedTokenIds.length, onChange]);
}
