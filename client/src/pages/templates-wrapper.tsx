import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Download, Eye, ArrowLeft, Star } from 'lucide-react';
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
      // Явно инвалидируем кеш при входе
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
    }
  }, [user]);

  const { data: myTemplates = [], isLoading: isLoadingMy } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/category/custom', user?.id || 'guest'],
    queryFn: async () => {
      // Проверяем есть ли сохраненные шаблоны в localStorage для гостей
      const myTemplateIds = localStorage.getItem('myTemplateIds');
      
      // Только для гостей добавляем параметр ids
      // Для авторизованных пользователей сервер автоматически вернет их шаблоны по сессии
      const idsParam = (myTemplateIds && myTemplateIds.length > 0 && !user) ? `?ids=${myTemplateIds}` : '';
      const response = await fetch(`/api/templates/category/custom${idsParam}`);
      return response.json();
    }
  });

  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'official', label: 'Официальные' },
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
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      currentTemplates = currentTemplates.filter(template => template.category === selectedCategory);
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
            <div className="space-y-4">
              {/* Поиск и фильтры */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Поиск шаблонов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
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
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Популярные</SelectItem>
                    <SelectItem value="rating">Рейтинг</SelectItem>
                    <SelectItem value="recent">Новые</SelectItem>
                    <SelectItem value="name">По алфавиту</SelectItem>
                  </SelectContent>
                </Select>
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
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoading} onUse={handleUseTemplate} />
                </TabsContent>
                
                <TabsContent value="featured" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoadingFeatured} onUse={handleUseTemplate} />
                </TabsContent>
                
                <TabsContent value="popular" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoading} onUse={handleUseTemplate} />
                </TabsContent>
                
                <TabsContent value="my" className="mt-4">
                  <TemplateGrid templates={filteredAndSortedTemplates} isLoading={isLoadingMy} onUse={handleUseTemplate} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для сетки шаблонов
function TemplateGrid({ templates, isLoading, onUse }: { 
  templates: BotTemplate[], 
  isLoading: boolean, 
  onUse: (template: BotTemplate) => void 
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                )}
              </div>
              {template.rating && template.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">{template.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{template.viewCount || 0}</span>
                <Download className="h-4 w-4 ml-2" />
                <span>{template.downloadCount || 0}</span>
              </div>
              <Button size="sm" onClick={() => onUse(template)}>
                Использовать
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}