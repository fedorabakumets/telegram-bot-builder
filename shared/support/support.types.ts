/**
 * @fileoverview Общие типы чата поддержки платформы для сервера и клиента
 * @module shared/support/support.types
 */

/** Отправитель сообщения поддержки */
export type SupportSender = "user" | "admin";

/** Статус диалога поддержки */
export type SupportThreadStatus = "open" | "closed";

/** Источник сообщения поддержки */
export type SupportMessageSource = "web" | "telegram";

/** Максимальная длина сообщения поддержки */
export const SUPPORT_MESSAGE_MAX_LENGTH = 4000;

/** Картинка, приложенная к сообщению поддержки */
export interface SupportAttachmentDto {
  /** Идентификатор вложения */
  id: number;
  /** Исходное имя файла */
  fileName: string;
  /** MIME картинки */
  mime: string;
  /** Размер в байтах */
  size: number;
}

/** Контекст, в котором пользователь отправил сообщение */
export interface SupportMessageContext {
  /** Идентификатор открытого проекта, если есть */
  projectId?: number | null;
  /** Путь страницы в конструкторе */
  path?: string;
  /** Строка браузера пользователя */
  userAgent?: string;
}

/** Сообщение поддержки в ответе API */
export interface SupportMessageDto {
  /** Идентификатор сообщения */
  id: number;
  /** Отправитель */
  sender: SupportSender;
  /** Текст сообщения */
  text: string;
  /** Контекст отправки (только у сообщений пользователя) */
  context: SupportMessageContext | null;
  /** Источник сообщения */
  source: SupportMessageSource;
  /** Дата создания в ISO */
  createdAt: string;
  /** Картинки сообщения. Пустой массив, если вложений нет */
  attachments: SupportAttachmentDto[];
}

/** Диалог поддержки в ответе API */
export interface SupportThreadDto {
  /** Идентификатор диалога */
  id: number;
  /** Статус диалога */
  status: SupportThreadStatus;
  /** Непрочитанные администратором сообщения */
  unreadByAdmin: number;
  /** Непрочитанные пользователем ответы */
  unreadByUser: number;
  /** Время последнего сообщения в ISO */
  lastMessageAt: string;
}

/** Ответ GET /api/support/thread */
export interface UserSupportThreadResponse {
  /** Диалог или null, если пользователь ещё не писал */
  thread: SupportThreadDto | null;
  /** Сообщения диалога по возрастанию времени */
  messages: SupportMessageDto[];
  /** Username служебного бота без @. null, если уведомления не настроены */
  telegramBot: string | null;
}

/** Краткий профиль пользователя в админке поддержки */
export interface SupportUserProfile {
  /** Идентификатор Telegram */
  id: number;
  /** Имя */
  firstName: string;
  /** Фамилия */
  lastName: string | null;
  /** Имя вида @name */
  username: string | null;
  /** Адрес аватара */
  photoUrl: string | null;
}

/** Элемент списка диалогов в админке */
export interface AdminSupportThreadListItem extends SupportThreadDto {
  /** Автор диалога */
  user: SupportUserProfile;
  /** Текст последнего сообщения для превью */
  lastMessageText: string | null;
  /** Отправитель последнего сообщения */
  lastMessageSender: SupportSender | null;
}

/** Ответ GET /admin/api/support/threads/:id */
export interface AdminSupportThreadResponse {
  /** Диалог */
  thread: SupportThreadDto;
  /** Автор диалога */
  user: SupportUserProfile;
  /** Сообщения по возрастанию времени */
  messages: SupportMessageDto[];
}
