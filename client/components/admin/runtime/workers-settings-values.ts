/** @fileoverview Подготовка значений и проверка настроек запуска воркеров. */
import { runtimeFormValue, type RuntimeGroupView } from './runtime-types';

/** Возвращает значения полей без раскрытия сохранённых секретов. */
export function workersSettingsValues(data: RuntimeGroupView): Record<string, string> {
  return Object.fromEntries(data.fields.map((field) => [field.env, runtimeFormValue({ ...field, value: field.savedValue ?? field.value })]));
}

/** Собирает только известные API поля, сохраняя пустые несекретные значения. */
export function workersSettingsPayload(data: RuntimeGroupView, values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(data.fields.filter((field) => field.kind !== 'secret' || values[field.env]?.trim())
    .map((field) => [field.env, values[field.env] ?? '']));
}

/** Проверяет числовые пределы настроек сна и параллельной обработки. */
export function validateWorkerNumber(env: string, value: string): true | string {
  if (!value.trim()) return true;
  const number = Number(value);
  if (env === 'BOT_ON_DEMAND_IDLE_SECONDS') {
    return Number.isFinite(number) && number >= 0.1 && number <= 86400 || 'Укажите число от 0,1 до 86400.';
  }
  return Number.isInteger(number) && number >= 0 && number <= 64 || 'Укажите 0 без ограничений либо целое число от 1 до 64.';
}
