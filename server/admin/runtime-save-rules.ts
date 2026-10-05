/**
 * @fileoverview Чистые правила записи поля рантайма без обращения к базе
 * @module server/admin/runtime-save-rules
 */

import type { RuntimeFieldKind } from "./runtime-field";

/** Что сделать с ключом `runtime.<ENV>` */
export type RuntimeSaveAction = "set" | "delete" | "skip";

/** Решение по одному полю формы */
export interface RuntimeSaveDecision {
  /** Записать, удалить или не трогать */
  action: RuntimeSaveAction;
  /** Значение для записи, если action равен set */
  value?: string;
}

/**
 * Решает, как сохранить поле.
 * Секрет с пустым вводом не трогает старое значение.
 * Обычное поле с явной пустой строкой удаляется, отсутствующий ключ пропускается.
 * @param kind - Вид поля
 * @param raw - Значение из тела запроса; undefined значит «ключ не прислали»
 * @returns Действие и, при записи, обрезанное значение
 */
export function decideRuntimeSave(kind: RuntimeFieldKind, raw: unknown): RuntimeSaveDecision {
  if (raw === undefined) return { action: "skip" };
  if (kind === "bool") return decideBool(raw);
  const text = raw === null ? "" : String(raw);
  if (kind === "secret") {
    if (!text.trim()) return { action: "skip" };
    return { action: "set", value: text.trim() };
  }
  if (!text.trim()) return { action: "delete" };
  return { action: "set", value: text.trim() };
}

/**
 * Булево поле: явные true/false пишутся, пустая строка удаляет ключ
 * @param raw - Значение из запроса
 * @returns Решение записи
 */
function decideBool(raw: unknown): RuntimeSaveDecision {
  if (raw === true || raw === "true" || raw === "1" || raw === "yes") return { action: "set", value: "true" };
  if (raw === false || raw === "false" || raw === "0" || raw === "no") return { action: "set", value: "false" };
  if (raw === null || raw === "") return { action: "delete" };
  const text = String(raw).trim();
  return text ? { action: "set", value: text } : { action: "delete" };
}
