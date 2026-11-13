/** @fileoverview Единый выбор публичного адреса вебхука для запуска и настроек. */

/**
 * Выбирает индивидуальный адрес бота или общий адрес сервера без конечных слэшей.
 * @param override - Сохранённый адрес конкретного бота; пустое значение наследует серверный.
 * @param env - Окружение API, содержащее публичный адрес и устаревший запасной адрес.
 * @returns Адрес для регистрации вебхука либо null, если он не настроен.
 */
export function resolveWebhookBaseUrl(
  override?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  for (const value of [override, env.API_BASE_URL, env.WEBHOOK_URL]) {
    const normalized = value?.trim().replace(/\/+$/, '');
    if (normalized) return normalized;
  }
  return null;
}
