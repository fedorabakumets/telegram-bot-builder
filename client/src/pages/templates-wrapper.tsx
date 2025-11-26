import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Download, ArrowLeft, Star, Trash2, Filter, SortAsc } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTelegramAuth } from '@/hooks/use-telegram-auth';
import type { BotTemplate } from '@shared/schema';

// Простая версия страницы шаблонов без сложной системы макетов
export default function TemplatesPageWrapper() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'name'>('popular');
  const { toast } = useToast();
  const { user } = useTelegramAuth();

  const { data: templates = [], isLoading } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const { data: featuredTemplates = [], isLoading: isLoadingFeatured } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/featured'],
    enabled: currentTab === 'featured',
  });

  // Очищаем локальный стейт гостя при авторизации
  useEffect(() => {
    if (user) {
      // Если пользователь авторизован - очищаем localStorage ID шаблонов гостя
      // Теперь используются данные из БД
      localStorage.removeItem('myTemplateIds');
      // КРИТИЧНО: удаляем старый кеш гостя и переполняем с новым user ID
      queryClient.removeQueries({ queryKey: ['/api/templates/category/custom', 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    }
  }, [user]);

  const { data: myTemplates = [], isLoading: isLoadingMy } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/category/custom', user?.id || 'guest'],
    queryFn: async () => {
      try {
        // Проверяем есть ли сохраненные шаблоны в localStorage для гостей
        const myTemplateIds = localStorage.getItem('myTemplateIds');
        
        // Только для гостей добавляем параметр ids
        // Для авторизованных пользователей сервер автоматически вернет их шаблоны по сессии
        const idsParam = (myTemplateIds && myTemplateIds.length > 0 && !user) ? `?ids=${myTemplateIds}` : '';
        console.log('📝 Fetching custom templates:', { user: user?.id, isGuest: !user, idsParam });
        
        const response = await fetch(`/api/templates/category/custom${idsParam}`, {
          credentials: 'include', // КРИТИЧНО: отправляем cookies для сессии!
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.error('❌ Failed to fetch templates:', response.status, response.statusText);
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Custom templates loaded:', data?.length || 0);
        return data;
      } catch (error) {
        console.error('❌ Error fetching custom templates:', error);
        throw error;
      }
    },
  });

  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'official', label: 'Официальные' },
    { value: 'userTemplates', label: 'Пользовательские' },
    { value: 'community', label: 'Сообщество' },
    { value: 'business', label: 'Бизнес' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'education', label: 'Образование' },
    { value: 'utility', label: 'Утилиты' },
    { value: 'games', label: 'Игры' }
  ];

  const filteredAndSortedTemplates = useMemo(() => {
    let currentTemplates = templates;
    
    if (currentTab === 'featured') {
      currentTemplates = featuredTemplates;
    } else if (currentTab === 'popular') {
      currentTemplates = templates.filter(t => (t.useCount || 0) > 5);
    } else if (currentTab === 'my') {
      currentTemplates = myTemplates;
    }

    if (searchTerm) {
      currentTemplates = currentTemplates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        template.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'official') {
        // Официальные шаблоны - это системные шаблоны (ownerId === null)
        currentTemplates = currentTemplates.filter(template => template.ownerId === null);
      } else if (selectedCategory === 'userTemplates') {
        // Пользовательские шаблоны - это все что не официальные (ownerId !== null)
        currentTemplates = currentTemplates.filter(template => template.ownerId !== null);
      } else {
        // Остальные категории - фильтруем по полю category
        currentTemplates = currentTemplates.filter(template => template.category === selectedCategory);
      }
    }

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

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to increment use count');
      return response.json();
    },
    onSuccess: () => {
      // Инвалидируем кеш проектов и шаблонов
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      toast({
        title: "✅ Успешно!",
        description: "Шаблон добавлен в ваши проекты и коллекцию",
      });
    },
    onError: () => {
      toast({
        title: "❌ Ошибка",
        description: "Не удалось использовать шаблон",
        variant: "destructive"
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/user/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "✅ Шаблон удален",
        description: "Ваш шаблон успешно удален",
      });
    },
    onError: () => {
      toast({
        title: "❌ Ошибка",
        description: "Не удалось удалить шаблон",
        variant: "destructive"
      });
    }
  });

  const handleUseTemplate = (template: BotTemplate) => {
    useTemplateMutation.mutate(template.id);
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    
    // Сохраняем ID шаблона в список "моих" для гостей (для оффлайна)
    const myTemplateIds = localStorage.getItem('myTemplateIds') || '';
    const ids = new Set(myTemplateIds.split(',').filter(Boolean).map(Number));
    ids.add(template.id);
    localStorage.setItem('myTemplateIds', Array.from(ids).join(','));
    
    setLocation('/');
    
    toast({
      title: 'Шаблон загружен!',
      description: `Шаблон "${template.name}" будет применен к вашему проекту`,
    });
  };

  const handleDeleteTemplate = (template: BotTemplate) => {
    if (window.confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"? Это действие нельзя отменить.`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к редактору
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Шаблоны ботов</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Содержимое */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Основной контент */}
          <div className="flex-1">
            <div className="space-y-3 xs:space-y-4 sm:space-y-4">
              {/* Поиск и фильтры */}
              <div className="rounded-lg border border-border/50 bg-card/50 dark:bg-card/30 p-2.5 xs:p-3 sm:p-4 space-y-2.5 xs:space-y-3">
                {/* Поиск */}
                <div className="relative group">
                  <Search className="absolute left-2.5 xs:left-3 top-1/2 transform -translate-y-1/2 text-blue-400/60 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Поиск шаблонов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 xs:pl-9 h-9 xs:h-10 text-xs xs:text-sm border-border/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                {/* Фильтры и сортировка */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-2.5">
                  <div className="flex-1 relative z-40">
                    <div className="flex items-center gap-1.5 mb-1.5 xs:hidden">
                      <Filter className="h-3 xs:h-3.5 w-3 xs:w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Категория</span>
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full h-8 xs:h-9 text-xs xs:text-sm border-border/50 hover:border-border/80 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <Filter className="h-3.5 xs:h-4 w-3.5 xs:w-4 hidden xs:block text-muted-foreground" />
                          <SelectValue placeholder="Категория" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 relative z-40">
                    <div className="flex items-center gap-1.5 mb-1.5 xs:hidden">
                      <SortAsc className="h-3 xs:h-3.5 w-3 xs:w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Сортировка</span>
                    </div>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-full h-8 xs:h-9 text-xs xs:text-sm border-border/50 hover:border-border/80 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <SortAsc className="h-3.5 xs:h-4 w-3.5 xs:w-4 hidden xs:block text-muted-foreground" />
                          <SelectValue placeholder="Сортировка" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="popular">Популярные</SelectItem>
                        <SelectItem value="rating">Рейтинг</SelectItem>
                        <SelectItem value="recent">Новые</SelectItem>
                        <SelectItem value="name">По алфавиту</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Вкладки */}
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList>
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="featured">Рекомендуемые</TabsTrigger>
                  <TabsTrigger value="popular">Популярные</TabsTrigger>
                  <TabsTrigger value="my">Мои</TabsTrigger>
                </TabsList>

                {/* Контент вкладок */}
                <TabsContent value="all" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoading} onUse={handleUseTemplate} showDelete={false} onDelete={handleDeleteTemplate} />
                </TabsContent>
                
                <TabsContent value="featured" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoadingFeatured} onUse={handleUseTemplate} showDelete={false} onDelete={handleDeleteTemplate} />
                </TabsContent>
                
                <TabsContent value="popular" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoading} onUse={handleUseTemplate} showDelete={false} onDelete={handleDeleteTemplate} />
                </TabsContent>
                
                <TabsContent value="my" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoadingMy} onUse={handleUseTemplate} showDelete={true} onDelete={handleDeleteTemplate} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Функция преобразования категории в русское название
