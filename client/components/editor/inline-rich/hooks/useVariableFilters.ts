/**
 * @fileoverview Хук управления фильтрами переменных редактора
 * @module hooks/useVariableFilters
 */

import { useState, useEffect, useCallback } from 'react';
import type { Node } from '@shared/schema';
import { extractVariables, type VariableInfo } from '../utils/extract-variables';

/**
 * Параметры хука useVariableFilters
 */
export interface UseVariableFiltersOptions {
  /** Текущий текст редактора */
  value: string;
  /** Все узлы проекта */
  allNodes?: Node[];
  /** Начальные фильтры переменных */
  initialFilters?: Record<string, string>;
  /** Callback при изменении фильтров */
  onFiltersChange?: (filters: Record<string, string>) => void;
}

/**
 * Результат работы хука useVariableFilters
 */
export interface UseVariableFiltersReturn {
  /** Переменные, найденные в тексте */
  variables: VariableInfo[];
  /** Текущие фильтры переменных */
  variableFilters: Record<string, string>;
  /** Применить фильтр к переменной */
  handleApplyFilter: (variableName: string, filter: string) => void;
}

/**
 * Хук управления фильтрами переменных
 * @param options - Параметры хука
 * @returns Переменные, фильтры и функция применения фильтра
 */
export function useVariableFilters({
  value,
  allNodes = [],
  initialFilters = {},
  onFiltersChange
}: UseVariableFiltersOptions): UseVariableFiltersReturn {
  const [variableFilters, setVariableFilters] = useState<Record<string, string>>(initialFilters);

  // Синхронизируем с внешним состоянием
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setVariableFilters(initialFilters);
    }
  }, [initialFilters]);

  // Уведомляем об изменении фильтров
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(variableFilters);
    }
  }, [variableFilters, onFiltersChange]);

  const variables = extractVariables(value || '', allNodes);

  /**
   * Применяет или удаляет фильтр для переменной
   * @param variableName - Имя переменной
   * @param filter - Строка фильтра (пустая строка — удалить фильтр)
   */
  const handleApplyFilter = useCallback((variableName: string, filter: string) => {
    setVariableFilters(prev => {
      const updated = { ...prev };
      if (filter === '') {
        delete updated[variableName];
      } else {
        updated[variableName] = filter;
      }
      return updated;
    });
  }, []);

  return { variables, variableFilters, handleApplyFilter };
}
