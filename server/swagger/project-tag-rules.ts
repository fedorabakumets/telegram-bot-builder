/**
 * @fileoverview Правила OpenAPI-тегов для эндпоинтов `/api/projects/*`
 * @module server/swagger/project-tag-rules
 */

/** Описания подтегов проектов (кроме общего `projects`) */
export const PROJECT_TAG_DESCRIPTIONS: Record<string, string> = {
  "project-dialogs":
    "Диалоги с пользователями бота: история сообщений, отправка текста/ноды, аватар. " +
    "UI: панель «Диалоги». Auth: requireProjectAccess. " +
    "Не путать со списком users и с `/api/bot/*`.",
  "project-versions":
    "Версии и коммиты проекта: список, commit, prune, restore, удаление. " +
    "Auth: requireProjectAccess. Не путать с CRUD самого проекта.",
  "project-tokens":
    "Токены бота внутри проекта: список, CRUD, настройки, env, userbot, logs. " +
    "Не путать с `/api/tokens` (runtime status) и agent PAT.",
  "project-bot":
    "Lifecycle и профиль бота проекта: start/stop/restart, info, name, description, data. " +
    "Auth: requireProjectAccess. Модерация групп — тег `project-groups`.",
  "project-users":
    "Пользователи бота проекта: список, аналитика, поиск, CRUD по userId. " +
    "Не включает диалоги (avatar/messages/send-*) — см. `project-dialogs`.",
  "project-messages":
    "Сообщения на уровне проекта: all/activity, CRUD по messageId, responses. " +
    "Не путать с `…/users/{userId}/messages` (диалоги).",
  "project-groups":
    "Telegram-группы проекта и модерация через bot API: groups*, saved-members, " +
    "ban/promote/restrict, pin, invite-link и т.п. Lifecycle бота — `project-bot`.",
  "project-broadcasts":
    "Рассылки проекта: список, создание, редактирование, stop, preview аудитории. " +
    "Auth: requireProjectAccess.",
  "project-tables":
    "Пользовательские таблицы проекта (`bot_tables`): список, CRUD таблиц/колонок/строк. " +
    "Auth: requireProjectAccess. UI: панель Database.",
  "project-files":
    "Файлы проекта, квота хранилища и прокси telegram-file. " +
    "Не путать с `/api/media` и реестром `storage-configs`.",
};

/** Действия bot API, относящиеся к модерации/группам (не lifecycle) */
const BOT_GROUP_ACTIONS =
  "send-group-message|group-info|group-members-count|admin-status|group-admins|" +
  "group-members|check-member|ban-member|unban-member|promote-member|demote-member|" +
  "restrict-member|set-group-photo|set-group-title|set-group-description|" +
  "pin-message|unpin-message|create-invite-link|delete-message|search-user";

/** Lifecycle / профиль бота проекта */
const BOT_LIFECYCLE_ACTIONS =
  "start|stop|restart|restart-all|start-offline-all|info|name|description|short-description|data";

/**
 * Определяет подтег для пути `/api/projects/…` (OpenAPI-формат с `{param}`).
 * Порядок правил: от более специфичных к общим; `null` — оставить fallback `projects`.
 * @param openApiPath - Путь после `toOpenApiPath`
 * @returns Имя тега или `null`, если путь не из спецгрупп
 */
export function inferProjectTag(openApiPath: string): string | null {
  // Диалоги: …/users/{userId}/avatar|messages|send-message|send-node-message
  if (
    /^\/api\/projects\/[^/]+\/users\/[^/]+\/(avatar|messages|send-message|send-node-message)$/.test(
      openApiPath,
    )
  ) {
    return "project-dialogs";
  }

  // Версии
  if (/^\/api\/projects\/[^/]+\/versions(\/|$)/.test(openApiPath)) {
    return "project-versions";
  }

  // Токены проекта (`bot_tokens`)
  if (/^\/api\/projects\/[^/]+\/tokens(\/|$)/.test(openApiPath)) {
    return "project-tokens";
  }

  // Группы и модерация через bot/*
  if (/^\/api\/projects\/[^/]+\/groups(\/|$)/.test(openApiPath)) {
    return "project-groups";
  }
  if (new RegExp(`^/api/projects/[^/]+/bot/(?:${BOT_GROUP_ACTIONS})(/|$)`).test(openApiPath)) {
    return "project-groups";
  }

  // Lifecycle / профиль бота
  if (new RegExp(`^/api/projects/[^/]+/bot/(?:${BOT_LIFECYCLE_ACTIONS})$`).test(openApiPath)) {
    return "project-bot";
  }

  // Users (диалоги уже отсечены выше)
  if (/^\/api\/projects\/[^/]+\/users(\/|$)/.test(openApiPath)) {
    return "project-users";
  }

  // Сообщения уровня проекта (+ responses)
  if (
    /^\/api\/projects\/[^/]+\/messages(\/|$)/.test(openApiPath) ||
    /^\/api\/projects\/[^/]+\/responses(\/|$)/.test(openApiPath)
  ) {
    return "project-messages";
  }

  // Рассылки
  if (/^\/api\/projects\/[^/]+\/broadcasts(\/|$)/.test(openApiPath)) {
    return "project-broadcasts";
  }

  // Таблицы
  if (/^\/api\/projects\/[^/]+\/tables(\/|$)/.test(openApiPath)) {
    return "project-tables";
  }

  // Файлы / квота / telegram-file
  if (
    /^\/api\/projects\/[^/]+\/files(\/|$)/.test(openApiPath) ||
    /^\/api\/projects\/[^/]+\/storage-quota$/.test(openApiPath) ||
    /^\/api\/projects\/[^/]+\/telegram-file$/.test(openApiPath)
  ) {
    return "project-files";
  }

  return null;
}
