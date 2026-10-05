/**
 * @fileoverview Поле раздела рантайма для JSON: секрет без значения, пример отдельно
 * @module server/admin/runtime-field-view
 */

import { runtimeEnv } from "../services/runtime-overlay";
import type { RuntimeField } from "./runtime-field";

/** Поле в ответе API: секрет не содержит самого значения */
export interface RuntimeFieldView {
  /** Имя переменной */
  env: string;
  /** Подпись */
  label: string;
  /** Вид поля */
  kind: RuntimeField["kind"];
  /** Подсказка */
  hint?: string;
  /** Пример для placeholder, не значение поля */
  placeholder?: string;
  /** Эффективное значение; у секрета всегда пусто */
  value: string;
  /** Задано ли значение в админке или в env */
  configured: boolean;
}

/**
 * Эффективное значение поля. Секрет наружу не отдаётся, placeholder в value не копируется.
 * @param field - Описание поля
 * @returns Поле для JSON
 */
export function toRuntimeFieldView(field: RuntimeField): RuntimeFieldView {
  const current = runtimeEnv(field.env);
  const base = {
    env: field.env,
    label: field.label,
    kind: field.kind,
    hint: field.hint,
    placeholder: field.placeholder,
  };
  if (field.kind === "secret") {
    return { ...base, value: "", configured: Boolean(current) };
  }
  return { ...base, value: current ?? "", configured: Boolean(current) };
}
