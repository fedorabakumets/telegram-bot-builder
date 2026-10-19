import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Grid2X2, List, SlidersHorizontal } from 'lucide-react';
import { ThemeToggle } from '@/components/editor/header/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import type { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { isGuest } from '@/types/telegram-user';
import { AccountSidebar } from '@/components/projects/account-sidebar';
import { ProjectCard } from '@/components/projects/project-card';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Название проекта обязательно'),
  description: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

/**
 * Компонент главной страницы приложения BotCraft Studio.
 *
 * @component
 * @description
 * Главная страница приложения, предоставляющая интерфейс для управления проектами Telegram ботов.
 * Позволяет создавать новые проекты, просматривать существующие, удалять их и переходить к редактированию.
 * Также предоставляет доступ к сценариям ботов и возможность авторизации через Telegram.
 *
 * @example
 * // Использование компонента:
 * import Home from '@/pages/home';
 *
 * return <Home />;
 *
 * @returns {JSX.Element} Возвращает JSX элемент, представляющий собой главную страницу приложения.
 * Страница содержит заголовок с названием приложения, кнопки для создания новых проектов,
 * список существующих проектов с информацией о них и действиями, а также панель навигации.
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, sessionReady } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();
  const isGuestUser = !user || isGuest(user);

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', description: '' },
  });

  // Загрузка активных проектов для списка на главной
  const { data: projects = [], isLoading: isLoadingActive } = useQuery<BotProject[]>({
    queryKey: ['/api/projects/list', 'active'],
    queryFn: () => apiRequest('GET', '/api/projects/list?archived=false'),
    enabled: !isGuestUser && sessionReady,
  });

  const needArchivedCheck = !isGuestUser && sessionReady && !isLoadingActive && projects.length === 0;

  const { data: archivedProjects = [], isLoading: isLoadingArchived } = useQuery<BotProject[]>({
    queryKey: ['/api/projects/list', 'archived'],
    queryFn: () => apiRequest('GET', '/api/projects/list?archived=true'),
    enabled: needArchivedCheck,
  });

  const isLoading = isLoadingActive || (needArchivedCheck && isLoadingArchived);

  /**
   * Если активных нет, но есть архивные — открываем первый архивный в редакторе.
   * На /not-found уходим только когда проектов нет вообще.
   */
  useEffect(() => {
    if (!sessionReady || isLoading || isGuestUser) return;

    if (projects.length === 0 && archivedProjects.length > 0) {
      setLocation(`/editor/${archivedProjects[0].id}`);
      return;
    }

  }, [sessionReady, isLoading, isGuestUser, projects.length, archivedProjects, setLocation]);

  // Создание нового проекта
  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectForm) => apiRequest('POST', '/api/projects', {
      ...data,
      data: {
        nodes: [
          {
            id: 'start-message',
            type: 'message',
            position: { x: 400, y: 300 },
            data: {
              messageText: 'Привет! Я ваш новый бот.',
              keyboardType: 'none',
              buttons: [],
              showInMenu: true,
            }
          },
          {
            id: 'start-command-trigger',
            type: 'command_trigger',
            position: { x: 100, y: 300 },
            data: {
              command: '/start',
              description: 'Запустить бота',
              showInMenu: true,
              autoTransitionTo: 'start-message',
              sourceNodeId: 'start-message',
            }
          }
        ],
        connections: []
      }
    }),
    onSuccess: (newProject: BotProject) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Проект создан", description: `Проект "${newProject.name}" успешно создан` });
      setIsCreateDialogOpen(false);
      form.reset();
      setLocation(`/editor/${newProject.id}`);
    },
    onError: () => {
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать проект",
        variant: "destructive",
      });
    }
  });

  // Удаление проекта
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: number) => apiRequest('DELETE', `/api/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Проект удален",
        description: "Проект успешно удален",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить проект",
        variant: "destructive",
      });
    }
  });

  const handleCreateProject = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };

  const handleDeleteProject = (project: BotProject) => {
    if (confirm(`Вы уверены, что хотите удалить проект "${project.name}"? Это действие нельзя отменить.`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Неизвестно';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNodeCount = (project: any) => {
    // Используем предподсчитанное поле с сервера
    if (typeof project.nodeCount === 'number') return project.nodeCount;
    if (!project.data || typeof project.data !== 'object') return 0;
    if (SheetsManager.isNewFormat(project.data)) {
      const sheets = (project.data as any).sheets || [];
      return sheets.reduce((total: number, sheet: any) => total + (sheet.nodes?.length || 0), 0);
    }
    return (project.data as { nodes?: any[] }).nodes?.length || 0;
  };

  const getSheetsInfo = (project: any) => {
    // Используем предподсчитанное поле с сервера
    if (typeof project.sheetsCount === 'number') {
      return { count: project.sheetsCount, names: [] };
    }
    if (!project.data || typeof project.data !== 'object') return { count: 0, names: [] };
    if (SheetsManager.isNewFormat(project.data)) {
      const sheets = (project.data as any).sheets || [];
      return { count: sheets.length, names: sheets.map((s: any) => s.name || 'Лист') };
    }
    return { count: 1, names: ['Главный лист'] };
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'name'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  /** Отбирает и сортирует проекты для текущего представления */
  const visibleProjects = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('ru-RU');
    return [...projects]
      .filter((project) => !query || project.name.toLocaleLowerCase('ru-RU').includes(query)
        || project.description?.toLocaleLowerCase('ru-RU').includes(query))
      .sort((a, b) => sortMode === 'name'
        ? a.name.localeCompare(b.name, 'ru')
        : new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }, [projects, searchQuery, sortMode]);


  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-gray-400 text-xl"></i>
          </div>
          <p className="text-gray-600">Загрузка проектов...</p>
        </div>
      </div>
    );
  }

  // Гость — показываем экран входа
  if (isGuestUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">BotCraft Studio</h2>
          <p className="text-muted-foreground">Войдите через Telegram чтобы управлять своими проектами</p>
          <Button onClick={handleTelegramLogin} size="lg" className="w-full">
            Войти через Telegram
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-background">
      <AccountSidebar />
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border/60 px-5 lg:px-8">
          <div><p className="text-sm font-semibold">BotCraft Studio</p><p className="text-xs text-muted-foreground">Рабочее пространство аккаунта</p></div>
          <div className="hidden items-center gap-2 sm:flex"><Link href="/templates"><Button variant="ghost" size="sm">Шаблоны</Button></Link><ThemeToggle /></div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="mb-2 text-sm font-medium text-primary">Рабочее пространство</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Проекты</h1><p className="mt-2 text-muted-foreground">Создавайте и запускайте Telegram-ботов без программирования</p></div>
            <div className="flex shrink-0">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Новый бот
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новый проект</DialogTitle>
                  <DialogDescription className="sr-only">
                    Создайте новый проект Telegram бота
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateProject)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название проекта</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Мой новый бот" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание (опционально)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Краткое описание бота" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button type="submit" disabled={createProjectMutation.isPending}>
                        {createProjectMutation.isPending ? 'Создание...' : 'Создать'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Поиск проектов..." className="h-10 border-0 bg-background/70 pl-9 shadow-none" /></div>
            <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => setSortMode(sortMode === 'recent' ? 'name' : 'recent')}><SlidersHorizontal className="mr-2 h-4 w-4" />{sortMode === 'recent' ? 'Недавно изменённые' : 'По названию'}</Button><Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} title="Список"><List className="h-4 w-4" /></Button><Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} title="Сетка"><Grid2X2 className="h-4 w-4" /></Button></div>
          </div>
          <div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{visibleProjects.length} {visibleProjects.length === 1 ? 'проект' : 'проектов'}</p><p className="text-xs text-muted-foreground">Все проекты</p></div>
          {visibleProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Plus className="h-6 w-6" /></div><h2 className="text-lg font-semibold">{searchQuery ? 'Проекты не найдены' : 'Создайте первого бота'}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{searchQuery ? 'Попробуйте изменить запрос поиска.' : 'Соберите сценарий визуально и запустите его в Telegram.'}</p>{!searchQuery && <Button className="mt-5" onClick={() => setIsCreateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Создать бота</Button>}</div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-3'}>
              {visibleProjects.map((project) => { const sheetsInfo = getSheetsInfo(project); return <ProjectCard key={project.id} project={project} nodeCount={getNodeCount(project)} sheetsCount={sheetsInfo.count} updatedAt={formatDate(project.updatedAt)} onDelete={handleDeleteProject} view={viewMode} />; })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
