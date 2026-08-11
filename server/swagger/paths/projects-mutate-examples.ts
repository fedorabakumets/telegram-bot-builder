/**
 * @fileoverview Примеры JSON для update / delete / duplicate проекта.
 * @module server/swagger/paths/projects-mutate-examples
 */

/** Тело PUT — переименование */
export const UPDATE_PROJECT_BODY_EXAMPLE = {
  name: "Новое имя",
};

/** Тело PUT — правка сценария + чекпоинт */
export const UPDATE_PROJECT_DATA_BODY_EXAMPLE = {
  data: { sheets: [{ id: "main", name: "Основной", nodes: [], edges: [] }] },
  commitMessage: "Добавил приветствие",
};

/** 400 неверный id */
export const UPDATE_PROJECT_BAD_ID_EXAMPLE = {
  message: "Неверный ID проекта",
  error: "ID проекта должен быть числом",
};

/** Успех DELETE */
export const DELETE_PROJECT_OK_EXAMPLE = {
  message: "Проект успешно удалён",
};

/** 403 DELETE */
export const DELETE_PROJECT_FORBIDDEN_EXAMPLE = {
  message: "Нет прав на удаление проекта",
};

/** Тело duplicate */
export const DUPLICATE_PROJECT_BODY_EXAMPLE = {
  name: "Мой бот (копия)",
};

/** 401 duplicate без Telegram-сессии */
export const DUPLICATE_UNAUTHORIZED_EXAMPLE = {
  message: "Требуется авторизация через Telegram",
};
