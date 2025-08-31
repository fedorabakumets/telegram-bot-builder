import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Download, Eye, Calendar, User, Filter, Star, TrendingUp, Crown, Sparkles, Trash2, Heart, Bookmark, Clock, Globe, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'name'>('popular');

  const { toast } = useToast();

  // Отладка для проверки открытия модального окна
  if (isOpen) {
    console.log('Templates modal is open');
  }

  const { data: templates = [], isLoading } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates'],
    enabled: isOpen,
  });

  const { data: featuredTemplates = [], isLoading: isLoadingFeatured } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/featured'],
    enabled: isOpen && currentTab === 'featured',
  });

  const { data: myTemplates = [], isLoading: isLoadingMy } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/category/custom'],
    enabled: isOpen,
    staleTime: 0, // Always refetch when needed
  });

  // Мутация для увеличения счетчика использования
  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to increment use count');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  // Мутация для оценки шаблона
  const rateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, rating }: { templateId: number; rating: number }) => {
      const response = await fetch(`/api/templates/${templateId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to rate template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Спасибо за оценку!',
        description: 'Ваша оценка поможет другим пользователям',
      });
    },
  });

  // Мутация для удаления шаблона
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      toast({
        title: 'Шаблон удален',
        description: 'Шаблон успешно удален',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить шаблон',
        variant: 'destructive',
      });
    },
  });

  // Мутация для просмотра шаблона
  const viewTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}/view`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to increment view count');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  // Мутация для лайка шаблона
  const likeTemplateMutation = useMutation({
    mutationFn: async ({ templateId, liked }: { templateId: number; liked: boolean }) => {
      const response = await fetch(`/api/templates/${templateId}/like`, {
        method: 'POST',
        body: JSON.stringify({ liked }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to toggle like');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Готово!',
        description: 'Ваша оценка учтена',
      });
    },
  });

  // Мутация для закладки шаблона
  const bookmarkTemplateMutation = useMutation({
    mutationFn: async ({ templateId, bookmarked }: { templateId: number; bookmarked: boolean }) => {
      const response = await fetch(`/api/templates/${templateId}/bookmark`, {
        method: 'POST',
        body: JSON.stringify({ bookmarked }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to toggle bookmark');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Готово!',
        description: 'Закладка обновлена',
      });
    },
  });

  // Мутация для скачивания шаблона
  const downloadTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}/download`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to increment download count');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'custom', label: 'Пользовательские' },
    { value: 'business', label: 'Бизнес' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'education', label: 'Образование' },
    { value: 'utility', label: 'Утилиты' },
    { value: 'games', label: 'Игры' },
    { value: 'official', label: 'Официальные' },
    { value: 'community', label: 'Сообщество' },
  ];

  const difficultyLabels = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
  };

  const filteredAndSortedTemplates = useMemo(() => {
    let templatesData = currentTab === 'featured' ? featuredTemplates : 
                       currentTab === 'my' ? myTemplates : templates;
    
    // Фильтрация
    let filtered = templatesData.filter((template: BotTemplate) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Дополнительная фильтрация для вкладки "Популярные"
    if (currentTab === 'popular') {
      filtered = filtered.filter(t => (t.useCount || 0) > 0);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.useCount || 0) - (a.useCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          return bDate - aDate;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, featuredTemplates, myTemplates, currentTab, searchTerm, selectedCategory, sortBy]);

  const handleUseTemplate = async (template: BotTemplate) => {
    try {
      console.log('Применяем шаблон:', template.name, template.data);
      
      // Сначала применяем шаблон к редактору
      onSelectTemplate(template);
      
      // Затем обновляем счетчик использования
      await useTemplateMutation.mutateAsync(template.id);
      
      toast({
        title: 'Шаблон применен',
        description: `Шаблон "${template.name}" загружен на холст`,
      });
      onClose();
    } catch (error) {
      console.error('Ошибка применения шаблона:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить шаблон',
        variant: 'destructive',
      });
    }
  };

  const handleRateTemplate = async (template: BotTemplate, rating: number) => {
    try {
      await rateTemplateMutation.mutateAsync({ templateId: template.id, rating });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось поставить оценку',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (template: BotTemplate) => {
    if (window.confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
      try {
        await deleteTemplateMutation.mutateAsync(template.id);
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить шаблон',
          variant: 'destructive',
        });
      }
    }
  };

  const getTemplateStats = (botData: BotData | any) => {
    let nodes: any[] = [];
    let connections: any[] = [];
    
    console.log('🔍 Calculating stats for template data:', botData);
    
    // Проверяем, это многолистовой шаблон или обычный
    if (botData.sheets && Array.isArray(botData.sheets)) {
      console.log('📋 Multi-sheet template detected, sheets count:', botData.sheets.length);
      // Многолистовой шаблон - собираем все узлы и связи из всех листов
      botData.sheets.forEach((sheet: any, index: number) => {
        if (sheet.nodes) {
          console.log(`📄 Sheet ${index + 1} (${sheet.name}): ${sheet.nodes.length} nodes`);
          nodes.push(...sheet.nodes);
        }
        if (sheet.connections) {
          console.log(`🔗 Sheet ${index + 1} (${sheet.name}): ${sheet.connections.length} connections`);
          connections.push(...sheet.connections);
        }
      });
      // Добавляем межлистовые связи
      if (botData.interSheetConnections) {
        console.log('🔄 Inter-sheet connections:', botData.interSheetConnections.length);
        connections.push(...botData.interSheetConnections);
      }
    } else {
      console.log('📝 Regular template detected');
      // Обычный шаблон
      nodes = botData.nodes || [];
      connections = botData.connections || [];
    }
    
    const stats = {
      nodes: nodes.length,
      connections: connections.length,
      commands: nodes.filter(node => node.type === 'command' || node.type === 'start').length,
      buttons: nodes.reduce((acc, node) => acc + (node.data?.buttons?.length || 0), 0),
    };
    
    console.log('📊 Final stats:', stats);
    return stats;
  };

  const handlePreview = (template: BotTemplate) => {
    console.log('🎯 PREVIEW BUTTON CLICKED FOR TEMPLATE:', template.name);
    console.log('🎯 TEMPLATE DATA STRUCTURE:', Object.keys(template.data || {}));
    console.log('🎯 FULL TEMPLATE DATA:', template.data);
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const TemplatePreview = ({ template }: { template: BotTemplate }) => {
    console.log('👁️ TemplatePreview rendering for:', template.name);
    console.log('📦 Template data received:', template.data);
    const stats = getTemplateStats(template.data as BotData);
    console.log('📈 Stats calculated:', stats);
    
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
          <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Узлов</div>
            <div className="text-2xl font-bold text-primary">{stats.nodes}</div>
          </div>
          <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Связей</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.connections}</div>
          </div>
          <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Команд</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.commands}</div>
          </div>
          <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Кнопок</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.buttons}</div>
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

  interface TemplateGridProps {
    templates: BotTemplate[];
    isLoading: boolean;
    onPreview: (template: BotTemplate) => void;
    onUse: (template: BotTemplate) => void;
    onRate: (template: BotTemplate, rating: number) => void;
    onDelete?: (template: BotTemplate) => void;
    searchTerm: string;
    selectedCategory: string;
    showDeleteButton?: boolean;
  }

  const TemplateGrid = ({ 
    templates, 
    isLoading, 
    onPreview, 
    onUse, 
    onRate, 
    onDelete, 
    searchTerm, 
    selectedCategory, 
    showDeleteButton = false 
  }: TemplateGridProps) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Шаблоны не найдены' 
              : 'Пока нет сохраненных шаблонов'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 py-4">
        {templates.map((template: BotTemplate) => {
          const stats = getTemplateStats(template.data as BotData);
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 dark:bg-card/50 dark:hover:bg-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.featured === 1 && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
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
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{template.rating || 0}</span>
                    <span>({template.ratingCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{template.useCount || 0} исп.</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {difficultyLabels[template.difficulty as keyof typeof difficultyLabels] || template.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted dark:bg-muted/30 rounded">
                    <div className="font-medium">{stats.nodes}</div>
                    <div className="text-muted-foreground">узлов</div>
                  </div>
                  <div className="text-center p-2 bg-muted dark:bg-muted/30 rounded">
                    <div className="font-medium">{stats.connections}</div>
                    <div className="text-muted-foreground">связей</div>
                  </div>
                  <div className="text-center p-2 bg-muted dark:bg-muted/30 rounded">
                    <div className="font-medium">{stats.commands}</div>
                    <div className="text-muted-foreground">команд</div>
                  </div>
                  <div className="text-center p-2 bg-muted dark:bg-muted/30 rounded">
                    <div className="font-medium">{stats.buttons}</div>
                    <div className="text-muted-foreground">кнопок</div>
                  </div>
                </div>

                {/* Расширенная статистика */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-muted/20 rounded">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{template.viewCount || 0}</span>
                    <span className="text-muted-foreground">просмотров</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-muted/20 rounded">
                    <Download className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{template.downloadCount || 0}</span>
                    <span className="text-muted-foreground">скачиваний</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-muted/20 rounded">
                    <Heart className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{template.likeCount || 0}</span>
                    <span className="text-muted-foreground">лайков</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-muted/20 rounded">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{template.estimatedTime || 5}</span>
                    <span className="text-muted-foreground">мин.</span>
                  </div>
                </div>

                {/* Дополнительные индикаторы */}
                <div className="flex items-center gap-2 text-xs">
                  {template.requiresToken === 1 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Токен
                    </Badge>
                  )}
                  {template.language && template.language !== 'ru' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {template.language.toUpperCase()}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {template.complexity || 1}/10
                  </Badge>
                </div>
                
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
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {template.createdAt && format(new Date(template.createdAt), 'dd.MM.yyyy', { locale: ru })}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.value === template.category)?.label || template.category}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPreview(template)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Просмотр
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onUse(template)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Использовать
                  </Button>
                  {showDeleteButton && onDelete && template.category === 'custom' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(template)}
                      className="px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Интерактивные действия */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likeTemplateMutation.mutate({ 
                        templateId: template.id, 
                        liked: true 
                      })}
                      className="h-7 px-2"
                    >
                      <Heart className="h-3 w-3 mr-1" />
                      <span className="text-xs">{template.likeCount || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => bookmarkTemplateMutation.mutate({ 
                        templateId: template.id, 
                        bookmarked: true 
                      })}
                      className="h-7 px-2"
                    >
                      <Bookmark className="h-3 w-3 mr-1" />
                      <span className="text-xs">{template.bookmarkCount || 0}</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Оценить:</span>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => onRate(template, rating)}
                        className="text-muted-foreground hover:text-yellow-500 transition-colors"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Шаблоны ботов
          </DialogTitle>
        </DialogHeader>

        {showPreview && selectedTemplate ? (
          <div className="flex-1 overflow-y-auto py-4 pr-2">
            <TemplatePreview template={selectedTemplate} />
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col h-full min-h-0">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Все шаблоны
              </TabsTrigger>
              <TabsTrigger value="featured" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Рекомендуемые
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Популярные
              </TabsTrigger>
              <TabsTrigger value="my" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Мои шаблоны
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 py-4 border-b flex-shrink-0">
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
                <div className="w-36">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Популярность</SelectItem>
                      <SelectItem value="rating">Рейтинг</SelectItem>
                      <SelectItem value="recent">Новые</SelectItem>
                      <SelectItem value="name">По алфавиту</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <TabsContent value="all" className="h-full overflow-y-auto pr-2 mt-0">
                <TemplateGrid 
                  templates={filteredAndSortedTemplates} 
                  isLoading={isLoading}
                  onPreview={handlePreview}
                  onUse={handleUseTemplate}
                  onRate={handleRateTemplate}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                />
              </TabsContent>
              
              <TabsContent value="featured" className="h-full overflow-y-auto pr-2 mt-0">
                <TemplateGrid 
                  templates={filteredAndSortedTemplates} 
                  isLoading={isLoadingFeatured}
                  onPreview={handlePreview}
                  onUse={handleUseTemplate}
                  onRate={handleRateTemplate}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                />
              </TabsContent>
              
              <TabsContent value="popular" className="h-full overflow-y-auto pr-2 mt-0">
                <TemplateGrid 
                  templates={filteredAndSortedTemplates} 
                  isLoading={isLoading}
                  onPreview={handlePreview}
                  onUse={handleUseTemplate}
                  onRate={handleRateTemplate}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                />
              </TabsContent>
              
              <TabsContent value="my" className="h-full overflow-y-auto pr-2 mt-0">
                <TemplateGrid 
                  templates={filteredAndSortedTemplates} 
                  isLoading={isLoadingMy}
                  onPreview={handlePreview}
                  onUse={handleUseTemplate}
                  onRate={handleRateTemplate}
                  onDelete={handleDeleteTemplate}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  showDeleteButton={true}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}