function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    'business': 'Бизнес',
    'community': 'Сообщество',
    'custom': 'Пользовательский',
    'entertainment': 'Развлечения',
    'education': 'Образование',
    'utility': 'Утилиты',
    'games': 'Игры',
    'official': 'Официальный'
  };
  return categoryMap[category] || category;
}

// Компонент для сетки шаблонов
function TemplateGrid({ templates, isLoading, onUse, showDelete, onDelete }: { 
  templates: BotTemplate[], 
  isLoading: boolean, 
  onUse: (template: BotTemplate) => void,
  showDelete: boolean,
  onDelete: (template: BotTemplate) => void
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Шаблоны не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
      {templates.map((template) => (
        <Card key={template.id} className="border border-border/50 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200 flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-2 xs:pb-2.5 sm:pb-3">
            <div className="flex items-start justify-between gap-1.5 xs:gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm xs:text-base sm:text-lg font-bold leading-tight truncate">{template.name}</CardTitle>
                <div className="flex items-center flex-wrap gap-1 xs:gap-1.5 mt-1.5 xs:mt-2">
                  {template.ownerId === null ? (
                    <>
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                        Официальный
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(template.category || 'official')}
                      </Badge>
                    </>
                  ) : template.authorName ? (
                    <Badge variant="secondary" title={template.authorName} className="text-xs">
                      От @{template.authorName}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                      🤝 От сообщества
                    </Badge>
                  )}
                  {showDelete && (
                    <Badge variant={template.isPublic === 1 ? "outline" : "secondary"} className={`text-xs ${template.isPublic === 1 ? "border-green-500 text-green-600 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"}`}>
                      {template.isPublic === 1 ? '🌍' : '🔒'}
                    </Badge>
                  )}
                </div>
              </div>
              {(template.rating ?? 0) > 0 && (
                <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 xs:px-2 py-1 rounded-md">
                  <Star className="h-3 xs:h-3.5 w-3 xs:w-3.5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                  <span className="text-xs xs:text-sm font-semibold text-yellow-700 dark:text-yellow-300">{(template.rating ?? 0).toFixed(1)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2 xs:gap-2.5 p-2 xs:p-2.5 sm:p-3">
            {template.description && (
              <CardDescription className="text-xs xs:text-sm line-clamp-2 flex-1">{template.description}</CardDescription>
            )}
            <div className="space-y-2 xs:space-y-2.5 mt-auto">
              <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5 xs:py-2">
                <Download className="h-3 xs:h-3.5 w-3 xs:w-3.5 flex-shrink-0" />
                <span>{template.useCount || 0} исп.</span>
              </div>
              <div className="flex gap-1.5 xs:gap-2">
                <Button size="sm" className="flex-1 h-8 xs:h-9 text-xs xs:text-sm" onClick={() => onUse(template)}>
                  Использовать
                </Button>
                {showDelete && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => onDelete(template)}
                    className="h-8 xs:h-9 px-2 xs:px-2.5"
                    data-testid="button-delete-template"
                  >
                    <Trash2 className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}