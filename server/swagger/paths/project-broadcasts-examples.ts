/**
 * @fileoverview Примеры JSON для OpenAPI project-broadcasts.
 * @module server/swagger/paths/project-broadcasts-examples
 */

/** GET …/broadcasts */
export const PROJECT_BROADCASTS_LIST_EXAMPLE = {
  broadcasts: [
    {
      id: 15,
      projectId: 42,
      tokenId: 7,
      name: "Акция августа",
      messageText: "Привет! Скидка 20%.",
      status: "done",
      totalCount: 120,
      sentCount: 120,
      deliveredCount: 115,
      failedCount: 5,
      mediaUrls: [],
      buttons: [],
      buttonsPerRow: 0,
      filters: { tags: ["vip"] },
      createdAt: "2026-08-10T10:00:00.000Z",
      startedAt: "2026-08-10T10:00:01.000Z",
      finishedAt: "2026-08-10T10:05:00.000Z",
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

/** POST create body */
export const CREATE_BROADCAST_BODY_EXAMPLE = {
  name: "Акция августа",
  messageText: "Привет! Скидка 20%.",
  mediaUrls: [],
  buttons: [],
  buttonsPerRow: 0,
  filters: { tags: ["vip"] },
};

/** POST create 201 */
export const CREATE_BROADCAST_RESPONSE_EXAMPLE = { broadcastId: 15 };

/** POST preview body */
export const PREVIEW_AUDIENCE_BODY_EXAMPLE = {
  filters: { tags: ["vip"] },
};

/** POST preview 200 */
export const PREVIEW_AUDIENCE_RESPONSE_EXAMPLE = {
  count: 42,
  sample: [
    {
      userId: "123456789",
      userName: "ivan",
      firstName: "Иван",
      lastName: "Петров",
    },
  ],
};

/** GET detail */
export const BROADCAST_DETAIL_EXAMPLE = {
  broadcast: PROJECT_BROADCASTS_LIST_EXAMPLE.broadcasts[0],
  results: [
    {
      id: 901,
      broadcastId: 15,
      userId: "987654321",
      status: "blocked",
      errorMessage: "Forbidden: bot was blocked by the user",
      telegramMessageId: null,
      sentAt: "2026-08-10T10:01:00.000Z",
    },
  ],
};

/** PUT edit body */
export const EDIT_BROADCAST_BODY_EXAMPLE = {
  messageText: "Обновлённый текст рассылки",
};

/** PUT edit 200 */
export const EDIT_BROADCAST_RESPONSE_EXAMPLE = {
  ok: true,
  edited: 110,
  failed: 5,
};

/** DELETE 200 */
export const DELETE_BROADCAST_RESPONSE_EXAMPLE = {
  ok: true,
  deleted: 115,
};

/** 403 */
export const PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE = {
  message: "Нет доступа к проекту",
};
