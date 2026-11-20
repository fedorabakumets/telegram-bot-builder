/** @fileoverview Типы демонстрационных аккаунтов Telegram и их привязок. */
import type { MockAccountProfile } from './mock-account-profile';

/** Способ подключения демонстрационной сессии. */
export type MockSessionKind = 'phone' | 'tdata' | 'session' | 'session-json' | 'string-session';

/** Демонстрационные данные бота, доступного для привязки. */
export interface MockAccountBot {
  /** Идентификатор демонстрационного бота. */
  id: string;
  /** Название на карточке бота. */
  name: string;
  /** Имя бота в Telegram с символом @. */
  username: string;
}

/** Параметры прокси, которые используются только в интерфейсе. */
export interface MockAccountProxy {
  /** Указывает, включён ли демонстрационный прокси. */
  enabled: boolean;
  /** Выбранный тип прокси. */
  type: 'socks5' | 'http';
  /** Имя демонстрационного сервера. */
  host: string;
  /** Порт в виде строки для поля ввода. */
  port: string;
  /** Результат имитации проверки прокси. */
  status: 'idle' | 'success' | 'error';
}

/** Данные карточки демонстрационного аккаунта. */
export interface MockTelegramAccount {
  /** Идентификатор аккаунта в прототипе. */
  id: string;
  /** Отображаемое название аккаунта. */
  name: string;
  /** Локальная фотография демонстрационного профиля. */
  avatarUrl?: string;
  /** Маскированный демонстрационный номер телефона. */
  maskedPhone: string;
  /** Данные профиля после демонстрационного подключения. */
  profile?: MockAccountProfile;
  /** Состояние подключения аккаунта в прототипе. */
  status: 'connected' | 'disconnected';
  /** Идентификаторы связанных демонстрационных ботов. */
  botIds: string[];
  /** Последний симулированный способ подключения. */
  sessionKind: MockSessionKind | null;
  /** Демонстрационные параметры прокси. */
  proxy: MockAccountProxy;
}
