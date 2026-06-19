/**
 * @fileoverview Хук фильтрации компонентов и пресетов по поисковому запросу
 * @module components/editor/sidebar/components/use-components-filter
 */

import { useMemo } from 'react';
import { ComponentDefinition } from '@shared/schema';
import type { CommandPreset } from '../massive/commands';

/** Результат фильтрации компонентов */
export interface FilteredResults {
  /** Отфильтрованные компоненты (плоский список) */
  components: ComponentDefinition[];
  /** Отфильтрованные пресеты команд */
  presets: CommandPreset[];
  /** Есть ли хоть одно совпадение */
  hasResults: boolean;
}

/**
 * Проверяет, содержит ли текст поисковый запрос (case-insensitive)
 * @param text - Текст для проверки
 * @param query - Поисковый запрос
 * @returns true если текст содержит запрос
 */
function matchesQuery(text: string | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query);
}

/**
 * Хук для фильтрации компонентов и пресетов команд по поисковому запросу
 * @param categories - Массив категорий компонентов
 * @param commandPresets - Пресеты команд
 * @param query - Строка поиска
 * @returns Отфильтрованные результаты или null если запрос пуст
 */
export function useComponentsFilter(
  categories: Array<{ title: string; components: ComponentDefinition[] }>,
  commandPresets: CommandPreset[] | undefined,
  query: string
): FilteredResults | null {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return null;

    const components = categories.flatMap((cat) =>
      cat.components.filter(
        (c) => matchesQuery(c.name, trimmed) || matchesQuery(c.description, trimmed)
      )
    );

    const presets = (commandPresets ?? []).filter(
      (p) => matchesQuery(p.name, trimmed) || matchesQuery(p.description, trimmed)
    );

    return { components, presets, hasResults: components.length > 0 || presets.length > 0 };
  }, [categories, commandPresets, query]);
}
