import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Download, Eye, Calendar, User, Filter, Star, TrendingUp, Crown, Sparkles, Trash2, Heart, Bookmark, Clock, Globe, Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BotTemplate } from '@shared/schema';
import type { BotData } from '@/types/bot';
import { AdaptiveHeader } from '@/components/layout/adaptive-header';
import { SimpleLayoutCustomizer, SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';
import { FlexibleLayout } from '@/components/layout/flexible-layout';

interface TemplatesPageProps {
  onSelectTemplate?: (template: BotTemplate) => void;
}

export function TemplatesPage({ onSelectTemplate }: TemplatesPageProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BotTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'name'>('popular');
  
  const [flexibleLayoutConfig, setFlexibleLayoutConfig] = useState<SimpleLayoutConfig>({
    elements: [
      {
        id: 'header',
        type: 'header',
        name: 'Шапка',
        position: 'top',
        size: 64,
        visible: true
      },
      {
        id: 'sidebar',
        type: 'sidebar',
        name: 'Боковая панель',
        position: 'left',
        size: 20,
        visible: true
      },
      {
        id: 'canvas',
        type: 'canvas',
        name: 'Содержимое',
        position: 'center',
        size: 60,
        visible: true
      },
      {
        id: 'properties',
        type: 'properties',
        name: 'Фильтры',
        position: 'right',
        size: 20,
        visible: true
      }
    ],
    compactMode: false,
    showGrid: false
  });

  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const { data: featuredTemplates = [], isLoading: isLoadingFeatured } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/featured'],
    enabled: currentTab === 'featured',
  });

  const { data: myTemplates = [], isLoading: isLoadingMy } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/category/custom'],
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
        description: 'Шаблон успешно удален из вашей библиотеки',
      });
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
      if (!response.ok) throw new Error('Failed to like template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Отлично!',
        description: 'Ваш голос учтен',
      });
    },
  });

  // Мутация для добавления в закладки
  const bookmarkTemplateMutation = useMutation({
    mutationFn: async ({ templateId, bookmarked }: { templateId: number; bookmarked: boolean }) => {
      const response = await fetch(`/api/templates/${templateId}/bookmark`, {
        method: 'POST',
        body: JSON.stringify({ bookmarked }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to bookmark template');
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
    { value: 'official', label: 'Официальные' },
    { value: 'business', label: 'Бизнес' },
    { value: 'education', label: 'Образование' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'utility', label: 'Утилиты' },
    { value: 'health', label: 'Здоровье' },
    { value: 'finance', label: 'Финансы' },
    { value: 'social', label: 'Социальные' },
    { value: 'custom', label: 'Пользовательские' },
  ];

  const getTemplateStats = (data: BotData) => {
    const nodes = data.nodes?.length || 0;
    const connections = data.connections?.length || 0;
    const commands = data.nodes?.filter(node => node.type === 'command').length || 0;
    const buttons = data.nodes?.reduce((total, node) => {
      return total + (node.data?.buttons?.length || 0);
    }, 0) || 0;

    return { nodes, connections, commands, buttons };
  };

  const filteredAndSortedTemplates = useMemo(() => {
    let currentTemplates = templates;
    
    // Фильтрация по вкладкам
    if (currentTab === 'featured') {
      currentTemplates = featuredTemplates;
    } else if (currentTab === 'popular') {
      currentTemplates = templates.filter(t => (t.useCount || 0) > 5);
    } else if (currentTab === 'my') {
      currentTemplates = myTemplates;
    }

    // Фильтрация по поиску
    if (searchTerm) {
      currentTemplates = currentTemplates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Фильтрация по категории
    if (selectedCategory !== 'all') {
      currentTemplates = currentTemplates.filter(template => template.category === selectedCategory);
    }

    // Сортировка
    const sorted = [...currentTemplates].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.useCount || 0) - (a.useCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'name':
          return a.name.localeCompare(b.name, 'ru');
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, featuredTemplates, myTemplates, currentTab, searchTerm, selectedCategory, sortBy]);

  const handleUseTemplate = (template: BotTemplate) => {
    useTemplateMutation.mutate(template.id);
    downloadTemplateMutation.mutate(template.id);
    
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      // Сохраняем выбранный шаблон в localStorage для загрузки в редакторе
      localStorage.setItem('selectedTemplate', JSON.stringify(template));
      setLocation('/');
    }
    
    toast({
      title: 'Шаблон загружен!',
      description: `Шаблон "${template.name}" успешно применен к вашему проекту`,
    });
  };

  const handlePreview = (template: BotTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleRateTemplate = (template: BotTemplate, rating: number) => {
    rateTemplateMutation.mutate({ templateId: template.id, rating });
  };

  const handleDeleteTemplate = (template: BotTemplate) => {
    if (confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

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
  }: {
    templates: BotTemplate[];
    isLoading: boolean;
    onPreview: (template: BotTemplate) => void;
    onUse: (template: BotTemplate) => void;
    onRate: (template: BotTemplate, rating: number) => void;
    onDelete?: (template: BotTemplate) => void;
    searchTerm: string;
    selectedCategory: string;
    showDeleteButton?: boolean;
  }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Шаблоны не найдены' 
              : 'Шаблоны пока не созданы'
            }
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all'
              ? 'Попробуйте изменить фильтры поиска'
              : 'Создайте свой первый шаблон бота'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 py-4">
        {templates.map((template: BotTemplate) => {
          const stats = getTemplateStats(template.data as BotData);
          
          return (
            <Card key={template.id} className="hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 border-muted/50 dark:border-muted/20 bg-card/50 dark:bg-card/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight mb-1 flex items-center gap-2">
                      {template.featured === 1 && (
                        <Crown className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{template.name}</span>
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {template.rating && template.rating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                          {template.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Основная статистика */}
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

  // Компоненты для layout
  const headerContent = (
    <div className="h-16 bg-background border-b border-border px-6 flex items-center justify-between relative">
      {/* Левая часть - логотип и название */}
      <div className="flex items-center space-x-3">
        <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">TelegramBot Builder</h1>
          <p className="text-xs text-muted-foreground">Шаблоны ботов</p>
        </div>
      </div>

      {/* Центральная часть - навигация табов */}
      <nav className="flex items-center space-x-1">
        {[
          { key: 'all', label: 'Все шаблоны', icon: Filter },
          { key: 'featured', label: 'Рекомендуемые', icon: Crown },
          { key: 'popular', label: 'Популярные', icon: TrendingUp },
          { key: 'my', label: 'Мои шаблоны', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`
                relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 
                flex items-center gap-2 group
                ${isActive 
                  ? 'text-primary bg-primary/10 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                isActive ? 'text-primary' : ''
              }`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Правая часть - действия и настройки */}
      <div className="flex items-center space-x-3">
        {/* Компактные настройки макета */}
        <SimpleLayoutCustomizer
          config={flexibleLayoutConfig}
          onConfigChange={setFlexibleLayoutConfig}
        />
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation('/')}
          className="transition-all hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к редактору
        </Button>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Категории</h2>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} orientation="vertical" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto">
          <TabsTrigger value="all" className="justify-start gap-2">
            <Filter className="h-4 w-4" />
            Все шаблоны
          </TabsTrigger>
          <TabsTrigger value="featured" className="justify-start gap-2">
            <Crown className="h-4 w-4" />
            Рекомендуемые
          </TabsTrigger>
          <TabsTrigger value="popular" className="justify-start gap-2">
            <TrendingUp className="h-4 w-4" />
            Популярные
          </TabsTrigger>
          <TabsTrigger value="my" className="justify-start gap-2">
            <User className="h-4 w-4" />
            Мои шаблоны
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Категория</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
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
        
        <div>
          <label className="text-sm font-medium mb-2 block">Сортировка</label>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full">
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
  );

  const canvasContent = (
    <div className="p-4 h-full">
      {showPreview && selectedTemplate ? (
        <TemplatePreview template={selectedTemplate} />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск шаблонов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="h-full overflow-y-auto">
            <TabsContent value="all" className="mt-0">
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
            
            <TabsContent value="featured" className="mt-0">
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
            
            <TabsContent value="popular" className="mt-0">
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
            
            <TabsContent value="my" className="mt-0">
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
        </div>
      )}
    </div>
  );

  const propertiesContent = (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Фильтры</h2>
      </div>
      
      {selectedTemplate && showPreview ? (
        <div className="space-y-4">
          <h3 className="font-medium">Информация о шаблоне</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Название:</span>
              <p className="text-muted-foreground">{selectedTemplate.name}</p>
            </div>
            {selectedTemplate.description && (
              <div>
                <span className="font-medium">Описание:</span>
                <p className="text-muted-foreground">{selectedTemplate.description}</p>
              </div>
            )}
            <div>
              <span className="font-medium">Категория:</span>
              <p className="text-muted-foreground">
                {categories.find(c => c.value === selectedTemplate.category)?.label || selectedTemplate.category}
              </p>
            </div>
            {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
              <div>
                <span className="font-medium">Теги:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <span className="font-medium">Всего шаблонов:</span>
            <p className="text-muted-foreground">{templates.length}</p>
          </div>
          <div>
            <span className="font-medium">Отфильтровано:</span>
            <p className="text-muted-foreground">{filteredAndSortedTemplates.length}</p>
          </div>
          {searchTerm && (
            <div>
              <span className="font-medium">Поиск:</span>
              <p className="text-muted-foreground">"{searchTerm}"</p>
            </div>
          )}
          <div>
            <span className="font-medium">Текущая вкладка:</span>
            <p className="text-muted-foreground">
              {currentTab === 'all' && 'Все шаблоны'}
              {currentTab === 'featured' && 'Рекомендуемые'}
              {currentTab === 'popular' && 'Популярные'}
              {currentTab === 'my' && 'Мои шаблоны'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab}>
      <SimpleLayoutCustomizer
        config={flexibleLayoutConfig}
        onConfigChange={setFlexibleLayoutConfig}
      >
        <FlexibleLayout
          config={flexibleLayoutConfig}
          headerContent={headerContent}
          sidebarContent={sidebarContent}
          canvasContent={canvasContent}
          propertiesContent={propertiesContent}
        />
      </SimpleLayoutCustomizer>
    </Tabs>
  );
}

export default TemplatesPage;