/**
 * @fileoverview Примеры JSON для OpenAPI тега projects (list/create/get).
 * @module server/swagger/paths/projects-examples
 */

/** Полный проект (как в GET /api/projects и GET /api/projects/{id}) */
export const BOT_PROJECT_EXAMPLE = {
  id: 42,
  ownerId: 123456789,
  name: "Мой бот",
  description: "Приветственный бот",
  data: {
    sheets: [{ id: "main", name: "Основной", nodes: [], edges: [] }],
  },
  botToken: null,
  sessionId: null,
  userDatabaseEnabled: 1,
  sortOrder: 0,
  adminIds: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-11T12:00:00.000Z",
};

/** Элемент безопасного списка GET /api/projects/list */
export const PROJECT_LIST_ITEM_EXAMPLE = {
  id: 42,
  ownerId: 123456789,
  name: "Мой бот",
  description: "Приветственный бот",
  userDatabaseEnabled: 1,
  sortOrder: 0,
  adminIds: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-11T12:00:00.000Z",
  nodeCount: 12,
  sheetsCount: 2,
};

/** Тело POST /api/projects (минимальное) */
export const CREATE_PROJECT_BODY_EXAMPLE = {
  name: "Мой бот",
  description: "Приветственный бот",
  data: { sheets: [{ id: "main", nodes: [], edges: [] }] },
  userDatabaseEnabled: 1,
  sortOrder: 0,
};

/** 401 на создание без сессии */
export const CREATE_PROJECT_UNAUTHORIZED_EXAMPLE = {
  message: "Требуется авторизация через Telegram",
};

/** 400 валидации Zod */
export const CREATE_PROJECT_VALIDATION_EXAMPLE = {
  message: "Неверные данные",
  errors: [{ path: ["name"], message: "Required" }],
};

/** 500 списка проектов */
export const PROJECTS_LIST_ERROR_EXAMPLE = {
  message: "Не удалось получить список проектов",
};

/** 500 полного списка */
export const PROJECTS_ALL_ERROR_EXAMPLE = {
  message: "Не удалось получить проекты",
};

/** 500 создания */
export const CREATE_PROJECT_ERROR_EXAMPLE = {
  message: "Не удалось создать проект",
};
