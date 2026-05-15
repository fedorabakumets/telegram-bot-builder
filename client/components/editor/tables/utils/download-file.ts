/**
 * @fileoverview Утилита скачивания файла через создание Blob и временной ссылки
 * @module editor/tables/utils/download-file
 */

/**
 * Скачивает файл с указанным содержимым, именем и MIME-типом
 * @param content - Содержимое файла
 * @param filename - Имя файла для скачивания
 * @param mimeType - MIME-тип файла (например "text/csv")
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
