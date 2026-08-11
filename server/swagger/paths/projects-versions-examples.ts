/**
 * @fileoverview Примеры JSON для OpenAPI project-versions.
 * @module server/swagger/paths/projects-versions-examples
 */

/** Мета-элемент списка версий */
export const VERSION_META_MANUAL_EXAMPLE = {
  id: 7,
  projectId: 42,
  label: "Добавил приветствие",
  authorId: 123456789,
  authorName: "Иван @ivan",
  authorKind: null as string | null,
  kind: "manual",
  createdAt: "2026-08-11T12:00:00.000Z",
};

/** Авто-снимок агента */
export const VERSION_META_AGENT_EXAMPLE = {
  id: 6,
  projectId: 42,
  label: null as string | null,
  authorId: null as number | null,
  authorName: "ИИ-агент",
  authorKind: "agent",
  kind: "auto",
  createdAt: "2026-08-11T11:30:00.000Z",
};

/** Список для GET …/versions */
export const VERSIONS_LIST_EXAMPLE = [
  VERSION_META_MANUAL_EXAMPLE,
  VERSION_META_AGENT_EXAMPLE,
];

/** Тело commit */
export const VERSION_COMMIT_BODY_EXAMPLE = { message: "Добавил приветствие" };

/** Полная версия со snapshot */
export const VERSION_FULL_EXAMPLE = {
  ...VERSION_META_MANUAL_EXAMPLE,
  snapshot: {
    sheets: [{ id: "main", name: "Основной", nodes: [], edges: [] }],
    activeSheetId: "main",
  },
};

/** Тело prune (оставить 30 auto) */
export const VERSION_PRUNE_BODY_EXAMPLE = {
  keep: 30,
  kind: "auto" as const,
};

/** Успех prune */
export const VERSION_PRUNE_OK_EXAMPLE = { deleted: 12 };

/** Успех delete */
export const VERSION_DELETE_OK_EXAMPLE = { deleted: true };
