/**
 * @fileoverview Черновик конфига хранилища (`StorageConfigDraft`) и хелперы.
 * Тип черновика создания/правки хранилища (Req 11.3, 11.4) и функции маппинга
 * черновика в серверные входы Create/UpdateStorageConfigInput, построения
 * начального черновика из DTO, локальной валидации и извлечения диагностики
 * ошибки 400 при сохранении (Req 11.9). Креды S3 собираются только при
 * создании/смене и шифруются на сервере. Без JSX — чистые хелперы.
 * @module components/editor/files/panel/storage/storage-config-draft
 */

import type {
  StorageConfigDto,
  CreateStorageConfigInput,
  UpdateStorageConfigInput,
} from '../../hooks/use-storage-configs';
import type { StorageBackendKind } from './storage-info';

/** Черновик конфига хранилища при создании/правке (Req 11.3, 11.4) */
export interface StorageConfigDraft {
  /** Существующий id (правка) или undefined (создание) */
  configId?: string;
  /** Человекочитаемое имя */
  name: string;
  /** Тип бэкенда */
  backend: StorageBackendKind;
  /** Несекретные параметры: local → { rootPath }; s3 → endpoint/region/bucket/… */
  config: Record<string, unknown>;
  /** Access key S3 (только при создании/смене) */
  s3AccessKeyId?: string;
  /** Secret key S3 (только при создании/смене) */
  s3SecretAccessKey?: string;
  /** Только чтение */
  readOnly?: boolean;
}

/**
 * Строит пустой черновик для создания нового хранилища.
 * @param backend - Тип бэкенда по умолчанию ('local')
 * @returns Черновик с дефолтными значениями
 */
export function emptyDraft(backend: StorageBackendKind = 'local'): StorageConfigDraft {
  return { name: '', backend, config: {}, readOnly: false };
}

/**
 * Строит черновик правки из серверного DTO (без секретов — они вводятся заново).
 * @param dto - DTO конфига хранилища из `/api/storage-configs`
 * @returns Черновик с заполненными несекретными полями
 */
export function draftFromDto(dto: StorageConfigDto): StorageConfigDraft {
  return {
    configId: dto.id,
    name: dto.name,
    backend: dto.backend === 's3' ? 's3' : 'local',
    config: { ...(dto.config ?? {}) },
    readOnly: dto.readOnly,
  };
}

/** Возвращает строковое значение поля config или пустую строку */
export function configStr(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Преобразует черновик в тело создания конфига (Req 11.3, 11.4).
 * Креды передаются только если заданы оба поля и backend === 's3'.
 * @param draft - Черновик хранилища
 * @returns Тело запроса создания
 */
export function toCreateInput(draft: StorageConfigDraft): CreateStorageConfigInput {
  const input: CreateStorageConfigInput = {
    name: draft.name.trim(),
    backend: draft.backend,
    config: draft.config,
    readOnly: Boolean(draft.readOnly),
  };
  if (draft.backend === 's3' && draft.s3AccessKeyId && draft.s3SecretAccessKey) {
    input.s3AccessKeyId = draft.s3AccessKeyId;
    input.s3SecretAccessKey = draft.s3SecretAccessKey;
  }
  return input;
}

/**
 * Преобразует черновик в тело обновления конфига (частичное, Req 11.4).
 * Креды включаются только при смене (заданы оба поля).
 * @param draft - Черновик хранилища
 * @returns Тело запроса обновления
 */
export function toUpdateInput(draft: StorageConfigDraft): UpdateStorageConfigInput {
  const input: UpdateStorageConfigInput = {
    name: draft.name.trim(),
    config: draft.config,
    readOnly: Boolean(draft.readOnly),
  };
  if (draft.backend === 's3' && draft.s3AccessKeyId && draft.s3SecretAccessKey) {
    input.s3AccessKeyId = draft.s3AccessKeyId;
    input.s3SecretAccessKey = draft.s3SecretAccessKey;
  }
  return input;
}

/**
 * Локальная валидация черновика перед сохранением.
 * @param draft - Черновик хранилища
 * @returns null если валиден, иначе текст ошибки
 */
export function validateDraft(draft: StorageConfigDraft): string | null {
  if (!draft.name.trim()) return 'Укажите имя хранилища';
  if (draft.backend === 'local') {
    if (!configStr(draft.config, 'rootPath').trim()) return 'Укажите путь к папке (rootPath)';
    return null;
  }
  if (!configStr(draft.config, 'bucket').trim()) return 'Укажите бакет S3';
  return null;
}

/**
 * Извлекает человекочитаемую диагностику из ошибки сохранения (Req 11.9).
 * Сервер отдаёт `{ error }` или `{ message }`; берётся первое доступное.
 * @param error - Объект ошибки из apiRequest
 * @returns Текст диагностики для тоста/инлайна
 */
export function extractSaveError(error: unknown): string {
  const e = error as { error?: string; message?: string } | null;
  return e?.error || e?.message || 'Не удалось сохранить хранилище';
}
