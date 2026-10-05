/**
 * @fileoverview Ответ GET раздела настроек: поля без секретов и список хранилищ
 * @module server/admin/runtime-settings-view
 */

import { storageConfigs } from "@shared/schema";
import { db } from "../database/db";
import type { RuntimeDocLink, RuntimeGroup } from "./runtime-field";
import { toRuntimeFieldView, type RuntimeFieldView } from "./runtime-field-view";
import { isPublicStorageRow, type RuntimeStorageOption } from "./runtime-storage-public";

export type { RuntimeFieldView };

/** Раздел для формы */
export interface RuntimeGroupView {
  /** Ключ раздела */
  id: string;
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Ссылки на документы раздела */
  docs: RuntimeDocLink[];
  /** Поля */
  fields: RuntimeFieldView[];
  /** Хранилища для выпадающего списка */
  storages: RuntimeStorageOption[];
}

/**
 * Список хранилищ: публичные помечаются, форма их блокирует
 * @returns Опции select
 */
export async function listRuntimeStorageOptions(): Promise<RuntimeStorageOption[]> {
  const rows = await db.select({
    id: storageConfigs.id,
    name: storageConfigs.name,
    backend: storageConfigs.backend,
    config: storageConfigs.config,
  }).from(storageConfigs);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    backend: row.backend,
    public: isPublicStorageRow(row),
  }));
}

/**
 * Собирает раздел для формы
 * @param group - Описание раздела
 * @returns Поля и хранилища
 */
export async function loadRuntimeGroupView(group: RuntimeGroup): Promise<RuntimeGroupView> {
  return {
    id: group.id,
    title: group.title,
    description: group.description,
    docs: group.docs ?? [],
    fields: group.fields.map(toRuntimeFieldView),
    storages: await listRuntimeStorageOptions(),
  };
}
