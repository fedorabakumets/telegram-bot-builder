/**
 * @fileoverview Валидация черновика фильтров и справочники опций для
 * `FiltersModal` (Req 6.4, 6.9). Чистый помощник `isFiltersValid` проверяет
 * корректность диапазонов даты и размера (для дизейбла кнопки «Применить»);
 * `MEDIA_TYPE_OPTIONS` — список типов медиа Telegram + обложка для селектора
 * типа. Вынесено в отдельный файл для переиспользования и лимита строк.
 * @module components/editor/files/panel/filters-modal-validation
 */

import type { FileFilters, FileFilterMediaType } from '../hooks/project-files-query-params';

/** Опция селектора типа медиа */
export interface MediaTypeOption {
  /** Значение фильтра ('all' = без фильтра) */
  value: FileFilterMediaType | 'all';
  /** Человекочитаемая подпись */
  label: string;
}

/** Типы медиа Telegram + обложка для фильтра по типу (Req 6.4) */
export const MEDIA_TYPE_OPTIONS: MediaTypeOption[] = [
  { value: 'all', label: 'Все типы' },
  { value: 'photo', label: 'Фото' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
  { value: 'voice', label: 'Голосовое' },
  { value: 'document', label: 'Документ' },
  { value: 'sticker', label: 'Стикер' },
  { value: 'animation', label: 'Анимация (GIF)' },
  { value: 'video_note', label: 'Видеосообщение' },
  { value: 'cover', label: 'Обложка' },
];

/**
 * Проверяет корректность черновика фильтров для дизейбла кнопки «Применить».
 * Невалидно, если начало диапазона дат позже конца или минимальный размер
 * больше максимального (Req 6.9).
 * @param f - Черновик фильтров
 * @returns true, если фильтры можно применять
 */
export function isFiltersValid(f: FileFilters): boolean {
  if (f.dateFrom && f.dateTo && new Date(f.dateFrom).getTime() > new Date(f.dateTo).getTime()) {
    return false;
  }
  if (
    f.sizeMin !== undefined &&
    f.sizeMax !== undefined &&
    Number.isFinite(f.sizeMin) &&
    Number.isFinite(f.sizeMax) &&
    f.sizeMin > f.sizeMax
  ) {
    return false;
  }
  return true;
}
