import { ComponentDefinition, BotProject } from '@shared/schema';
import { cn } from '@/lib/bot-generator/utils';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SheetsManager } from '@/utils/sheets-manager';
import { parsePythonCodeToJson } from '@/lib/bot-generator/format';
import { components } from './massive/massiv';
import { textMessage, stickerMessage, voiceMessage, locationMessage, contactMessage } from './massive/messages';
import { startCommand, helpCommand, settingsCommand, menuCommand, customCommand } from './massive/commands';
import { pinMessage, unpinMessage, deleteMessage } from './massive/content-management';
import { banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights } from './massive/user-management';
import {
  handleProjectDragStart,
  handleProjectDragOver,
  handleProjectDragLeave,
  handleProjectDrop,
  handleProjectDragEnd,
  formatDate,
  getNodeCount,
  getSheetsInfo
} from './handlers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Home, Plus, Trash2, Calendar, GripVertical, FileText, Copy, Share2, ChevronDown, ChevronRight, X, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LayoutButtons } from '@/components/layout/layout-buttons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';

/**
 * Свойства компонента боковой панели с компонентами
 * @interface ComponentsSidebarProps
 */
interface ComponentsSidebarProps {
  /** Колбэк при начале перетаскивания компонента */
  onComponentDrag: (component: ComponentDefinition) => void;
  /** Колбэк при добавлении компонента */
  onComponentAdd?: (component: ComponentDefinition) => void;
  /** Колбэк при выборе проекта */
  onProjectSelect?: (projectId: number) => void;
  /** Идентификатор текущего проекта */
  currentProjectId?: number;
  /** Идентификатор активного листа */
  activeSheetId?: string | undefined;

  // Новые пропсы для управления макетом
  /** Колбэк для переключения видимости холста */
  onToggleCanvas?: () => void;
  /** Колбэк для переключения видимости заголовка */
  onToggleHeader?: () => void;
  /** Колбэк для переключения видимости панели свойств */
  onToggleProperties?: () => void;
  /** Колбэк для показа полного макета */
  onShowFullLayout?: () => void;
  /** Колбэк для изменения конфигурации макета */
  onLayoutChange?: (newConfig: any) => void;
  /** Колбэк для перехода к проектам */
  onGoToProjects?: () => void;
  /** Колбэк для добавления листа */
  onSheetAdd?: (name: string) => void;
  /** Содержимое заголовка */
  headerContent?: React.ReactNode;
  /** Содержимое боковой панели */
  sidebarContent?: React.ReactNode;
  /** Содержимое холста */
  canvasContent?: React.ReactNode;
  /** Содержимое панели свойств */
  propertiesContent?: React.ReactNode;
  /** Видимость холста */
  canvasVisible?: boolean;
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Показывать ли кнопки макета */
  showLayoutButtons?: boolean;

  // Пропсы для управления листами
  /** Колбэк для удаления листа */
  onSheetDelete?: (sheetId: string) => void;
  /** Колбэк для переименования листа */
  onSheetRename?: (sheetId: string, name: string) => void;
  /** Колбэк для дублирования листа */
  onSheetDuplicate?: (sheetId: string) => void;
  /** Колбэк для выбора листа */
  onSheetSelect?: (sheetId: string) => void;

  // Мобильный режим
  /** Флаг мобильного режима */
  isMobile?: boolean;
  /** Колбэк для закрытия панели */
  onClose?: () => void;
}

/**
 * Группировка компонентов по категориям для удобной навигации
 * Разделяет компоненты на логические группы в интерфейсе
 */
const componentCategories = [
  {
    title: 'Сообщения',
    components: [textMessage, voiceMessage, locationMessage, contactMessage]
  },
  {
    title: 'Команды',
    components: [startCommand, helpCommand, settingsCommand, menuCommand, customCommand]
  },
  {
    title: 'Рассылка',
    components: components.filter(c => ['broadcast'].includes(c.type))
  },
  {
    title: 'Client API',
    components: components.filter(c => ['client_auth'].includes(c.type))
  },
  {
    title: 'Управление контентом',
    components: [pinMessage, unpinMessage, deleteMessage]
  },
  {
    title: 'Управление пользователями',
    components: [banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights]
  }
];

