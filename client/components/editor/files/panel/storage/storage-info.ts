/**
 * @fileoverview Тип `StorageInfo` — краткая инфа о хранилище для UI
 * (селектор цели загрузки, фильтр по хранилищу, менеджер хранилищ).
 * Согласован с серверным DTO `StorageConfigDto` (id↔configId, backend,
 * name, isActive, readOnly). Используется компонентами 8.1–8.3 (Req 11.*).
 * @module components/editor/files/panel/storage/storage-info
 */

import type { StorageConfigDto } from '../../hooks/use-storage-configs';

/** Тип бэкенда хранилища для UI */
export type StorageBackendKind = 'local' | 's3';

/** Краткая инфа о хранилище для UI */
export interface StorageInfo {
  /** storage_configs.id */
  configId: string;
  /** Тип бэкенда */
  backend: StorageBackendKind;
  /** Человекочитаемое имя */
  name: string;
  /** Активно для записи по умолчанию */
  isActive: boolean;
  /** Только чтение */
  readOnly: boolean;
}

/**
 * Преобразует серверный DTO конфига хранилища в краткую инфу `StorageInfo`.
 * Нормализует тип бэкенда к 'local' | 's3' ('local' как безопасный фолбэк).
 * @param dto - DTO конфига хранилища из `/api/storage-configs`
 * @returns Краткая инфа о хранилище для UI
 */
export function toStorageInfo(dto: StorageConfigDto): StorageInfo {
  return {
    configId: dto.id,
    backend: dto.backend === 's3' ? 's3' : 'local',
    name: dto.name,
    isActive: dto.isActive,
    readOnly: dto.readOnly,
  };
}

/**
 * Отбирает доступные для записи хранилища (эквивалент серверного
 * `listWritable`): исключает помеченные только-для-чтения (Req 11.7).
 * @param storages - Полный список хранилищ
 * @returns Хранилища, в которые разрешена запись (загрузка)
 */
export function listWritable(storages: StorageInfo[]): StorageInfo[] {
  return storages.filter((storage) => !storage.readOnly);
}
