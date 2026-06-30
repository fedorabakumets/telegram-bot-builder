/**
 * @fileoverview Вычисление расширения файла для столбца «Расширение».
 * Берёт расширение из имени файла, а при его отсутствии — подбирает
 * запасной вариант по типу медиа.
 * @module botIntegration/handlers/botData/project-files-extension
 */

import type { MediaType } from "./project-files-types";

/** Запасное расширение по типу медиа (когда нет точки в имени файла) */
const EXT_BY_TYPE: Record<MediaType, string | null> = {
  photo: "jpg",
  video: "mp4",
  animation: "mp4",
  audio: "mp3",
  voice: "ogg",
  video_note: "mp4",
  document: null,
  sticker: "webp",
};

/**
 * Вычисляет расширение файла: сначала из имени (после последней точки),
 * затем — запасной вариант по типу медиа.
 * @param fileName - Имя файла (может быть null)
 * @param mediaType - Тип файла из media_files.fileType
 * @returns Расширение в нижнем регистре без точки или null
 */
export function deriveExtension(fileName: string | null | undefined, mediaType: string | null | undefined): string | null {
  if (fileName) {
    const dot = fileName.lastIndexOf(".");
    if (dot > 0 && dot < fileName.length - 1) {
      return fileName.slice(dot + 1).toLowerCase();
    }
  }
  if (mediaType && mediaType in EXT_BY_TYPE) {
    return EXT_BY_TYPE[mediaType as MediaType];
  }
  return null;
}
