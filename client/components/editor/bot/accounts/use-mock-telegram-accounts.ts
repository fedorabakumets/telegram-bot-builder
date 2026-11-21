/** @fileoverview Состояние прототипа аккаунтов по проектам в памяти вкладки. */
import { useState } from 'react';
import { emptyMockAccountProxy, initialMockAccounts, mockAccountBots } from './mock-account-fixtures';
import { createMockAccountProfile } from './mock-account-profile';
import type { MockAccountBot, MockAccountProxy, MockSessionKind, MockTelegramAccount } from './mock-account-types';

/** Демонстрационные карточки и выбор для одного проекта. */
interface MockAccountsState {
  /** Текущий список карточек. */
  accounts: MockTelegramAccount[];
  /** Идентификатор открытой карточки. */
  selectedId: string | null;
}

const initialState: MockAccountsState = { accounts: initialMockAccounts, selectedId: null };

/**
 * Управляет карточками аккаунтов без сетевых запросов.
 * @param projectId - Идентификатор проекта для разделения демонстрационных изменений.
 * @param projectBots - Уже загруженные подписи ботов проекта для локальной привязки.
 * @returns Карточки, их выбор и операции прототипа.
 */
export function useMockTelegramAccounts(projectId?: number | null, projectBots: readonly MockAccountBot[] = []) {
  const key = projectId ?? 'default';
  const [projects, setProjects] = useState<Record<string, MockAccountsState>>({});
  const { accounts, selectedId } = projects[key] ?? initialState;
  const bots = [...mockAccountBots, ...projectBots];

  /**
   * Применяет изменение к актуальному состоянию выбранного проекта.
   * @param recipe - Функция изменения карточек и выбора.
   */
  function update(recipe: (state: MockAccountsState) => MockAccountsState) {
    setProjects(previous => {
      const state = previous[key] ?? initialState;
      const next = recipe(state);
      return state === next ? previous : { ...previous, [key]: next };
    });
  }

  /**
   * Открывает существующую карточку или закрывает панель.
   * @param id - Идентификатор карточки или null.
   */
  function selectAccount(id: string | null) {
    update(state => ({
      ...state, selectedId: state.accounts.some(account => account.id === id) ? id : null,
    }));
  }

  /** Добавляет пустую демонстрационную карточку и открывает её. */
  function createAccount() {
    update(state => {
      const number = state.accounts.length + 1;
      const id = `demo-account-${number}`;
      const account: MockTelegramAccount = {
        id, name: `Аккаунт ${number}`, maskedPhone: 'Номер не указан',
        status: 'disconnected', botIds: [], sessionKind: null, proxy: emptyMockAccountProxy,
      };
      return { accounts: [...state.accounts, account], selectedId: id };
    });
  }

  /**
   * Создаёт авторизованный демо-аккаунт и сразу переносит к нему привязку.
   * @param botId - Идентификатор бота, из настроек которого открыт вход.
   * @param phone - Подтверждённый в демо номер.
   */
  function connectPhoneAccount(botId: string, phone: string) {
    if (!bots.some(bot => bot.id === botId)) return;
    update(state => {
      const number = state.accounts.length + 1;
      const account: MockTelegramAccount = {
        id: `demo-account-${number}`, name: `Аккаунт ${number}`,
        maskedPhone: `+••• ••• •• ${phone.slice(-2)}`, profile: createMockAccountProfile(number, phone),
        status: 'connected', botIds: [botId], sessionKind: 'phone', proxy: emptyMockAccountProxy,
      };
      const accounts = state.accounts.map(existing => existing.botIds.includes(botId)
        ? { ...existing, botIds: existing.botIds.filter(id => id !== botId) } : existing);
      return { ...state, accounts: [...accounts, account], selectedId: account.id };
    });
  }

  /**
   * Добавляет, переносит или снимает привязку бота.
   * @param accountId - Идентификатор аккаунта в прототипе.
   * @param botId - Идентификатор демонстрационного бота.
   */
  function toggleBot(accountId: string, botId: string) {
    changeBotAccount(botId, accountId, true);
  }

  /**
   * Меняет локальную привязку независимо от открытой панели.
   * @param botId - Идентификатор бота.
   * @param accountId - Выбранный аккаунт или отсутствие привязки.
   * @param toggle - Снять привязку при повторном выборе того же аккаунта.
   */
  function changeBotAccount(botId: string, accountId: string | null, toggle = false) {
    if (!bots.some(bot => bot.id === botId)) return;
    update(state => {
      const target = state.accounts.find(account => account.id === accountId);
      if (accountId !== null && !target) return state;
      const targetId = toggle && target?.botIds.includes(botId) ? null : accountId;
      return {
        ...state,
        accounts: state.accounts.map(account => {
          if (account.id === targetId) {
            return account.botIds.includes(botId) ? account : { ...account, botIds: [...account.botIds, botId] };
          }
          if (account.botIds.includes(botId)) return { ...account, botIds: account.botIds.filter(id => id !== botId) };
          return account;
        }),
      };
    });
  }

  /**
   * Устанавливает состояние подключённой демонстрационной сессии.
   * @param accountId - Идентификатор аккаунта в прототипе.
   * @param kind - Выбранный способ подключения.
   */
  function importSession(accountId: string, kind: MockSessionKind) {
    update(state => ({
      ...state,
      accounts: state.accounts.map((account, index) => account.id === accountId
        ? { ...account, profile: account.profile ?? createMockAccountProfile(index + 1), sessionKind: kind, status: 'connected' }
        : account),
    }));
  }

  /**
   * Применяет параметры демонстрационного прокси к карточке.
   * @param accountId - Идентификатор аккаунта в прототипе.
   * @param proxy - Новое состояние прокси.
   */
  function updateProxy(accountId: string, proxy: MockAccountProxy) {
    update(state => ({
      ...state,
      accounts: state.accounts.map(account => account.id === accountId ? { ...account, proxy } : account),
    }));
  }

  const selectedAccount = accounts.find(account => account.id === selectedId) ?? null;
  return { accounts, bots, selectedAccount, selectAccount, createAccount, connectPhoneAccount, toggleBot, changeBotAccount, importSession, updateProxy };
}
