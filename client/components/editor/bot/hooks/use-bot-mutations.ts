/**
 * @fileoverview Хук для мутаций управления ботами
 *
 * Инкапсулирует все useMutation вызовы для панели управления ботами:
 * - startBot — запуск бота
 * - stopBot — остановка бота
 * - deleteBot — удаление токена
 * - toggleDatabase — переключение базы данных
 * - createBot — создание токена
 * - parseBotInfo — получение информации о боте по токену
 * - updateBotInfo — обновление поля информации о боте
 *
 * @module use-bot-mutations
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { BotToken } from '@shared/schema';
import { getBotDisplayName } from '../contexts/bot-control-utils';

/**
 * Параметры хука мутаций ботов
 */
interface UseBotMutationsParams {
  /** ID текущего проекта */
  projectId: number;
  /** Все токены в плоском массиве */
  allTokensFlat: (BotToken & { projectId: number })[];
  /** Callback при запуске бота */
  onBotStarted?: (projectId: number, tokenId: number, botName: string) => void;
  /** Callback при остановке бота */
  onBotStopped?: (projectId: number, tokenId: number) => void;
  /** Callback при удалении бота */
  onBotDeleted?: (projectId: number, tokenId: number) => void;
  /** Токен нового бота (для parseBotInfo → createBot) */
  newBotToken: string;
  /** ID проекта для нового бота */
  projectForNewBot: number | null;
  /** Количество уже существующих токенов */
  existingTokensCount: number;
  /** Callback после успешного добавления бота */
  onBotAdded: () => void;
  /** Все токены в плоском массиве (для режима "существующий") */
  allTokensFlatFull: (BotToken & { projectId: number })[];
}

/**
 * Хук для всех мутаций управления ботами
 */
