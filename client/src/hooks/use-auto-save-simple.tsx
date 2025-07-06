import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotData, BotProject } from '@shared/schema';

interface AutoSaveOptions {
  enabled?: boolean;
  delay?: number;
  showToasts?: boolean;
}

export function useAutoSave(
  project: BotProject | undefined,
  getBotData: () => BotData,
  options: AutoSaveOptions = {}
) {
  const {
    enabled = true,
    delay = 800,
    showToasts = false
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');

  // Mutation для сохранения проекта
  const saveProjectMutation = useMutation({
    mutationFn: async (data: BotData) => {
      if (!project) throw new Error('Нет проекта для сохранения');
      
      return apiRequest('PUT', `/api/projects/${project.id}`, {
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      if (showToasts) {
        toast({
          title: "Автосохранение",
          description: "Проект автоматически сохранен",
          duration: 2000,
        });
      }
    },
    onError: () => {
      if (showToasts) {
        toast({
          title: "Ошибка автосохранения",
          description: "Не удалось автоматически сохранить проект",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  });

  // Функция для запуска автосохранения
  const triggerAutoSave = useCallback(() => {
    if (!enabled || !project || saveProjectMutation.isPending) return;

    const currentData = getBotData();
    const currentDataString = JSON.stringify(currentData);
    
    // Проверяем, изменились ли данные
    if (currentDataString === lastDataRef.current) return;
    
    lastDataRef.current = currentDataString;

    // Очищаем предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Устанавливаем новый таймер для отложенного сохранения
    saveTimeoutRef.current = setTimeout(() => {
      if (!saveProjectMutation.isPending) {
        saveProjectMutation.mutate(currentData);
      }
    }, delay);
  }, [enabled, project, getBotData, delay, saveProjectMutation]);

  // Функция для принудительного сохранения
  const forceSave = useCallback(() => {
    if (!project || saveProjectMutation.isPending) return;

    // Очищаем таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentData = getBotData();
    saveProjectMutation.mutate(currentData);
  }, [project, getBotData, saveProjectMutation]);

  // Инициализация начального состояния данных
  useEffect(() => {
    if (project?.data) {
      lastDataRef.current = JSON.stringify(project.data);
    }
  }, [project?.data]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    triggerAutoSave,
    forceSave,
    isSaving: saveProjectMutation.isPending,
    isEnabled: enabled
  };
}