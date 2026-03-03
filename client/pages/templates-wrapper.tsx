import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, ArrowLeft, Star, Trash2, Filter, SortAsc, Layers, Sparkles, Flame, Bookmark, Eye, Users, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import type { BotTemplate } from '@shared/schema';

/**
 * Простая версия страницы шаблонов без сложной системы макетов
 *
 * Этот компонент представляет собой упрощенную версию страницы шаблонов,
 * которая не использует сложную систему макетов. Он предоставляет
 * функциональность поиска, фильтрации и использования шаблонов ботов.
 *
 * @returns JSX элемент страницы шаблонов
 */
export default function TemplatesPageWrapper() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'name'>('popular');
  const { toast } = useToast();
  const { user } = useTelegramAuth();

  const { data: templates = [], isLoading, isError } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates'],
    retry: 2, // Повторить запрос 2 раза в случае ошибки
    staleTime: 10 * 60 * 1000, // Считать данные свежими 10 минут
    gcTime: 15 * 60 * 1000, // Время жизни неиспользуемых данных в кэше 15 минут
  });

  const { data: featuredTemplates = [], isLoading: isLoadingFeatured, isError: isFeaturedError } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/featured'],
    enabled: currentTab === 'featured',
    retry: 2,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  /**
   * Эффект для очистки локального состояния гостя при авторизации
   *
   * При авторизации пользователя удаляет локальное хранилище ID шаблонов гостя
   * и инвалидирует соответствующие кэши для обновления данных.
   */
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

  const { data: myTemplates = [], isLoading: isLoadingMy, isError: isMyError } = useQuery<BotTemplate[]>({
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
    retry: 2,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
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
    onError: (error) => {
      console.error('Ошибка при использовании шаблона:', error);
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
    onError: (error) => {
      console.error('Ошибка при удалении шаблона:', error);
      toast({
        title: "❌ Ошибка",
        description: "Не удалось удалить шаблон",
        variant: "destructive"
      });
    }
  });

  /**
   * Обработчик использования шаблона
   *
   * Вызывается при выборе пользователем шаблона для использования.
   * Обновляет счетчики использования, сохраняет шаблон в localStorage
   * и перенаправляет пользователя в редактор.
   *
   * @param template - выбранный шаблон
   */
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

  /**
   * Обработчик удаления шаблона
   *
   * Запрашивает подтверждение у пользователя и удаляет шаблон,
   * если пользователь подтверждает удаление.
   *
   * @param template - шаблон для удаления
   */
  const handleDeleteTemplate = (template: BotTemplate) => {
    if (window.confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"? Это действие нельзя отменить.`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  // Показываем сообщение об ошибке, если произошла ошибка загрузки
  if (isError || isFeaturedError || isMyError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Ошибка загрузки шаблонов</h2>
          <p className="text-muted-foreground mb-4">
            Произошла ошибка при загрузке шаблонов. Пожалуйста, обновите страницу.
          </p>
          <Button onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
        </div>
      </div>
    );
  }

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
              {/* Поиск и фильтры - Современный дизайн */}
              <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card/60 to-card/40 dark:from-card/50 dark:to-card/30 p-3 xs:p-4 sm:p-5 space-y-3 xs:space-y-4 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
                {/* Поиск с улучшенным стилем */}
                <div className="relative group">
                  <Search className="absolute left-3 xs:left-3.5 top-1/2 transform -translate-y-1/2 text-blue-500/50 h-4 w-4 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
                  <Input
                    placeholder="Поиск шаблонов по названию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 xs:pl-10 h-10 xs:h-11 text-sm xs:text-base border border-border/50 rounded-lg bg-background/80 hover:bg-background hover:border-border/70 focus:border-blue-500/60 focus:ring-blue-500/15 transition-all duration-200 shadow-sm"
                  />
                </div>

                {/* Фильтры и сортировка - Современный макет */}
                <div className="flex flex-col xs:flex-row gap-2.5 xs:gap-3">
                  {/* Категория */}
                  <div className="flex-1 relative z-40">
                    <div className="flex items-center gap-1.5 mb-2 xs:mb-0 xs:mb-0">
                      <Filter className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs xs:text-sm font-semibold text-foreground/70 uppercase tracking-wide">Категория</span>
                      {selectedCategory !== 'all' && (
                        <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {categories.find(c => c.value === selectedCategory)?.label}
                        </Badge>
                      )}
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full h-9 xs:h-10 text-xs xs:text-sm border border-border/60 rounded-lg bg-background/80 hover:bg-background hover:border-blue-500/40 dark:hover:border-blue-400/40 focus:border-blue-500/60 focus:ring-blue-500/15 transition-all duration-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-blue-600 dark:text-blue-400 hidden xs:block" />
                          <SelectValue placeholder="Выбрать категорию" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="z-50 rounded-lg">
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="text-sm">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Сортировка */}
                  <div className="flex-1 relative z-40">
                    <div className="flex items-center gap-1.5 mb-2 xs:mb-0 xs:mb-0">
                      <SortAsc className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs xs:text-sm font-semibold text-foreground/70 uppercase tracking-wide">Сортировка</span>
                      {sortBy !== 'popular' && (
                        <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          {sortBy === 'rating' ? 'По рейтингу' : sortBy === 'recent' ? 'Новые' : 'По алфавиту'}
                        </Badge>
                      )}
                    </div>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-full h-9 xs:h-10 text-xs xs:text-sm border border-border/60 rounded-lg bg-background/80 hover:bg-background hover:border-amber-500/40 dark:hover:border-amber-400/40 focus:border-amber-500/60 focus:ring-amber-500/15 transition-all duration-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-amber-600 dark:text-amber-400 hidden xs:block" />
                          <SelectValue placeholder="Сортировка" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="z-50 rounded-lg">
                        <SelectItem value="popular" className="text-sm">Популярные</SelectItem>
                        <SelectItem value="rating" className="text-sm">По рейтингу</SelectItem>
                        <SelectItem value="recent" className="text-sm">Новые</SelectItem>
                        <SelectItem value="name" className="text-sm">По алфавиту</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Активные фильтры - индикатор */}
                {(searchTerm || selectedCategory !== 'all' || sortBy !== 'popular') && (
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground">Фильтры активны:</span>
                      {searchTerm && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                          Поиск: {searchTerm}
                        </Badge>
                      )}
                      {selectedCategory !== 'all' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                          {categories.find(c => c.value === selectedCategory)?.label}
                        </Badge>
                      )}
                      {sortBy !== 'popular' && (
                        <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                          Сортировка: {sortBy === 'rating' ? 'По рейтингу' : sortBy === 'recent' ? 'Новые' : 'По алфавиту'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Вкладки - Современный дизайн */}
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid grid-cols-4 gap-1.5 xs:gap-2 bg-background/50 dark:bg-background/30 p-1.5 xs:p-2 h-auto rounded-xl border border-border/40 backdrop-blur-sm hover:border-border/60 transition-all">
                  <TabsTrigger
                    value="all"
                    className="flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 text-xs xs:text-sm font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-blue-500/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 hover:bg-muted/60 active:scale-95"
                  >
                    <Layers className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Все</span>
                    <span className="xs:hidden">Все</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="featured"
                    className="flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 text-xs xs:text-sm font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-yellow-500/20 data-[state=active]:border data-[state=active]:border-amber-500/40 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300 hover:bg-muted/60 active:scale-95"
                  >
                    <Sparkles className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" />
                    <span>Рекомендуемые</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="popular"
                    className="flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 text-xs xs:text-sm font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border data-[state=active]:border-red-500/40 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300 hover:bg-muted/60 active:scale-95"
                  >
                    <Flame className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Популярные</span>
                    <span className="xs:hidden">Популярные</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="my"
                    className="flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 text-xs xs:text-sm font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border data-[state=active]:border-purple-500/40 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 hover:bg-muted/60 active:scale-95"
                  >
                    <Bookmark className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Мои</span>
                    <span className="xs:hidden">Мои</span>
                  </TabsTrigger>
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

/**
 * Функция преобразования категории в русское название
 *
 * Преобразует внутреннее название категории шаблона в человекочитаемое
 * русское название для отображения пользователю.
 *
 * @param category - внутреннее название категории
 * @returns русское название категории или оригинальное название, если не найдено
 */
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

/**
 * Компонент для отображения сетки шаблонов
 *
 * Отображает шаблоны в виде сетки карточек с возможностью использования
 * и удаления (если разрешено).
 *
 * @param props - свойства компонента
 * @param props.templates - массив шаблонов для отображения
 * @param props.isLoading - флаг загрузки данных
 * @param props.onUse - функция обратного вызова при использовании шаблона
 * @param props.showDelete - флаг отображения кнопки удаления
 * @param props.onDelete - функция обратного вызова при удалении шаблона
 * @returns JSX элемент сетки шаблонов
 */
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
      {templates.map((template) => {
        // Проверяем, что template имеет все необходимые свойства
        if (!template || typeof template.id === 'undefined') {
          console.warn('Некорректный шаблон:', template);
          return null;
        }

        return (
          <Card
            key={template.id}
            className="group border border-border/40 shadow-sm hover:shadow-lg hover:border-border/70 transition-all duration-300 flex flex-col h-full overflow-hidden bg-gradient-to-br from-card/60 to-card/40 dark:from-card/50 dark:to-card/30 hover:from-blue-500/5 hover:to-cyan-500/5 dark:hover:from-blue-900/10 dark:hover:to-cyan-900/10 hover:scale-105"
          >
            {/* Gradient overlay для красивого эффекта */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:animate-pulse transition-opacity duration-300 rounded-lg" />

            <CardHeader className="pb-2.5 xs:pb-3 sm:pb-4 relative z-10">
              <div className="flex items-start justify-between gap-2 xs:gap-2.5">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm xs:text-base sm:text-lg font-bold leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{template.name}</CardTitle>
                  <div className="flex items-center flex-wrap gap-1.5 xs:gap-2 mt-2 xs:mt-2.5">
                    {template.ownerId === null ? (
                      <>
                        <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold shadow-sm">
                          <Globe className="w-2.5 h-2.5 mr-1 hidden xs:inline" />
                          Официальный
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                          {getCategoryLabel(template.category || 'official')}
                        </Badge>
                      </>
                    ) : template.authorName ? (
                      <Badge variant="secondary" title={template.authorName} className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        <Users className="w-2.5 h-2.5 mr-1 hidden xs:inline" />
                        От @{template.authorName}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                        <Users className="w-2.5 h-2.5 mr-1 hidden xs:inline" />
                        От сообщества
                      </Badge>
                    )}
                    {showDelete && (
                      <Badge
                        variant={template.isPublic === 1 ? "outline" : "secondary"}
                        className={`text-xs font-medium ${template.isPublic === 1 ? "border-green-200/50 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}
                      >
                        {template.isPublic === 1 ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        <span className="ml-1 hidden xs:inline">{template.isPublic === 1 ? 'Публичный' : 'Приватный'}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                {(template.rating ?? 0) > 0 && (
                  <div className="flex items-center gap-1 ml-auto flex-shrink-0 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 px-2 xs:px-2.5 py-1.5 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 group-hover:shadow-md transition-all">
                    <Star className="h-3.5 xs:h-4 w-3.5 xs:w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                    <span className="text-xs xs:text-sm font-bold text-yellow-700 dark:text-yellow-300">{(template.rating ?? 0).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-3 xs:gap-3.5 p-3 xs:p-3.5 sm:p-4 relative z-10">
              {template.description && (
                <CardDescription className="text-xs xs:text-sm line-clamp-2 flex-1 text-muted-foreground group-hover:text-foreground/70 transition-colors">{template.description}</CardDescription>
              )}

              <div className="space-y-2.5 xs:space-y-3 mt-auto">
                {/* Статистика */}
                <div className="flex items-center gap-2 xs:gap-2.5 text-xs xs:text-sm text-muted-foreground bg-gradient-to-r from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/10 rounded-lg px-2.5 xs:px-3 py-2 xs:py-2.5 border border-border/20 group-hover:border-border/40 transition-all group-hover:shadow-sm">
                  <Eye className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0 text-blue-500/70" />
                  <span className="font-medium">{template.useCount || 0}</span>
                  <span className="text-muted-foreground/60">использований</span>
                </div>

                {/* Кнопки действия */}
                <div className="flex gap-2 xs:gap-2.5 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 h-9 xs:h-10 text-xs xs:text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm hover:shadow-md transition-all group-hover:scale-105"
                    onClick={() => onUse(template)}
                    data-testid="button-use-template"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Использовать
                  </Button>
                  {showDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(template)}
                      className="h-9 xs:h-10 px-2.5 xs:px-3 border-red-200/50 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
                      data-testid="button-delete-template"
                    >
                      <Trash2 className="h-3.5 xs:h-4 w-3.5 xs:w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }).filter(Boolean)} {/* Фильтруем null значения, которые могут возникнуть при ошибках */}
    </div>
  );
}