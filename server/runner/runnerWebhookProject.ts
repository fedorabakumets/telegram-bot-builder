/** @fileoverview Проверка адреса регистрации до передачи команды запуска Python. */

/** Возвращает проект webhook либо отклоняет некорректный адрес до запуска бота. */
export function runnerWebhookProject(command: { cmd?: string; token_id?: number; project_id?: number; webhook_url?: unknown;
  env?: Record<string, string> }): number | undefined {
  if (command.cmd !== "start_bot" || command.webhook_url === undefined || command.webhook_url === "") return undefined;
  if (typeof command.webhook_url !== "string") throw new Error("Некорректный адрес webhook");
  let url: URL;
  try { url = new URL(command.webhook_url); } catch { throw new Error("Некорректный адрес webhook"); }
  const route = /\/api\/webhook\/([1-9]\d*)\/([1-9]\d*)$/.exec(url.pathname);
  /** Старый API уже передавал PROJECT_ID в окружении; это сохраняет совместимость при поочерёдном деплое. */
  const projectId = command.project_id ?? Number(command.env?.PROJECT_ID ?? route?.[1]);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
    || !Number.isSafeInteger(projectId) || projectId <= 0
    || !Number.isSafeInteger(command.token_id) || Number(command.token_id) <= 0
    || (route && (Number(route[2]) !== command.token_id || Number(route[1]) !== projectId))) {
    throw new Error("Адрес webhook не соответствует проекту и боту");
  }
  return projectId;
}
