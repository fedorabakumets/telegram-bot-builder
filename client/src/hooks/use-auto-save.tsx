import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotData, BotProject } from '@shared/schema';

interface AutoSaveOptions {
  enabled?: boolean;
  delay?: number; // Задержка в миллисекундах перед сохранением
  instantSave?: boolean; // Мгновенное сохранение без задержки
  showToasts?: boolean; // Показывать ли уведомления о сохранении
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export function useAutoSave(
  project: BotProject | undefined,
  getBotData: () => BotData,
  options: AutoSaveOptions = {}
) {
  const {
    enabled = true,
    delay = 1000,
    instantSave = false,
    showToasts = false,
    onSaveSuccess,
    onSaveError
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  
  // Используем состояния для компонентов React
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mutation для сохранения проекта
  const saveProjectMutation = useMutation({
    mutationFn: async (data: BotData) => {
      if (!project) throw new Error('Нет проекта для сохранения');
      
      return apiRequest('PUT', `/api/projects/${project.id}`, {
        data: data
      });
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      const now = new Date();
      setLastSaved(now);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      
      if (showToasts) {
        toast({
          title: "Автосохранение",
          description: "Проект автоматически сохранен",
          duration: 2000,
        });
      }
      
      onSaveSuccess?.();
    },
    onError: (error) => {
      setIsSaving(false);
      
      if (showToasts) {
        toast({
          title: "Ошибка автосохранения",
          description: "Не удалось автоматически сохранить проект",
          variant: "destructive",
          duration: 3000,
        });
      }
      
      onSaveError?.(error);
    }
  });

  // Функция для проверки, изменились ли данные
  const hasDataChanged = useCallback((newData: BotData): boolean => {
    const newDataString = JSON.stringify(newData);
    const hasChanged = newDataString !== lastDataRef.current;
    
    if (hasChanged) {
      lastDataRef.current = newDataString;
      setHasUnsavedChanges(true);
    }
    
    return hasChanged;
  }, []);

  // Функция для запуска автосохранения
  const triggerAutoSave = useCallback(() => {
    if (!enabled || !project || isSaving) return;

    const currentData = getBotData();
    
    // Проверяем, изменились ли данные
    if (!hasDataChanged(currentData)) return;

    // Очищаем предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (instantSave) {
      // Мгновенное сохранение
      saveProjectMutation.mutate(currentData);
    } else {
      // Устанавливаем новый таймер для отложенного сохранения
      saveTimeoutRef.current = setTimeout(() => {
        if (!isSaving && hasUnsavedChanges) {
          saveProjectMutation.mutate(currentData);
        }
      }, delay);
    }
  }, [enabled, project, getBotData, hasDataChanged, delay, instantSave, saveProjectMutation, isSaving, hasUnsavedChanges]);

  // Функция для принудительного сохранения
  const forceSave = useCallback(() => {
    if (!project || isSaving) return;

    // Очищаем таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentData = getBotData();
    hasDataChanged(currentData); // Обновляем состояние
    
    if (hasUnsavedChanges) {
      saveProjectMutation.mutate(currentData);
    }
  }, [project, getBotData, hasDataChanged, saveProjectMutation, isSaving, hasUnsavedChanges]);

  // Функция для получения статуса автосохранения
  const getAutoSaveState = useCallback((): AutoSaveState => ({
    isSaving,
    lastSaved,
    hasUnsavedChanges
  }), [isSaving, lastSaved, hasUnsavedChanges]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Инициализация начального состояния данных
  useEffect(() => {
    if (project?.data) {
      lastDataRef.current = JSON.stringify(project.data);
      setHasUnsavedChanges(false);
    }
  }, [project?.data]);

  // Автосохранение при выходе со страницы
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && enabled) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, forceSave, hasUnsavedChanges]);

  return {
    triggerAutoSave,
    forceSave,
    getAutoSaveState,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    isEnabled: enabled
  };
}