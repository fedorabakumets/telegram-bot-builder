/** @fileoverview Переход к панели первоначальной настройки. */

/** Адрес входа в панель с параметром первоначальной настройки. */
export const ADMIN_SETUP_URL = '/admin/login?setup=1';

/** Открывает вход в панель, заменяя текущую запись истории. */
export function openAdminSetup(): void {
  window.location.replace(ADMIN_SETUP_URL);
}
