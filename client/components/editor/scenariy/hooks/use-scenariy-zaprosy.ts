/**
 * @fileoverview Хуки useQuery для загрузки сценариев (все, рекомендуемые, мои)
 * @module client/components/editor/scenariy/hooks/use-scenariy-zaprosy
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/queryClient';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import {
  ochistItIdStsenarievGostya,
  poluchitIdsParamDlyaGostya,
} from '../utils/scenariy-hranilishche';
import type { BotTemplate } from '@shared/schema';

/** Общие настройки кэша для запросов сценариев */
const NASTROYKI_KESHA = {
  retry: 2,
  staleTime: 10 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
} as const;

/**
 * Хук для загрузки всех сценариев
 * @returns объект с данными, флагами загрузки и ошибки
 */
export function useVseStsenary() {
  return useQuery<BotTemplate[]>({
    queryKey: ['/api/templates'],
    ...NASTROYKI_KESHA,
  });
}

/**
 * Хук для загрузки рекомендуемых сценариев
 * @param enabled - загружать только если true (активна вкладка "featured")
 * @returns объект с данными, флагами загрузки и ошибки
 */
export function useRekomenduemyeStsenary(enabled: boolean) {
  return useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/featured'],
    enabled,
    ...NASTROYKI_KESHA,
  });
}

/**
 * Хук для загрузки "моих" сценариев с поддержкой гостевого режима
 * При авторизации очищает localStorage и инвалидирует кэш гостя
 * @returns объект с данными, флагами загрузки и ошибки
 */
export function useMoiStsenary() {
  const { user } = useTelegramAuth();

  useEffect(() => {
    if (user) {
      ochistItIdStsenarievGostya();
      queryClient.removeQueries({ queryKey: ['/api/templates/category/custom', 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    }
  }, [user]);

  return useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/category/custom', user?.id ?? 'guest'],
    queryFn: async () => {
      const idsParam = !user ? poluchitIdsParamDlyaGostya() : '';
      const url = `/api/templates/category/custom${idsParam ? `?ids=${idsParam}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки сценариев: ${response.status}`);
      }

      return response.json() as Promise<BotTemplate[]>;
    },
    ...NASTROYKI_KESHA,
  });
}
