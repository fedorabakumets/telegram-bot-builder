import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, Search, Download, Eye, Calendar, User, Filter, Star, TrendingUp, 
  Crown, Sparkles, Trash2, Heart, Bookmark, Clock, Globe, Shield, Upload,
  BarChart3, Users, Zap, Award, ArrowRight, Grid3X3, Play, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TemplateImport } from '@/components/import-export';
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
  const [showImport, setShowImport] = useState(false);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 py-4">
        {templates.map((template: BotTemplate) => {
          const stats = getTemplateStats(template.data as BotData);
          
          return (
            <Card key={template.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/30 hover:scale-[1.02]">
              {/* Featured Badge */}
              {template.featured === 1 && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                    <Crown className="h-3 w-3" />
                    Топ
                  </div>
                </div>
              )}
              
              {/* Gradient Header */}
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <CardHeader className="pb-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <CardDescription className="mt-2 line-clamp-2 text-sm">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  {/* Author and Category */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{template.authorName || 'Система'}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  
                  {/* Rating and Difficulty */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{template.rating || 0}</span>
                        <span className="text-muted-foreground text-sm">({template.ratingCount || 0})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">{template.useCount || 0}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${template.difficulty === 'easy' ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950' : ''}
                        ${template.difficulty === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950' : ''}
                        ${template.difficulty === 'hard' ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950' : ''}
                      `}
                    >
                      {difficultyLabels[template.difficulty as keyof typeof difficultyLabels] || template.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    <Grid3X3 className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">{stats.nodes}</div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70">узлов</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-100 dark:border-green-900">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300">{stats.connections}</div>
                    <div className="text-xs text-green-600/70 dark:text-green-400/70">связей</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg border border-purple-100 dark:border-purple-900">
                    <Play className="h-4 w-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">{stats.commands}</div>
                    <div className="text-xs text-purple-600/70 dark:text-purple-400/70">команд</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-100 dark:border-orange-900">
                    <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-orange-700 dark:text-orange-300">{stats.buttons}</div>
                    <div className="text-xs text-orange-600/70 dark:text-orange-400/70">кнопок</div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{template.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="h-3 w-3" />
                      <span>{template.downloadCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{template.estimatedTime || 5} мин</span>
                    </div>
                  </div>
                  {template.isPublic && (
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Публичный
                    </Badge>
                  )}
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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Шаблоны ботов
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Импорт
            </Button>
          </div>
        </DialogHeader>

        {showPreview && selectedTemplate ? (
          <div className="flex-1 overflow-y-auto py-4">
            <TemplatePreview template={selectedTemplate} />
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-4">
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

            <TabsContent value="all" className="flex-1 overflow-y-auto">
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
            
            <TabsContent value="featured" className="flex-1 overflow-y-auto">
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
            
            <TabsContent value="popular" className="flex-1 overflow-y-auto">
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
            
            <TabsContent value="my" className="flex-1 overflow-y-auto">
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
          </Tabs>
        )}
      </DialogContent>
      
      <TemplateImport
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={(result) => {
          toast({
            title: "Импорт завершен",
            description: result.message,
          });
          // Обновляем список шаблонов
          queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
          queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
        }}
      />
    </Dialog>
  );
}