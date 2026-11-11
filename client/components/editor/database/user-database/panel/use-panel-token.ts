/** @fileoverview Выбор бота в панели пользователей с поддержкой внешнего управления. */
import { useCallback, useEffect, useState } from 'react';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useNormalizeSelectedTokenId } from '@/hooks/use-normalize-selected-token';
import { UserDatabasePanelProps } from '../types';

/**
 * Согласует выбранного бота с родительской панелью и удалением токенов.
 * @param props - Параметры панели пользователей.
 * @returns Токены, текущий выбор и обработчик изменения.
 */
export function usePanelToken(props: UserDatabasePanelProps) {
  const { projectId, selectedTokenId, availableTokens, onSelectToken } = props;
  const tokensInfo = useProjectTokens([projectId]);
  const projectTokens = availableTokens ?? tokensInfo[0]?.tokens ?? [];
  const [internalTokenId, setInternalTokenId] = useState<number | null>(selectedTokenId ?? null);
  /** Значение null сохраняет режим «Все боты». */
  const resolvedSelectedTokenId = selectedTokenId !== undefined ? selectedTokenId : internalTokenId;
  useEffect(() => {
    if (selectedTokenId !== undefined) setInternalTokenId(selectedTokenId);
  }, [selectedTokenId]);
  /**
   * Обновляет выбранного бота внутри панели и у родителя.
   * @param tokenId - Идентификатор бота или все боты.
   */
  const handleSelectToken = useCallback((tokenId: number | null): void => {
    if (selectedTokenId === undefined) setInternalTokenId(tokenId);
    onSelectToken?.(tokenId);
  }, [selectedTokenId, onSelectToken]);
  useNormalizeSelectedTokenId(projectTokens, resolvedSelectedTokenId, handleSelectToken);
  return { projectTokens, resolvedSelectedTokenId, handleSelectToken };
}
