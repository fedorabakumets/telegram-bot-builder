import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Search, Download, Eye, Calendar, User, Filter, Star, TrendingUp, 
  Crown, Sparkles, Trash2, Heart, Bookmark, Clock, Globe, Shield, Upload,
  BarChart3, Users, Zap, Award, ArrowRight, Grid3X3, Play, CheckCircle,
  ArrowLeft, Home, Library
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TemplateImport } from '@/components/import-export';
import type { BotTemplate } from '@shared/schema';
import type { BotData } from '@/types/bot';

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BotTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'name'>('popular');
  const [showImport, setShowImport] = useState(false);

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
    staleTime: 0,
  });

  // Мутации для работы с шаблонами
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
    
    let filtered = templatesData.filter((template: BotTemplate) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (currentTab === 'popular') {
      filtered = filtered.filter(t => (t.useCount || 0) > 0);
    }

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
      await useTemplateMutation.mutateAsync(template.id);
      
      toast({
        title: 'Шаблон отмечен как использованный',
        description: `Шаблон "${template.name}" готов к работе`,
      });
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <Button size="sm" onClick={() => setShowPreview(false)}>
            Закрыть предпросмотр
          </Button>
        </div>
        
        {template.description && (
          <p className="text-muted-foreground text-lg">{template.description}</p>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Узлов</div>
            <div className="text-3xl font-bold text-primary">{stats.nodes}</div>
          </div>
          <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Связей</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.connections}</div>
          </div>
          <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Команд</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.commands}</div>
          </div>
          <div className="p-4 bg-muted dark:bg-muted/50 rounded-lg">
            <div className="font-medium">Кнопок</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.buttons}</div>
          </div>
        </div>
        
        {template.tags && template.tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Теги:</h4>
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <Button onClick={() => handleUseTemplate(template)} className="flex-1" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Использовать шаблон
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg">
              <Home className="h-5 w-5 mr-2" />
              Перейти в редактор
            </Button>
          </Link>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4 text-6xl">📚</div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Шаблоны не найдены' 
                : 'Пока нет сохраненных шаблонов'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all'
                ? 'Попробуйте изменить фильтры или поисковый запрос'
                : 'Создайте свой первый шаблон в редакторе ботов'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template: BotTemplate) => {
          const stats = getTemplateStats(template.data as BotData);
          
          return (
            <Card key={template.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/30 hover:scale-[1.02]">
              {template.featured === 1 && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                    <Crown className="h-3 w-3" />
                    Топ
                  </div>
                </div>
              )}
              
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <CardHeader className="pb-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{template.authorName || 'Система'}</span>
                    
                    {template.category && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{template.category}</span>
                      </>
                    )}
                    
                    {template.difficulty && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                          {difficultyLabels[template.difficulty as keyof typeof difficultyLabels]}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                    <Grid3X3 className="h-4 w-4 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                    <div className="font-semibold text-blue-700 dark:text-blue-300">{stats.nodes}</div>
                    <div className="text-blue-600 dark:text-blue-400">узлов</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    <ArrowRight className="h-4 w-4 mx-auto mb-1 text-green-600 dark:text-green-400" />
                    <div className="font-semibold text-green-700 dark:text-green-300">{stats.connections}</div>
                    <div className="text-green-600 dark:text-green-400">связей</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                    <div className="font-semibold text-purple-700 dark:text-purple-300">{stats.commands}</div>
                    <div className="text-purple-600 dark:text-purple-400">команд</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                    <CheckCircle className="h-4 w-4 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                    <div className="font-semibold text-orange-700 dark:text-orange-300">{stats.buttons}</div>
                    <div className="text-orange-600 dark:text-orange-400">кнопок</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{template.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>{template.useCount || 0}</span>
                    </div>
                    {(template.rating || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{template.rating?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {template.createdAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(template.createdAt), 'dd.MM.yyyy', { locale: ru })}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onPreview(template)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Просмотр
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => onUse(template)}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Использовать
                  </Button>
                  {showDeleteButton && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(template)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onRate(template, star)}
                        className="text-gray-300 hover:text-yellow-400 transition-colors"
                      >
                        <Star className={`h-3 w-3 ${(template.rating || 0) >= star ? 'fill-yellow-400 text-yellow-400' : ''}`} />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Enhanced Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <Button variant="ghost" size="lg" className="group">
                  <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Вернуться в редактор
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Библиотека шаблонов
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Готовые решения для создания ботов
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground"
              >
                <Upload className="h-4 w-4" />
                Импорт шаблона
              </Button>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Создать бота
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Всего шаблонов</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Рекомендуемых</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{featuredTemplates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Популярных</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {templates.filter(t => (t.useCount || 0) > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Мои шаблоны</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{myTemplates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-8">
        {showPreview && selectedTemplate ? (
          <TemplatePreview template={selectedTemplate} />
        ) : (
          <div className="space-y-6">
            {/* Enhanced Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-4 max-w-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-1 rounded-xl border shadow-lg">
                  <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                    <Filter className="h-4 w-4" />
                    Все шаблоны
                  </TabsTrigger>
                  <TabsTrigger value="featured" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                    <Crown className="h-4 w-4" />
                    Рекомендуемые
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                    <TrendingUp className="h-4 w-4" />
                    Популярные
                  </TabsTrigger>
                  <TabsTrigger value="my" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                    <User className="h-4 w-4" />
                    Мои шаблоны
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm">
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
                <div className="w-full sm:w-48">
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
                <div className="w-full sm:w-36">
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

              {/* Template Content */}
              <TabsContent value="all">
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
              
              <TabsContent value="featured">
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
              
              <TabsContent value="popular">
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
              
              <TabsContent value="my">
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
          </div>
        )}
      </div>

      <TemplateImport
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={(result) => {
          toast({
            title: "Импорт завершен",
            description: result.message,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
          queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
        }}
      />
    </div>
  );
}