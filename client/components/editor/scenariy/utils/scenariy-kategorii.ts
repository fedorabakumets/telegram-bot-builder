/**
 * @fileoverview Массив категорий сценариев и вспомогательная функция получения метки
 * @module client/components/editor/scenariy/utils/scenariy-kategorii
 */

/**
 * Элемент списка категорий
 */
export interface KategoriyaElement {
  /** Внутреннее значение категории */
  value: string;
  /** Отображаемое название на русском */
  label: string;
}

/**
 * Полный список категорий сценариев для фильтрации
 */
export const KATEGORII: KategoriyaElement[] = [
  { value: 'all', label: 'Все категории' },
  { value: 'official', label: 'Официальные' },
  { value: 'userTemplates', label: 'Пользовательские' },
  { value: 'community', label: 'Сообщество' },
  { value: 'business', label: 'Бизнес' },
  { value: 'entertainment', label: 'Развлечения' },
  { value: 'education', label: 'Образование' },
  { value: 'utility', label: 'Утилиты' },
  { value: 'games', label: 'Игры' },
];

/** Словарь для быстрого поиска метки по значению категории */
const KATEGORIYA_MAP: Record<string, string> = {
  business: 'Бизнес',
  community: 'Сообщество',
  custom: 'Пользовательский',
  entertainment: 'Развлечения',
  education: 'Образование',
  utility: 'Утилиты',
  games: 'Игры',
  official: 'Официальный',
};

/**
 * Возвращает русское название категории по её внутреннему значению
 * @param category - внутреннее значение категории
 * @returns русское название или оригинальное значение, если не найдено
 */
export function getCategoryLabel(category: string): string {
  return KATEGORIYA_MAP[category] ?? category;
}
