/** @fileoverview Данные и действия Telegram-аккаунтов проекта с явным демонстрационным режимом. */
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import type { ProjectTelegramAccount } from '@shared/project-telegram-accounts';
import { emptyMockAccountProxy } from './mock-account-fixtures';
import type { MockAccountBot, MockTelegramAccount } from './mock-account-types';
import { useMockTelegramAccounts } from './use-mock-telegram-accounts';

/** Ответ сервера для проекта, в котором включены общие аккаунты. */
interface ProjectAccountsResult {
  /** Разрешено менять аккаунты текущему пользователю. */
  canManage: boolean;
  /** Открытые данные без ключей сессий и паролей. */
  accounts: ProjectTelegramAccount[];
}

/**
 * Адаптирует безопасное представление аккаунта к общему холсту.
 * @param account - Открытые данные аккаунта.
 * @returns Карточка рабочего пространства.
 */
function displayAccount(account: ProjectTelegramAccount): MockTelegramAccount {
  return {
    id: String(account.id), name: account.telegramName?.trim() || account.name,
    maskedPhone: account.maskedPhone ?? 'Номер не указан',
    telegramUsername: account.telegramUsername, telegramId: account.telegramUserId,
    status: account.status, botIds: account.botIds.map(id => `project-bot-${id}`),
    sessionKind: account.sessionKind === 'legacy' ? null : account.sessionKind,
    proxy: account.proxy ? {
      enabled: true, type: account.proxy.type, host: account.proxy.host, port: String(account.proxy.port), status: 'idle',
    } : emptyMockAccountProxy,
  };
}

/**
 * Читает и изменяет карточки активного проекта.
 * @param projectId - Идентификатор открытого проекта.
 * @param projectBots - Обозначения ботов текущего проекта.
 * @param actorId - Идентификатор авторизованного пользователя, отделяющий его кеш.
 * @returns Модель холста, режим и действия.
 */
export function useProjectTelegramAccounts(projectId: number | null | undefined, projectBots: MockAccountBot[], actorId: number | null) {
  const mock = useMockTelegramAccounts(projectId, projectBots);
  const [selection, setSelection] = useState<Record<number, string | null>>({});
  const [busyProjects, setBusyProjects] = useState<number[]>([]);
  const writes = useRef(new Set<number>());
  const cache = useQueryClient();
  const { toast } = useToast();
  const path = `/api/projects/${projectId}/telegram-accounts`;
  const queryKey = ['/api/projects', 'telegram-accounts', projectId, actorId];
  const query = useQuery({
    queryKey, enabled: !!projectId && actorId != null, retry: false,
    /** Обновляет открытый холст после изменений в другой вкладке или на сервере. */
    refetchInterval: query => query.state.data === null ? false : 3_000,
    refetchOnWindowFocus: 'always',
    queryFn: async (): Promise<ProjectAccountsResult | null> => {
      try {
        return await apiRequest('GET', path);
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'PROJECT_TELEGRAM_ACCOUNTS_DISABLED') return null;
        throw error;
      }
    },
  });
  const live = query.data;
  const demo = actorId == null || query.data === null;
  const cards = live?.accounts.map(displayAccount) ?? [];
  /** Перезагружает только аккаунты выбранного проекта. */
  const refreshAccounts = () => cache.invalidateQueries({ queryKey });
  /**
   * Отправляет изменение и перезагружает результат из хранилища.
   * @param method - HTTP-метод изменения.
   * @param suffix - Относительный путь к операции.
   * @param body - Параметры изменения.
   * @returns Безопасный ответ сервера или отсутствие результата при ошибке.
   */
  async function write(method: string, suffix = '', body?: unknown): Promise<ProjectTelegramAccount | undefined> {
    if (!projectId || !live?.canManage || writes.current.has(projectId)) return undefined;
    writes.current.add(projectId);
    setBusyProjects(previous => [...previous, projectId]);
    try {
      const result = await apiRequest(method, `${path}${suffix}`, body);
      await refreshAccounts();
      return result;
    } catch (error) {
      toast({ title: 'Не удалось сохранить настройки', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
      return undefined;
    } finally {
      writes.current.delete(projectId);
      setBusyProjects(previous => previous.filter(id => id !== projectId));
    }
  }
  /**
   * Выбирает карточку только в активном проекте.
   * @param id - Идентификатор карточки или отсутствие выбора.
   */
  function selectAccount(id: string | null) {
    if (projectId) setSelection(previous => ({ ...previous, [projectId]: id }));
  }
  /** Создаёт карточку проекта и открывает её настройки. */
  async function createAccount() {
    const account = await write('POST', '', { name: `Аккаунт ${(live?.accounts.length ?? 0) + 1}` });
    if (account) selectAccount(String(account.id));
  }
  /**
   * Переносит привязку бота между аккаунтами проекта или снимает её.
   * @param botId - Идентификатор бота на холсте.
   * @param accountId - Целевой аккаунт или отсутствие связи.
   */
  function changeBotAccount(botId: string, accountId: string | null) {
    const tokenId = Number(botId.replace(/^project-bot-/, ''));
    const target = live?.accounts.find(account => account.id === Number(accountId));
    const source = live?.accounts.find(account => account.botIds.includes(tokenId));
    if (target) void write('PUT', `/${target.id}/bots`, { botIds: [...new Set([...target.botIds, tokenId])] });
    else if (accountId === null && source) void write('PUT', `/${source.id}/bots`, { botIds: source.botIds.filter(id => id !== tokenId) });
  }
  const selectedAccount = cards.find(account => projectId != null && account.id === selection[projectId]) ?? null;
  return {
    ...mock,
    ...(demo ? {} : {
      accounts: cards, bots: projectBots, selectedAccount, selectAccount, createAccount, changeBotAccount,
      toggleBot: (id: string, botId: string) =>
        changeBotAccount(botId, cards.find(account => account.id === id)?.botIds.includes(botId) ? null : id),
    }),
    demo, projectId: projectId ?? null, actorId, path, refreshAccounts, write,
    canManage: demo || live?.canManage === true,
    pending: !demo && query.isPending, busy: !!projectId && busyProjects.includes(projectId),
    error: !demo && query.isError ? query.error : null,
    selectedLiveAccount: demo ? null : live?.accounts.find(account => String(account.id) === selectedAccount?.id) ?? null,
  };
}
