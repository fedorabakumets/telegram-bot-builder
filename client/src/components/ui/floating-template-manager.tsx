import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Save, 
  Settings, 
  Clock, 
  Zap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Plus
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QuickTemplateCreator } from './quick-template-creator';
import { TemplateAutoSaveIndicator } from './template-autosave-indicator';
import { EnhancedSaveTemplateModal } from '../editor/enhanced-save-template-modal';
import type { BotData } from '@/types/bot';

interface FloatingTemplateManagerProps {
  botData: BotData;
  projectName?: string;
  onTemplateSaved?: (templateId: number) => void;
  onLoadTemplate?: () => void;
  className?: string;
}

export function FloatingTemplateManager({
  botData,
  projectName,
  onTemplateSaved,
  onLoadTemplate,
  className
}: FloatingTemplateManagerProps) {
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = {
    nodes: botData.nodes?.length || 0,
    connections: botData.connections?.length || 0,
    complexity: Math.min(10, Math.max(1, Math.floor((botData.nodes?.length || 0) / 3) + 1))
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 3) return 'text-green-600 dark:text-green-400';
    if (complexity <= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const canCreateTemplate = stats.nodes > 0;

  return (
    <>
      <Popover open={isExpanded} onOpenChange={setIsExpanded}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-200 ${className}`}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Шаблоны</span>
            {canCreateTemplate && (
              <Badge 
                variant="secondary" 
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0"
              >
                {stats.nodes}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 space-y-4">
              {/* Заголовок */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Управление шаблонами</span>
                </div>
                {canCreateTemplate && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${getComplexityColor(stats.complexity)}`}
                  >
                    Сложность: {stats.complexity}/10
                  </Badge>
                )}
              </div>

              {/* Статистика проекта */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {stats.nodes}
                  </div>
                  <div className="text-xs text-muted-foreground">Узлов</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {stats.connections}
                  </div>
                  <div className="text-xs text-muted-foreground">Связей</div>
                </div>
                <div className="space-y-1">
                  <div className={`text-lg font-bold ${getComplexityColor(stats.complexity)}`}>
                    {stats.complexity}
                  </div>
                  <div className="text-xs text-muted-foreground">Уровень</div>
                </div>
              </div>

              {/* Быстрые действия */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Действия</div>
                
                <div className="grid grid-cols-1 gap-2">
                  {/* Быстрое создание шаблона */}
                  <Button
                    onClick={() => {
                      setShowQuickCreator(true);
                      setIsExpanded(false);
                    }}
                    disabled={!canCreateTemplate}
                    className="flex items-center justify-between w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Быстрый шаблон</span>
                    </div>
                    <Clock className="h-3 w-3" />
                  </Button>

                  {/* Расширенное создание */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEnhancedModal(true);
                      setIsExpanded(false);
                    }}
                    disabled={!canCreateTemplate}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Расширенный режим</span>
                    </div>
                    <Plus className="h-3 w-3" />
                  </Button>

                  {/* Загрузка шаблонов */}
                  {onLoadTemplate && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onLoadTemplate();
                        setIsExpanded(false);
                      }}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Загрузить шаблон</span>
                      </div>
                    </Button>
                  )}
                </div>
              </div>

              {/* Подсказки */}
              {!canCreateTemplate ? (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  💡 Добавьте хотя бы один узел для создания шаблона
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded p-2">
                  ⚡ Быстрый шаблон создается мгновенно с автосохранением
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Быстрое создание шаблона в отдельном попапе */}
      {showQuickCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative">
            <QuickTemplateCreator
              botData={botData}
              projectName={projectName}
              onTemplateSaved={(id) => {
                onTemplateSaved?.(id);
                setShowQuickCreator(false);
              }}
              className="shadow-xl"
            />
            
            {/* Кнопка закрытия */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickCreator(false)}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-lg"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Расширенный редактор шаблонов */}
      <EnhancedSaveTemplateModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        botData={botData}
        projectName={projectName}
        onTemplateSaved={(id) => {
          onTemplateSaved?.(id);
          setShowEnhancedModal(false);
        }}
      />
    </>
  );
}