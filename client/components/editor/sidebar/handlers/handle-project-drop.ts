/**
 * @fileoverview Обработчик сброса проекта на новую позицию
 * Переупорядочивает проекты в списке с синхронизацией на сервере
 */
import { BotProject } from '@shared/schema';
import { QueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { apiRequest } from '@/queryClient';

/** Параметры обработчика сброса проекта */
interface ProjectDropParams {
  /** Перетаскиваемый проект */
  draggedProject: BotProject | null;
  /** Целевой проект */
  targetProject: BotProject;
  /** QueryClient для обновления кеша */
  queryClient: QueryClient;
  /** Функция для сброса перетаскиваемого проекта */
  setDraggedProject: Dispatch<SetStateAction<any>>;
  /** Функция для сброса целевого проекта */
  setDragOverProject: Dispatch<SetStateAction<number | null>>;
  /** Функция для показа уведомления */
  toast: (options: { title: string; description: string }) => void;
}

/**
 * Обработчик события drop на проекте
 * @param e - Событие перетаскивания
 * @param params - Параметры обработчика
 */
export const handleProjectDrop = async (
 e: React.DragEvent | null,
 { draggedProject, targetProject, queryClient, setDraggedProject, setDragOverProject, toast }: ProjectDropParams
) => {
 e?.preventDefault?.();
 e?.stopPropagation?.();
 setDragOverProject(null);

  console.log('🎯 Попытка перемещения:', draggedProject?.name, '→', targetProject.name);

  if (!draggedProject || draggedProject.id === targetProject.id) {
    console.log('❌ Отмена: проект не выбран или это тот же проект');
    setDraggedProject(null);
    return;
  }

  const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
  console.log('📋 Текущие проекты:', currentProjects.map(p => p.name));

  const draggedIndex = currentProjects.findIndex(p => p.id === draggedProject.id);
  const targetIndex = currentProjects.findIndex(p => p.id === targetProject.id);

  console.log(`📍 Индексы: перемещаемый=${draggedIndex}, целевой=${targetIndex}`);

  if (draggedIndex === -1 || targetIndex === -1) {
    console.log('❌ Отмена: проект не найден');
    setDraggedProject(null);
    return;
  }

  const newProjects = [...currentProjects];
  const [movedProject] = newProjects.splice(draggedIndex, 1);
  newProjects.splice(targetIndex, 0, movedProject);

  console.log('✅ Новый порядок:', newProjects.map(p => p.name));

  try {
    await apiRequest('PUT', '/api/projects/reorder', {
      projectIds: newProjects.map(p => p.id)
    });

    queryClient.setQueryData(['/api/projects'], newProjects);

    const newList = newProjects.map(({ data, ...rest }) => rest);
    queryClient.setQueryData(['/api/projects/list'], newList);

    toast({
      title: '✅ Проекты переупорядочены',
      description: `Проект "${draggedProject.name}" перемещен`,
    });
  } catch (error: any) {
    console.error('❌ Ошибка сохранения порядка:', error.message);
    toast({
      title: '❌ Ошибка',
      description: 'Не удалось сохранить порядок проектов',
    });
  }

  setDraggedProject(null);
};
