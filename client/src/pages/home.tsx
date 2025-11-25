import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Bot, Edit, Trash2, Calendar, User, Download, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Название проекта обязательно'),
  description: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Get telegram user ID
  const getUserIdFromStorage = () => {
    try {
      const userStr = localStorage.getItem('telegramUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (e) {
      console.error('Failed to get user ID from storage:', e);
    }
    return null;
  };

  const telegramUserId = getUserIdFromStorage();

  // Загрузка списка проектов (только метаданные, без data)
  const { data: projects = [], isLoading } = useQuery<Array<Omit<BotProject, 'data'>>>({
    queryKey: ['/api/projects/list', telegramUserId],
    queryFn: () => apiRequest('GET', `/api/projects/list${telegramUserId ? `?userId=${telegramUserId}` : ''}`),
  });

  // Создание нового проекта
  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectForm) => {
      const endpoint = telegramUserId ? `/api/projects/user/${telegramUserId}` : '/api/projects';
      return apiRequest('POST', endpoint, {
        ...data,
        data: {
          nodes: [{
            id: 'start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              messageText: 'Привет! Я ваш новый бот.',
              keyboardType: 'none',
              buttons: [],
            }
          }],
          connections: []
        }
      });
    },
    onSuccess: (newProject: BotProject) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list', telegramUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', telegramUserId] });
      toast({
        title: "Проект создан",
        description: `Проект "${newProject.name}" успешно создан`,
      });
      setIsCreateDialogOpen(false);
      form.reset();
      // Переходим в редактор нового проекта
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

  const getNodeCount = (project: BotProject) => {
    if (!project.data || typeof project.data !== 'object') return 0;
    
    // Проверяем, новый формат с листами или старый
    if (SheetsManager.isNewFormat(project.data)) {
      const sheets = (project.data as any).sheets || [];
      return sheets.reduce((total: number, sheet: any) => total + (sheet.nodes?.length || 0), 0);
    } else {
      const data = project.data as { nodes?: any[] };
      return data.nodes?.length || 0;
    }
  };

  const getSheetsInfo = (project: BotProject) => {
    if (!project.data || typeof project.data !== 'object') return { count: 0, names: [] };
    
    // Проверяем, новый формат с листами или старый
    if (SheetsManager.isNewFormat(project.data)) {
      const sheets = (project.data as any).sheets || [];
      return {
        count: sheets.length,
        names: sheets.map((sheet: any) => sheet.name || 'Лист')
      };
    } else {
      // Старый формат - один лист
      return {
        count: 1,
        names: ['Главный лист']
      };
    }
  };


  if (isLoading) {
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
                Шаблоны
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

        {/* Список проектов */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет проектов</h3>
            <p className="text-muted-foreground mb-4">
              Создайте свой первый проект для начала работы
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать проект
            </Button>
          </div>
        ) : (
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
                              {sheetsInfo.names.slice(0, 3).map((name, index) => (
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