export function useBotMutations({
  projectId,
  allTokensFlat,
  onBotStarted,
  onBotStopped,
  onBotDeleted,
  newBotToken,
  projectForNewBot,
  existingTokensCount,
  onBotAdded,
  allTokensFlatFull,
}: UseBotMutationsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isParsingBot, setIsParsingBot] = useState(false);

  /** Вспомогательная функция: найти токен по ID */
  const findToken = (tokenId: number) =>
    allTokensFlat.find(t => t.id === tokenId);

  const startBotMutation = useMutation({
    mutationFn: ({ tokenId, projectId: pid }: { tokenId: number; projectId: number }) =>
      apiRequest('POST', `/api/projects/${pid}/bot/start`, { tokenId }),
    onSuccess: (_, vars) => {
      toast({ title: 'Бот запущен', description: 'Бот успешно запущен и готов к работе.' });
      queryClient.invalidateQueries({ queryKey: [`/api/tokens/${vars.tokenId}/bot-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${vars.projectId}/bot/info`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${vars.projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: ['launch-history', vars.tokenId] });
      const token = findToken(vars.tokenId);
      if (token && onBotStarted) {
        onBotStarted(vars.projectId, vars.tokenId, getBotDisplayName(token, `Бот ${vars.tokenId}`));
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка запуска', description: error.message, variant: 'destructive' });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: ({ tokenId, projectId: pid }: { tokenId: number; projectId: number }) =>
      apiRequest('POST', `/api/projects/${pid}/bot/stop`, { tokenId }),
    onSuccess: (_, vars) => {
      toast({ title: 'Бот остановлен', description: 'Бот успешно остановлен.' });
      queryClient.invalidateQueries({ queryKey: [`/api/tokens/${vars.tokenId}/bot-status`] });
      queryClient.invalidateQueries({ queryKey: ['launch-history', vars.tokenId] });
      if (onBotStopped) onBotStopped(vars.projectId, vars.tokenId);
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка остановки', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      const token = findToken(tokenId);
      if (!token) throw new Error('Токен не найден');
      return apiRequest('DELETE', `/api/projects/${token.projectId}/tokens/${tokenId}`);
    },
    onSuccess: (_, tokenId) => {
      const token = findToken(tokenId);
      if (token) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${token.projectId}/tokens`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${token.projectId}/bot/info`] });
        // Удаляем терминальную вкладку удалённого бота
        if (onBotDeleted) onBotDeleted(token.projectId, tokenId);
      }
      toast({ title: 'Бот удалён' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка при удалении бота', description: error.message, variant: 'destructive' });
    },
  });

  const toggleDatabaseMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest('PUT', `/api/projects/${projectId}`, { userDatabaseEnabled: enabled ? 1 : 0 }),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: enabled ? 'База данных включена' : 'База данных выключена',
        description: enabled
          ? 'Функции работы с базой данных будут генерироваться в коде бота.'
          : 'Функции работы с базой данных НЕ будут генерироваться в коде бота.',
      });
    },
    onError: () => {
      toast({ title: 'Ошибка', description: 'Не удалось изменить настройку базы данных', variant: 'destructive' });
    },
  });

  const createBotMutation = useMutation({
    mutationFn: (botData: BotToken & { projectId: number }) =>
      apiRequest('POST', `/api/projects/${botData.projectId}/tokens`, botData),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${vars.projectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${vars.projectId}/bot/info`] });
      toast({ title: 'Бот успешно добавлен', description: 'Информация о боте автоматически получена из Telegram' });
      // Создаём терминальную вкладку для нового бота
      if (onBotStarted && data?.id) {
        onBotStarted(vars.projectId, data.id, vars.name || `Бот ${data.id}`);
      }
      onBotAdded();
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка при добавлении бота', description: error.message, variant: 'destructive' });
    },
  });

  const parseBotInfoMutation = useMutation({
    mutationFn: async ({ token, projectId: pid }: { token: string; projectId: number }) => {
      setIsParsingBot(true);
      try {
        return await apiRequest('POST', `/api/projects/${pid}/tokens/parse`, { token });
      } finally {
        setIsParsingBot(false);
      }
    },
    onSuccess: (botInfo) => {
      if (!projectForNewBot) return;
      createBotMutation.mutate({
        name: botInfo.botFirstName
          ? `${botInfo.botFirstName}${botInfo.botUsername ? ` (@${botInfo.botUsername})` : ''}`
          : `@${botInfo.botUsername}`,
        token: newBotToken.trim(),
        description: botInfo.botShortDescription,
        isDefault: existingTokensCount === 0 ? 1 : 0,
        isActive: 1,
        ...botInfo,
        projectId: projectForNewBot,
      } as BotToken & { projectId: number });
    },
    onError: (error: Error) => {
      setIsParsingBot(false);
      toast({ title: 'Ошибка получения информации о боте', description: error.message || 'Проверьте правильность токена', variant: 'destructive' });
    },
  });

  const updateBotInfoMutation = useMutation({
    mutationFn: async ({ tokenId, field, value }: { tokenId: number; field: string; value: string }) => {
      const token = findToken(tokenId);
      if (!token) throw new Error('Токен не найден');
      return apiRequest('PUT', `/api/projects/${token.projectId}/tokens/${tokenId}/bot-info`, { field, value });
    },
    onSuccess: (_, vars) => {
      const token = findToken(vars.tokenId);
      if (token) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${token.projectId}/tokens`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${token.projectId}/bot/info`] });
      }
      toast({ title: 'Информация о боте обновлена' });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка обновления', description: error.message, variant: 'destructive' });
    },
  });

  /** Мутация перезапуска всех ботов проекта */
  const restartAllBotsMutation = useMutation({
    mutationFn: (pid: number) =>
      apiRequest('POST', `/api/projects/${pid}/bot/restart-all`),
    onSuccess: (data: { restarted: number; results?: { tokenId: number }[] }, pid: number) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${pid}/tokens`] });
      // Очищаем логи для каждого перезапущенного токена
      if (data.results) {
        data.results.forEach(r => {
          onBotStarted?.(pid, r.tokenId, '');
        });
      }
      toast({ title: 'Боты перезапущены', description: `Перезапущено: ${data.restarted}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка перезапуска', description: error.message, variant: 'destructive' });
    },
  });

  /** Мутация привязки существующего токена к новому проекту */
  const attachExistingTokenMutation = useMutation({
    mutationFn: async ({ tokenId, targetProjectId }: { tokenId: number; targetProjectId: number }) => {
      const source = allTokensFlatFull.find(t => t.id === tokenId);
      if (!source) throw new Error('Токен не найден');
      // Не передаём ownerId — сервер сам определит из сессии или проекта
      const { projectId: _pid, ownerId: _oid, id: _id, ...tokenData } = source;
      return apiRequest('POST', `/api/projects/${targetProjectId}/tokens`, {
        ...tokenData,
        isDefault: 0,
        isActive: 1,
        projectId: targetProjectId,
      });
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${vars.targetProjectId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${vars.targetProjectId}/bot/info`] });
      toast({ title: 'Бот успешно добавлен', description: 'Существующий токен привязан к проекту' });
      // Создаём терминальную вкладку для привязанного бота
      if (onBotStarted && data?.id) {
        const source = allTokensFlatFull.find(t => t.id === vars.tokenId);
        onBotStarted(vars.targetProjectId, data.id, source?.name || `Бот ${data.id}`);
      }
      onBotAdded();
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка при добавлении бота', description: error.message, variant: 'destructive' });
    },
  });

  return {
    startBotMutation,
    stopBotMutation,
    deleteBotMutation,
    toggleDatabaseMutation,
    createBotMutation,
    parseBotInfoMutation,
    updateBotInfoMutation,
    attachExistingTokenMutation,
    restartAllBotsMutation,
    isParsingBot,
  };
}
