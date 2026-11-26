/** @fileoverview Шифрование секретов Telegram-аккаунтов с привязкой к записи БД. */
import type { ProjectTelegramAccountProxyInput, ProjectTelegramSessionKind } from '@shared/project-telegram-accounts';
import { decryptString, encryptString } from '../storage/storage-secrets';

/** Секреты подтверждённой сессии, доступные только серверу. */
export interface ProjectTelegramSessionSecret {
  /** Идентификатор приложения Telegram. */
  apiId: string;
  /** Ключ приложения Telegram. */
  apiHash: string;
  /** Авторизованная строка сессии Telethon. */
  sessionString: string;
  /** Полный телефон для работы с сессией, если его предоставил Telegram. */
  phone?: string;
}

/** Поля после успешной авторизации, импорта или миграции. */
export interface ProjectTelegramSessionInput extends ProjectTelegramSessionSecret {
  /** Способ авторизации. */
  sessionKind: ProjectTelegramSessionKind;
  /** Маскированный телефон при отсутствии полного номера. */
  maskedPhone?: string;
  /** Идентификатор подтверждённого аккаунта Telegram. */
  telegramUserId?: string;
  /** Имя подтверждённого аккаунта. */
  telegramName?: string;
  /** Имя пользователя подтверждённого аккаунта. */
  telegramUsername?: string;
}

/** Набор для внутреннего клиента Telethon. */
export interface ProjectTelegramAccountSecrets {
  /** Сессия, если аккаунт авторизован. */
  session: ProjectTelegramSessionSecret | null;
  /** Настройки прокси с учётными данными, если он задан. */
  proxy: ProjectTelegramAccountProxyInput | null;
}

/** Формат зашифрованного поля с проверкой принадлежности записи. */
interface SecretEnvelope<T> {
  /** Версия формата. */
  version: 1;
  /** Проект, которому принадлежат данные. */
  projectId: number;
  /** Аккаунт, которому принадлежат данные. */
  accountId: number;
  /** Назначение поля в хранилище. */
  purpose: 'session' | 'proxy';
  /** Секретные данные. */
  value: T;
}

/**
 * Шифрует секрет вместе с контекстом, проверяемым при чтении.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор аккаунта.
 * @param purpose - Назначение секрета.
 * @param value - Секрет для записи.
 * @returns Шифротекст с тегом целостности.
 */
export function sealProjectTelegramSecret<T>(
  projectId: number, accountId: number, purpose: SecretEnvelope<T>['purpose'], value: T,
): string {
  const envelope: SecretEnvelope<T> = { version: 1, projectId, accountId, purpose, value };
  return encryptString(JSON.stringify(envelope));
}

/**
 * Открывает секрет и проверяет его принадлежность запрошенному аккаунту.
 * @param projectId - Проект аккаунта.
 * @param accountId - Идентификатор аккаунта.
 * @param purpose - Ожидаемое назначение секрета.
 * @param ciphertext - Данные из хранилища.
 * @returns Секрет из хранилища или null.
 */
export function openProjectTelegramSecret<T>(
  projectId: number, accountId: number, purpose: SecretEnvelope<T>['purpose'], ciphertext: string | null,
): T | null {
  if (ciphertext === null) return null;
  const envelope = JSON.parse(decryptString(ciphertext)) as SecretEnvelope<T>;
  if (envelope?.version !== 1 || envelope.projectId !== projectId || envelope.accountId !== accountId || envelope.purpose !== purpose) {
    throw new Error('Секрет Telegram-аккаунта не соответствует записи');
  }
  return envelope.value;
}

/**
 * Возвращает номер с видимыми последними двумя цифрами.
 * @param value - Полный либо ранее маскированный номер.
 * @returns Строка для интерфейса или null.
 */
export function maskProjectTelegramPhone(value?: string): string | null {
  const digits = value?.replace(/\D/g, '');
  return digits && digits.length >= 2 ? `•••• ${digits.slice(-2)}` : null;
}
