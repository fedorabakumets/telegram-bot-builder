/**
 * @fileoverview Хук для обработки импорта проектов в sidebar
 * Предоставляет функцию handleImportProject для импорта JSON и Python проектов
 * с поддержкой различных форматов данных
 * @module components/editor/sidebar/hooks/use-sidebar-import-handler
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { parsePythonBotToJson } from '../utils/parse-python-bot-to-json';
import type { BotProject } from '@shared/schema';

/**
 * Параметры хука обработки импорта
 */
export interface UseSidebarImportHandlerParams {
  /** QueryClient для управления кешем */
  queryClient: ReturnType<typeof useQueryClient>;
  /** Функция для показа toast уведомлений */
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void;
  /** Колбэк при выборе проекта после импорта */
  onProjectSelect?: (projectId: number) => void;
  /** Текущее состояние импорта */
  importState: {
    /** JSON текст для импорта */
    jsonText: string;
    /** Python текст для импорта */
    pythonText: string;
  };
  /** Функция очистки состояния импорта */
  clearImport: () => void;
  /** Функция закрытия диалога импорта */
  closeImportDialog: () => void;
  /** Функция установки ошибки импорта */
  setImportError: (error: string) => void;
  /** Список проектов для обновления кеша (резерв для будущего использования) */
  projects?: BotProject[];
}

/**
 * Результат работы хука обработки импорта
 */
export interface UseSidebarImportHandlerResult {
  /** Функция для импорта проекта из JSON или Python кода */
  handleImportProject: () => void;
}

/**
 * Хук для обработки импорта проектов
 * @param params - Параметры хука с зависимостями
 * @returns Объект с функцией handleImportProject
 *
 * @example
 * ```typescript
 * const { handleImportProject } = useSidebarImportHandler({
 *   queryClient,
 *   toast,
 *   onProjectSelect,
 *   importState,
 *   clearImport,
 *   closeImportDialog,
 *   setImportError,
 *   projects
 * });
 * ```
 */
