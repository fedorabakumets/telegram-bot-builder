import { ComponentDefinition, BotProject } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SheetsManager } from '@/utils/sheets-manager';

import QuickLayoutSwitcher from '@/components/layout/quick-layout-switcher';
import DragLayoutManager from '@/components/layout/drag-layout-manager';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Layout, Settings, Grid, Home, Plus, Edit, Trash2, Calendar, User, GripVertical, FileText, Copy, MoreHorizontal, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LayoutButtons } from '@/components/layout/layout-buttons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';



interface ComponentsSidebarProps {
  onComponentDrag: (component: ComponentDefinition) => void;
  onComponentAdd?: (component: ComponentDefinition) => void;
  onLoadTemplate?: () => void;
  onOpenLayoutCustomizer?: () => void;
  onLayoutChange?: (config: any) => void;
  onGoToProjects?: () => void;
  onProjectSelect?: (projectId: number) => void;
  currentProjectId?: number;
  activeSheetId?: string;
  headerContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  canvasContent?: React.ReactNode;
  propertiesContent?: React.ReactNode;
  // Новые пропсы для управления макетом
  onToggleCanvas?: () => void;
  onToggleHeader?: () => void;
  onToggleProperties?: () => void;
  onShowFullLayout?: () => void;
  canvasVisible?: boolean;
  headerVisible?: boolean;
  propertiesVisible?: boolean;
  showLayoutButtons?: boolean;
  // Пропсы для управления листами
  onSheetAdd?: (name: string) => void;
  onSheetDelete?: (sheetId: string) => void;
  onSheetRename?: (sheetId: string, name: string) => void;
  onSheetDuplicate?: (sheetId: string) => void;
  onSheetSelect?: (sheetId: string) => void;
  // Мобильный режим
  isMobile?: boolean;
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
  },
  {
    id: 'pin-message',
    name: 'Закрепить сообщение',
    description: 'Закрепление сообщения в группе',
    icon: 'fas fa-thumbtack',
    color: 'bg-cyan-100 text-cyan-600',
    type: 'pin_message',
    defaultData: {
      command: '/pin_message',
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: '',
      disableNotification: false
    }
  },
  {
    id: 'unpin-message',
    name: 'Открепить сообщение',
    description: 'Снятие закрепления сообщения',
    icon: 'fas fa-times',
    color: 'bg-slate-100 text-slate-600',
    type: 'unpin_message',
    defaultData: {
      command: '/unpin_message',
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    }
  },
  {
    id: 'delete-message',
    name: 'Удалить сообщение',
    description: 'Удаление сообщения в группе',
    icon: 'fas fa-trash',
    color: 'bg-red-100 text-red-600',
    type: 'delete_message',
    defaultData: {
      command: '/delete_message',
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    }
  },
  {
    id: 'ban-user',
    name: 'Заблокировать пользователя',
    description: 'Забанить участника группы',
    icon: 'fas fa-ban',
    color: 'bg-red-100 text-red-600',
    type: 'ban_user',
    defaultData: {
      command: '/ban_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      reason: 'Нарушение правил группы',
      untilDate: 0
    }
  },
  {
    id: 'unban-user',
    name: 'Разблокировать пользователя',
    description: 'Снять бан с участника группы',
    icon: 'fas fa-user-check',
    color: 'bg-green-100 text-green-600',
    type: 'unban_user',
    defaultData: {
      command: '/unban_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    }
  },
  {
    id: 'mute-user',
    name: 'Заглушить пользователя',
    description: 'Ограничить права участника',
    icon: 'fas fa-volume-mute',
    color: 'bg-orange-100 text-orange-600',
    type: 'mute_user',
    defaultData: {
      command: '/mute_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      duration: 3600,
      reason: 'Нарушение правил группы',
      canSendMessages: false,
      canSendMediaMessages: false,
      canSendPolls: false,
      canSendOtherMessages: false,
      canAddWebPagePreviews: false,
      canChangeGroupInfo: false,
      canInviteUsers2: false,
      canPinMessages2: false
    }
  },
  {
    id: 'unmute-user',
    name: 'Снять ограничения',
    description: 'Восстановить права участника',
    icon: 'fas fa-volume-up',
    color: 'bg-green-100 text-green-600',
    type: 'unmute_user',
    defaultData: {
      command: '/unmute_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    }
  },
  {
    id: 'kick-user',
    name: 'Исключить пользователя',
    description: 'Удалить участника из группы',
    icon: 'fas fa-user-times',
    color: 'bg-red-100 text-red-600',
    type: 'kick_user',
    defaultData: {
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      reason: 'Нарушение правил группы'
    }
  },
  {
    id: 'promote-user',
    name: 'Назначить администратором',
    description: 'Дать права администратора',
    icon: 'fas fa-crown',
    color: 'bg-yellow-100 text-yellow-600',
    type: 'promote_user',
    defaultData: {
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      canChangeInfo: false,
      canDeleteMessages: true,
      canBanUsers: false,
      canInviteUsers: true,
      canPinMessages: true,
      canAddAdmins: false,
      canRestrictMembers: false,
      canPromoteMembers: false,
      canManageVideoChats: false,
      canManageTopics: false,
      isAnonymous: false
    }
  },
  {
    id: 'demote-user',
    name: 'Снять с администратора',
    description: 'Убрать права администратора',
    icon: 'fas fa-user-minus',
    color: 'bg-gray-100 text-gray-600',
    type: 'demote_user',
    defaultData: {
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    }
  },
  {
    id: 'admin-rights',
    name: 'Тг права',
    description: 'Панель редактирования прав администратора',
    icon: 'fas fa-user-cog',
    color: 'bg-purple-100 text-purple-600',
    type: 'admin_rights',
    defaultData: {
      command: '/admin_rights',
      description: 'Управление правами администратора',
      synonyms: ['права админа', 'изменить права', 'админ права', 'тг права', 'права'],
      adminUserIdSource: 'last_message',
      adminChatIdSource: 'current_chat',
      // Права администратора согласно Telegram Bot API
      can_manage_chat: false,
      can_post_messages: false,
      can_edit_messages: false,
      can_delete_messages: true,
      can_post_stories: false,
      can_edit_stories: false,
      can_delete_stories: false,
      can_manage_video_chats: false,
      can_restrict_members: false,
      can_promote_members: false,
      can_change_info: false,
      can_invite_users: true,
      can_pin_messages: true,
      can_manage_topics: false,
      is_anonymous: false
    }
  }
];

const componentCategories = [
  {
    title: 'Сообщения',
    components: components.filter(c => ['message', 'sticker', 'voice', 'location', 'contact'].includes(c.type))
  },
  {
    title: 'Команды',
    components: components.filter(c => ['start', 'command'].includes(c.type))
  },
  {
    title: 'Управление контентом',
    components: components.filter(c => ['pin_message', 'unpin_message', 'delete_message'].includes(c.type))
  },
  {
    title: 'Управление пользователями',
    components: components.filter(c => ['ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user', 'admin_rights'].includes(c.type))
  }
];

export function ComponentsSidebar({ 
  onComponentDrag, 
  onComponentAdd,
  onLoadTemplate, 
  onOpenLayoutCustomizer, 
  onLayoutChange,
  onGoToProjects,
  onProjectSelect,
  currentProjectId,
  activeSheetId,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  onToggleCanvas,
  onToggleHeader,
  onToggleProperties,
  onShowFullLayout,
  canvasVisible = false,
  headerVisible = false,
  propertiesVisible = false,
  showLayoutButtons = false,
  onSheetAdd,
  onSheetDelete,
  onSheetRename,
  onSheetDuplicate,
  onSheetSelect,
  isMobile = false
}: ComponentsSidebarProps) {
  const [currentTab, setCurrentTab] = useState<'elements' | 'projects'>('elements');
  const [draggedProject, setDraggedProject] = useState<BotProject | null>(null);
  const [dragOverProject, setDragOverProject] = useState<number | null>(null);
  const [draggedSheet, setDraggedSheet] = useState<{ sheetId: string; projectId: number } | null>(null);
  const [dragOverSheet, setDragOverSheet] = useState<string | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  // Состояние для inline редактирования листов
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingSheetName, setEditingSheetName] = useState('');
  // Состояние для сворачивания/раскрытия категорий
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  // Мобильное меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Импорт проекта
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPythonText, setImportPythonText] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pythonFileInputRef = useRef<HTMLInputElement>(null);
  const isActuallyMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Функция для переключения видимости категории
  const toggleCategory = (categoryTitle: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };
  
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag(component);
  };

  // Touch события для мобильных устройств
  const [touchedComponent, setTouchedComponent] = useState<ComponentDefinition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [touchStartElement, setTouchStartElement] = useState<HTMLElement | null>(null);

  const handleTouchStart = (e: React.TouchEvent, component: ComponentDefinition) => {
    console.log('Touch start on component:', component.name);
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    
    setTouchedComponent(component);
    setIsDragging(true);
    setTouchStartElement(element);
    
    const rect = element.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    onComponentDrag(component);
    
    // Добавляем визуальную обратную связь
    element.style.opacity = '0.7';
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'all 0.2s ease';
    
    console.log('Touch drag started for:', component.name, {
      touchPos: { x: touch.clientX, y: touch.clientY },
      elementRect: rect
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchedComponent) return;
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch move:', { x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !touchedComponent) {
      console.log('Touch end ignored - not dragging or no component');
      return;
    }
    
    console.log('Touch end for component:', touchedComponent.name);
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    console.log('Touch end position:', { x: touch.clientX, y: touch.clientY });
    console.log('Element at touch point:', element);
    
    // Возвращаем стили элемента
    const currentTarget = e.currentTarget as HTMLElement;
    currentTarget.style.opacity = '';
    currentTarget.style.transform = '';
    
    // Проверяем, попали ли мы на холст или в область холста
    const canvas = document.querySelector('[data-canvas-drop-zone]');
    console.log('Canvas element found:', canvas);
    
    if (canvas && element) {
      // Проверяем если элемент находится внутри canvas или является самим canvas
      const isInCanvas = canvas.contains(element) || element === canvas || 
                        element.closest('[data-canvas-drop-zone]') === canvas;
      
      console.log('Is in canvas:', isInCanvas);
      
      if (isInCanvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const dropPosition = {
          x: touch.clientX - canvasRect.left,
          y: touch.clientY - canvasRect.top
        };
        
        // Dispatching canvas-drop event
        
        // Создаем синтетическое событие drop
        const dropEvent = new CustomEvent('canvas-drop', {
          detail: {
            component: touchedComponent,
            position: dropPosition
          }
        });
        canvas.dispatchEvent(dropEvent);
      } else {
        // Touch ended outside canvas
      }
    } else {
      // Canvas not found
    }
    
    setTouchedComponent(null);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setTouchStartElement(null);
  };

  // Глобальные touch обработчики для лучшей поддержки мобильных устройств
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && touchedComponent) {
        e.preventDefault();
        // Global touch move
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!isDragging || !touchedComponent) return;
      
      // Global touch end
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Global touch end position
      
      // Восстанавливаем стили элемента
      if (touchStartElement) {
        touchStartElement.style.opacity = '';
        touchStartElement.style.transform = '';
        touchStartElement.style.transition = '';
      }
      
      // Проверяем, попали ли мы на холст
      const canvas = document.querySelector('[data-canvas-drop-zone]');
      // Canvas element check
      
      if (canvas && element) {
        const isInCanvas = canvas.contains(element) || element === canvas || 
                          element.closest('[data-canvas-drop-zone]') === canvas;
        
        // Is in canvas check
        
        if (isInCanvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const dropPosition = {
            x: touch.clientX - canvasRect.left,
            y: touch.clientY - canvasRect.top
          };
          
          // Dispatching global canvas-drop event
          
          const dropEvent = new CustomEvent('canvas-drop', {
            detail: {
              component: touchedComponent,
              position: dropPosition
            }
          });
          canvas.dispatchEvent(dropEvent);
        }
      }
      
      setTouchedComponent(null);
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      setTouchStartElement(null);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, touchedComponent, touchStartElement]);

  // Загрузка списка проектов
  const { data: projects = [], isLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    staleTime: 0, // Данные всегда считаются устаревшими для немедленного обновления при рефетче
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
            position: { x: 400, y: 300 }, // Центральная позиция для нового проекта
            data: {
              messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
              keyboardType: 'none',
              buttons: [],
              command: '/start',
              description: 'Запустить бота',
              showInMenu: true,
              isPrivateOnly: false,
              requiresAuth: false,
              adminOnly: false
            }
          }],
          connections: []
        }
      });
    },
    onSuccess: async (newProject: BotProject) => {
      // Immediately update the query cache with the new project
      const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
      queryClient.setQueryData(['/api/projects'], [...currentProjects, newProject]);
      
      // Also update the list cache
      const currentList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']) || [];
      const { data, ...projectWithoutData } = newProject;
      queryClient.setQueryData(['/api/projects/list'], [...currentList, projectWithoutData]);
      
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
    onMutate: async (projectId: number) => {
      // Отменяем текущие запросы для предотвращения race condition
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      await queryClient.cancelQueries({ queryKey: ['/api/projects/list'] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${projectId}`] });
      
      // Сохраняем предыдущие значения для отката
      const previousProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
      const previousList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);
      
      // Оптимистично удаляем проект из кеша
      if (previousProjects) {
        const updatedProjects = previousProjects.filter(p => p.id !== projectId);
        queryClient.setQueryData<BotProject[]>(['/api/projects'], updatedProjects);
      }
      
      if (previousList) {
        const updatedList = previousList.filter(p => p.id !== projectId);
        queryClient.setQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list'], updatedList);
      }
      
      // Удаляем из кеша конкретный проект
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}`] });
      
      // Возвращаем контекст для отката
      return { previousProjects, previousList };
    },
    onSuccess: async () => {
      toast({
        title: "Проект удален",
        description: "Проект успешно удален",
      });
    },
    onError: (error, projectId, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      if (context?.previousList) {
        queryClient.setQueryData(['/api/projects/list'], context.previousList);
      }
      
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить проект",
        variant: "destructive",
      });
    }
  });



  const handleCreateProject = () => {
    createProjectMutation.mutate();
  };

  // Обработчики перемещения листов между проектами
  const handleSheetDragStart = (e: React.DragEvent, sheetId: string, projectId: number) => {
    e.stopPropagation();
    setDraggedSheet({ sheetId, projectId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sheetId);
  };

  const handleSheetDragOver = (e: React.DragEvent, sheetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSheet(sheetId);
  };

  const handleSheetDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverSheet(null);
  };

  const handleSheetDrop = async (e: React.DragEvent, targetSheetId: string, targetProjectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSheet(null);

    if (!draggedSheet || (draggedSheet.sheetId === targetSheetId && draggedSheet.projectId === targetProjectId)) {
      setDraggedSheet(null);
      return;
    }

    // Находим исходный и целевой проекты
    const sourceProject = projects.find(p => p.id === draggedSheet.projectId);
    const targetProject = projects.find(p => p.id === targetProjectId);

    if (!sourceProject || !targetProject) {
      setDraggedSheet(null);
      return;
    }

    try {
      const sourceData = sourceProject.data as any;
      const targetData = targetProject.data as any;

      // Находим лист в исходном проекте
      let sheetToMove = null;
      let sourceSheetIndex = -1;

      if (sourceData.sheets) {
        sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === draggedSheet.sheetId);
        if (sourceSheetIndex !== -1) {
          sheetToMove = sourceData.sheets[sourceSheetIndex];
        }
      }

      if (!sheetToMove) {
        setDraggedSheet(null);
        return;
      }

      // Добавляем лист в целевой проект
      if (targetData.sheets) {
        const newSheet = JSON.parse(JSON.stringify(sheetToMove)); // Deep copy
        targetData.sheets.push(newSheet);

        // Удаляем из исходного проекта
        sourceData.sheets.splice(sourceSheetIndex, 1);

        // Обновляем оба проекта
        await Promise.all([
          apiRequest('PUT', `/api/projects/${sourceProject.id}`, { data: sourceData }),
          apiRequest('PUT', `/api/projects/${targetProject.id}`, { data: targetData })
        ]);

        // Обновляем кеш
        const updatedProjects = projects.map(p => {
          if (p.id === sourceProject.id) return { ...p, data: sourceData };
          if (p.id === targetProject.id) return { ...p, data: targetData };
          return p;
        });
        queryClient.setQueryData(['/api/projects'], updatedProjects);

        toast({
          title: "✅ Лист перемещен",
          description: `"${sheetToMove.name}" перемещен в "${targetProject.name}"`,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Ошибка перемещения",
        description: "Не удалось переместить лист",
        variant: "destructive",
      });
    } finally {
      setDraggedSheet(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportJsonText(content);
        setImportError('');
        toast({
          title: "Файл загружен",
          description: `Файл "${file.name}" успешно загружен. Нажмите "Импортировать" для создания проекта.`,
        });
      } catch (error) {
        setImportError('Ошибка при чтении файла');
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      setImportError('Ошибка при чтении файла');
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось прочитать файл",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
    
    // Очищаем input, чтобы можно было загрузить файл с тем же именем снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePythonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportPythonText(content);
        setImportError('');
        toast({
          title: "Python файл загружен",
          description: `Файл "${file.name}" успешно загружен. Нажмите "Импортировать" для создания проекта.`,
        });
      } catch (error) {
        setImportError('Ошибка при чтении файла');
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      setImportError('Ошибка при чтении файла');
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось прочитать файл",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
    
    if (pythonFileInputRef.current) {
      pythonFileInputRef.current.value = '';
    }
  };

  const parsePythonBotToJson = async (pythonCode: string) => {
    // Используем функцию парсинга из bot-generator.ts (обратная операция к generatePythonCode)
    const botGenerator = await import('@/lib/bot-generator');
    const { nodes, connections } = botGenerator.parsePythonCodeToJson(pythonCode);
    
    // Создаём структуру проекта с листом (sheets), точно как extractNodesAndConnections
    const projectData = {
      sheets: [
        {
          id: 'main',
          name: 'Импортированный бот',
          nodes: nodes,
          connections: connections
        }
      ],
      version: 2,
      activeSheetId: 'main'
    };
    
    return {
      data: projectData,
      nodeCount: nodes.length
    };
  };

  const handleImportProject = () => {
    try {
      setImportError('');
      
      // Если импортируем Python код бота
      if (importPythonText.trim()) {
        try {
          // Проверяем, это ли Python код бота
          if (importPythonText.includes('@@NODE_START:') && importPythonText.includes('@@NODE_END:')) {
            // Это Python код бота - парсим его в JSON
            parsePythonBotToJson(importPythonText).then((result) => {
              const projectName = `Python Bot ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              const projectDescription = `Импортирован из Python кода (${result.nodeCount} узлов)`;
              
              return apiRequest('POST', '/api/projects', {
                name: projectName,
                description: projectDescription,
                data: result.data
              });
            }).then(() => {
              setIsImportDialogOpen(false);
              setImportPythonText('');
              setImportJsonText('');
              setImportError('');
              toast({
                title: "✅ Успешно импортировано!",
                description: `Python бот загружен (${result.nodeCount} узлов)`,
                variant: "default",
              });
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              }, 300);
            }).catch((error: any) => {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "❌ Ошибка импорта",
                description: error.message || 'Не удалось создать проект',
                variant: "destructive",
              });
            });
            return;
          } else {
            // Может быть JSON в файле - пробуем парсить
            const jsonData = JSON.parse(importPythonText);
            
            let projectData: any;
            let projectName: string;
            let projectDescription: string;
            
            if (jsonData.name && jsonData.data) {
              projectName = jsonData.name;
              projectDescription = jsonData.description || '';
              projectData = jsonData.data;
            } else if (jsonData.sheets && (jsonData.version || jsonData.activeSheetId)) {
              projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              projectDescription = '';
              projectData = jsonData;
              
              if (!projectData.version) {
                projectData.version = 2;
              }
            } else if (jsonData.nodes) {
              projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              projectDescription = '';
              projectData = jsonData;
            } else {
              throw new Error('Неподдерживаемый формат');
            }
            
            apiRequest('POST', '/api/projects', {
              name: projectName,
              description: projectDescription,
              data: projectData
            }).then(() => {
              setIsImportDialogOpen(false);
              setImportPythonText('');
              setImportJsonText('');
              setImportError('');
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              }, 300);
            }).catch((error: any) => {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "Ошибка импорта",
                description: error.message,
                variant: "destructive",
              });
            });
            return;
          }
        } catch (error: any) {
          setImportError('Файл должен содержать либо Python код бота (с @@NODE_START@@), либо валидный JSON');
          toast({
            title: "Ошибка парсинга",
            description: "Неподдерживаемый формат файла",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Импорт JSON
      const parsedData = JSON.parse(importJsonText);
      
      let projectData: any;
      let projectName: string;
      let projectDescription: string;
      
      // Проверяем формат JSON
      // Формат 1: полный проект {name, description, data}
      if (parsedData.name && parsedData.data) {
        projectName = parsedData.name;
        projectDescription = parsedData.description || '';
        projectData = parsedData.data;
      }
      // Формат 2: только данные проекта {sheets, version, activeSheetId}
      else if (parsedData.sheets && (parsedData.version || parsedData.activeSheetId)) {
        projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
        projectDescription = '';
        projectData = parsedData;
        
        // Убедимся, что все листы имеют версию
        if (!projectData.version) {
          projectData.version = 2;
        }
      }
      // Формат 3: старый формат с узлами
      else if (parsedData.nodes) {
        projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
        projectDescription = '';
        projectData = parsedData;
      }
      else {
        throw new Error('Неподдерживаемый формат JSON. Должен содержать поле "sheets", "nodes" или "data"');
      }
      
      // Создаём проект с импортированными данными
      apiRequest('POST', '/api/projects', {
        name: projectName,
        description: projectDescription,
        data: projectData
      }).then((newProject: BotProject) => {
        // Сначала закрываем диалог
        setIsImportDialogOpen(false);
        setImportJsonText('');
        
        // Небольшая задержка перед обновлением проекта, чтобы диалог успел закрыться
        setTimeout(() => {
          // Обновляем кеш
          const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
          queryClient.setQueryData(['/api/projects'], [...currentProjects, newProject]);
          
          const currentList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']) || [];
          const { data, ...projectWithoutData } = newProject;
          queryClient.setQueryData(['/api/projects/list'], [...currentList, projectWithoutData]);
          
          toast({
            title: "Проект импортирован",
            description: `Проект "${newProject.name}" успешно импортирован. Проект готов к редактированию!`,
          });
          
          // Переключаемся на новый проект
          if (onProjectSelect) {
            onProjectSelect(newProject.id);
          }
        }, 300);
      }).catch((error) => {
        setImportError(`Ошибка импорта: ${error.message}`);
        toast({
          title: "Ошибка импорта",
          description: error.message,
          variant: "destructive",
        });
      });
    } catch (error: any) {
      const errorMsg = error instanceof SyntaxError ? 'Неверный JSON формат' : error.message;
      setImportError(errorMsg);
      toast({
        title: "Ошибка валидации",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project && confirm(`Вы уверены, что хотите удалить проект "${project.name}"? Это действие нельзя отменить.`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  // Обработчики inline редактирования листов
  const handleStartEditingSheet = (sheetId: string, currentName: string) => {
    setEditingSheetId(sheetId);
    setEditingSheetName(currentName);
  };

  const handleSaveSheetName = () => {
    if (editingSheetId && editingSheetName.trim() && onSheetRename) {
      onSheetRename(editingSheetId, editingSheetName.trim());
    }
    setEditingSheetId(null);
    setEditingSheetName('');
  };

  const handleCancelEditingSheet = () => {
    setEditingSheetId(null);
    setEditingSheetName('');
  };

  // Обработчики drag-and-drop для проектов
  const handleProjectDragStart = (e: React.DragEvent, project: BotProject) => {
    e.stopPropagation();
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id.toString());
  };

  const handleProjectDragOver = (e: React.DragEvent, projectId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverProject(projectId);
  };

  const handleProjectDragLeave = () => {
    setDragOverProject(null);
  };

  const handleProjectDrop = (e: React.DragEvent, targetProject: BotProject) => {
    e.preventDefault();
    setDragOverProject(null);
    
    if (!draggedProject || draggedProject.id === targetProject.id) {
      setDraggedProject(null);
      return;
    }

    // Здесь можно добавить логику изменения порядка проектов
    // Пока просто показываем уведомление
    toast({
      title: "Перемещение проектов",
      description: `Проект "${draggedProject.name}" перемещен`,
    });
    
    setDraggedProject(null);
  };

  const handleProjectDragEnd = () => {
    setDraggedProject(null);
    setDragOverProject(null);
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
    
    try {
      // Проверяем, новый формат с листами или старый
      if (SheetsManager.isNewFormat(project.data)) {
        const sheets = (project.data as any).sheets || [];
        const nodeCount = sheets.reduce((total: number, sheet: any) => total + (sheet.nodes?.length || 0), 0);
        console.log(`[${project.name}] Формат с листами. Листов: ${sheets.length}, Узлов: ${nodeCount}`);
        return nodeCount;
      } else {
        const data = project.data as { nodes?: any[] };
        const nodeCount = data.nodes?.length || 0;
        console.log(`[${project.name}] Старый формат. Узлов: ${nodeCount}`);
        return nodeCount;
      }
    } catch (error) {
      console.error('Ошибка подсчета узлов:', error);
      // Попытка получить узлы напрямую из данных
      const fallbackData = project.data as any;
      if (fallbackData.nodes && Array.isArray(fallbackData.nodes)) {
        return fallbackData.nodes.length;
      }
      if (fallbackData.sheets && Array.isArray(fallbackData.sheets)) {
        return fallbackData.sheets.reduce((total: number, sheet: any) => 
          total + (sheet.nodes ? sheet.nodes.length : 0), 0);
      }
      return 0;
    }
  };

  const getSheetsInfo = (project: BotProject) => {
    if (!project.data || typeof project.data !== 'object') return { count: 0, names: [] };
    
    try {
      // Проверяем, новый формат с листами или старый
      if (SheetsManager.isNewFormat(project.data)) {
        const sheets = (project.data as any).sheets || [];
        const sheetsInfo = {
          count: sheets.length,
          names: sheets.map((sheet: any) => sheet.name || 'Лист без названия')
        };
        console.log(`[${project.name}] Информация о листах:`, sheetsInfo);
        return sheetsInfo;
      } else {
        // Старый формат - один лист
        console.log(`[${project.name}] Старый формат - один основной лист`);
        return {
          count: 1,
          names: ['Основной поток']
        };
      }
    } catch (error) {
      console.error('Ошибка получения информации о листах:', error);
      return {
        count: 1,
        names: ['Основной поток']
      };
    }
  };

  // Создаем контент панели
  const SidebarContent = () => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Компоненты</h2>
          {/* Кнопки макета отображаются когда только панель компонентов видна */}
          {showLayoutButtons && (
            <LayoutButtons
              onToggleCanvas={onToggleCanvas}
              onToggleHeader={onToggleHeader}
              onToggleProperties={onToggleProperties}
              onShowFullLayout={onShowFullLayout}
              canvasVisible={canvasVisible}
              headerVisible={headerVisible}
              propertiesVisible={propertiesVisible}
              className="scale-75 -mr-2"
            />
          )}
        </div>
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
            {/* Заголовок и кнопки управления */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Проекты ({projects.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button 
                    size="default" 
                    variant="outline" 
                    className="h-8 px-3 flex items-center gap-1"
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                    title="Создать новый проект"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Новый</span>
                  </Button>
                  <Button 
                    size="default" 
                    variant="outline" 
                    className="h-8 px-3 flex items-center gap-1"
                    onClick={() => {
                      setIsImportDialogOpen(true);
                      setImportJsonText('');
                      setImportError('');
                    }}
                    title="Импортировать проект из JSON"
                  >
                    <i className="fas fa-upload text-sm" />
                    <span className="text-sm">Импорт</span>
                  </Button>
                </div>
              </div>
              
            </div>

            {/* Диалог импорта проекта */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Импортировать проект</DialogTitle>
                  <DialogDescription>Вставьте JSON или загрузите файл с данными проекта</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Три раздела: JSON текст, JSON файл и Python код */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Вставка JSON текста */}
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <i className="fas fa-paste text-blue-500" />
                        Вставьте JSON проекта
                      </label>
                      <Textarea 
                        value={importJsonText}
                        onChange={(e) => {
                          setImportJsonText(e.target.value);
                          setImportPythonText('');
                          setImportError('');
                        }}
                        placeholder='{"name": "Мой бот", "description": "", "data": {...}}'
                        className="font-mono text-xs h-40 resize-none"
                        data-testid="textarea-import-json"
                      />
                    </div>
                    
                    {/* Загрузка JSON файла */}
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <i className="fas fa-file text-green-500" />
                        Загрузить файл JSON
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        data-testid="input-import-file"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:bg-muted/50 transition-colors"
                        data-testid="button-upload-file"
                      >
                        <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Нажмите для выбора файла</p>
                          <p className="text-xs text-muted-foreground">JSON / TXT файл</p>
                        </div>
                      </Button>
                    </div>

                    {/* Загрузка Python кода */}
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <i className="fas fa-python text-yellow-500" />
                        Или загрузите Python код бота
                      </label>
                      <input
                        ref={pythonFileInputRef}
                        type="file"
                        accept=".py,.txt"
                        onChange={handlePythonFileUpload}
                        className="hidden"
                        data-testid="input-import-python"
                      />
                      <Button
                        onClick={() => pythonFileInputRef.current?.click()}
                        variant="outline"
                        className="w-full h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:bg-muted/50 transition-colors"
                        data-testid="button-upload-python"
                      >
                        <i className="fas fa-code text-3xl text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Нажмите для выбора файла</p>
                          <p className="text-xs text-muted-foreground">Python (.py) файл</p>
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  {importError && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <p className="text-sm text-destructive">{importError}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 justify-end pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setImportJsonText('');
                        setImportPythonText('');
                        setImportError('');
                      }}
                      data-testid="button-cancel-import"
                    >
                      Отмена
                    </Button>
                    <Button 
                      onClick={handleImportProject}
                      disabled={!importJsonText.trim() && !importPythonText.trim()}
                      data-testid="button-confirm-import"
                    >
                      <i className="fas fa-check mr-2" />
                      Импортировать
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Список проектов */}
            {isLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-spinner fa-spin text-muted-foreground text-xs"></i>
                </div>
                <p className="text-xs text-muted-foreground">Загрузка...</p>
              </div>
            ) : !isLoading && projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-2">Нет проектов</h4>
                <p className="text-xs text-muted-foreground mb-4">Создайте первый проект для начала работы</p>
                <Button size="default" onClick={handleCreateProject} disabled={createProjectMutation.isPending} className="h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  {createProjectMutation.isPending ? 'Создание...' : 'Создать проект'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project: BotProject) => (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleProjectDragStart(e, project)}
                    onDragOver={(e) => handleProjectDragOver(e, project.id)}
                    onDragLeave={handleProjectDragLeave}
                    onDrop={(e) => handleProjectDrop(e, project)}
                    onDragEnd={handleProjectDragEnd}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
                      currentProjectId === project.id 
                        ? 'bg-primary/10 border-primary/30 shadow-md' 
                        : 'bg-background border-border/50 hover:bg-muted/30 hover:border-border'
                    } ${
                      dragOverProject === project.id ? 'border-primary border-2 scale-105 shadow-lg' : ''
                    } ${
                      draggedProject?.id === project.id ? 'opacity-50 scale-95' : ''
                    }`}
                    onClick={() => onProjectSelect && onProjectSelect(project.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="cursor-grab active:cursor-grabbing mr-3 hidden group-hover:flex">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-foreground truncate mb-1">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hidden group-hover:flex hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
                          <User className="h-4 w-4 mr-2" />
                          <span className="font-medium">{getNodeCount(project)}</span>
                          <span className="ml-1">узлов</span>
                        </span>
                        <span className="flex items-center text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(project.updatedAt)}
                        </span>
                      </div>
                      
                      {/* Информация о листах */}
                      {(() => {
                        const sheetsInfo = getSheetsInfo(project);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <FileText className="h-4 w-4 mr-2" />
                                <span className="font-medium">{sheetsInfo.count}</span>
                                <span className="ml-1">{sheetsInfo.count === 1 ? 'лист' : sheetsInfo.count < 5 ? 'листа' : 'листов'}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 hidden group-hover:flex hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentProjectId === project.id && onSheetAdd) {
                                    const sheetsInfo = getSheetsInfo(project);
                                    const newSheetName = `Лист ${sheetsInfo.count + 1}`;
                                    onSheetAdd(newSheetName);
                                  }
                                }}
                                title="Добавить лист"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            {sheetsInfo.names.length > 0 && (
                              <div className="space-y-1.5 mt-2">
                                {sheetsInfo.names.map((name: string, index: number) => {
                                const projectData = project.data as any;
                                const sheetId = SheetsManager.isNewFormat(projectData) ? projectData.sheets[index]?.id : null;
                                const isActive = currentProjectId === project.id && sheetId === activeSheetId;
                                const isEditing = editingSheetId !== null && sheetId !== null && editingSheetId === sheetId;
                                
                                return (
                                  <div key={index} className="flex items-center gap-2 group/sheet">
                                    {isEditing ? (
                                      <Input
                                        value={editingSheetName}
                                        onChange={(e) => setEditingSheetName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveSheetName();
                                          } else if (e.key === 'Escape') {
                                            handleCancelEditingSheet();
                                          }
                                        }}
                                        onBlur={handleSaveSheetName}
                                        autoFocus
                                        className="text-xs px-3 py-1.5 h-7 flex-1 font-medium"
                                      />
                                    ) : (
                                      <Badge 
                                        draggable
                                        onDragStart={(e) => handleSheetDragStart(e, sheetId, project.id)}
                                        onDragOver={(e) => handleSheetDragOver(e, sheetId)}
                                        onDragLeave={handleSheetDragLeave}
                                        onDrop={(e) => handleSheetDrop(e, sheetId, project.id)}
                                        variant={isActive ? "default" : "secondary"} 
                                        className={`text-xs px-3 py-1.5 h-7 cursor-grab active:cursor-grabbing hover:opacity-80 transition-all flex-1 font-medium ${
                                          isActive ? 'bg-primary text-primary-foreground shadow-sm' : ''
                                        } ${dragOverSheet === sheetId ? 'ring-2 ring-primary ring-offset-1' : ''} ${
                                          draggedSheet?.sheetId === sheetId && draggedSheet?.projectId === project.id ? 'opacity-50' : ''
                                        }`}
                                        onClick={() => {
                                          if (currentProjectId === project.id && onSheetSelect && SheetsManager.isNewFormat(projectData)) {
                                            const sheetId = projectData.sheets[index]?.id;
                                            if (sheetId) {
                                              onSheetSelect(sheetId);
                                            }
                                          }
                                        }}
                                        onDoubleClick={() => {
                                          // Включаем inline редактирование
                                          if (currentProjectId === project.id && SheetsManager.isNewFormat(projectData)) {
                                            const sheetId = projectData.sheets[index]?.id;
                                            if (sheetId) {
                                              handleStartEditingSheet(sheetId, name);
                                            }
                                          }
                                        }}
                                        title={name}
                                      >
                                        <span className="block text-center w-full truncate" style={{ visibility: 'visible', opacity: 1 }}>{name || 'Без названия'}</span>
                                      </Badge>
                                    )}
                                    
                                    {/* Кнопки управления листом */}
                                    {currentProjectId === project.id && (
                                      <div className="flex gap-1 hidden group-hover/sheet:flex">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-muted"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (SheetsManager.isNewFormat(projectData)) {
                                              const sheetId = projectData.sheets[index]?.id;
                                              if (sheetId && onSheetDuplicate) {
                                                onSheetDuplicate(sheetId);
                                              }
                                            }
                                          }}
                                          title="Дублировать лист"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        {sheetsInfo.count > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-muted"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (SheetsManager.isNewFormat(projectData)) {
                                                const sheetId = projectData.sheets[index]?.id;
                                                if (sheetId && onSheetDelete) {
                                                  onSheetDelete(sheetId);
                                                }
                                              }
                                            }}
                                            title="Удалить лист"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {currentTab === 'elements' && componentCategories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.title);
          
          return (
            <div key={category.title}>
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors group"
              >
                <span>{category.title}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs normal-case bg-muted/50 px-2 py-0.5 rounded-full">
                    {category.components.length}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronDown className="h-3 w-3 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </button>
              
              {!isCollapsed && (
                <div className="space-y-2 transition-all duration-200 ease-in-out">
                  {category.components.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                      onTouchStart={(e) => handleTouchStart(e, component)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`component-item group flex items-center p-3 bg-muted/50 hover:bg-muted rounded-lg cursor-move transition-colors touch-action-none no-select ${
                        touchedComponent?.id === component.id && isDragging ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mr-3", component.color)}>
                        <i className={`${component.icon} text-sm`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{component.name}</p>
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      </div>
                      {onComponentAdd && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onComponentAdd(component);
                          }}
                          className="ml-2 w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary hidden group-hover:flex items-center justify-center"
                          title={`Добавить ${component.name} на холст`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // На мобильных устройствах возвращаем содержимое для использования в Sheet из editor.tsx
  if (isActuallyMobile || isMobile) {
    return <SidebarContent />;
  }

  // Десктопная версия
  return (
    <aside className="w-full bg-background h-full flex flex-col overflow-hidden">
      <SidebarContent />
    </aside>
  );
}
