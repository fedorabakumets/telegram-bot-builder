/**
 * @fileoverview Карточки hub админ-панели (/admin)
 * @module server/admin/admin-hub-sections
 */

/** Карточка раздела админки */
export interface AdminSection {
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Ссылка */
  href: string;
  /** Открывать во вкладке (внешний URL) */
  external?: boolean;
}

/** URL Drizzle Studio (отдельный процесс drizzle-kit studio) */
export const DRIZZLE_STUDIO_URL = "https://local.drizzle.studio";

/** Базовые разделы admin hub */
const BASE_ADMIN_SECTIONS: AdminSection[] = [
  {
    title: "Database Schema",
    description: "ER-диаграмма и описание таблиц из Drizzle-схемы (npm run docs:db).",
    href: "/admin/schema",
  },
  {
    title: "API Reference (MD)",
    description: "Markdown-справочник HTTP API из OpenAPI (npm run docs:api).",
    href: "/admin/api-docs",
  },
  {
    title: "API Documentation",
    description: "OpenAPI spec: Swagger, Scalar, Redoc, RapiDoc.",
    href: "/admin/docs",
  },
  {
    title: "Healthcheck",
    description: "GET /api/health — статус БД, Redis, шаблонов.",
    href: "/api/health",
  },
  {
    title: "OpenAPI JSON",
    description: "Сырой spec для экспорта и генерации клиентов.",
    href: "/admin/openapi.json",
  },
];

/** Карточка Live DB — только локальная разработка */
const LIVE_DB_SECTION: AdminSection = {
  title: "Live DB",
  description: "Drizzle Studio — данные в реальном времени. Сначала в терминале: npm run db:studio",
  href: DRIZZLE_STUDIO_URL,
  external: true,
};

/**
 * Возвращает список карточек hub с учётом окружения.
 * @returns Массив разделов admin-панели
 */
export function getAdminHubSections(): AdminSection[] {
  if (process.env.NODE_ENV === "production") {
    return BASE_ADMIN_SECTIONS;
  }

  return [BASE_ADMIN_SECTIONS[0], LIVE_DB_SECTION, ...BASE_ADMIN_SECTIONS.slice(1)];
}
