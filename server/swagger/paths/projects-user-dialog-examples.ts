/**
 * @fileoverview Примеры JSON для диалогов users/…/messages|send|avatar.
 * @module server/swagger/paths/projects-user-dialog-examples
 */

/** GET messages — одна запись бота */
export const DIALOG_MESSAGE_EXAMPLE = {
  id: 501,
  projectId: 42,
  tokenId: 7,
  userId: "123456789",
  messageType: "bot",
  messageText: "Привет! Чем могу помочь?",
  messageData: { sentFromAdmin: true },
  telegramMessageId: 1001,
  createdAt: "2026-08-11T15:00:00.000Z",
  media: [],
};

/** GET messages — пусто */
export const DIALOG_MESSAGES_EMPTY_EXAMPLE: unknown[] = [];

/** POST send-message body */
export const SEND_MESSAGE_BODY_EXAMPLE = {
  messageText: "Здравствуйте!",
  mediaUrls: [],
  buttons: [],
  buttonsPerRow: 0,
};

/** POST send-node-message body */
export const SEND_NODE_BODY_EXAMPLE = {
  nodeId: "welcome-msg",
  userData: { order_id: "A-100" },
};

/** Успех send */
export const SEND_OK_EXAMPLE = {
  message: "Сообщение успешно отправлено",
  result: { ok: true, result: { message_id: 1002 } },
};

/** DELETE ok */
export const DELETE_MESSAGES_OK_EXAMPLE = {
  message: "Сообщения успешно удалены",
  deleted: true,
};

/** 400 нет токена */
export const NO_TOKEN_EXAMPLE = {
  message: "Токен бота не найден для этого проекта",
};

/** 404 аватар */
export const AVATAR_NOT_FOUND_EXAMPLE = {
  message: "Не удалось получить аватарку",
};
