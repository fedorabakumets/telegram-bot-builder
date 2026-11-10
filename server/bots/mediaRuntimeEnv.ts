/**
 * @fileoverview Настройка ограниченного доступа бота к медиа проекта.
 * @module server/bots/mediaRuntimeEnv
 */
import { createMediaRuntimeToken, createMediaRuntimeWriteToken } from "../storage/media-runtime-token";
import { getProjectPlacement } from "./botPlacement";
import { getDockerWorkerConfig, getWorkerRuntime } from "./workerRuntime";

/**
 * Собирает окружение конкретного бота и сообщает о недоступной конфигурации.
 * @param projectId - Идентификатор проекта
 * @param projectData - Данные проекта для диагностики привязанных файлов
 * @param storageRequired - Требуется чтение из хранилища без локальной подмены
 * @returns Переменные доступа без секрета панели
 */
export function buildMediaRuntimeEnv(projectId: number, projectData: unknown, storageRequired = false): Record<string, string> {
  const needsMedia = storageRequired || collectRuntimeMediaUrls(projectData).size > 0;
  const base = (process.env.MEDIA_RUNTIME_BASE_URL || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).trim();
  const remote = getProjectPlacement(projectId).runnerId !== null;
  const required = storageRequired || remote;
  const fallback: Record<string, string> = required ? { MEDIA_RUNTIME_REQUIRED: '1' } : {};
  let url: URL;
  try {
    url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
  } catch {
    if (needsMedia) console.warn('[MediaRuntime] Некорректный адрес панели для получения медиа');
    return fallback;
  }
  const dockerIsolated = getWorkerRuntime() === 'docker' && getDockerWorkerConfig().network !== 'host';
  if (remote && url.protocol !== 'https:' && process.env.MEDIA_RUNTIME_ALLOW_INSECURE_REMOTE !== 'true') {
    if (needsMedia) console.warn('[MediaRuntime] Для удалённого исполнителя требуется HTTPS или явно разрешённый доверенный канал');
    return fallback;
  }
  if ((remote || dockerIsolated) && ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
    if (needsMedia) console.warn('[MediaRuntime] Локальный адрес панели недоступен удалённому исполнителю или контейнеру; задайте MEDIA_RUNTIME_BASE_URL');
    return fallback;
  }
  try {
    return { ...fallback, MEDIA_RUNTIME_BASE_URL: url.toString().replace(/\/$/, ''), MEDIA_RUNTIME_PROJECT_ID: String(projectId), MEDIA_RUNTIME_TOKEN: createMediaRuntimeToken(projectId), MEDIA_RUNTIME_WRITE_TOKEN: createMediaRuntimeWriteToken(projectId) };
  } catch {
    if (needsMedia) console.warn('[MediaRuntime] Доступ к хранилищу медиа не настроен: проверьте MEDIA_RUNTIME_SECRET');
    return fallback;
  }
}

/**
 * Проверяет, что удалённый бот получил доступ к медиа до отправки команды запуска.
 * @param env - Окружение бота после добавления переменных медиа
 * @returns Причина отказа или null при готовом доступе
 */
export function validateMediaRuntimeEnv(env: Record<string, string>): string | null {
  if (env.MEDIA_RUNTIME_REQUIRED !== '1') return null;
  if (env.MEDIA_RUNTIME_BASE_URL && env.MEDIA_RUNTIME_PROJECT_ID && env.MEDIA_RUNTIME_TOKEN && env.MEDIA_RUNTIME_WRITE_TOKEN) return null;
  return 'Удалённому боту недоступны медиа: проверьте MEDIA_RUNTIME_BASE_URL и MEDIA_RUNTIME_SECRET';
}

/**
 * Собирает логические ссылки медиа в данных проекта.
 * @param value - Данные проекта
 * @param urls - Множество найденных ссылок
 * @returns Адреса вложений
 */
export function collectRuntimeMediaUrls(value: unknown, urls = new Set<string>()): Set<string> {
  if (typeof value === 'string' && (/^\/(?:uploads|api\/storage\/proxy|api\/media\/s3-proxy)\//.test(value) || /^https?:\/\//i.test(value))) urls.add(value);
  else if (Array.isArray(value)) value.forEach(item => collectRuntimeMediaUrls(item, urls));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) { collectRuntimeMediaUrls(key, urls); collectRuntimeMediaUrls(item, urls); }
  }
  return urls;
}
