import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { BotData } from '@/types/bot';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  botData: BotData;
  projectName?: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  complexity: number;
  estimatedTime: number;
}

export function SaveTemplateModal({ isOpen, onClose, botData, projectName }: SaveTemplateModalProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: projectName ? `${projectName} - Шаблон` : 'Новый шаблон',
    description: '',
    category: 'custom',
    isPublic: false,
    complexity: 1,
    estimatedTime: 5,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Функция для вычисления статистики с поддержкой многолистовых шаблонов
  const getStats = (data: BotData | any) => {
    let nodes: any[] = [];
    let connections: any[] = [];
    
    // Проверяем, это многолистовой шаблон или обычный
    if (data.sheets && Array.isArray(data.sheets)) {
      // Многолистовой шаблон - собираем все узлы и связи из всех листов
      data.sheets.forEach((sheet: any) => {
        if (sheet.nodes) nodes.push(...sheet.nodes);
        if (sheet.connections) connections.push(...sheet.connections);
      });
      // Добавляем межлистовые связи
      if (data.interSheetConnections) {
        connections.push(...data.interSheetConnections);
      }
    } else {
      // Обычный шаблон
      nodes = data.nodes || [];
      connections = data.connections || [];
    }
    
    return {
      nodes: nodes.length,
      connections: connections.length,
      commands: nodes.filter(node => node.data?.command).length,
      buttons: nodes.reduce((acc, node) => acc + (node.data?.buttons?.length || 0), 0),
    };
  };

  const stats = getStats(botData);

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return await apiRequest('POST', '/api/templates', {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: [],
        isPublic: data.isPublic ? 1 : 0,
        difficulty: data.complexity <= 3 ? 'easy' : data.complexity <= 7 ? 'medium' : 'hard',
        language: 'ru',
        requiresToken: 1,
        complexity: data.complexity,
        estimatedTime: data.estimatedTime,
        authorName: 'Пользователь',
        featured: 0,
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
      isPublic: false,
      complexity: 1,
      estimatedTime: 5,
    });
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

          {/* Основные настройки */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Публичность */}
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

          {/* Статистика бота */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Информация о шаблоне:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Узлов:</span>
                <span className="ml-2 font-medium">{stats.nodes}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Связей:</span>
                <span className="ml-2 font-medium">{stats.connections}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Команд:</span>
                <span className="ml-2 font-medium">{stats.commands}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Кнопок:</span>
                <span className="ml-2 font-medium">{stats.buttons}</span>
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