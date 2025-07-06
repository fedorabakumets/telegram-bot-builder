import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Tag, Save, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { EnhancedSaveTemplateModal } from './enhanced-save-template-modal';
import type { BotData } from '@/types/bot';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  botData: BotData;
  projectName?: string;
  useEnhanced?: boolean; // Использовать ли улучшенную версию
  onTemplateSaved?: (templateId: number) => void;
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

export function SaveTemplateModal({ isOpen, onClose, botData, projectName, useEnhanced = true, onTemplateSaved }: SaveTemplateModalProps) {
  // Если включен улучшенный режим, используем новый компонент
  if (useEnhanced) {
    return (
      <EnhancedSaveTemplateModal
        isOpen={isOpen}
        onClose={onClose}
        botData={botData}
        projectName={projectName}
        onTemplateSaved={onTemplateSaved}
      />
    );
  }

  // Оригинальная реализация для обратной совместимости
  const [formData, setFormData] = useState<TemplateFormData>({
    name: projectName ? `${projectName} - Шаблон` : 'Новый шаблон',
    description: '',
    category: 'custom',
    tags: [],
    isPublic: false,
    difficulty: 'easy',
    language: 'ru',
    requiresToken: true,
    complexity: 1,
    estimatedTime: 5,
  });
  const [newTag, setNewTag] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return await apiRequest('POST', '/api/templates', {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        isPublic: data.isPublic ? 1 : 0,
        difficulty: data.difficulty,
        language: data.language,
        requiresToken: data.requiresToken ? 1 : 0,
        complexity: data.complexity,
        estimatedTime: data.estimatedTime,
        data: botData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      toast({
        title: 'Шаблон сохранен',
        description: 'Ваш шаблон бота успешно сохранен',
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить шаблон',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: projectName ? `${projectName} - Шаблон` : 'Новый шаблон',
      description: '',
      category: 'custom',
      tags: [],
      isPublic: false,
      difficulty: 'easy',
      language: 'ru',
      requiresToken: true,
      complexity: 1,
      estimatedTime: 5,
    });
    setNewTag('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название шаблона обязательно',
        variant: 'destructive',
      });
      return;
    }
    saveTemplateMutation.mutate(formData);
  };

  const categories = [
    { value: 'custom', label: 'Пользовательский' },
    { value: 'business', label: 'Бизнес' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'education', label: 'Образование' },
    { value: 'utility', label: 'Утилиты' },
    { value: 'games', label: 'Игры' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Сохранить как шаблон
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Название */}
          <div className="space-y-2">
            <Label htmlFor="name">Название шаблона</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите название шаблона"
            />
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Краткое описание того, для чего предназначен этот шаблон"
              rows={3}
            />
          </div>

          {/* Категория */}
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Теги */}
          <div className="space-y-2">
            <Label>Теги</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Добавить тег"
                onKeyPress={handleKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Расширенные настройки */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Сложность */}
            <div className="space-y-2">
              <Label>Сложность</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сложность" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Легкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="hard">Сложный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Язык */}
            <div className="space-y-2">
              <Label>Язык</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Сложность (1-10) */}
            <div className="space-y-2">
              <Label>Сложность (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.complexity}
                onChange={(e) => setFormData(prev => ({ ...prev, complexity: parseInt(e.target.value) || 1 }))}
                placeholder="1"
              />
            </div>

            {/* Время настройки */}
            <div className="space-y-2">
              <Label>Время настройки (минут)</Label>
              <Input
                type="number"
                min="1"
                max="120"
                value={formData.estimatedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 5 }))}
                placeholder="5"
              />
            </div>
          </div>

          {/* Публичность и токен */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublic">
                Сделать шаблон публичным (другие пользователи смогут его использовать)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="requiresToken"
                type="checkbox"
                checked={formData.requiresToken}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresToken: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="requiresToken">
                Требует токен бота (пользователю нужно будет указать токен)
              </Label>
            </div>
          </div>

          {/* Статистика бота */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Информация о шаблоне:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Узлов:</span>
                <span className="ml-2 font-medium">{botData.nodes.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Связей:</span>
                <span className="ml-2 font-medium">{botData.connections.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Команд:</span>
                <span className="ml-2 font-medium">
                  {botData.nodes.filter(node => node.type === 'command' || node.type === 'start').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Кнопок:</span>
                <span className="ml-2 font-medium">
                  {botData.nodes.reduce((acc, node) => acc + (node.data.buttons?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTemplateMutation.isPending || !formData.name.trim()}
          >
            {saveTemplateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Сохранить шаблон
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}