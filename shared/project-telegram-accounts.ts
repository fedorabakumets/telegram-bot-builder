/** @fileoverview Контракты проектных Telegram-аккаунтов без секретов в ответах API. */

/** Источник подтверждённой сессии Telegram. */
export type ProjectTelegramSessionKind = 'phone' | 'tdata' | 'session' | 'session-json' | 'string-session' | 'legacy';

/** Параметры настройки прокси при передаче от клиента серверу. */
export interface ProjectTelegramAccountProxyInput {
  /** Протокол прокси. */
  type: 'socks5' | 'http';
  /** Имя узла или IP-адрес прокси. */
  host: string;
  /** Порт прокси. */
  port: number;
  /** Имя для входа в прокси. */
  username?: string;
  /** Пароль для входа в прокси. */
  password?: string;
}

/** Данные прокси, доступные в карточке аккаунта. */
export interface ProjectTelegramAccountProxy {
  /** Протокол прокси. */
  type: ProjectTelegramAccountProxyInput['type'];
  /** Имя узла или IP-адрес прокси. */
  host: string;
  /** Порт прокси. */
  port: number;
  /** Указаны ли учётные данные прокси. */
  hasPassword: boolean;
}

/** Представление аккаунта для интерфейса без ключей доступа. */
export interface ProjectTelegramAccount {
  /** Уникальный идентификатор аккаунта. */
  id: number;
  /** Идентификатор проекта. */
  projectId: number;
  /** Название карточки аккаунта. */
  name: string;
  /** Маскированный телефон. */
  maskedPhone: string | null;
  /** Подтверждённый идентификатор аккаунта Telegram. */
  telegramUserId: string | null;
  /** Подтверждённое имя аккаунта Telegram. */
  telegramName: string | null;
  /** Подтверждённое имя пользователя Telegram. */
  telegramUsername: string | null;
  /** Подтверждённая авторизация сессии, а не состояние соединения клиента. */
  status: 'connected' | 'disconnected';
  /** Идентификаторы привязанных ботов. */
  botIds: number[];
  /** Способ записи подтверждённой сессии. */
  sessionKind: ProjectTelegramSessionKind | null;
  /** Настройки прокси без имени пользователя и пароля. */
  proxy: ProjectTelegramAccountProxy | null;
}
