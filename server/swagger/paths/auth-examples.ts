/**
 * @fileoverview Примеры JSON для OpenAPI тега auth.
 * @module server/swagger/paths/auth-examples
 */

/** Пример пользователя в ответах */
export const TELEGRAM_USER_EXAMPLE = {
  id: 123456789,
  firstName: "Иван",
  lastName: "Петров",
  username: "ivan_p",
  photoUrl: "https://t.me/i/userpic/320/ivan_p.jpg",
  authDate: 1710000000,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-08-08T12:00:00.000Z",
};

/** Пример тела Widget login */
export const TELEGRAM_AUTH_BODY_EXAMPLE = {
  id: 123456789,
  first_name: "Иван",
  last_name: "Петров",
  username: "ivan_p",
  auth_date: 1710000000,
  id_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
};

/** Пример тела dev-login */
export const DEV_LOGIN_BODY_EXAMPLE = {
  id: 123456789,
  firstName: "Иван",
  username: "ivan_p",
};

/** Пример тела Mini App */
export const MINIAPP_BODY_EXAMPLE = {
  initData: "user=%7B%22id%22%3A123456789%7D&auth_date=1710000000&hash=abc...",
};

/** Успех Widget / Mini App */
export const TELEGRAM_AUTH_OK_EXAMPLE = {
  success: true,
  message: "Авторизация успешна",
  user: TELEGRAM_USER_EXAMPLE,
  switched: false,
};

/** Успех dev-login */
export const DEV_LOGIN_OK_EXAMPLE = {
  success: true,
  user: TELEGRAM_USER_EXAMPLE,
};

/** GET /me — залогинен */
export const ME_OK_EXAMPLE = { user: TELEGRAM_USER_EXAMPLE };

/** GET /me — гость */
export const ME_GUEST_EXAMPLE = { user: null };

/** Logout OK */
export const LOGOUT_OK_EXAMPLE = {
  success: true,
  message: "Выход выполнен",
};

/** GET user by id OK */
export const GET_USER_OK_EXAMPLE = {
  success: true,
  user: TELEGRAM_USER_EXAMPLE,
};
