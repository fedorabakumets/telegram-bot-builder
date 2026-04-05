/**
 * @fileoverview Хук useMemo для фильтрации и сортировки сценариев
 * @module client/components/editor/scenariy/hooks/use-scenariy-filtry
 */

import { useMemo } from 'react';
import type { BotTemplate } from '@shared/schema';
import type { SortBy, TabValue } from '../types/scenariy-tipy';

/**
 * Параметры хука фильтрации сценариев
 */
interface FiltryParams {
  /** Все сценарии */
  templates: BotTemplate[];
  /** Рекомендуемые сценарии */
  featuredTemplates: BotTemplate[];
  /** Мои сценарии */
  myTemplates: BotTemplate[];
  /** Активная вкладка */
  currentTab: TabValue;
  /** Поисковый запрос */
  searchTerm: string;
  /** Выбранная категория */
  selectedCategory: string;
  /** Способ сортировки */
  sortBy: SortBy;
}

/**
 * Хук для фильтрации и сортировки сценариев на основе текущих параметров
 * @param params - параметры фильтрации
 * @returns отфильтрованный и отсортированный массив сценариев
 */
export function useScenariyFiltry(params: FiltryParams): BotTemplate[] {
  const { templates, featuredTemplates, myTemplates, currentTab, searchTerm, selectedCategory, sortBy } = params;

  return useMemo(() => {
    let result: BotTemplate[] =
      currentTab === 'featured' ? featuredTemplates
      : currentTab === 'popular' ? templates.filter(t => (t.useCount ?? 0) > 5)
      : currentTab === 'my' ? myTemplates
      : templates;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        t.authorName?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'official') {
        result = result.filter(t => t.ownerId === null);
      } else if (selectedCategory === 'userTemplates') {
        result = result.filter(t => t.ownerId !== null);
      } else {
        result = result.filter(t => t.category === selectedCategory);
      }
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'popular': return (b.useCount ?? 0) - (a.useCount ?? 0);
        case 'rating':  return (b.rating ?? 0) - (a.rating ?? 0);
        case 'recent':  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case 'name':    return a.name.localeCompare(b.name, 'ru');
        default:        return 0;
      }
    });
  }, [templates, featuredTemplates, myTemplates, currentTab, searchTerm, selectedCategory, sortBy]);
}
