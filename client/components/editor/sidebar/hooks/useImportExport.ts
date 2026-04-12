/**
 * @fileoverview Hook для управления импортом/экспортом проектов
 * Предоставляет логику для импорта проектов из JSON и Python кода
 * @module components/editor/sidebar/hooks/useImportExport
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BotProject } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { parsePythonCodeToJson } from '../parsePythonCodeToJson';
import type { ImportState } from '../types';

/**
 * Результат работы hook для импорта/экспорта
 */
export interface UseImportExportResult {
  /** Состояние импорта */
  importState: ImportState;
  /** Открыть диалог импорта */
  openImportDialog: () => void;
  /** Закрыть диалог импорта */
  closeImportDialog: () => void;
  /** Изменить JSON текст */
  setImportJsonText: (text: string) => void;
  /** Изменить Python текст */
  setImportPythonText: (text: string) => void;
  /** Импортировать проект */
  importProject: () => Promise<void>;
  /** Очистить ошибку импорта */
  clearError: () => void;
}

/**
 * Начальное состояние импорта
 */
const INITIAL_IMPORT_STATE: ImportState = {
  isOpen: false,
  jsonText: '',
  pythonText: '',
  error: '',
};

/**
 * Hook для управления импортом/экспортом проектов
 * @returns Объект с состоянием и методами импорта
 */
export function useImportExport(): UseImportExportResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [importState, setImportState] = useState<ImportState>(INITIAL_IMPORT_STATE);

  // Открыть диалог импорта
  const openImportDialog = useCallback(() => {
    setImportState(prev => ({ ...prev, isOpen: true, error: '' }));
  }, []);

  // Закрыть диалог импорта
  const closeImportDialog = useCallback(() => {
    setImportState(INITIAL_IMPORT_STATE);
  }, []);

  // Изменить JSON текст
  const setImportJsonText = useCallback((text: string) => {
    setImportState(prev => ({ ...prev, jsonText: text, error: '' }));
  }, []);

  // Изменить Python текст
  const setImportPythonText = useCallback((text: string) => {
    setImportState(prev => ({ ...prev, pythonText: text, error: '' }));
  }, []);

  // Очистить ошибку
  const clearError = useCallback(() => {
    setImportState(prev => ({ ...prev, error: '' }));
  }, []);

  // Импортировать проект
  const importProject = useCallback(async () => {
    try {
      let projectData;
      let projectName = 'Импортированный проект';

      // Импорт из JSON
      if (importState.jsonText.trim()) {
        try {
          projectData = JSON.parse(importState.jsonText);
          projectName = projectData.name || 'Импортированный проект';
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Неверный формат JSON';
          setImportState(prev => ({ ...prev, error: errorMessage }));
          return;
        }
      }
      // Импорт из Python кода
      else if (importState.pythonText.trim()) {
        try {
          const parsed = parsePythonCodeToJson(importState.pythonText);
          projectData = {
            nodes: parsed.nodes,
            connections: parsed.connections,
          };
          // Пытаемся извлечь имя проекта из кода
          const nameMatch = /#.*Project:\s*(.+)/i.exec(importState.pythonText);
          if (nameMatch) {
            projectName = nameMatch[1].trim();
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Ошибка парсинга Python кода';
          setImportState(prev => ({ ...prev, error: errorMessage }));
          return;
        }
      } else {
        setImportState(prev => ({ ...prev, error: 'Введите JSON или Python код для импорта' }));
        return;
      }

      // Создание проекта через API
      const response = await apiRequest('POST', '/api/projects', {
        name: projectName,
        data: projectData,
      });

      const newProject = await response.json() as BotProject;

      // Сохраняем ID в localStorage для гостевого режима
      const myProjectIds = localStorage.getItem('myProjectIds') || '';
      const ids = new Set(myProjectIds.split(',').filter(Boolean).map(Number));
      ids.add(newProject.id);
      localStorage.setItem('myProjectIds', Array.from(ids).join(','));

      // Обновление кеша проектов
      queryClient.setQueryData<BotProject[]>(
        ['/api/projects'],
        (old = []) => [...old, newProject]
      );
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });

      toast({
        title: '✅ Проект импортирован',
        description: `Проект "${projectName}" успешно импортирован`,
      });

      // Закрытие диалога
      closeImportDialog();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось импортировать проект';
      setImportState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: '❌ Ошибка импорта',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [importState.jsonText, importState.pythonText, queryClient, toast, closeImportDialog]);

  return {
    importState,
    openImportDialog,
    closeImportDialog,
    setImportJsonText,
    setImportPythonText,
    importProject,
    clearError,
  };
}
