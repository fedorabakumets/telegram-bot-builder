/** @fileoverview Подтверждение импортированной сессии только через общий клиент Telethon. */
import { callProjectTelegramBroker, ProjectTelegramBrokerError } from '../project-telegram-broker-client';
import {
  confirmProjectTelegramAccountSession, getProjectTelegramAccount, getProjectTelegramAccountSecrets,
} from '../../database/project-telegram-accounts-store';
import { ProjectTelegramInputError, telegramInput } from './input';

/**
 * Проверяет только уже сохранённый и зарезервированный ключ импорта.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор карточки.
 * @returns Публичная карточка с результатом проверки или состояние ожидания.
 */
export async function verifyImportedProjectTelegramSession(projectId: number, accountId: number) {
  const account = await getProjectTelegramAccount(projectId, accountId);
  if (!account) return null;
  if (account.sessionKind === 'legacy' && account.status !== 'connected') {
    throw new ProjectTelegramInputError('Сессия сохранена. Для проверки нужно подтвердить закрытие прежнего подключения Telethon.');
  }
  if (!account.sessionKind) {
    throw new ProjectTelegramInputError('Для этой карточки нет импортированной сессии для проверки.');
  }
  if (account.status === 'connected') return { ok: true, stage: 'done', account };
  const secrets = await getProjectTelegramAccountSecrets(projectId, accountId);
  if (!secrets?.session) return null;
  const { apiId, apiHash, sessionString } = secrets.session;
  try {
    const profile = telegramInput(await callProjectTelegramBroker('verify', {
      accountId, apiId: Number(apiId), apiHash, sessionString, proxy: secrets.proxy,
    }));
    if (profile.authorized !== true || typeof profile.id !== 'string') {
      throw new ProjectTelegramBrokerError('NOT_AUTHORIZED');
    }
    const telegramName = [profile.firstName, profile.lastName].filter(value => typeof value === 'string' && value).join(' ');
    const confirmed = await confirmProjectTelegramAccountSession(projectId, accountId, sessionString, {
      telegramUserId: profile.id, telegramName: telegramName || undefined,
      telegramUsername: typeof profile.username === 'string' ? profile.username : undefined,
      maskedPhone: typeof profile.maskedPhone === 'string' ? profile.maskedPhone : undefined,
    });
    return confirmed ? { ok: true, stage: 'done', account: confirmed } : null;
  } catch (error) {
    if (!(error instanceof ProjectTelegramBrokerError)) throw error;
    const revoked = ['NOT_AUTHORIZED', 'SESSION_REVOKED', 'AUTH_KEY_DUPLICATED', 'SESSION_UNAUTHORIZED'].includes(error.code);
    return { ok: true, stage: 'pending', account, message: revoked
      ? 'Telegram не подтвердил авторизацию импортированной сессии.'
      : 'Сессия сохранена. Проверка через общий клиент пока недоступна.' };
  }
}
