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
    "В ответах token маскируется (`botId:••••••••`); PUT токена и env-batch " +
    "игнорируют маску и не затирают секрет в БД. " +
    "Не путать с `/api/tokens` (runtime status) и agent PAT.",
  "project-bot":
    "Lifecycle и профиль бота проекта: start/stop/restart, restart-all, start-offline-all, " +
    "statuses (список live-статусов), info (getMe), data. Auth: requireProjectAccess. " +
    "Профиль name/description — `project-tokens` …/bot-info. Группы — `project-groups`.",
  "project-users":
    "Пользователи бота проекта: список, аналитика, поиск, CRUD по userId. " +
    "Не включает диалоги (avatar/messages/send-*) — см. `project-dialogs`.",
  "project-messages":
    "Сообщения на уровне проекта: all/activity, DELETE/PATCH по messageId. " +
    "Не путать с `…/users/{userId}/messages` (диалоги).",
  "project-groups":
    "Telegram-группы проекта: список, sync названия/аватарки, история и отправка " +
    "в групповой диалог. Auth: requireProjectAccess. Lifecycle бота — `project-bot`.",
  "project-broadcasts":
    "Рассылки проекта: список, создание, детали, редактирование текста, stop, delete, " +
    "preview аудитории, а также «большая рассылка по нескольким ботам» " +
    "(`/broadcast-campaigns`: список, детали, stop, edit, delete). " +
    "Auth: requireProjectAccess. UI: панель Broadcast и лента «Диалоги». " +
    "Не путать с canvas-нодой broadcast.",
  "project-tables":
    "Пользовательские таблицы проекта (`bot_tables`): список, CRUD таблиц/колонок/строк. " +
    "Auth: requireProjectAccess. UI: панель Database.",
  "project-files":
    "Файлы проекта (список/удаление), квота локального хранилища и прокси telegram-file. " +
    "Auth: requireProjectAccess. Не путать с `/api/media` и реестром `storage-configs`.",
};

/** Действия bot API, относящиеся к группам (не lifecycle) */
const BOT_GROUP_ACTIONS = "send-group-message";

/** Lifecycle / профиль бота проекта */
const BOT_LIFECYCLE_ACTIONS =
  "start|stop|restart|restart-all|start-offline-all|info|data|statuses";

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

  // Сообщения уровня проекта
  if (/^\/api\/projects\/[^/]+\/messages(\/|$)/.test(openApiPath)) {
    return "project-messages";
  }

  // Рассылки: одиночные и кампании «большой рассылки»
  if (
    /^\/api\/projects\/[^/]+\/broadcasts(\/|$)/.test(openApiPath) ||
    /^\/api\/projects\/[^/]+\/broadcast-campaigns(\/|$)/.test(openApiPath)
  ) {
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
