/**
 * @fileoverview Достаёт файлы и http-ссылки из DataTransfer (drag-and-drop).
 * @module components/editor/properties/media/files-from-data-transfer
 */

/**
 * Убирает повторы: браузер кладёт один файл и в FileList, и в items
 * с разным lastModified — из-за этого картинка с другой вкладки прикреплялась дважды.
 * @param files - Сырой список
 * @returns Уникальные по имени и размеру
 */
function uniqueFiles(files: File[]): File[] {
  const byKey = new Map<string, File>();
  for (const file of files) {
    if (file.size <= 0) continue;
    byKey.set(`${file.name}:${file.size}`, file);
  }
  return Array.from(byKey.values());
}

/**
 * Собирает File из перетаскивания (проводник, другое окно, скриншот).
 * FileList важнее items: это один и тот же файл, а не два.
 * @param data - DataTransfer события drop
 * @returns Массив файлов (может быть пустым)
 */
export function filesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  const listed = uniqueFiles(Array.from(data.files ?? []));
  if (listed.length > 0) return listed;
  const fromItems: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== 'file' && !item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return uniqueFiles(fromItems);
}

/**
 * Достаёт http(s) URL из перетаскивания (картинка из браузера).
 * @param data - DataTransfer события drop
 * @returns Список ссылок без повторов
 */
export function httpUrlsFromDataTransfer(data: DataTransfer | null): string[] {
  if (!data) return [];
  const uriList = data.getData('text/uri-list');
  const fromList = uriList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && /^https?:\/\//i.test(line));
  const unique = [...new Set(fromList)];
  if (unique.length > 0) return unique;
  const plain = data.getData('text/plain').trim();
  return /^https?:\/\//i.test(plain) ? [plain] : [];
}
