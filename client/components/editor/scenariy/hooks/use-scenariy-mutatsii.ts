/**
 * @fileoverview Хуки useMutation для использования и удаления сценариев
 * @module client/components/editor/scenariy/hooks/use-scenariy-mutatsii
 */

import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotTemplate } from '@shared/schema';

/**
 * Хук для мутации "использовать сценарий"
 * Создаёт проект из шаблона и открывает его после обновления списка проектов
 * @returns объект мутации и обработчик handleUseTemplate
 */
export function useIspolzovatStsenary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const mutation = useMutation({
    /** Создаёт самостоятельный проект и получает его идентификатор от сервера. */
    mutationFn: (templateId: number) => apiRequest('POST', `/api/templates/${templateId}/use`) as Promise<{
      /** Проект, созданный сервером из выбранного шаблона. */
      project: { /** Идентификатор проекта для перехода в редактор. */ id: number };
    }>,
    /** Обновляет список для проверки пустого экрана до перехода к новому проекту. */
    onSuccess: async ({ project }) => {
      localStorage.removeItem('selectedTemplate');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] }),
      ]);
      setLocation(`/editor/${project.id}`);
      toast({ title: 'Проект создан', description: 'Сценарий готов к редактированию' });
    },
    onError: () => {
      toast({ title: '❌ Ошибка', description: 'Не удалось использовать сценарий', variant: 'destructive' });
    },
  });

  /**
   * Обработчик выбора сценария для использования
   * @param template - выбранный сценарий
   */
  const handleUseTemplate = (template: BotTemplate) => {
    if (mutation.isPending) return;
    mutation.mutate(template.id);
  };

  return { mutation, handleUseTemplate };
}

/**
 * Хук для мутации "удалить сценарий"
 * @returns объект мутации и обработчик handleDeleteTemplate
 */
export function useUdalitStsenary() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Не удалось удалить сценарий');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: '✅ Сценарий удалён', description: 'Ваш сценарий успешно удалён' });
    },
    onError: () => {
      toast({ title: '❌ Ошибка', description: 'Не удалось удалить сценарий', variant: 'destructive' });
    },
  });

  return mutation;
}
