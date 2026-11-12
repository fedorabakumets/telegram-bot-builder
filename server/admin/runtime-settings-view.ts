/**
 * @fileoverview Ответ GET раздела настроек: поля без секретов и список хранилищ
 * @module server/admin/runtime-settings-view
 */

import { appSettings, storageConfigs } from "@shared/schema";
import { inArray } from "drizzle-orm";
import { db } from "../database/db";
import type { RuntimeDocLink, RuntimeGroup } from "./runtime-field";
import { toRuntimeFieldView, type RuntimeFieldView } from "./runtime-field-view";
import { isPublicStorageRow, type RuntimeStorageOption } from "./runtime-storage-public";
import { runtimeSettingKey } from "./runtime-field";
import { toWorkerFieldView } from "./runtime-worker-view";

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
  const saved = group.id === "workers" ? await db.select({ key: appSettings.key, value: appSettings.value })
    .from(appSettings).where(inArray(appSettings.key, group.fields.map((field) => runtimeSettingKey(field.env)))) : [];
  const stored = new Map(saved.map((row) => [row.key, row.value]));
  return {
    id: group.id,
    title: group.title,
    description: group.description,
    docs: group.docs ?? [],
    fields: group.fields.map((field) => group.id === "workers"
      ? toWorkerFieldView(field, stored.get(runtimeSettingKey(field.env))) : toRuntimeFieldView(field)),
    storages: await listRuntimeStorageOptions(),
  };
}
