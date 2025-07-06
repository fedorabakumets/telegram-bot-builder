import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Download, Eye, Calendar, User, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BotTemplate } from '@shared/schema';
import type { BotData } from '@/types/bot';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: BotTemplate) => void;
}

export function TemplatesModal({ isOpen, onClose, onSelectTemplate }: TemplatesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BotTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates'],
    enabled: isOpen,
  });

  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'custom', label: 'Пользовательские' },
    { value: 'business', label: 'Бизнес' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'education', label: 'Образование' },
    { value: 'utility', label: 'Утилиты' },
    { value: 'games', label: 'Игры' },
  ];

  const filteredTemplates = templates.filter((template: BotTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: BotTemplate) => {
    try {
      onSelectTemplate(template);
      toast({
        title: 'Шаблон применен',
        description: `Шаблон "${template.name}" успешно загружен`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить шаблон',
        variant: 'destructive',
      });
    }
  };

  const getTemplateStats = (botData: BotData) => {
    const nodes = botData.nodes || [];
    const connections = botData.connections || [];
    
    return {
      nodes: nodes.length,
      connections: connections.length,
      commands: nodes.filter(node => node.type === 'command' || node.type === 'start').length,
      buttons: nodes.reduce((acc, node) => acc + (node.data.buttons?.length || 0), 0),
    };
  };

  const handlePreview = (template: BotTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const TemplatePreview = ({ template }: { template: BotTemplate }) => {
    const stats = getTemplateStats(template.data as BotData);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <Button size="sm" onClick={() => setShowPreview(false)}>
            Закрыть
          </Button>
        </div>
        
        {template.description && (
          <p className="text-muted-foreground">{template.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">Узлов</div>
            <div className="text-2xl font-bold text-primary">{stats.nodes}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">Связей</div>
            <div className="text-2xl font-bold text-blue-600">{stats.connections}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">Команд</div>
            <div className="text-2xl font-bold text-green-600">{stats.commands}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">Кнопок</div>
            <div className="text-2xl font-bold text-purple-600">{stats.buttons}</div>
          </div>
        </div>
        
        {template.tags && template.tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Теги:</h4>
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-4">
          <Button onClick={() => handleUseTemplate(template)} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Использовать шаблон
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Шаблоны ботов
          </DialogTitle>
        </DialogHeader>

        {showPreview && selectedTemplate ? (
          <div className="flex-1 overflow-y-auto py-4">
            <TemplatePreview template={selectedTemplate} />
          </div>
        ) : (
          <>
            {/* Фильтры */}
            <div className="space-y-4 py-4 border-b">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Поиск шаблонов..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Категория" />
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
              </div>
            </div>

            {/* Список шаблонов */}
            <div className="flex-1 overflow-y-auto py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Шаблоны не найдены' 
                      : 'Пока нет сохраненных шаблонов'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template: BotTemplate) => {
                    const stats = getTemplateStats(template.data as BotData);
                    
                    return (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              {template.description && (
                                <CardDescription className="mt-1 line-clamp-2">
                                  {template.description}
                                </CardDescription>
                              )}
                            </div>
                            <Badge variant={template.isPublic ? 'default' : 'secondary'}>
                              {template.isPublic ? 'Публичный' : 'Личный'}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {/* Статистика */}
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{stats.nodes}</div>
                              <div className="text-muted-foreground">узлов</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{stats.connections}</div>
                              <div className="text-muted-foreground">связей</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{stats.commands}</div>
                              <div className="text-muted-foreground">команд</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{stats.buttons}</div>
                              <div className="text-muted-foreground">кнопок</div>
                            </div>
                          </div>
                          
                          {/* Теги */}
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Метаинформация */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {template.createdAt && format(new Date(template.createdAt), 'dd.MM.yyyy', { locale: ru })}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {categories.find(c => c.value === template.category)?.label || template.category}
                            </Badge>
                          </div>
                          
                          {/* Кнопки действий */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(template)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Просмотр
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUseTemplate(template)}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Использовать
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}