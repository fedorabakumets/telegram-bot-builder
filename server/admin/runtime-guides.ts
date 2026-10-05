/**
 * @fileoverview Документы разделов рантайма и ссылки на встроенный просмотр
 * @module server/admin/runtime-guides
 */

import path from "path";
import type { RuntimeDocLink } from "./runtime-field";

/** Документ, который админка умеет показать */
export interface RuntimeGuide {
  /** Ключ в URL /admin/guides/:slug */
  slug: string;
  /** Заголовок ссылки и страницы */
  title: string;
  /** Путь от каталога docs, без выхода наружу */
  file: string;
  /** Раздел, к которому ведёт «назад» */
  group: string;
}

/** Только эти файлы открываются из формы. Сырой GitHub не используется */
export const RUNTIME_GUIDES: RuntimeGuide[] = [
  { slug: "uploads-s3", title: "Загрузки в S3", file: "deployment/UPLOADS_S3.md", group: "storages" },
  { slug: "db-backups", title: "Бэкапы базы", file: "deployment/DB_BACKUPS.md", group: "backups" },
  { slug: "worker-docker", title: "Воркеры в Docker", file: "deployment/WORKER_DOCKER.md", group: "workers" },
  { slug: "bot-runner", title: "Исполнитель ботов", file: "deployment/BOT_RUNNER.md", group: "runners" },
  { slug: "bot-railway", title: "Боты на Railway", file: "deployment/BOT_RAILWAY.md", group: "runners" },
  { slug: "bot-builds", title: "Сборки ботов", file: "deployment/BOT_BUILDS.md", group: "builds" },
  { slug: "bot-database-access", title: "Доступ ботов к базе", file: "futures/infrastructure/bot-database-access.md", group: "platform" },
  { slug: "bot-manager-auth", title: "Bot Manager", file: "features/bot-manager-api-auth.md", group: "platform" },
  { slug: "mcp-http", title: "HTTP MCP", file: "mcp/remote-http.md", group: "platform" },
  { slug: "admin-settings", title: "Настройки рантайма", file: "interface/admin-settings.md", group: "platform" },
];

/**
 * Ссылки раздела под заголовком страницы
 * @param groupId - Ключ раздела
 * @returns Ссылки на просмотрщик
 */
export function docsForRuntimeGroup(groupId: string): RuntimeDocLink[] {
  return RUNTIME_GUIDES.filter((guide) => guide.group === groupId).map((guide) => ({
    label: guide.title,
    href: `/admin/guides/${guide.slug}`,
  }));
}

/**
 * Ищет документ по ключу URL
 * @param slug - Ключ из адреса
 * @returns Документ или undefined
 */
export function findRuntimeGuide(slug: string): RuntimeGuide | undefined {
  return RUNTIME_GUIDES.find((guide) => guide.slug === slug);
}

/**
 * Имена файлов из markdown → ключ просмотрщика, чтобы относительные ссылки открывались здесь
 * @returns Словарь basename и относительного пути
 */
export function runtimeGuideAliases(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const guide of RUNTIME_GUIDES) {
    map[guide.file] = guide.slug;
    map[path.basename(guide.file)] = guide.slug;
  }
  return map;
}
