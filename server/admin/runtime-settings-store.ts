/**
 * @fileoverview Сохранение раздела рантайма: база, оверлей, бэкапы и S3
 * @module server/admin/runtime-settings-store
 */

import { deleteSetting, setSetting } from "../services/app-settings.service";
import { restartDbBackupScheduler } from "../database/backups/dbBackupScheduler";
import { runDbBackupNow } from "../database/backups/runDbBackupNow";
import { resetTelegramProxy } from "../utils/telegram-proxy";
import { applyStorageFromSettings } from "./apply-storage-from-settings";
import { findRuntimeGroup } from "./runtime-groups";
import { runtimeSettingKey } from "./runtime-field";
import { applyRuntimeProxyEnv, refreshRuntimeOverlay } from "./runtime-overlay-refresh";
import { decideRuntimeSave } from "./runtime-save-rules";
import { listRuntimeStorageOptions, loadRuntimeGroupView, type RuntimeGroupView } from "./runtime-settings-view";

/** Ошибка API настроек рантайма с кодом HTTP */
export class RuntimeSettingsError extends Error {
  /**
   * @param message - Текст для клиента
   * @param status - Код ответа
   */
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Читает раздел для формы
 * @param groupId - Ключ раздела
 * @returns Поля и хранилища
 */
export async function getRuntimeGroup(groupId: string): Promise<RuntimeGroupView> {
  const group = findRuntimeGroup(groupId);
  if (!group) throw new RuntimeSettingsError("Раздел не найден", 404);
  return loadRuntimeGroupView(group);
}

/**
 * Запрещает выбрать публичное хранилище в поле storage
 * @param groupId - Раздел
 * @param id - ID хранилища
 */
async function assertStorageAllowed(groupId: string, id: string): Promise<void> {
  const options = await listRuntimeStorageOptions();
  const known = options.find((item) => item.id === id);
  const isPublic = id === "local-default" || known?.public === true;
  if (!isPublic) return;
  const message = groupId === "backups"
    ? `Хранилище "${id}" публичное — бэкапы в него не пишутся`
    : `Хранилище "${id}" публичное — выберите приватное`;
  throw new RuntimeSettingsError(message, 400);
}

/**
 * Пишет поля раздела. Секрет с пустым вводом не затирается.
 * @param groupId - Ключ раздела
 * @param input - Значения формы
 * @returns Предупреждения (например, ключи S3 без шифрования)
 */
export async function saveRuntimeGroup(groupId: string, input: Record<string, unknown>): Promise<string[]> {
  const group = findRuntimeGroup(groupId);
  if (!group) throw new RuntimeSettingsError("Раздел не найден", 404);
  const decisions = group.fields.map((field) => ({ field, decision: decideRuntimeSave(field.kind, input[field.env]) }));
  for (const { field, decision } of decisions) {
    if (field.kind === "storage" && decision.action === "set" && decision.value) {
      await assertStorageAllowed(groupId, decision.value);
    }
  }
  for (const { field, decision } of decisions) {
    const key = runtimeSettingKey(field.env);
    if (decision.action === "delete") await deleteSetting(key);
    if (decision.action === "set" && decision.value) {
      await setSetting(key, decision.value);
      if (field.env === "SUPPORT_BOT_TOKEN") await setSetting("support_bot_token", decision.value);
    }
  }
  await refreshRuntimeOverlay();
  applyRuntimeProxyEnv();
  if (groupId === "platform") resetTelegramProxy();
  if (groupId === "backups") restartDbBackupScheduler();
  const warnings: string[] = [];
  if (groupId === "storages") {
    const warning = await applyStorageFromSettings(input);
    if (warning) warnings.push(warning);
  }
  return warnings;
}

/**
 * Снимает бэкап всех целей сразу, без ожидания интервала
 * @returns Метки баз, которые сохранены
 */
export async function backupNow(): Promise<string[]> {
  const labels = await runDbBackupNow();
  if (labels.length === 0) throw new RuntimeSettingsError("Нет баз для бэкапа: не задан DATABASE_URL", 400);
  return labels;
}
