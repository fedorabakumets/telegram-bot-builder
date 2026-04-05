/**
 * @fileoverview Хук применения сценария к проекту
 *
 * Проверяет localStorage на наличие выбранного сценария и применяет его
 * к активному проекту при загрузке страницы.
 *
 * @module UseApplyTemplate
 */

import { useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { QueryClient } from '@tanstack/react-query';
import type { BotProject, BotData, BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import type { Toast } from '@/hooks/use-toast';

/** Параметры хука useApplyTemplate */
export interface UseApplyTemplateParams {
  /** Активный проект */
  activeProject: BotProject | null | undefined;
  /** Данные бота с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Установить данные бота с листами */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
  /** Установить данные бота */
  setBotData: (data: BotData, name?: string, sizes?: Map<string, { width: number; height: number }> | undefined, skipLayout?: boolean) => void;
  /** Текущие размеры узлов */
  currentNodeSizes: Map<string, { width: number; height: number }>;
  /** Установить флаг загрузки сценария */
  setIsLoadingTemplate: (v: boolean) => void;
  /** Триггер для fitToContent */
  setFitTrigger: React.Dispatch<React.SetStateAction<number>>;
  /** Мутация обновления проекта */
  updateProjectMutation: { mutate: (params: { newName?: string }) => void };
  /** QueryClient для обновления кеша */
  queryClient: QueryClient;
  /** Функция показа уведомлений */
  toast: (opts: Toast) => void;
}

/**
 * Применяет сохранённый в localStorage сценарий к активному проекту.
 * Срабатывает один раз при изменении activeProject.id.
 *
 * @param params - Параметры хука
 */
export function useApplyTemplate(params: UseApplyTemplateParams): void {
  const {
    activeProject,
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    currentNodeSizes,
    setIsLoadingTemplate,
    setFitTrigger,
    updateProjectMutation,
    queryClient,
    toast,
  } = params;

  useEffect(() => {
    const apply = async () => {
      const selectedTemplateData = localStorage.getItem('selectedTemplate');
      if (!selectedTemplateData || !activeProject) return;

      try {
        setIsLoadingTemplate(true);
        const template = JSON.parse(selectedTemplateData);

        /** Оптимистично обновляет имя проекта в кеше */
        const updateNameInCache = (name: string) => {
          const updateList = <T extends { id: number; name: string }>(key: string) => {
            const list = queryClient.getQueryData<T[]>([key]);
            if (list) {
              queryClient.setQueryData([key], list.map(p =>
                p.id === activeProject.id ? { ...p, name } : p
              ));
            }
          };
          updateList('/api/projects/list');
          updateList('/api/projects');
        };

        if (template.data.sheets && Array.isArray(template.data.sheets)) {
          const updatedSheets = template.data.sheets.map((sheet: { name: string; nodes: unknown[]; viewState?: unknown }) => ({
            id: nanoid(),
            name: sheet.name,
            nodes: (sheet.nodes ?? []).map((node: unknown) => {
              const n = node as { id: string; type: string; position?: { x: number; y: number }; data?: Record<string, unknown> };
              return { id: n.id, type: n.type, position: n.position ?? { x: 0, y: 0 }, data: { ...n.data, parent: undefined, children: undefined } };
            }),
            viewState: sheet.viewState ?? { position: { x: 0, y: 0 }, zoom: 1 },
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          const templateDataWithSheets: BotDataWithSheets = { sheets: updatedSheets, activeSheetId: updatedSheets[0]?.id, version: 2 };
          setBotDataWithSheets({ ...botDataWithSheets, ...templateDataWithSheets });

          if (updatedSheets[0]) {
            setBotData({ nodes: updatedSheets[0].nodes as BotData['nodes'] }, template.name, currentNodeSizes, true);
          }
        } else {
          const migratedData = SheetsManager.migrateLegacyData(template.data as BotData);
          setBotDataWithSheets({ ...botDataWithSheets, ...migratedData });
          setBotData(template.data as BotData, template.name, currentNodeSizes, true);
        }

        setFitTrigger(t => t + 1);

        if (activeProject.id) {
          if (template.name) updateNameInCache(template.name);
          updateProjectMutation.mutate({ newName: template.name });
        }

        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });

        toast({ title: 'Сценарий применен', description: `Сценарий "${template.name}" успешно загружен` });
        localStorage.removeItem('selectedTemplate');
        setTimeout(() => setIsLoadingTemplate(false), 1000);
      } catch {
        localStorage.removeItem('selectedTemplate');
        setIsLoadingTemplate(false);
      }
    };

    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);
}
