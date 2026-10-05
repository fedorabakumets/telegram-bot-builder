/**
 * @fileoverview Типы ответа API настроек рантайма
 * @module components/admin/runtime/runtime-types
 */

/** Вид поля, как его отдаёт сервер */
export type RuntimeFieldKind = 'text' | 'number' | 'bool' | 'secret' | 'storage';

/** Поле формы: секрет приходит без значения */
export interface RuntimeFieldView {
  /** Имя переменной */
  env: string;
  /** Подпись */
  label: string;
  /** Вид поля */
  kind: RuntimeFieldKind;
  /** Подсказка */
  hint?: string;
  /** Эффективное значение, у секрета пусто */
  value: string;
  /** Уже задано в админке или в окружении */
  configured: boolean;
}

/** Хранилище в выпадающем списке */
export interface RuntimeStorageOption {
  /** ID в storage_configs */
  id: string;
  /** Подпись */
  name: string;
  /** local или s3 */
  backend: string;
  /** Публичное — в списке недоступно */
  public: boolean;
}

/** Раздел настроек */
export interface RuntimeGroupView {
  /** Ключ раздела */
  id: string;
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Поля */
  fields: RuntimeFieldView[];
  /** Хранилища */
  storages: RuntimeStorageOption[];
}

/**
 * Значение для формы. Секрет всегда пустой, булево сводится к true/false.
 * @param field - Поле из API
 * @returns Строка для input
 */
export function runtimeFormValue(field: RuntimeFieldView): string {
  if (field.kind === 'secret') return '';
  if (field.kind !== 'bool') return field.value;
  const value = field.value.trim().toLowerCase();
  if (value === 'true' || value === '1' || value === 'yes') return 'true';
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') return 'false';
  return '';
}
