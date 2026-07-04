/**
 * @fileoverview Помощники прикрепления выбранных файлов к ноде (`attachedMedia`).
 * Превращают записи `ProjectFile` в ссылки единого формата: реальный URL для
 * файлов с локальным объектом и JSON-запись file_id
 * (`{"__type":"file_id","mediaType":...,"fileIdsByToken":{...}}`) для файлов,
 * представленных только как file_id (Req 8.4). Содержат дедупликацию набора и
 * слияние с текущим значением ноды (идемпотентность прикрепления — Req 3.4, 3.8),
 * с поддержкой одиночного/множественного режимов. Логика вынесена сюда отдельным
 * переиспользуемым файлом (используется панелью, контейнерами и кнопкой ноды).
 * @module components/editor/files/panel/attach-node-refs
 */

import type { ProjectFile } from '../hooks/use-project-files';

/** Префикс JSON-записи file_id в attachedMedia */
const FILE_ID_JSON_PREFIX = '{"__type":"file_id"';

/**
 * Строит карту `tokenId → file_id` для файла, представленного только как file_id.
 * Источники по приоритету: уже готовая карта `fileIdsByToken`, затем одиночный
 * `fileId` с привязкой к токену файла или выбранному токену.
 * @param file - Запись файла проекта
 * @param selectedTokenId - Выбранный токен бота (fallback-ключ для одиночного fileId)
 * @returns Карта со строковыми ключами токенов (может быть пустой)
 */
function buildTokenMap(file: ProjectFile, selectedTokenId?: number | null): Record<string, string> {
  const byToken = file.fileIdsByToken ?? {};
  const keys = Object.keys(byToken);
  if (keys.length > 0) {
    const normalized: Record<string, string> = {};
    for (const key of keys) {
      const value = byToken[Number(key)];
      if (value) normalized[String(key)] = value;
    }
    return normalized;
  }
  if (file.fileId) {
    const tokenKey = file.tokenId ?? selectedTokenId;
    if (tokenKey != null) return { [String(tokenKey)]: file.fileId };
  }
  return {};
}

/**
 * Преобразует файл в одну ссылку для записи в `attachedMedia`.
 * Для файлов с локальным объектом возвращает их `url` (в т.ч. уже готовую
 * JSON-запись file_id). Для file_id-only файлов собирает JSON-запись file_id.
 * @param file - Запись файла проекта
 * @param selectedTokenId - Выбранный токен бота (для приоритизации file_id)
 * @returns Ссылка для attachedMedia либо null, если ссылку построить нельзя
 */
export function toNodeRef(file: ProjectFile, selectedTokenId?: number | null): string | null {
  const url = file.url?.trim();
  if (url) return url;

  const fileIdsByToken = buildTokenMap(file, selectedTokenId);
  if (Object.keys(fileIdsByToken).length === 0) return null;

  return JSON.stringify({
    __type: 'file_id',
    mediaType: file.mediaType ?? 'photo',
    fileIdsByToken,
  });
}

/**
 * Собирает дедуплицированный список ссылок из выбранных файлов.
 * Отбрасывает файлы, для которых ссылку построить нельзя, и убирает дубли
 * внутри самого набора (Req 3.8).
 * @param files - Выбранные файлы проекта
 * @param selectedTokenId - Выбранный токен бота (для приоритизации file_id)
 * @returns Массив уникальных ссылок для attachedMedia
 */
export function buildSelectedRefs(files: ProjectFile[], selectedTokenId?: number | null): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const ref = toNodeRef(file, selectedTokenId);
    if (!ref || seen.has(ref)) continue;
    seen.add(ref);
    refs.push(ref);
  }
  return refs;
}

/**
 * Сливает новые ссылки с текущим значением `attachedMedia` ноды.
 * В множественном режиме дозаписывает только отсутствующие ссылки
 * (идемпотентность — Req 3.8); в одиночном режиме заменяет значение последней
 * выбранной ссылкой (или сохраняет текущее, если выбора нет).
 * @param current - Текущее значение attachedMedia ноды
 * @param refs - Новые ссылки выбранных файлов
 * @param multi - Множественный режим прикрепления
 * @returns Новый массив attachedMedia
 */
export function mergeAttachedMedia(current: string[], refs: string[], multi: boolean): string[] {
  if (!multi) {
    return refs.length > 0 ? [refs[refs.length - 1]] : [...current];
  }
  const merged = [...current];
  for (const ref of refs) {
    if (!merged.includes(ref)) merged.push(ref);
  }
  return merged;
}

/**
 * Проверяет, является ли строка JSON-записью file_id формата attachedMedia.
 * @param ref - Ссылка из attachedMedia
 * @returns true, если это запись `{"__type":"file_id",...}`
 */
export function isFileIdRef(ref: string | null | undefined): boolean {
  return !!ref && ref.startsWith(FILE_ID_JSON_PREFIX);
}
