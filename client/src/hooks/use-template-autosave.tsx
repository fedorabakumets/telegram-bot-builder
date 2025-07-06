import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotData } from '@shared/schema';

interface TemplateAutoSaveOptions {
  enabled?: boolean;
  instantSave?: boolean; // Мгновенное сохранение без задержки
  delay?: number; // Задержка для обычного автосохранения
  showToasts?: boolean;
  onSaveSuccess?: (templateId: number) => void;
  onSaveError?: (error: any) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  requiresToken: boolean;
  complexity: number;
  estimatedTime: number;
}

interface TemplateAutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  templateId: number | null;
  isCreating: boolean;
}

export function useTemplateAutoSave(
  botData: BotData,
  formData: TemplateFormData,
  options: TemplateAutoSaveOptions = {}
) {
  const {
    enabled = true,
    instantSave = false,
    delay = 500, // Быстрее для шаблонов
    showToasts = true,
    onSaveSuccess,
    onSaveError
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  const lastFormRef = useRef<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [templateId, setTemplateId] = useState<number | null>(null);

  // Mutation для создания нового шаблона
  const createTemplateMutation = useMutation({
    mutationFn: async (data: { formData: TemplateFormData; botData: BotData }) => {
      return await apiRequest('POST', '/api/templates', {
        name: data.formData.name,
        description: data.formData.description,
        category: data.formData.category,
        tags: data.formData.tags,
        isPublic: data.formData.isPublic ? 1 : 0,
        difficulty: data.formData.difficulty,
        language: data.formData.language,
        requiresToken: data.formData.requiresToken ? 1 : 0,
        complexity: data.formData.complexity,
        estimatedTime: data.formData.estimatedTime,
        data: data.botData,
      });
    },
    onMutate: () => {
      setIsCreating(true);
      setIsSaving(true);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      
      const now = new Date();
      setLastSaved(now);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      setIsCreating(false);
      setTemplateId(response.id);
      
      if (showToasts) {
        toast({
          title: "✨ Шаблон создан",
          description: "Ваш шаблон автоматически сохранен",
          duration: 3000,
        });
      }
      
      onSaveSuccess?.(response.id);
    },
    onError: (error) => {
      setIsSaving(false);
      setIsCreating(false);
      
      if (showToasts) {
        toast({
          title: "❌ Ошибка создания",
          description: "Не удалось создать шаблон",
          variant: "destructive",
          duration: 4000,
        });
      }
      
      onSaveError?.(error);
    }
  });

  // Mutation для обновления существующего шаблона
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: number; formData: TemplateFormData; botData: BotData }) => {
      return await apiRequest('PUT', `/api/templates/${data.templateId}`, {
        name: data.formData.name,
        description: data.formData.description,
        category: data.formData.category,
        tags: data.formData.tags,
        isPublic: data.formData.isPublic ? 1 : 0,
        difficulty: data.formData.difficulty,
        language: data.formData.language,
        requiresToken: data.formData.requiresToken ? 1 : 0,
        complexity: data.formData.complexity,
        estimatedTime: data.formData.estimatedTime,
        data: data.botData,
      });
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      
      const now = new Date();
      setLastSaved(now);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      
      if (showToasts) {
        toast({
          title: "💾 Шаблон обновлен",
          description: "Изменения автоматически сохранены",
          duration: 2000,
        });
      }
      
      onSaveSuccess?.(templateId!);
    },
    onError: (error) => {
      setIsSaving(false);
      
      if (showToasts) {
        toast({
          title: "❌ Ошибка обновления",
          description: "Не удалось обновить шаблон",
          variant: "destructive",
          duration: 4000,
        });
      }
      
      onSaveError?.(error);
    }
  });

  // Проверка изменений в данных бота или форме
  const hasDataChanged = useCallback(() => {
    const newBotDataString = JSON.stringify(botData);
    const newFormDataString = JSON.stringify(formData);
    
    const botDataChanged = newBotDataString !== lastDataRef.current;
    const formDataChanged = newFormDataString !== lastFormRef.current;
    
    if (botDataChanged || formDataChanged) {
      lastDataRef.current = newBotDataString;
      lastFormRef.current = newFormDataString;
      setHasUnsavedChanges(true);
      return true;
    }
    
    return false;
  }, [botData, formData]);

  // Валидация перед сохранением
  const validateTemplate = useCallback(() => {
    if (!formData.name.trim()) {
      toast({
        title: "⚠️ Проблема с валидацией",
        description: "Название шаблона обязательно",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
    
    if (!botData.nodes || botData.nodes.length === 0) {
      toast({
        title: "⚠️ Проблема с валидацией",
        description: "Шаблон должен содержать хотя бы один узел",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
    
    return true;
  }, [formData.name, botData.nodes, toast]);

  // Основная функция сохранения
  const saveTemplate = useCallback(() => {
    if (!enabled || isSaving || !validateTemplate()) return;
    
    if (templateId) {
      // Обновляем существующий шаблон
      updateTemplateMutation.mutate({ templateId, formData, botData });
    } else {
      // Создаем новый шаблон
      createTemplateMutation.mutate({ formData, botData });
    }
  }, [enabled, isSaving, validateTemplate, templateId, formData, botData, updateTemplateMutation, createTemplateMutation]);

  // Автосохранение с задержкой или мгновенно
  const triggerAutoSave = useCallback(() => {
    if (!enabled || isSaving) return;
    
    if (!hasDataChanged()) return;
    
    // Очищаем предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (instantSave) {
      // Мгновенное сохранение
      saveTemplate();
    } else {
      // Сохранение с задержкой
      saveTimeoutRef.current = setTimeout(() => {
        if (!isSaving && hasUnsavedChanges) {
          saveTemplate();
        }
      }, delay);
    }
  }, [enabled, isSaving, hasDataChanged, instantSave, saveTemplate, delay, hasUnsavedChanges]);

  // Принудительное сохранение
  const forceSave = useCallback(() => {
    if (!enabled || isSaving) return;
    
    // Очищаем таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    hasDataChanged(); // Обновляем состояние
    saveTemplate();
  }, [enabled, isSaving, hasDataChanged, saveTemplate]);

  // Сброс состояния для нового шаблона
  const resetAutoSave = useCallback(() => {
    setTemplateId(null);
    setHasUnsavedChanges(false);
    setLastSaved(null);
    lastDataRef.current = JSON.stringify(botData);
    lastFormRef.current = JSON.stringify(formData);
  }, [botData, formData]);

  // Установка существующего ID шаблона для редактирования
  const setExistingTemplateId = useCallback((id: number) => {
    setTemplateId(id);
    setHasUnsavedChanges(false);
    lastDataRef.current = JSON.stringify(botData);
    lastFormRef.current = JSON.stringify(formData);
  }, [botData, formData]);

  // Получение статуса автосохранения
  const getAutoSaveState = useCallback((): TemplateAutoSaveState => ({
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    templateId,
    isCreating
  }), [isSaving, lastSaved, hasUnsavedChanges, templateId, isCreating]);

  // Инициализация состояния при первой загрузке
  useEffect(() => {
    lastDataRef.current = JSON.stringify(botData);
    lastFormRef.current = JSON.stringify(formData);
    setHasUnsavedChanges(false);
  }, []);

  // Автосохранение при выходе со страницы
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && enabled) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения в шаблоне. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges && enabled) {
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

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Методы
    triggerAutoSave,
    forceSave,
    resetAutoSave,
    setExistingTemplateId,
    getAutoSaveState,
    
    // Состояние
    isSaving,
    isCreating,
    lastSaved,
    hasUnsavedChanges,
    templateId,
    isEnabled: enabled
  };
}