export function useSidebarImportHandler({
  queryClient,
  toast,
  onProjectSelect,
  importState,
  clearImport,
  closeImportDialog,
  setImportError,
  projects: _projects
}: UseSidebarImportHandlerParams): UseSidebarImportHandlerResult {
  /**
   * Обработать импорт проекта
   * Поддерживает форматы: полный проект (name + data), только данные (sheets/nodes), legacy формат
   */
  const handleImportProject = useCallback(() => {
    try {
      setImportError('');

      // Импорт Python кода
      if (importState.pythonText.trim()) {
        try {
          // Проверка на формат Python бота с маркерами
          if (importState.pythonText.includes('@@NODE_START:') && importState.pythonText.includes('@@NODE_END:')) {
            try {
              const result = parsePythonBotToJson(importState.pythonText);
              const projectName = `Python Bot ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              const projectDescription = `Импортирован из Python кода (${result.nodeCount} узлов)`;

              apiRequest('POST', '/api/projects', {
                name: projectName,
                description: projectDescription,
                data: result.data
              }).then(() => {
                closeImportDialog();
                clearImport();
                toast({
                  title: "✅ Успешно импортировано!",
                  description: `Python бот загружен (${result.nodeCount} узлов)`,
                  variant: "default",
                });
                // Обновить кеш проектов
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                }, 300);
              }).catch((apiError: any) => {
                setImportError(apiError.message || 'Ошибка при создании проекта');
                toast({
                  title: "❌ Ошибка создания проекта",
                  description: apiError.message || 'Не удалось создать проект',
                  variant: "destructive",
                });
              });
            } catch (error: any) {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "❌ Ошибка импорта",
                description: error.message || 'Не удалось создать проект',
                variant: "destructive",
              });
            }
            return;
          } else {
            // Попытка парсинга как JSON (Python текст может содержать JSON)
            const jsonData = JSON.parse(importState.pythonText);

            let projectData: any;
            let projectName: string;
            let projectDescription: string;

            // Полный формат проекта (name + data)
            if (jsonData.name && jsonData.data) {
              projectName = jsonData.name;
              projectDescription = jsonData.description || '';
              projectData = jsonData.data;
            }
            // Формат с sheets (версия или activeSheetId)
            else if (jsonData.sheets && (jsonData.version || jsonData.activeSheetId)) {
              projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              projectDescription = '';
              projectData = jsonData;

              if (!projectData.version) {
                projectData.version = 2;
              }
            }
            // Legacy формат с nodes
            else if (jsonData.nodes) {
              projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              projectDescription = '';
              projectData = jsonData;
            }
            else {
              throw new Error('Неподдерживаемый формат');
            }

            apiRequest('POST', '/api/projects', {
              name: projectName,
              description: projectDescription,
              data: projectData
            }).then(() => {
              closeImportDialog();
              clearImport();
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              }, 300);
            }).catch((error: any) => {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "Ошибка импорта",
                description: error.message,
                variant: "destructive",
              });
            });
            return;
          }
        } catch (error: any) {
          setImportError('Файл должен содержать либо Python код бота (с @@NODE_START@@), либо валидный JSON');
          toast({
            title: "Ошибка парсинга",
            description: "Неподдерживаемый формат файла",
            variant: "destructive",
          });
          return;
        }
      }

      // Импорт JSON
      const parsedData = JSON.parse(importState.jsonText);

      let projectData: any;
      let projectName: string;
      let projectDescription: string;

      // Полный формат проекта (name + data)
      if (parsedData.name && parsedData.data) {
        projectName = parsedData.name;
        projectDescription = parsedData.description || '';
        projectData = parsedData.data;
      }
      // Формат с sheets (версия или activeSheetId)
      else if (parsedData.sheets && (parsedData.version || parsedData.activeSheetId)) {
        projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
        projectDescription = '';
        projectData = parsedData;

        if (!projectData.version) {
          projectData.version = 2;
        }
      }
      // Legacy формат с nodes
      else if (parsedData.nodes) {
        projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
        projectDescription = '';
        projectData = parsedData;
      }
      else {
        throw new Error('Неподдерживаемый формат JSON. Должен содержать поле "sheets", "nodes" или "data"');
      }

      apiRequest('POST', '/api/projects', {
        name: projectName,
        description: projectDescription,
        data: projectData
      }).then((newProject: BotProject) => {
        closeImportDialog();
        clearImport();

        setTimeout(() => {
          // Сохраняем ID в localStorage для гостевого режима
          const myProjectIds = localStorage.getItem('myProjectIds') || '';
          const ids = new Set(myProjectIds.split(',').filter(Boolean).map(Number));
          ids.add(newProject.id);
          localStorage.setItem('myProjectIds', Array.from(ids).join(','));

          // Обновить кеш проектов
          const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
          queryClient.setQueryData(['/api/projects'], [...currentProjects, newProject]);

          const currentList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']) || [];
          const { data, ...projectWithoutData } = newProject;
          queryClient.setQueryData(['/api/projects/list'], [...currentList, projectWithoutData]);

          // Инвалидируем список чтобы сайдбар перезагрузил с новым ids
          queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
          queryClient.invalidateQueries({ queryKey: ['/api/projects'] });

          toast({
            title: "Проект импортирован",
            description: `Проект "${newProject.name}" успешно импортирован. Проект готов к редактированию!`,
          });

          if (onProjectSelect) {
            onProjectSelect(newProject.id);
          }
        }, 300);
      }).catch((error) => {
        setImportError(`Ошибка импорта: ${error.message}`);
        toast({
          title: "Ошибка импорта",
          description: error.message,
          variant: "destructive",
        });
      });
    } catch (error: any) {
      const errorMsg = error instanceof SyntaxError ? 'Неверный JSON формат' : error.message;
      setImportError(errorMsg);
      toast({
        title: "Ошибка валидации",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [queryClient, toast, onProjectSelect, importState, clearImport, closeImportDialog, setImportError]);

  return {
    handleImportProject
  };
}
