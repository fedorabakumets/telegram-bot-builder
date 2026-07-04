/**
 * @fileoverview API-клиент реестра хранилищ `/api/storage-configs`.
 * Тонкие обёртки над fetch/apiRequest для списка/CRUD/теста/активации
 * конфигов хранилищ (Req 11.2, 11.3). Секреты наружу не отдаются — DTO
 * содержит лишь флаг `hasSecrets`. Типы повторяют серверные DTO/входы.
 * @module components/editor/files/hooks/storage-configs-api
 */

import { apiRequest } from '@/queryClient';

/** Базовый путь CRUD-эндпоинтов реестра хранилищ */
export const STORAGE_CONFIGS_URL = '/api/storage-configs';

/** Безопасное представление конфига хранилища (без секретов) */
export interface StorageConfigDto {
  /** Стабильный идентификатор конфига (storage_configs.id) */
  id: string;
  /** Человекочитаемое имя */
  name: string;
  /** Тип бэкенда: "local" | "s3" */
  backend: string;
  /** Активно ли для новых загрузок */
  isActive: boolean;
  /** Несекретные параметры (rootPath / endpoint+bucket и т.п.) */
  config: Record<string, unknown>;
  /** Только чтение (нельзя выбрать целью записи) */
  readOnly: boolean;
  /** Заданы ли секретные креды (без раскрытия значений) */
  hasSecrets: boolean;
  /** Дата создания (ISO) либо null */
  createdAt: string | null;
}

/** Тело запроса на создание конфига хранилища */
export interface CreateStorageConfigInput {
  /** Необязательный стабильный id (иначе сгенерируется на сервере) */
  id?: string;
  /** Имя конфига */
  name: string;
  /** Тип бэкенда */
  backend: 'local' | 's3';
  /** Несекретные параметры */
  config?: Record<string, unknown>;
  /** Access key S3 (только при создании/смене) */
  s3AccessKeyId?: string;
  /** Secret key S3 (только при создании/смене) */
  s3SecretAccessKey?: string;
  /** Только чтение */
  readOnly?: boolean;
}

/** Тело запроса на обновление конфига хранилища (частичное) */
export interface UpdateStorageConfigInput {
  /** Новое имя */
  name?: string;
  /** Новые несекретные параметры (полная замена объекта config) */
  config?: Record<string, unknown>;
  /** Сменить режим только-чтения */
  readOnly?: boolean;
  /** Сделать активным (снимет активность у остальных) */
  isActive?: boolean;
  /** Новый access key S3 (только при смене кредов) */
  s3AccessKeyId?: string;
  /** Новый secret key S3 (только при смене кредов) */
  s3SecretAccessKey?: string;
}

/** Результат проверки доступности хранилища */
export interface StorageTestResult {
  /** Успешна ли проверка доступности */
  ok: boolean;
  /** Диагностическое сообщение */
  message?: string;
}

/**
 * Запрашивает список всех конфигов хранилищ (без секретов).
 * @returns Промис с массивом DTO хранилищ
 */
export async function fetchStorageConfigs(): Promise<StorageConfigDto[]> {
  const res = await fetch(STORAGE_CONFIGS_URL, { credentials: 'include' });
  if (!res.ok) throw new Error('Ошибка загрузки списка хранилищ');
  return res.json();
}

/**
 * Создаёт новый конфиг хранилища (local-папка или S3).
 * @param input - Параметры создания конфига
 * @returns Промис с созданным DTO
 */
export function createStorageConfig(input: CreateStorageConfigInput): Promise<StorageConfigDto> {
  return apiRequest('POST', STORAGE_CONFIGS_URL, input);
}

/**
 * Обновляет конфиг хранилища по идентификатору (имя/параметры/секреты/активность).
 * @param id - Идентификатор конфига (storage_configs.id)
 * @param input - Частичные поля обновления
 * @returns Промис с обновлённым DTO
 */
export function updateStorageConfig(id: string, input: UpdateStorageConfigInput): Promise<StorageConfigDto> {
  return apiRequest('PATCH', `${STORAGE_CONFIGS_URL}/${encodeURIComponent(id)}`, input);
}

/**
 * Удаляет конфиг хранилища (запрещено сервером при наличии файлов → 409).
 * @param id - Идентификатор конфига
 * @returns Промис с результатом удаления
 */
export function deleteStorageConfig(id: string): Promise<{ ok: boolean; id: string }> {
  return apiRequest('DELETE', `${STORAGE_CONFIGS_URL}/${encodeURIComponent(id)}`);
}

/**
 * Проверяет доступность хранилища (S3: headBucket/list; local: доступ к папке).
 * @param id - Идентификатор конфига
 * @returns Промис с результатом проверки
 */
export function testStorageConfig(id: string): Promise<StorageTestResult> {
  return apiRequest('POST', `${STORAGE_CONFIGS_URL}/${encodeURIComponent(id)}/test`);
}
