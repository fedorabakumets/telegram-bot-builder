/**
 * @fileoverview Общие типы для модуля управления ботами
 *
 * Содержит все переиспользуемые интерфейсы и типы,
 * используемые в компонентах вкладки "Бот".
 *
 * @module bot-types
 */

/**
 * Статус бота
 */
export type BotStatus = 'running' | 'stopped' | 'error';

/**
 * Экземпляр запущенного бота
 */
export interface BotInstance {
  /** Уникальный идентификатор экземпляра */
  id: number;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
  /** Текущий статус */
  status: BotStatus;
  /** Токен бота */
  token: string;
  /** Идентификатор процесса */
  processId?: string;
  /** Время запуска */
  startedAt: Date;
  /** Время остановки */
  stoppedAt?: Date;
  /** Сообщение об ошибке */
  errorMessage?: string;
}

/**
 * Ответ API со статусом бота
 */
export interface BotStatusResponse {
  /** Текущий статус */
  status: BotStatus;
  /** Экземпляр бота или null */
  instance: BotInstance | null;
}

/**
 * Информация о боте из Telegram API
 */
export interface BotInfo {
  /** Telegram ID бота */
  id: number;
  /** Признак бота */
  is_bot: boolean;
  /** Имя бота */
  first_name: string;
  /** Username бота */
  username: string;
  /** Может ли бот вступать в группы */
  can_join_groups: boolean;
  /** Может ли бот читать все сообщения в группах */
  can_read_all_group_messages: boolean;
  /** Поддерживает ли бот inline-запросы */
  supports_inline_queries: boolean;
  /** Полное описание бота */
  description?: string;
  /** Краткое описание бота */
  short_description?: string;
  /** URL фото профиля */
  photoUrl?: string;
  /** Объект фото профиля */
  photo?: {
    /** ID маленького файла */
    small_file_id: string;
    /** Уникальный ID маленького файла */
    small_file_unique_id: string;
    /** ID большого файла */
    big_file_id: string;
    /** Уникальный ID большого файла */
    big_file_unique_id: string;
  };
}

/**
 * Редактируемое поле токена
 */
export interface EditingField {
  /** ID токена */
  tokenId: number;
  /** Название поля */
  field: string;
}

/**
 * Мутация TanStack Query (упрощённый тип)
 */
export interface MutationState<TVariables = unknown> {
  /** Выполняется ли мутация */
  isPending: boolean;
  /** Переменные последнего вызова */
  variables?: TVariables;
  /** Вызвать мутацию */
  mutate: (variables: TVariables) => void;
  /** Вызвать мутацию с промисом */
  mutateAsync: (variables: TVariables) => Promise<unknown>;
}

/**
 * Переменные мутации запуска/остановки бота
 */
export interface BotStartStopVariables {
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
}
