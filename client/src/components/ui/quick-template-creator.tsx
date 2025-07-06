import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, Loader2, X, Check } from 'lucide-react';
import { useTemplateAutoSave } from '@/hooks/use-template-autosave';
import { CompactTemplateAutoSaveIndicator } from '@/components/ui/template-autosave-indicator';
import { useToast } from '@/hooks/use-toast';
import type { BotData } from '@/types/bot';

interface QuickTemplateCreatorProps {
  botData: BotData;
  projectName?: string;
  onTemplateSaved?: (templateId: number) => void;
  className?: string;
}

export function QuickTemplateCreator({ 
  botData, 
  projectName, 
  onTemplateSaved,
  className 
}: QuickTemplateCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [templateName, setTemplateName] = useState(
    projectName ? `${projectName} - Шаблон` : 'Быстрый шаблон'
  );
  
  const { toast } = useToast();

  const formData = {
    name: templateName,
    description: `Быстро сохраненный шаблон на основе "${projectName || 'проекта'}"`,
    category: 'custom',
    tags: ['быстрый-шаблон'],
    isPublic: false,
    difficulty: 'easy' as const,
    language: 'ru',
    requiresToken: true,
    complexity: 1,
    estimatedTime: 5,
  };

  const {
    triggerAutoSave,
    forceSave,
    resetAutoSave,
    isSaving,
    isCreating,
    lastSaved,
    hasUnsavedChanges,
    templateId,
  } = useTemplateAutoSave(botData, formData, {
    enabled: true,
    instantSave: true,
    showToasts: true,
    onSaveSuccess: (id) => {
      toast({
        title: "✨ Быстрый шаблон создан",
        description: `Шаблон "${templateName}" готов к использованию`,
        duration: 3000,
      });
      onTemplateSaved?.(id);
      setIsExpanded(false);
      resetAutoSave();
    }
  });

  const handleQuickSave = () => {
    if (!templateName.trim()) {
      toast({
        title: "Укажите название",
        description: "Название шаблона обязательно",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    if (!botData.nodes || botData.nodes.length === 0) {
      toast({
        title: "Пустой проект",
        description: "Добавьте хотя бы один узел для создания шаблона",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    forceSave();
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setTemplateName(projectName ? `${projectName} - Шаблон` : 'Быстрый шаблон');
    resetAutoSave();
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={`flex items-center space-x-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 border-dashed hover:border-solid transition-all duration-200 ${className}`}
      >
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>Быстрый шаблон</span>
      </Button>
    );
  }

  return (
    <Card className={`w-full max-w-md shadow-lg border-purple-200 dark:border-purple-800 ${className}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="font-medium text-sm">Быстрое создание шаблона</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <CompactTemplateAutoSaveIndicator
              isSaving={isSaving}
              isCreating={isCreating}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Название шаблона..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-sm focus:ring-2 focus:ring-purple-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleQuickSave();
              }
            }}
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {botData.nodes?.length || 0} узлов
              </Badge>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {botData.connections?.length || 0} связей
              </Badge>
            </div>
            
            {templateId && (
              <Badge variant="default" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <Check className="h-3 w-3 mr-1" />
                Создан
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-xs"
          >
            Отмена
          </Button>
          
          <Button
            size="sm"
            onClick={handleQuickSave}
            disabled={isSaving || !templateName.trim() || (!botData.nodes?.length)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {isCreating ? 'Создание...' : 'Сохранение...'}
              </>
            ) : (
              <>
                <Save className="mr-1 h-3 w-3" />
                Создать шаблон
              </>
            )}
          </Button>
        </div>

        {/* Подсказка для пользователя */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
          💡 Быстрый шаблон создается мгновенно с базовыми настройками. 
          Для детальной настройки используйте полный редактор шаблонов.
        </div>
      </CardContent>
    </Card>
  );
}