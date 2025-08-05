import { ComponentDefinition, BotProject } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropTestButton } from '@/components/layout/drag-drop-test-button';
import QuickLayoutSwitcher from '@/components/layout/quick-layout-switcher';
import DragLayoutManager from '@/components/layout/drag-layout-manager';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Layout, Settings, Grid, Home, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';



interface ComponentsSidebarProps {
  onComponentDrag: (component: ComponentDefinition) => void;
  onLoadTemplate?: () => void;
  onOpenLayoutCustomizer?: () => void;
  onLayoutChange?: (config: any) => void;
  onGoToProjects?: () => void;
  onProjectSelect?: (projectId: number) => void;
  currentProjectId?: number;
  headerContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  canvasContent?: React.ReactNode;
  propertiesContent?: React.ReactNode;
}

const components: ComponentDefinition[] = [
  {
    id: 'text-message',
    name: 'Текстовое сообщение',
    description: 'Обычный текст или Markdown',
    icon: 'fas fa-comment',
    color: 'bg-blue-100 text-blue-600',
    type: 'message',
    defaultData: {
      messageText: 'Новое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'photo-message',
    name: 'Фото с текстом',
    description: 'Изображение + описание',
    icon: 'fas fa-image',
    color: 'bg-green-100 text-green-600',
    type: 'photo',
    defaultData: {
      messageText: 'Описание изображения',
      imageUrl: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'video-message',
    name: 'Видео сообщение',
    description: 'Видео файл с подписью',
    icon: 'fas fa-video',
    color: 'bg-red-100 text-red-600',
    type: 'video',
    defaultData: {
      messageText: 'Описание видео',
      videoUrl: '',
      mediaCaption: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'audio-message',
    name: 'Аудио сообщение',
    description: 'Аудио файл с подписью',
    icon: 'fas fa-music',
    color: 'bg-yellow-100 text-yellow-600',
    type: 'audio',
    defaultData: {
      messageText: 'Описание аудио',
      audioUrl: '',
      mediaCaption: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'document-message',
    name: 'Документ',
    description: 'Файл документа',
    icon: 'fas fa-file',
    color: 'bg-gray-100 text-gray-600',
    type: 'document',
    defaultData: {
      messageText: 'Описание документа',
      documentUrl: '',
      documentName: 'document.pdf',
      mediaCaption: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'sticker-message',
    name: 'Стикер',
    description: 'Анимированный стикер',
    icon: 'fas fa-laugh',
    color: 'bg-pink-100 text-pink-600',
    type: 'sticker',
    defaultData: {
      messageText: 'Стикер',
      stickerUrl: '',
      stickerFileId: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'voice-message',
    name: 'Голосовое сообщение',
    description: 'Голосовое сообщение',
    icon: 'fas fa-microphone',
    color: 'bg-teal-100 text-teal-600',
    type: 'voice',
    defaultData: {
      messageText: 'Голосовое сообщение',
      voiceUrl: '',
      duration: 0,
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'animation-message',
    name: 'GIF анимация',
    description: 'Анимированное изображение',
    icon: 'fas fa-film',
    color: 'bg-orange-100 text-orange-600',
    type: 'animation',
    defaultData: {
      messageText: 'GIF анимация',
      animationUrl: '',
      duration: 0,
      width: 0,
      height: 0,
      mediaCaption: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'location-message',
    name: 'Геолокация',
    description: 'Отправка координат',
    icon: 'fas fa-map-marker',
    color: 'bg-green-100 text-green-600',
    type: 'location',
    defaultData: {
      messageText: 'Местоположение',
      latitude: 55.7558,
      longitude: 37.6176,
      title: 'Москва',
      address: 'Москва, Россия',
      foursquareId: '',
      foursquareType: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'contact-message',
    name: 'Контакт',
    description: 'Поделиться контактом',
    icon: 'fas fa-address-book',
    color: 'bg-blue-100 text-blue-600',
    type: 'contact',
    defaultData: {
      messageText: 'Контакт',
      phoneNumber: '+7 (999) 123-45-67',
      firstName: 'Имя',
      lastName: 'Фамилия',
      userId: 0,
      vcard: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },

  {
    id: 'reply-keyboard',
    name: 'Reply клавиатура',
    description: 'Кнопки внизу экрана',
    icon: 'fas fa-keyboard',
    color: 'bg-purple-100 text-purple-600',
    type: 'keyboard',
    defaultData: {
      messageText: 'Выберите действие:',
      keyboardType: 'reply',
      buttons: [
        { id: 'btn-1', text: 'Кнопка 1', action: 'goto', target: '' },
        { id: 'btn-2', text: 'Кнопка 2', action: 'goto', target: '' }
      ],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'inline-keyboard',
    name: 'Inline кнопки',
    description: 'Кнопки под сообщением',
    icon: 'fas fa-mouse',
    color: 'bg-amber-100 text-amber-600',
    type: 'keyboard',
    defaultData: {
      messageText: 'Выберите действие:',
      keyboardType: 'inline',
      buttons: [
        { id: 'btn-1', text: 'Кнопка 1', action: 'goto', target: '' },
        { id: 'btn-2', text: 'Кнопка 2', action: 'goto', target: '' }
      ],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },

  {
    id: 'start-command',
    name: '/start команда',
    description: 'Точка входа в бота',
    icon: 'fas fa-play',
    color: 'bg-green-100 text-green-600',
    type: 'start',
    defaultData: {
      command: '/start',
      description: 'Запустить бота',
      messageText: 'Привет! Добро пожаловать!',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'help-command',
    name: '/help команда',
    description: 'Справка по боту',
    icon: 'fas fa-question-circle',
    color: 'bg-blue-100 text-blue-600',
    type: 'command',
    defaultData: {
      command: '/help',
      description: 'Справка по боту',
      messageText: '🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки',
      keyboardType: 'none',
      buttons: [],
      markdown: true,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'settings-command',
    name: '/settings команда',
    description: 'Настройки бота',
    icon: 'fas fa-cog',
    color: 'bg-gray-100 text-gray-600',
    type: 'command',
    defaultData: {
      command: '/settings',
      description: 'Настройки бота',
      messageText: '⚙️ Настройки бота:',
      keyboardType: 'inline',
      buttons: [
        { id: 'btn-1', text: '📋 Язык', action: 'command', target: '/language' },
        { id: 'btn-2', text: '🔔 Уведомления', action: 'command', target: '/notifications' }
      ],
      markdown: true,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'menu-command',
    name: '/menu команда',
    description: 'Главное меню',
    icon: 'fas fa-bars',
    color: 'bg-purple-100 text-purple-600',
    type: 'command',
    defaultData: {
      command: '/menu',
      description: 'Главное меню',
      messageText: '📋 Главное меню:',
      keyboardType: 'reply',
      buttons: [
        { id: 'btn-1', text: '📖 Информация', action: 'command', target: '/info' },
        { id: 'btn-2', text: '⚙️ Настройки', action: 'command', target: '/settings' },
        { id: 'btn-3', text: '❓ Помощь', action: 'command', target: '/help' },
        { id: 'btn-4', text: '📞 Поддержка', action: 'command', target: '/support' }
      ],
      markdown: true,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'custom-command',
    name: 'Пользовательская команда',
    description: 'Настраиваемая команда',
    icon: 'fas fa-terminal',
    color: 'bg-indigo-100 text-indigo-600',
    type: 'command',
    defaultData: {
      command: '/custom',
      description: 'Новая команда',
      messageText: 'Команда выполнена',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  }
];

const componentCategories = [
  {
    title: 'Сообщения',
    components: components.filter(c => ['message', 'photo', 'video', 'audio', 'document', 'sticker', 'voice', 'animation', 'location', 'contact'].includes(c.type))
  },
  {
    title: 'Кнопки',
    components: components.filter(c => c.type === 'keyboard')
  },
  {
    title: 'Команды',
    components: components.filter(c => ['start', 'command'].includes(c.type))
  }
];

export function ComponentsSidebar({ 
  onComponentDrag, 
  onLoadTemplate, 
  onOpenLayoutCustomizer, 
  onLayoutChange,
  onGoToProjects,
  onProjectSelect,
  currentProjectId,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent
}: ComponentsSidebarProps) {
  const [currentTab, setCurrentTab] = useState<'elements' | 'templates' | 'projects'>('elements');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag(component);
  };

  // Загрузка списка проектов
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Создание нового проекта
  const createProjectMutation = useMutation({
    mutationFn: () => {
      const projectCount = projects.length;
      return apiRequest('POST', '/api/projects', {
        name: `Новый бот ${projectCount + 1}`,
        description: '',
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
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Проект создан",
        description: `Проект "${newProject.name}" успешно создан`,
      });
      // Переключаемся на новый проект
      if (onProjectSelect) {
        onProjectSelect(newProject.id);
      }
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

  const handleTemplatesClick = () => {
    setCurrentTab('templates');
    if (onLoadTemplate) {
      console.log('Templates button clicked in sidebar');
      onLoadTemplate();
    }
  };

  const handleCreateProject = () => {
    createProjectMutation.mutate();
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
    const data = project.data as { nodes?: any[] };
    return data.nodes?.length || 0;
  };

  return (
    <aside className="w-full h-full bg-background border-r border-border flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Компоненты</h2>
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <button 
            onClick={() => setCurrentTab('elements')}
            className={`flex-1 px-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentTab === 'elements' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Элементы
          </button>
          <button 
            onClick={handleTemplatesClick}
            className={`flex-1 px-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentTab === 'templates' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Шаблоны
          </button>
          <button 
            onClick={() => setCurrentTab('projects')}
            className={`flex-1 px-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentTab === 'projects' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Проекты
          </button>
        </div>
      </div>
      
      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTab === 'projects' && (
          <div className="space-y-4">
            {/* Заголовок и кнопка создания */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Проекты ({projects.length})
              </h3>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 w-6 p-0"
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Список проектов */}
            {isLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-spinner fa-spin text-muted-foreground text-xs"></i>
                </div>
                <p className="text-xs text-muted-foreground">Загрузка...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-6">
                <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">Нет проектов</p>
                <Button size="sm" onClick={handleCreateProject} disabled={createProjectMutation.isPending}>
                  <Plus className="h-3 w-3 mr-1" />
                  {createProjectMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project: BotProject) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentProjectId === project.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => onProjectSelect && onProjectSelect(project.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {getNodeCount(project)}
                        </span>
                        <Badge variant={project.botToken ? "default" : "secondary"} className="h-4 text-xs">
                          {project.botToken ? "Настроен" : "Токен"}
                        </Badge>
                      </div>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(project.updatedAt).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {currentTab === 'elements' && componentCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {category.title}
            </h3>
            <div className="space-y-2">
              {category.components.map((component) => (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  className="flex items-center p-3 bg-muted/50 hover:bg-muted rounded-lg cursor-move transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mr-3", component.color)}>
                    <i className={`${component.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{component.name}</p>
                    <p className="text-xs text-muted-foreground">{component.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {currentTab === 'layout' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Настройка макета
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4" />
                    <span className="text-sm font-medium">Быстрые настройки</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Выберите готовый макет из предустановленных вариантов
                  </p>
                  {onLayoutChange && (
                    <QuickLayoutSwitcher onLayoutChange={onLayoutChange} />
                  )}
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Grid className="w-4 h-4" />
                    <span className="text-sm font-medium">Перетаскивание</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Перетащите элементы в нужное место на экране
                  </p>
                  {headerContent && sidebarContent && canvasContent && propertiesContent && (
                    <DragLayoutManager
                      headerContent={headerContent}
                      sidebarContent={sidebarContent}
                      canvasContent={canvasContent}
                      propertiesContent={propertiesContent}
                      onLayoutChange={onLayoutChange}
                    />
                  )}
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Дополнительно</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Расширенные настройки макета
                  </p>
                  {onOpenLayoutCustomizer && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onOpenLayoutCustomizer}
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Открыть настройки
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Советы по макету
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-900 dark:text-blue-100">💡 Заголовок внизу</p>
                  <p className="text-blue-700 dark:text-blue-300">Попробуйте разместить заголовок снизу для необычного интерфейса</p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-900 dark:text-green-100">🎯 Боковая панель справа</p>
                  <p className="text-green-700 dark:text-green-300">Переместите боковую панель вправо для левшей</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="font-medium text-purple-900 dark:text-purple-100">⚡ Компактный режим</p>
                  <p className="text-purple-700 dark:text-purple-300">Включите для экономии места на экране</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Drag & Drop Test Button */}
      {onOpenLayoutCustomizer && (
        <DragDropTestButton onOpenCustomizer={onOpenLayoutCustomizer} />
      )}
    </aside>
  );
}
