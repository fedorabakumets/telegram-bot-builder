/**
 * @fileoverview Вспомогательные функции таблицы файлов панели хранилища:
 * форматирование размера/даты, вычисление расширения, построение URL превью и
 * скачивания, определение наличия превью. Вынесены из каркаса таблицы, чтобы
 * файлы оставались ≤150 строк (Req 7.1, 7.3, 7.8). Используются ячейками
 * (задача 7.3) и строкой (задача 7.2).
 * @module components/editor/files/panel/table/files-table-utils
 */

import { Image, Film, Music, FileText, Sticker } from 'lucide-react';
import type { ProjectFile } from '../../hooks/use-project-files';
import { getFileSizeTextClass } from '../panel-styles';

/** Иконка-компонент по типу медиа (для не-изображений) */
export const MEDIA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  photo: Image, video: Film, animation: Film, audio: Music, voice: Music,
  video_note: Film, document: FileText, sticker: Sticker,
};

/** Русские названия типов медиа для бейджа типа */
export const MEDIA_TYPE_LABELS: Record<string, string> = {
  photo: 'Фото', video: 'Видео', animation: 'GIF', audio: 'Аудио',
  voice: 'Голосовое', video_note: 'Кружок', document: 'Документ', sticker: 'Стикер',
};

/** Расширения по умолчанию для типов медиа (когда нет file_name) */
const DEFAULT_EXTENSIONS: Record<string, string> = {
  photo: 'jpg', video: 'mp4', animation: 'gif', audio: 'mp3',
  voice: 'ogg', video_note: 'mp4', sticker: 'webp',
};

/** Типы медиа, для которых по умолчанию доступно превью */
const PREVIEW_TYPES = new Set(['photo', 'video', 'sticker', 'animation']);
/** Расширения изображений (для документов, сохранённых как файл) */
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
/** Расширения видео */
const VIDEO_EXTENSIONS = new Set(['mp4', 'avi', 'mov', 'webm', 'mkv']);

/**
 * Возвращает цветовой класс размера файла на токенах темы (success/warning/
 * destructive). Реальная классификация уровня и сопоставление с классами
 * вынесены в общий helper `panel-styles` (задача 12.1 — единый источник
 * стилей панели). Сигнатура сохранена для обратной совместимости.
 * @param size - Размер в байтах или null
 * @returns Tailwind-класс цвета текста
 */
export function getSizeColor(size: number | null): string {
  return getFileSizeTextClass(size);
}

/**
 * Форматирует размер файла в человекочитаемый вид.
 * @param bytes - Размер в байтах или null
 * @returns Строка размера, например «37.5 KB», либо «—»
 */
export function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Извлекает расширение из имени файла или определяет по типу медиа.
 * @param fileName - Имя файла или null
 * @param mediaType - Тип медиа (fallback)
 * @returns Расширение в нижнем регистре, либо «—»
 */
export function getExtension(fileName: string | null, mediaType?: string | null): string {
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ext !== fileName.toLowerCase()) return ext;
  }
  if (mediaType && DEFAULT_EXTENSIONS[mediaType]) return DEFAULT_EXTENSIONS[mediaType];
  return '—';
}

/**
 * Форматирует дату загрузки в краткий вид «ЧЧ:ММ ДД.ММ.ГГ».
 * @param dateStr - ISO-строка даты или null
 * @returns Отформатированная дата либо «—»
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

/**
 * Строит URL превью для файла (локальный URL или прокси Telegram).
 * @param file - Файл проекта
 * @param projectId - ID проекта для проксирования
 * @returns URL превью или null
 */
export function getPreviewUrl(file: ProjectFile, projectId: number): string | null {
  if (file.url && !file.url.startsWith('{')) return file.url;
  if (file.fileId && file.tokenId) {
    return `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(file.fileId)}&tokenId=${file.tokenId}`;
  }
  if (file.fileId) {
    return `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(file.fileId)}`;
  }
  return null;
}

/**
 * Строит URL скачивания файла (с именем в query для прокси-ссылок).
 * @param file - Файл проекта
 * @param projectId - ID проекта
 * @returns URL скачивания или null (для file_id-only обрабатывается в задаче 9.5)
 */
export function getDownloadUrl(file: ProjectFile, projectId: number): string | null {
  const base = getPreviewUrl(file, projectId);
  if (!base) return null;
  if (base.startsWith('/api/') && file.fileName) {
    return `${base}&fileName=${encodeURIComponent(file.fileName)}`;
  }
  return base;
}

/**
 * Определяет, нужно ли показывать превью для файла.
 * @param file - Файл проекта
 * @returns true, если файл является изображением/видео
 */
export function shouldShowPreview(file: ProjectFile): boolean {
  if (PREVIEW_TYPES.has(file.mediaType ?? '')) return true;
  const ext = file.fileName?.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
}
