import { ComponentDefinition, BotTemplate, BotData } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Star, User, ExternalLink } from 'lucide-react';

interface ComponentsSidebarProps {
  onComponentDrag: (component: ComponentDefinition) => void;
  onLoadTemplate?: () => void;
  onSelectTemplate?: (template: BotTemplate) => void;
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
      resizeKeyboard: true,
      // Дополнительные настройки фото
      sendAsDocument: false,
      hasContentProtection: true,
      disableWebPagePreview: false
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
    id: 'condition',
    name: 'Условие',
    description: 'If/else логика',
    icon: 'fas fa-code-branch',
    color: 'bg-red-100 text-red-600',
    type: 'condition',
    defaultData: {
      messageText: 'Условие выполнено',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'user-input',
    name: 'Ввод данных',
    description: 'Сбор информации',
    icon: 'fas fa-edit',
    color: 'bg-cyan-100 text-cyan-600',
    type: 'input',
    defaultData: {
      messageText: 'Введите данные:',
      keyboardType: 'none',
      buttons: [],
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
    components: components.filter(c => ['message', 'photo'].includes(c.type))
  },
  {
    title: 'Кнопки',
    components: components.filter(c => c.type === 'keyboard')
  },
  {
    title: 'Логика',
    components: components.filter(c => ['condition', 'input'].includes(c.type))
  },
  {
    title: 'Команды',
    components: components.filter(c => ['start', 'command'].includes(c.type))
  }
];

export function ComponentsSidebar({ onComponentDrag, onLoadTemplate, onSelectTemplate }: ComponentsSidebarProps) {
  const [currentTab, setCurrentTab] = useState<'elements' | 'my-templates' | 'templates'>('elements');
  
  // Получаем пользовательские шаблоны
  const { data: myTemplates = [], isLoading: isMyTemplatesLoading } = useQuery<BotTemplate[]>({
    queryKey: ['/api/templates/category/custom'],
    enabled: currentTab === 'my-templates'
  });

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag(component);
  };

  const handleSelectTemplate = (template: BotTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <aside className="w-full h-full bg-background border-r border-border flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Компоненты</h2>
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <button 
            onClick={() => setCurrentTab('elements')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentTab === 'elements' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Элементы
          </button>
          <button 
            onClick={() => setCurrentTab('my-templates')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentTab === 'my-templates' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Мои
          </button>
          <Link href="/templates">
            <button 
              className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-background"
            >
              Все
            </button>
          </Link>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === 'elements' && (
          <div className="p-4 space-y-4">
            {componentCategories.map((category) => (
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
          </div>
        )}

        {currentTab === 'my-templates' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Мои шаблоны</h3>
              <Badge variant="secondary" className="text-xs">
                {myTemplates.length}
              </Badge>
            </div>
            
            {isMyTemplatesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : myTemplates.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">У вас пока нет шаблонов</p>
                <p className="text-xs text-muted-foreground">Создайте бота и сохраните его как шаблон</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {myTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="group p-3 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {template.name}
                        </h4>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {template.featured && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                          {template.rating && template.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-muted-foreground">
                                {template.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {template.difficulty && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                template.difficulty === 'easy' && "border-green-200 text-green-700 dark:border-green-800 dark:text-green-300",
                                template.difficulty === 'medium' && "border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300",
                                template.difficulty === 'hard' && "border-red-200 text-red-700 dark:border-red-800 dark:text-red-300"
                              )}
                            >
                              {template.difficulty === 'easy' && 'Легкий'}
                              {template.difficulty === 'medium' && 'Средний'}
                              {template.difficulty === 'hard' && 'Сложный'}
                            </Badge>
                          )}
                          {template.useCount && template.useCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {template.useCount} исп.
                            </span>
                          )}
                        </div>
                        
                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <div className="mt-4 pt-4 border-t border-border">
              <Link href="/templates?tab=my-templates">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Открыть в библиотеке
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
