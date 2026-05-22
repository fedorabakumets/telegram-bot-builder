/**
 * @fileoverview Конфигурация суффиксов метаданных медиа.
 * Определяет какие метаданные доступны для каждого типа медиа.
 */

/** Описание одного суффикса метаданных */
export interface MetadataSuffix {
  /** Суффикс переменной (добавляется к имени через _) */
  suffix: string;
  /** Описание на русском */
  description: string;
  /** Иконка для отображения */
  icon: string;
}

/** Суффиксы метаданных по типу медиа */
export const MEDIA_METADATA_SUFFIXES: Record<string, MetadataSuffix[]> = {
  video: [
    { suffix: 'file_id', description: 'Telegram file_id', icon: '📎' },
    { suffix: 'file_unique_id', description: 'Уникальный ID файла', icon: '🔑' },
    { suffix: 'thumbnail', description: 'Обложка (file_id)', icon: '🖼️' },
    { suffix: 'duration', description: 'Длительность (сек)', icon: '⏱️' },
    { suffix: 'file_size', description: 'Размер файла (байт)', icon: '📦' },
    { suffix: 'file_name', description: 'Имя файла', icon: '📝' },
    { suffix: 'width', description: 'Ширина (px)', icon: '↔️' },
    { suffix: 'height', description: 'Высота (px)', icon: '↕️' },
    { suffix: 'mime_type', description: 'MIME тип', icon: '🏷️' },
  ],
  photo: [
    { suffix: 'file_id', description: 'Telegram file_id (макс. размер)', icon: '📎' },
    { suffix: 'file_unique_id', description: 'Уникальный ID файла', icon: '🔑' },
    { suffix: 'file_size', description: 'Размер файла (байт)', icon: '📦' },
    { suffix: 'width', description: 'Ширина (px)', icon: '↔️' },
    { suffix: 'height', description: 'Высота (px)', icon: '↕️' },
    { suffix: 'small_file_id', description: 'file_id миниатюры (мин. размер)', icon: '🔍' },
    { suffix: 'small_width', description: 'Ширина миниатюры (px)', icon: '↔️' },
    { suffix: 'small_height', description: 'Высота миниатюры (px)', icon: '↕️' },
    { suffix: 'sizes_count', description: 'Количество размеров', icon: '📐' },
    { suffix: 'all_sizes', description: 'JSON всех размеров [{file_id, w, h, size}]', icon: '📋' },
  ],
  audio: [
    { suffix: 'file_id', description: 'Telegram file_id', icon: '📎' },
    { suffix: 'file_unique_id', description: 'Уникальный ID файла', icon: '🔑' },
    { suffix: 'thumbnail', description: 'Обложка (file_id)', icon: '🖼️' },
    { suffix: 'duration', description: 'Длительность (сек)', icon: '⏱️' },
    { suffix: 'file_size', description: 'Размер файла (байт)', icon: '📦' },
    { suffix: 'file_name', description: 'Имя файла', icon: '📝' },
    { suffix: 'title', description: 'Название трека', icon: '🎵' },
    { suffix: 'performer', description: 'Исполнитель', icon: '🎤' },
    { suffix: 'mime_type', description: 'MIME тип', icon: '🏷️' },
  ],
  document: [
    { suffix: 'file_id', description: 'Telegram file_id', icon: '📎' },
    { suffix: 'file_unique_id', description: 'Уникальный ID файла', icon: '🔑' },
    { suffix: 'thumbnail', description: 'Обложка (file_id)', icon: '🖼️' },
    { suffix: 'file_name', description: 'Имя файла', icon: '📝' },
    { suffix: 'file_size', description: 'Размер файла (байт)', icon: '📦' },
    { suffix: 'mime_type', description: 'MIME тип', icon: '🏷️' },
  ],
};
