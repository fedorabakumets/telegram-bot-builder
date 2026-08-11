/**
 * @fileoverview Примеры JSON для OpenAPI project-messages.
 * @module server/swagger/paths/project-messages-examples
 */

/** GET …/messages/all */
export const PROJECT_MESSAGES_ALL_EXAMPLE = [
  {
    id: 501,
    userId: "123456789",
    messageType: "bot",
    messageText: "Привет! Чем могу помочь?",
    chatType: "private",
    chatId: "123456789",
    createdAt: "2026-08-11T15:00:00.000Z",
  },
  {
    id: 500,
    userId: "123456789",
    messageType: "user",
    messageText: "/start",
    chatType: "private",
    chatId: "123456789",
    createdAt: "2026-08-11T14:59:00.000Z",
  },
];

/** GET …/messages/activity без split */
export const PROJECT_MESSAGES_ACTIVITY_EXAMPLE = [
  { date: "2026-08-11T13:00:00.000Z", count: 4 },
  { date: "2026-08-11T14:00:00.000Z", count: 12 },
];

/** GET …/messages/activity?split=true */
export const PROJECT_MESSAGES_ACTIVITY_SPLIT_EXAMPLE = [
  { date: "2026-08-11T13:00:00.000Z", incoming: 2, outgoing: 2 },
  { date: "2026-08-11T14:00:00.000Z", incoming: 7, outgoing: 5 },
];

/** DELETE 200 */
export const PROJECT_MESSAGE_DELETE_OK_EXAMPLE = {
  success: true,
  deletedFromTelegram: true,
};

/** PATCH body */
export const PROJECT_MESSAGE_EDIT_BODY_EXAMPLE = {
  messageText: "Обновлённый текст сообщения",
  buttons: [],
  buttonsPerRow: 0,
};

/** PATCH 200 */
export const PROJECT_MESSAGE_EDIT_OK_EXAMPLE = {
  success: true,
  editedInTelegram: true,
};

/** 403: нет доступа к проекту (middleware) */
export const PROJECT_MESSAGES_FORBIDDEN_EXAMPLE = {
  message: "Нет прав доступа к проекту",
};

/** 403: сообщение чужого проекта */
export const PROJECT_MESSAGE_OWNERSHIP_FORBIDDEN_EXAMPLE = {
  message: "Сообщение не принадлежит данному проекту",
};
