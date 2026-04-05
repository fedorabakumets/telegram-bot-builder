/**
 * @fileoverview Локальные типы для модуля сценариев
 * @module client/components/editor/scenariy/types/scenariy-tipy
 */

import type { BotTemplate } from '@shared/schema';

/**
 * Варианты сортировки сценариев
 * - popular: по количеству использований
 * - rating: по рейтингу
 * - recent: по дате создания
 * - name: по алфавиту
 */
export type SortBy = 'popular' | 'rating' | 'recent' | 'name';

/**
 * Значения вкладок страницы сценариев
 * - all: все сценарии
 * - featured: рекомендуемые
 * - popular: популярные
 * - my: мои сценарии
 */
export type TabValue = 'all' | 'featured' | 'popular' | 'my';

/**
 * Пропсы компонента сетки сценариев
 */
export interface TemplateGridProps {
  /** Массив сценариев для отображения */
  templates: BotTemplate[];
  /** Флаг загрузки данных */
  isLoading: boolean;
  /** Обработчик использования сценария */
  onUse: (template: BotTemplate) => void;
  /** Показывать ли кнопку удаления */
  showDelete: boolean;
  /** Обработчик удаления сценария */
  onDelete: (template: BotTemplate) => void;
}

/**
 * Пропсы компонента одной карточки сценария
 */
export interface TemplateCardProps {
  /** Данные сценария */
  template: BotTemplate;
  /** Обработчик использования */
  onUse: (template: BotTemplate) => void;
  /** Показывать ли кнопку удаления */
  showDelete: boolean;
  /** Обработчик удаления */
  onDelete: (template: BotTemplate) => void;
}

/**
 * Пропсы компонента фильтров
 */
export interface TemplateFiltersProps {
  /** Текущий поисковый запрос */
  searchTerm: string;
  /** Обработчик изменения поиска */
  onSearchChange: (value: string) => void;
  /** Выбранная категория */
  selectedCategory: string;
  /** Обработчик изменения категории */
  onCategoryChange: (value: string) => void;
  /** Текущая сортировка */
  sortBy: SortBy;
  /** Обработчик изменения сортировки */
  onSortChange: (value: SortBy) => void;
}

/**
 * Пропсы компонента вкладок
 */
export interface TemplateTabsProps {
  /** Текущая активная вкладка */
  currentTab: TabValue;
  /** Обработчик смены вкладки */
  onTabChange: (value: TabValue) => void;
}

/**
 * Пропсы диалога подтверждения удаления
 */
export interface TemplateDeleteDialogProps {
  /** Сценарий для удаления (null — диалог закрыт) */
  template: BotTemplate | null;
  /** Обработчик подтверждения удаления */
  onConfirm: () => void;
  /** Обработчик отмены */
  onCancel: () => void;
}
