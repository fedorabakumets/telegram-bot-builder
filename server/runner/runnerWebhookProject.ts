/** @fileoverview Проверка адреса регистрации до передачи команды запуска Python. */

/** Возвращает проект webhook либо отклоняет некорректный адрес до запуска бота. */
export function runnerWebhookProject(command: { cmd?: string; token_id?: number; webhook_url?: unknown }): number | undefined {
  if (command.cmd !== "start_bot" || command.webhook_url === undefined || command.webhook_url === "") return undefined;
  if (typeof command.webhook_url !== "string") throw new Error("Некорректный адрес webhook");
  let url: URL;
  try { url = new URL(command.webhook_url); } catch { throw new Error("Некорректный адрес webhook"); }
  const route = /\/api\/webhook\/([1-9]\d*)\/([1-9]\d*)$/.exec(url.pathname);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !route
    || Number(route[2]) !== command.token_id || !Number.isSafeInteger(Number(route[1]))) {
    throw new Error("Адрес webhook не соответствует проекту и боту");
  }
  return Number(route[1]);
}
