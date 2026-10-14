/**
 * @fileoverview Разовая зачистка устаревшего запрета медиа в данных ограничения
 * @module templates/chat-permissions/resolve-mute-media
 */

/** Отдельные права, куда копируется устаревший общий запрет медиа */
const MUTE_MEDIA_SPLIT_FIELDS = [
  'canSendAudios',
  'canSendDocuments',
  'canSendPhotos',
  'canSendVideos',
  'canSendVideoNotes',
  'canSendVoiceNotes',
  'canReactToMessages',
] as const;

/** Имя устаревшего ключа, которого больше нет в схеме */
const LEGACY_MEDIA_KEY = 'canSendMediaMessages';

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
 * Копирует устаревший запрет медиа в ещё не заданные отдельные права и удаляет ключ.
 * Уже заданные boolean не перезаписывает. Если ключа нет, возвращает объект как есть.
 * @param params - Данные блока или параметры шаблона
 * @returns Данные без устаревшего ключа
 */
export function stripLegacyMediaPermission<T extends object>(params: T): T {
  const source = params as T & Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(source, LEGACY_MEDIA_KEY)) {
    return params;
  }
  const next: Record<string, unknown> = { ...source };
  const media = next[LEGACY_MEDIA_KEY];
  if (typeof media === 'boolean') {
    for (const field of MUTE_MEDIA_SPLIT_FIELDS) {
      if (typeof next[field] !== 'boolean') {
        next[field] = media;
      }
    }
  }
  delete next[LEGACY_MEDIA_KEY];
  return next as T;
}
