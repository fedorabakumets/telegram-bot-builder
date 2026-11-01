/** @fileoverview Получение фотографий блока из attachedMedia и одиночного imageUrl. */
import type { ProjectFile } from '../hooks/use-project-files';

/**
 * Преобразует ссылки блока в записи для общего предпросмотра, исключая другие типы и переменные.
 * @param data - Содержимое выбранного блока
 * @param tokenId - Предпочитаемый токен для Telegram file_id
 * @returns Фотографии без повторяющихся ссылок
 */
export function getNodePhotoFiles(data: Record<string, unknown>, tokenId?: number | null): ProjectFile[] {
  const refs = [...(Array.isArray(data.attachedMedia) ? data.attachedMedia : []), data.imageUrl];
  const seen = new Set<string>();
  const photos: ProjectFile[] = [];
  for (const ref of refs) {
    if (typeof ref !== 'string' || !ref.trim()) continue;
    const value = ref.trim();
    let fileId: string | null = null;
    let selectedToken: number | null = null;
    let url: string | null = value;
    if (value.startsWith('{')) {
      try {
        const metadata = JSON.parse(value);
        if (metadata.__type !== 'file_id' || metadata.mediaType !== 'photo') continue;
        const entries = Object.entries(metadata.fileIdsByToken ?? {}).filter(([key, id]) => Number(key) > 0 && typeof id === 'string' && id.length);
        const entry = entries.find(([key]) => Number(key) === tokenId) ?? entries[0];
        if (!entry) continue;
        selectedToken = Number(entry[0]); fileId = entry[1] as string; url = null;
      } catch { continue; }
    } else {
      if (!/^(\/|https?:\/\/)/i.test(value)) continue;
      if (value !== data.imageUrl && !/\.(jpe?g|png|webp|gif|avif|bmp)(?:[?#]|$)/i.test(value)) continue;
    }
    const key = fileId ? `${selectedToken}:${fileId}` : value;
    if (seen.has(key)) continue;
    seen.add(key);
    photos.push({ id: photos.length, source: url ? 'uploaded' : 'outgoing', mediaType: 'photo',
      fileId, tokenId: selectedToken, url, fileName: `Фото ${photos.length + 1}`, fileSize: null, duration: null, createdAt: null });
  }
  return photos;
}
