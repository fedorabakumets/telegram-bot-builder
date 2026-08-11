/**
 * @fileoverview Примеры JSON для OpenAPI project-groups.
 * @module server/swagger/paths/project-groups-examples
 */

/** GET …/groups */
export const PROJECT_GROUPS_LIST_EXAMPLE = [
  {
    id: 15,
    projectId: 42,
    groupId: "-1001234567890",
    name: "Поддержка клиентов",
    url: "https://t.me/support_chat",
    isAdmin: 1,
    isActive: 1,
    avatarUrl: "/api/projects/42/telegram-file?fileId=AgAC&tokenId=7",
    chatType: "supergroup",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-11T12:00:00.000Z",
  },
];

/** POST …/sync 200 */
export const PROJECT_GROUPS_SYNC_EXAMPLE = {
  synced: true,
  group: PROJECT_GROUPS_LIST_EXAMPLE[0],
};

/** GET …/groups/{groupId}/messages */
export const PROJECT_GROUPS_MESSAGES_EXAMPLE = [
  {
    id: 880,
    projectId: 42,
    tokenId: 7,
    userId: "-1001234567890",
    messageType: "user",
    messageText: "Нужна помощь с заказом",
    messageData: null,
    telegramMessageId: 101,
    createdAt: "2026-08-11T14:00:00.000Z",
  },
  {
    id: 881,
    projectId: 42,
    tokenId: 7,
    userId: "-1001234567890",
    messageType: "bot",
    messageText: "Здравствуйте! Чем помочь?",
    messageData: { sentFromAdmin: true },
    telegramMessageId: 102,
    createdAt: "2026-08-11T14:01:00.000Z",
  },
];

/** POST send-group-message body */
export const SEND_GROUP_MESSAGE_BODY_EXAMPLE = {
  groupId: "-1001234567890",
  message: "Здравствуйте!",
  mediaUrls: [],
  buttons: [],
  buttonsPerRow: 0,
};

/** POST send-group-message 200 */
export const SEND_GROUP_MESSAGE_OK_EXAMPLE = {
  message: "Сообщение успешно отправлено",
  messageId: 98765,
};

/** 403 */
export const PROJECT_GROUPS_FORBIDDEN_EXAMPLE = {
  message: "Нет прав доступа к проекту",
};

/** 404 группа */
export const PROJECT_GROUPS_NOT_FOUND_EXAMPLE = {
  message: "Группа не найдена в проекте",
};
