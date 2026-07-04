/**
 * @fileoverview Построение человекочитаемых чипов активных фильтров файлов
 * (Req 6.8). Преобразует объект FileFilters в список дескрипторов чипов
 * (подпись + ключи для снятия) и считает количество активных фильтров для
 * бейджа на кнопке фильтров (Req 6.1). Вынесено из компонента ActiveFilterChips
 * для переиспользования и соблюдения лимита строк.
 * @module components/editor/files/panel/active-filter-chips-labels
 */

import type { FileFilters } from '../hooks/project-files-query-params';
import type { CollaboratorInfo } from '../hooks/use-project-collaborators';

/** Ключ поля фильтра (для точечного снятия) */
export type FilterKey = keyof FileFilters;

/** Краткая инфа о хранилище для подписи чипа «Хранилище» */
export interface StorageOption {
  /** storage_configs.id */
  id: string;
  /** Человекочитаемое имя */
  name: string;
}

/** Дескриптор одного чипа активного фильтра */
export interface ActiveChip {
  /** Уникальный идентификатор чипа (React key / data-testid) */
  id: string;
  /** Подпись чипа */
  label: string;
  /** Ключи фильтра, очищаемые при снятии чипа */
  keys: FilterKey[];
}

/** Подписи типов медиа Telegram + обложка (Req 6.4) */
const MEDIA_TYPE_LABELS: Record<string, string> = {
  photo: 'Фото',
  video: 'Видео',
  animation: 'GIF',
  audio: 'Аудио',
  voice: 'Голосовое',
  video_note: 'Видеосообщение',
  document: 'Документ',
  sticker: 'Стикер',
  cover: 'Обложка',
};

/**
 * Форматирует ISO-дату в локальный вид (ru-RU); при невалидной дате — исходная строка.
 * @param iso - ISO-строка даты
 * @returns Человекочитаемая дата
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('ru-RU');
}

/**
 * Строит подпись чипа диапазона дат по наличию границ.
 * @param from - Начало диапазона (ISO)
 * @param to - Конец диапазона (ISO)
 * @returns Подпись чипа даты
 */
function dateLabel(from?: string, to?: string): string {
  if (from && to) return `Дата: ${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `Дата: с ${formatDate(from)}`;
  return `Дата: по ${formatDate(to as string)}`;
}

/**
 * Строит подпись чипа размера (Мин–Макс + единица).
 * @param min - Минимальный размер
 * @param max - Максимальный размер
 * @param unit - Единица измерения (KB/MB)
 * @returns Подпись чипа размера
 */
function sizeLabel(min: number | undefined, max: number | undefined, unit: string): string {
  return `Размер: ${min ?? 0}–${max ?? '∞'} ${unit}`;
}

/**
 * Преобразует фильтры в список дескрипторов активных чипов.
 * @param filters - Текущие фильтры
 * @param collaborators - Коллабораторы для подписи «Сотрудник»
 * @param storages - Список хранилищ для подписи «Хранилище» (опционально)
 * @returns Массив дескрипторов чипов в детерминированном порядке
 */
export function buildActiveChips(
  filters: FileFilters,
  collaborators: CollaboratorInfo[] = [],
  storages: StorageOption[] = [],
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  const f = filters;

  if (f.fileName?.trim()) {
    chips.push({ id: 'fileName', label: `Имя: «${f.fileName.trim()}»`, keys: ['fileName'] });
  }
  if (f.dateFrom || f.dateTo) {
    chips.push({ id: 'date', label: dateLabel(f.dateFrom, f.dateTo), keys: ['dateFrom', 'dateTo'] });
  }
  if (f.mediaType && f.mediaType !== 'all') {
    chips.push({
      id: 'mediaType',
      label: `Тип: ${MEDIA_TYPE_LABELS[f.mediaType] ?? f.mediaType}`,
      keys: ['mediaType'],
    });
  }
  if (f.uploadedBy !== undefined) {
    const name = collaborators.find((c) => c.userId === f.uploadedBy)?.name ?? `#${f.uploadedBy}`;
    chips.push({ id: 'uploadedBy', label: `Сотрудник: ${name}`, keys: ['uploadedBy'] });
  }
  if (f.sizeMin !== undefined || f.sizeMax !== undefined) {
    chips.push({
      id: 'size',
      label: sizeLabel(f.sizeMin, f.sizeMax, f.sizeUnit ?? 'KB'),
      keys: ['sizeMin', 'sizeMax', 'sizeUnit'],
    });
  }
  if (f.storageConfigId && f.storageConfigId !== 'all') {
    const name = storages.find((s) => s.id === f.storageConfigId)?.name ?? f.storageConfigId;
    chips.push({ id: 'storageConfigId', label: `Хранилище: ${name}`, keys: ['storageConfigId'] });
  }

  return chips;
}

/**
 * Считает количество активных фильтров (для бейджа на кнопке фильтров).
 * @param filters - Текущие фильтры
 * @returns Число активных фильтров
 */
export function countActiveFilters(filters: FileFilters): number {
  return buildActiveChips(filters).length;
}
