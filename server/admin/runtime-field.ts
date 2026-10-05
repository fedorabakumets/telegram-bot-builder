/**
 * @fileoverview Поле настройки, которое админка хранит вместо переменной окружения
 * @module server/admin/runtime-field
 */

/** Как рисовать поле в форме */
export type RuntimeFieldKind = "text" | "number" | "bool" | "secret" | "storage";

/** Описание одного поля раздела админки */
export interface RuntimeField {
  /** Имя переменной и суффикс ключа app_settings `runtime.<env>` */
  env: string;
  /** Подпись в форме */
  label: string;
  /** Вид поля */
  kind: RuntimeFieldKind;
  /** Короткая подсказка под полем */
  hint?: string;
}

/** Префикс ключа в `app_settings` */
export const RUNTIME_SETTING_PREFIX = "runtime.";

/**
 * Ключ строки в `app_settings` для переменной
 * @param envName - Имя переменной
 * @returns Ключ вида `runtime.ENV_NAME`
 */
export function runtimeSettingKey(envName: string): string {
  return `${RUNTIME_SETTING_PREFIX}${envName}`;
}

/** Раздел настроек в боковом меню */
export interface RuntimeGroup {
  /** Ключ раздела в URL */
  id: string;
  /** Заголовок страницы */
  title: string;
  /** Описание под заголовком */
  description: string;
  /** Поля раздела */
  fields: RuntimeField[];
}
