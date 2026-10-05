/**
 * @fileoverview Примеры JSON для OpenAPI чата поддержки
 * @module server/swagger/paths/support-examples
 */

/** Диалог поддержки */
export const SUPPORT_THREAD_EXAMPLE = {
  id: 1,
  status: "open" as const,
  unreadByAdmin: 0,
  unreadByUser: 0,
  lastMessageAt: "2026-09-30T11:11:04.565Z",
};

/** Сообщение пользователя с контекстом страницы */
export const SUPPORT_USER_MESSAGE_EXAMPLE = {
  id: 1,
  sender: "user" as const,
  text: "Не сохраняется сценарий",
  context: { projectId: 294, path: "/editor/294", userAgent: "Mozilla/5.0" },
  source: "web" as const,
  createdAt: "2026-09-30T11:10:20.787Z",
  attachments: [],
};

/** Ответ администратора */
export const SUPPORT_ADMIN_MESSAGE_EXAMPLE = {
  id: 2,
  sender: "admin" as const,
  text: "Проверьте, что проект открыт, и повторите сохранение.",
  context: null,
  source: "web" as const,
  createdAt: "2026-09-30T11:11:04.565Z",
  attachments: [],
};

/** Ответ GET /api/support/thread */
export const USER_SUPPORT_THREAD_EXAMPLE = {
  thread: SUPPORT_THREAD_EXAMPLE,
  messages: [SUPPORT_USER_MESSAGE_EXAMPLE, SUPPORT_ADMIN_MESSAGE_EXAMPLE],
  telegramBot: "support_bot",
};

/** Профиль автора диалога */
export const SUPPORT_USER_PROFILE_EXAMPLE = {
  id: 123456789,
  firstName: "Иван",
  lastName: null,
  username: "ivan",
  photoUrl: null,
};

/** Элемент списка диалогов в админке */
export const ADMIN_SUPPORT_LIST_ITEM_EXAMPLE = {
  ...SUPPORT_THREAD_EXAMPLE,
  unreadByAdmin: 1,
  user: SUPPORT_USER_PROFILE_EXAMPLE,
  lastMessageText: "Не сохраняется сценарий",
  lastMessageSender: "user" as const,
};

/** Ответ GET /admin/api/support/threads/{id} */
export const ADMIN_SUPPORT_THREAD_EXAMPLE = {
  thread: { ...SUPPORT_THREAD_EXAMPLE, unreadByAdmin: 1 },
  user: SUPPORT_USER_PROFILE_EXAMPLE,
  messages: [SUPPORT_USER_MESSAGE_EXAMPLE, SUPPORT_ADMIN_MESSAGE_EXAMPLE],
};

/** Тело сообщения пользователя */
export const SUPPORT_USER_MESSAGE_BODY_EXAMPLE = {
  text: "Не сохраняется сценарий",
  context: "{\"projectId\":294,\"path\":\"/editor/294\"}",
};

/** Тело ответа администратора */
export const SUPPORT_ADMIN_MESSAGE_BODY_EXAMPLE = {
  text: "Проверьте сохранение ещё раз.",
};

/** Тело смены статуса */
export const SUPPORT_STATUS_BODY_EXAMPLE = { status: "closed" as const };