/**
 * Компонент боковой панели с компонентами и управлением проектами
 * Предоставляет drag-and-drop интерфейс для добавления компонентов на холст,
 * управление проектами и листами, а также настройки макета
 * @param props - Свойства компонента ComponentsSidebarProps
 * @returns JSX элемент боковой панели
 */
export function ComponentsSidebar({
  onComponentDrag,
  onComponentAdd,
  onProjectSelect,
  currentProjectId,
  activeSheetId,
  onToggleCanvas,
  onToggleHeader,
  onToggleProperties,
  onShowFullLayout,
  canvasVisible = false,
  headerVisible = false,
  propertiesVisible = false,
  showLayoutButtons = false,
  onSheetDelete,
  onSheetRename,
  onSheetDuplicate,
  onSheetSelect,
  isMobile = false,
  onClose
}: ComponentsSidebarProps) {
  // Состояние для управления вкладками и интерфейсом
  const [currentTab, setCurrentTab] = useState<'elements' | 'projects'>('elements');

  // Состояние для drag-and-drop проектов и листов
  const [draggedProject, setDraggedProject] = useState<BotProject | null>(null);
  const [dragOverProject, setDragOverProject] = useState<number | null>(null);
  const [draggedSheet, setDraggedSheet] = useState<{ sheetId: string; projectId: number } | null>(null);
  const [dragOverSheet, setDragOverSheet] = useState<string | null>(null);

  // Состояние для inline редактирования листов
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingSheetName, setEditingSheetName] = useState('');

  // Состояние для сворачивания/раскрытия категорий
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Импорт проекта
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPythonText, setImportPythonText] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pythonFileInputRef = useRef<HTMLInputElement>(null);

  // Touch события для мобильных устройств
  const [touchedComponent, setTouchedComponent] = useState<ComponentDefinition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartElement, setTouchStartElement] = useState<HTMLElement | null>(null);

  const isActuallyMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Функция для переключения видимости категории компонентов
   * Управляет сворачиванием и разворачиванием категорий в списке
   * @param categoryTitle - Название категории для переключения
   */
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

  /**
   * Обработчик начала перетаскивания компонента
   * Инициализирует drag-and-drop операцию для десктопных устройств
   * @param e - Событие перетаскивания
   * @param component - Компонент для перетаскивания
   */
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag(component);
  };

  /**
   * Обработчик начала касания для мобильных устройств
   * Инициализирует touch-based drag-and-drop
   * @param e - Событие касания
   * @param component - Компонент для перетаскивания
   */
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

  /**
   * Обработчик движения касания
   * Отслеживает перемещение пальца по экрану
   * @param e - Событие движения касания
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchedComponent) return;
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch move:', { x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  /**
   * Обработчик окончания касания
   * Завершает touch-based drag-and-drop и проверяет попадание на холст
   * @param e - Событие окончания касания
   */
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

        // Создаем синтетическое событие drop
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
    setTouchStartElement(null);
  };

  /**
   * Глобальные touch обработчики для лучшей поддержки мобильных устройств
   * Обеспечивают корректную работу drag-and-drop на всем экране
   */
  useEffect(() => {
    /**
     * Обработчик глобального движения касания
     * Предотвращает скролл страницы во время перетаскивания
     * @param e - Событие касания
     */
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && touchedComponent) {
        e.preventDefault();
      }
    };

    /**
     * Обработчик глобального окончания касания
     * Завершает перетаскивание независимо от того, где закончилось касание
     * @param e - Событие касания
     */
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!isDragging || !touchedComponent) return;

      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      // Восстанавливаем стили элемента
      if (touchStartElement) {
        touchStartElement.style.opacity = '';
        touchStartElement.style.transform = '';
        touchStartElement.style.transition = '';
      }

      // Проверяем, попали ли мы на холст
      const canvas = document.querySelector('[data-canvas-drop-zone]');

      if (canvas && element) {
        const isInCanvas = canvas.contains(element) || element === canvas ||
          element.closest('[data-canvas-drop-zone]') === canvas;

        if (isInCanvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const dropPosition = {
            x: touch.clientX - canvasRect.left,
            y: touch.clientY - canvasRect.top
          };

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

  /**
   * Загрузка списка проектов с сервера
   * Данные всегда считаются устаревшими для немедленного обновления
   */
  const { data: projects = [], isLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
    staleTime: 0, // Данные всегда считаются устаревшими для немедленного обновления при рефетче
  });

  /**
   * Мутация для создания нового проекта
   * Создает проект с базовым /start узлом и обновляет кэш
   */
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
      // Немедленно обновляем кэш запросов с новым проектом
      const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
      queryClient.setQueryData(['/api/projects'], [...currentProjects, newProject]);

      // Также обновляем кэш списка
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

  /**
   * Мутация для удаления проекта с оптимистичными обновлениями
   * Использует optimistic updates для мгновенного отклика UI
   */
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
    onError: (_, __, context) => {
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

  /**
   * Обработчик создания нового проекта
   * Запускает мутацию создания проекта
   */
  const handleCreateProject = () => {
    createProjectMutation.mutate();
  };

  /**
   * Обработчик начала перетаскивания листа
   * Инициализирует drag-and-drop для перемещения листов между проектами
   * @param e - Событие перетаскивания
   * @param sheetId - Идентификатор листа
   * @param projectId - Идентификатор проекта
   */
  const handleSheetDragStart = (e: React.DragEvent, sheetId: string, projectId: number) => {
    e.stopPropagation();
    setDraggedSheet({ sheetId, projectId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sheetId);
  };

  /**
   * Обработчик сброса листа на проект
   * Перемещает лист из одного проекта в другой
   * @param e - Событие сброса
   * @param targetProjectId - Идентификатор целевого проекта
   */
  const handleSheetDropOnProject = async (e: React.DragEvent, targetProjectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSheet(null);

    if (!draggedSheet) {
      return;
    }

    // Если перемещаем в свой же проект - отменяем
    if (draggedSheet.projectId === targetProjectId) {
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

      // Проверяем что оба проекта в новом формате
      if (!sourceData?.sheets || !targetData?.sheets) {
        toast({
          title: "❌ Ошибка",
          description: "Оба проекта должны быть в новом формате с листами",
          variant: "destructive",
        });
        setDraggedSheet(null);
        return;
      }

      // Находим лист в исходном проекте
      const sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === draggedSheet.sheetId);
      if (sourceSheetIndex === -1) {
        setDraggedSheet(null);
        return;
      }

      const sheetToMove = sourceData.sheets[sourceSheetIndex];

      // Добавляем лист в целевой проект
      const newSheet = JSON.parse(JSON.stringify(sheetToMove)); // Deep copy
      targetData.sheets.push(newSheet);

      // Удаляем из исходного проекта
      sourceData.sheets.splice(sourceSheetIndex, 1);

      // Обновляем оба проекта на сервере
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
    } catch (error: any) {
      console.error('Ошибка при перемещении листа:', error);
      toast({
        title: "❌ Ошибка перемещения",
        description: error.message || "Не удалось переместить лист",
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

  const parsePythonBotToJson = (pythonCode: string) => {
    // Используем функцию парсинга из bot-generator.ts (обратная операция к generatePythonCode)
    const { nodes, connections } = parsePythonCodeToJson(pythonCode);

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
            try {
              // Это Python код бота - парсим его в JSON
              const result = parsePythonBotToJson(importPythonText);
              const projectName = `Python Bot ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              const projectDescription = `Импортирован из Python кода (${result.nodeCount} узлов)`;

              apiRequest('POST', '/api/projects', {
                name: projectName,
                description: projectDescription,
                data: result.data
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
              }).catch((apiError: any) => {
                setImportError(apiError.message || 'Ошибка при создании проекта');
                toast({
                  title: "❌ Ошибка создания проекта",
                  description: apiError.message || 'Не удалось создать проект',
                  variant: "destructive",
                });
              });
            } catch (error: any) {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "❌ Ошибка импорта",
                description: error.message || 'Не удалось создать проект',
                variant: "destructive",
              });
            }
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

  // Создаем контент панели
  const SidebarContent = () => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-slate-50/50 dark:from-slate-900/30 to-transparent">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">Компоненты</h2>
          <div className="flex items-center gap-1">
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
            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={onClose}
                title="Закрыть панель компонентов"
                data-testid="button-close-components-sidebar"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex space-x-1 bg-gradient-to-r from-slate-200/40 to-slate-100/20 dark:from-slate-800/40 dark:to-slate-700/20 rounded-lg p-1 backdrop-blur-sm border border-slate-300/20 dark:border-slate-600/20">
          <button
            onClick={() => setCurrentTab('elements')}
            className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 ${currentTab === 'elements'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-slate-700/30'
              }`}
          >
            Элементы
          </button>
          <button
            onClick={() => setCurrentTab('projects')}
            className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 ${currentTab === 'projects'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-slate-700/30'
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <h3 className="text-base font-bold bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                  Проекты ({projects.length})
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="default"
                    variant="outline"
                    className="h-9 px-3 flex items-center gap-1.5 font-semibold text-xs bg-gradient-to-r from-green-500/10 to-green-400/5 hover:from-green-600/20 hover:to-green-500/15 border-green-400/30 dark:border-green-500/30 hover:border-green-500/50 dark:hover:border-green-400/50 text-green-700 dark:text-green-300 rounded-lg transition-all hover:shadow-md hover:shadow-green-500/20"
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                    title="Создать новый проект"
                    data-testid="button-create-project"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Новый</span>
                  </Button>
                  <Button
                    size="default"
                    variant="outline"
                    className="h-9 px-3 flex items-center gap-1.5 font-semibold text-xs bg-gradient-to-r from-blue-500/10 to-blue-400/5 hover:from-blue-600/20 hover:to-blue-500/15 border-blue-400/30 dark:border-blue-500/30 hover:border-blue-500/50 dark:hover:border-blue-400/50 text-blue-700 dark:text-blue-300 rounded-lg transition-all hover:shadow-md hover:shadow-blue-500/20"
                    onClick={() => {
                      setIsImportDialogOpen(true);
                      setImportJsonText('');
                      setImportError('');
                    }}
                    title="Импортировать проект из JSON"
                    data-testid="button-import-project"
                  >
                    <i className="fas fa-upload text-xs" />
                    <span>Импорт</span>
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
                    {/* Вставка JSON т��кста */}
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
                    onDragStart={(e) => handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject })}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      handleProjectDragOver(e, project.id, setDragOverProject);
                      if (draggedSheet) {
                        console.log('🎯 Sheet over project:', project.id);
                        setDragOverSheet(`project-${project.id}`);
                      }
                    }}
                    onDragLeave={() => {
                      handleProjectDragLeave(setDragOverProject);
                      setDragOverSheet(null);
                    }}
                    onDrop={(e) => {
                      console.log('🎯 Drop on project:', draggedSheet, draggedProject);
                      if (draggedSheet) {
                        handleSheetDropOnProject(e, project.id);
                      } else if (draggedProject) {
                        handleProjectDrop(e, { draggedProject, targetProject: project, queryClient, setDraggedProject, setDragOverProject, toast });
                      }
                    }}
                    onDragEnd={() => handleProjectDragEnd(setDraggedProject, setDragOverProject)}
                    className={`group p-2.5 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm overflow-hidden ${currentProjectId === project.id
                        ? 'bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-600/15 dark:from-blue-600/30 dark:via-blue-500/20 dark:to-cyan-600/25 border-blue-500/50 dark:border-blue-400/50 shadow-lg shadow-blue-500/25'
                        : 'bg-gradient-to-br from-slate-50/60 to-slate-100/40 dark:from-slate-900/50 dark:to-slate-800/40 border-slate-200/40 dark:border-slate-700/40 hover:border-slate-300/60 dark:hover:border-slate-600/60 hover:bg-gradient-to-br hover:from-slate-100/80 hover:to-slate-100/50 dark:hover:from-slate-800/70 dark:hover:to-slate-700/50 hover:shadow-md hover:shadow-slate-500/20'
                      } ${dragOverProject === project.id || dragOverSheet === `project-${project.id}` ? 'border-blue-500 border-2 shadow-xl shadow-blue-500/50 bg-gradient-to-br from-blue-600/25 to-cyan-600/20 dark:from-blue-600/40 dark:to-cyan-600/30' : ''
                      } ${draggedProject?.id === project.id ? 'opacity-50 scale-95' : ''
                      }`}
                    onClick={() => onProjectSelect && onProjectSelect(project.id)}
                  >
                    {/* Header Section */}
                    <div className="flex gap-1.5 xs:gap-2 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4 items-start">
                      <div className="hidden xs:flex cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 flex-shrink-0 mt-0.5">
                        <GripVertical className="h-4 xs:h-4.5 w-4 xs:w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs xs:text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 break-words leading-tight line-clamp-2">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 break-words line-clamp-1 xs:line-clamp-2 leading-relaxed mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-xs px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap font-semibold flex-shrink-0 transition-all ${project.ownerId === null
                            ? 'bg-blue-500/25 text-blue-700 dark:text-blue-300'
                            : 'bg-green-500/25 text-green-700 dark:text-green-300'
                          }`}>
                          {project.ownerId === null ? '👥' : '👤'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 rounded-md flex-shrink-0"
                        >
                          <Trash2 className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 text-xs mb-2.5 xs:mb-3 sm:mb-4 flex-wrap">
                      <span className="flex items-center gap-1 bg-blue-500/15 dark:bg-blue-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-blue-400/30 dark:border-blue-500/30 font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">{getNodeCount(project)}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-purple-500/15 dark:bg-purple-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-purple-400/30 dark:border-purple-500/30 font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs">{(() => { const info = getSheetsInfo(project); return info.count; })()}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-500/15 dark:bg-slate-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-slate-400/30 dark:border-slate-500/30 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{formatDate(project.updatedAt).split(',')[0]}</span>
                      </span>
                    </div>

                    {/* Sheets Section */}
                    {(() => {
                      const sheetsInfo = getSheetsInfo(project);
                      return (
                        <div className="space-y-1 xs:space-y-1.5">
                          {sheetsInfo.names.length > 0 && (
                            <div className="space-y-0.5 sm:space-y-1">
                              {sheetsInfo.names.map((name: string, index: number) => {
                                const projectData = project.data as any;
                                const sheetId = SheetsManager.isNewFormat(projectData) ? projectData.sheets[index]?.id : null;
                                const isActive = currentProjectId === project.id && sheetId === activeSheetId;
                                const isEditing = editingSheetId !== null && sheetId !== null && editingSheetId === sheetId;

                                return (
                                  <div key={index} className="flex items-center gap-1 sm:gap-1.5 group/sheet px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md hover:bg-muted/50 transition-colors">
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
                                        className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6 flex-1 font-medium"
                                      />
                                    ) : (
                                      <div
                                        draggable
                                        onDragStart={(e) => {
                                          if (sheetId) handleSheetDragStart(e, sheetId, project.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedSheet(null);
                                        }}
                                        className={`text-xs px-1.5 sm:px-2 py-0.5 cursor-grab active:cursor-grabbing transition-all flex-1 font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent inline-flex items-center text-center line-clamp-1 ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-foreground hover:bg-muted'
                                          } ${draggedSheet?.sheetId === sheetId && draggedSheet?.projectId === project.id ? 'opacity-50' : ''
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
                                          if (currentProjectId === project.id && SheetsManager.isNewFormat(projectData)) {
                                            const sheetId = projectData.sheets[index]?.id;
                                            if (sheetId) {
                                              handleStartEditingSheet(sheetId, name);
                                            }
                                          }
                                        }}
                                        title={name}
                                      >
                                        <span className="truncate">{name || 'Без названия'}</span>
                                      </div>
                                    )}

                                    {/* Кнопки управления листом */}
                                    {currentProjectId === project.id && !isEditing && (
                                      <div className="flex gap-0.5 sm:gap-1 opacity-0 group-hover/sheet:opacity-100 transition-opacity flex-shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded transition-all"
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
                                          <Copy className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                                        </Button>

                                        {projects.length > 1 && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded transition-all"
                                                title="Переместить в другой проект"
                                              >
                                                <Share2 className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56" side="top" sideOffset={5}>
                                              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Переместить в</div>
                                              {projects.map((otherProject) => {
                                                if (otherProject.id === project.id) return null;
                                                const targetInfo = getSheetsInfo(otherProject);
                                                const targetNodeCount = getNodeCount(otherProject);
                                                return (
                                                  <DropdownMenuItem
                                                    key={otherProject.id}
                                                    onClick={async (e: React.MouseEvent) => {
                                                      e.stopPropagation();
                                                      const sourceData = projectData;
                                                      const targetData = otherProject.data as any;

                                                      if (!sourceData?.sheets || !targetData?.sheets) return;

                                                      const sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === sheetId);
                                                      if (sourceSheetIndex === -1) return;

                                                      const sheetToMove = sourceData.sheets[sourceSheetIndex];
                                                      const newSheet = JSON.parse(JSON.stringify(sheetToMove));
                                                      targetData.sheets.push(newSheet);
                                                      sourceData.sheets.splice(sourceSheetIndex, 1);

                                                      try {
                                                        await Promise.all([
                                                          apiRequest('PUT', `/api/projects/${project.id}`, { data: sourceData }),
                                                          apiRequest('PUT', `/api/projects/${otherProject.id}`, { data: targetData })
                                                        ]);

                                                        const updatedProjects = projects.map(p => {
                                                          if (p.id === project.id) return { ...p, data: sourceData };
                                                          if (p.id === otherProject.id) return { ...p, data: targetData };
                                                          return p;
                                                        });
                                                        queryClient.setQueryData(['/api/projects'], updatedProjects);

                                                        toast({
                                                          title: "✅ Лист перемещен",
                                                          description: `"${sheetToMove.name}" → "${otherProject.name}"`,
                                                        });
                                                      } catch (error: any) {
                                                        toast({
                                                          title: "❌ Ошибка",
                                                          description: error.message,
                                                          variant: "destructive",
                                                        });
                                                      }
                                                    }}
                                                    className="flex flex-col gap-1.5 cursor-pointer py-2.5"
                                                  >
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="font-medium text-sm truncate">{otherProject.name}</span>
                                                      {otherProject.ownerId === null && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium flex-shrink-0">👥</span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-xs bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Zap className="h-2.5 w-2.5" />
                                                        {targetNodeCount}
                                                      </span>
                                                      <span className="text-xs bg-purple-500/10 dark:bg-purple-600/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <FileText className="h-2.5 w-2.5" />
                                                        {targetInfo.count}
                                                      </span>
                                                    </div>
                                                  </DropdownMenuItem>
                                                );
                                              })}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}

                                        {sheetsInfo.count > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded transition-all"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (sheetId && SheetsManager.isNewFormat(projectData)) {
                                                if (onSheetDelete) {
                                                  onSheetDelete(sheetId);
                                                }
                                              }
                                            }}
                                            title="Удалить лист"
                                          >
                                            <Trash2 className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
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
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'elements' && componentCategories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.title);

          return (
            <div key={category.title} className="space-y-2 sm:space-y-3">
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate">{category.title}</span>
                  <span className="text-xs normal-case bg-muted/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-full font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {category.components.length}
                  </span>
                </div>
                <div className="flex-shrink-0 p-1 rounded-md group-hover:bg-muted/50 transition-colors">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5 sm:space-y-2 transition-all duration-200 ease-in-out">
                  {category.components.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                      onTouchStart={(e) => handleTouchStart(e, component)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`component-item group/item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-br from-muted/40 to-muted/20 dark:from-slate-800/50 dark:to-slate-900/30 hover:from-muted/70 hover:to-muted/40 dark:hover:from-slate-700/60 dark:hover:to-slate-800/40 rounded-lg sm:rounded-xl cursor-move transition-all duration-200 touch-action-none no-select border border-border/30 hover:border-primary/30 ${touchedComponent?.id === component.id && isDragging ? 'opacity-50 scale-95' : ''
                        }`}
                      data-testid={`component-${component.id}`}
                    >
                      <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover/item:scale-110", component.color)}>
                        <i className={`${component.icon} text-xs sm:text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{component.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{component.description}</p>
                      </div>
                      {onComponentAdd && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onComponentAdd(component);
                          }}
                          className="ml-1 flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/15 dark:hover:bg-primary/25 hidden group-hover/item:flex items-center justify-center transition-all duration-200 hover:shadow-md hover:shadow-primary/20"
                          title={`Добавить ${component.name} на холст`}
                          data-testid={`button-add-${component.id}`}
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
