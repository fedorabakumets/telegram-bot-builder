/**
 * @fileoverview Подстановка устаревшего запрета медиа в новые поля ограничения
 * @module templates/chat-permissions/resolve-mute-media
 */

/** Новые права ChatPermissions: виды медиа и реакции */
const MUTE_MEDIA_SPLIT_FIELDS = [
  'canSendAudios',
  'canSendDocuments',
  'canSendPhotos',
  'canSendVideos',
  'canSendVideoNotes',
  'canSendVoiceNotes',
  'canReactToMessages',
] as const;

/**
 * Убирает незаданные поля, чтобы шаблон не считал их явным false.
 * @param value - Объект параметров
 * @returns Копия без ключей со значением undefined
 */
export function omitUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

/**
 * Если новое право ограничения не задано, берёт значение canSendMediaMessages.
 * Явно заданные поля не перезаписывает.
 * @param params - Параметры узла или синонима
 * @returns Копия с заполненными новыми правами
 */
export function resolveMuteMediaPermissions<T extends { canSendMediaMessages?: boolean }>(params: T): T {
  const source = params as T & Record<string, unknown>;
  const media = source.canSendMediaMessages === true;
  const next: Record<string, unknown> = { ...source };
  for (const field of MUTE_MEDIA_SPLIT_FIELDS) {
    if (typeof next[field] !== 'boolean') {
      next[field] = media;
    }
  }
  return next as T;
}
