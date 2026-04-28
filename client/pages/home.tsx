import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Bot, Edit, Trash2, Calendar, User, Download } from 'lucide-react';
import { ThemeToggle } from '@/components/editor/header/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import type { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { isGuest } from '@/types/telegram-user';

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

  // Загрузка списка проектов
  const { data: projects = [], isLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects/list'],
    queryFn: () => apiRequest('GET', '/api/projects/list'),
    enabled: !isGuestUser,
  });

  /**
   * Редирект на страницу 404 если авторизованный пользователь не имеет проектов.
   * Срабатывает только после завершения загрузки авторизации и данных проектов.
   */
  useEffect(() => {
    console.log('[redirect check]', { sessionReady, isLoading, isGuestUser, projectsLen: projects.length });
    if (sessionReady && !isLoading && !isGuestUser && projects.length === 0) {
      setLocation('/not-found');
    }
  }, [sessionReady, isLoading, isGuestUser, projects.length, setLocation]);

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
    <div className="min-h-screen bg-background">
      {/* Заголовок */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fab fa-telegram-plane text-primary-foreground text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">BotCraft Studio</h1>
              <p className="text-xs text-muted-foreground">Конструктор Telegram ботов</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/templates">
              <Button variant="outline" size="sm">
                <Bot className="h-4 w-4 mr-2" />
                Сценарии
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Мои проекты</h2>
            <p className="text-muted-foreground">
              Управляйте своими Telegram ботами
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Новый проект
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

        {/* Список проектов */}
        {projects.length === 0 ? null : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || 'Без описания'}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteProject(project)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Статистика */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {getNodeCount(project)} узлов
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(project.updatedAt)}
                        </div>
                      </div>
                      
                      {/* Информация о листах */}
                      {(() => {
                        const sheetsInfo = getSheetsInfo(project);
                        return (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Bot className="h-4 w-4 mr-1" />
                              {sheetsInfo.count} {sheetsInfo.count === 1 ? 'лист' : sheetsInfo.count < 5 ? 'листа' : 'листов'}:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {sheetsInfo.names.slice(0, 3).map((name: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                                  {name}
                                </Badge>
                              ))}
                              {sheetsInfo.names.length > 3 && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  +{sheetsInfo.names.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>



                    {/* Действия */}
                    <div className="flex space-x-2">
                      <Link href={`/editor/${project.id}`} className="flex-1">
                        <Button className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Редактировать
                        </Button>
                      </Link>
                      <Link href={`/editor/${project.id}?tab=export`}>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
