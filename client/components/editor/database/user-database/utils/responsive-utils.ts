/**
 * @fileoverview Утилиты адаптивного отображения
 * @description Функции для определения видимости элементов в зависимости от размеров панели
 */

/**
 * Типы брейкпоинтов для адаптивности
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Опции адаптивности
 */
export interface ResponsiveOptions {
  /** Минимальная ширина для отображения элемента */
  minWidth?: number;
  /** Максимальная ширина для скрытия элемента */
  maxWidth?: number;
}

/**
 * Определяет текущий брейкпоинт по ширине
 * @param width - Ширина панели в пикселях
 * @returns Текущий брейкпоинт
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  return 'xl';
}

/**
 * Проверяет видимость элемента по ширине
 * @param width - Текущая ширина панели
 * @param options - Опции видимости
 * @returns true если элемент должен быть видим
 */
export function isVisibleByWidth(
  width: number,
  options: ResponsiveOptions
): boolean {
  const { minWidth = 0, maxWidth = Infinity } = options;
  return width >= minWidth && width <= maxWidth;
}

/**
 * Определяет количество видимых колонок таблицы
 * @param width - Ширина панели
 * @returns Количество колонок для отображения
 */
export function getVisibleColumns(width: number): number {
  const breakpoint = getBreakpoint(width);
  
  switch (breakpoint) {
    case 'xs':
      return 2; // Только имя и статус
    case 'sm':
      return 3; // Имя, статус, сообщения
    case 'md':
      return 4; // + дата
    default:
      return 5; // Все колонки
  }
}

/**
 * Определяет режим отображения статистики
 * @param width - Ширина панели
 * @returns Количество карточек в ряду
 */
export function getStatsGridColumns(width: number): number {
  const breakpoint = getBreakpoint(width);
  
  switch (breakpoint) {
    case 'xs':
      return 1;
    case 'sm':
      return 2;
    default:
      return 4;
  }
}
