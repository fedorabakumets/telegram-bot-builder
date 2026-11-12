/** @fileoverview Разделение сохранённых и унаследованных настроек воркеров для формы. */
import type { RuntimeField } from "./runtime-field";
import { toRuntimeFieldView, type RuntimeFieldView } from "./runtime-field-view";

/** Встроенные варианты при отсутствии настройки площадки и окружения. */
const DEFAULTS: Record<string, string> = {
  BOT_POLLING_MODE: "direct", BOT_ON_DEMAND_IDLE_SECONDS: "30", BOT_ON_DEMAND_MAX_ACTIVE: "0",
};

/** Собирает поле без превращения значения окружения в явную настройку базы. */
export function toWorkerFieldView(field: RuntimeField, saved: string | undefined,
  env: NodeJS.ProcessEnv = process.env): RuntimeFieldView {
  const stored = saved?.trim() || "";
  const inherited = env[field.env]?.trim() || "";
  const effective = stored || inherited || DEFAULTS[field.env] || "";
  const secret = field.kind === "secret";
  return { ...toRuntimeFieldView(field),
    savedValue: secret ? "" : stored,
    effectiveValue: secret ? "" : effective,
    value: secret ? "" : effective,
    configured: Boolean(stored || inherited),
    source: stored ? "database" : inherited ? "environment" : "default" };
}
