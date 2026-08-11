/**
 * @fileoverview Примеры JSON для OpenAPI admin-ids проекта.
 * @module server/swagger/paths/projects-admin-ids-examples
 */

/** GET — список админов */
export const ADMIN_IDS_GET_EXAMPLE = {
  adminIds: "123456789,987654321",
  items: [{ id: "123456789" }, { id: "987654321" }],
  count: 2,
};

/** GET — пустой список */
export const ADMIN_IDS_GET_EMPTY_EXAMPLE = {
  adminIds: "",
  items: [],
  count: 0,
};

/** PUT body */
export const ADMIN_IDS_PUT_BODY_EXAMPLE = {
  adminIds: "123456789,987654321",
};

/** PUT / remove success */
export const ADMIN_IDS_MUTATION_OK_EXAMPLE = {
  success: true,
  adminIds: "123456789,987654321",
};

/** После remove одного id */
export const ADMIN_IDS_REMOVE_OK_EXAMPLE = {
  success: true,
  adminIds: "123456789",
};

/** POST remove body (callback из менеджера ботов) */
export const ADMIN_IDS_REMOVE_BODY_EXAMPLE = {
  adminId: "del_admin_987654321",
};

/** 500 GET */
export const ADMIN_IDS_GET_ERROR_EXAMPLE = {
  message: "Ошибка чтения ADMIN_IDS",
  error: "Error: ...",
};

/** 500 PUT */
export const ADMIN_IDS_PUT_ERROR_EXAMPLE = {
  message: "Ошибка обновления ADMIN_IDS",
  error: "Error: ...",
};

/** 500 remove */
export const ADMIN_IDS_REMOVE_ERROR_EXAMPLE = {
  message: "Ошибка удаления администратора",
  error: "Error: ...",
};
