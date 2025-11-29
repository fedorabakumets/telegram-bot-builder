import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useTelegramAuth } from '@/hooks/use-telegram-auth';
import { TelegramLoginWidget } from '@/components/telegram-login-widget';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/editor/header';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { Canvas } from '@/components/editor/canvas';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { CodePanel } from '@/components/editor/code-panel';
import { ExportPanel } from '@/components/editor/export-panel';
import { BotControl } from '@/components/editor/bot-control';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { VisibilityControls } from '@/components/editor/visibility-controls';

import { ConnectionManagerPanel } from '@/components/editor/connection-manager-panel';
import { EnhancedConnectionControls } from '@/components/editor/enhanced-connection-controls';
import { ConnectionVisualization } from '@/components/editor/connection-visualization';
import { SmartConnectionCreator } from '@/components/editor/smart-connection-creator';
import { UserDatabasePanel } from '@/components/editor/user-database-panel';
import { DialogPanel } from '@/components/editor/dialog-panel';
import { GroupsPanel } from '@/components/editor/groups-panel';
import { AdaptiveLayout } from '@/components/layout/adaptive-layout';
import { AdaptiveHeader } from '@/components/layout/adaptive-header';
import { LayoutManager, useLayoutManager } from '@/components/layout/layout-manager';
import { LayoutCustomizer } from '@/components/layout/layout-customizer';
import { SimpleLayoutCustomizer, SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';
import { FlexibleLayout } from '@/components/layout/flexible-layout';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useBotEditor } from '@/hooks/use-bot-editor';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { BotProject, Connection, ComponentDefinition, BotData, BotDataWithSheets, Node, UserBotData } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';
import { nanoid } from 'nanoid';

export default function Editor() {
  // Используем useLocation для получения текущего пути
  const [location, setLocation] = useLocation();
  
  // Парсим ID проекта из URL вручную вместо useRoute
  const projectId = (() => {
    const match = location.match(/^\/editor\/(\d+)/) || location.match(/^\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  })();
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups'>('editor');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [selectedDialogUser, setSelectedDialogUser] = useState<UserBotData | null>(null);
  
  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  // Эффект для корректного восстановления мобильного интерфейса при навигации
  useEffect(() => {
    if (isMobile) {
      setShowMobileSidebar(false);
      setShowMobileProperties(false);
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(element => {
          if (element.type === 'sidebar' || element.type === 'properties') {
            return { ...element, visible: false };
          }
          return element;
        })
      }));
    } else {
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(element => ({
          ...element,
          visible: true
        }))
      }));
    }
  }, [isMobile]);

  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showLayoutCustomizer, setShowLayoutCustomizer] = useState(false);
  const [useFlexibleLayout, setUseFlexibleLayout] = useState(true);
  
  // Новая система листов
  const [botDataWithSheets, setBotDataWithSheets] = useState<BotDataWithSheets | null>(null);
  
  // Состояние для реальных размеров узлов (для иерархического layout)
  const [currentNodeSizes, setCurrentNodeSizes] = useState<Map<string, { width: number; height: number }>>(new Map());
  
  // Флаг для предотвращения перезаписи данных во время загрузки шаблона  
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  // Флаг для предотвращения перезаписи при локальных изменениях
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  // Track the last loaded activeProject ID to prevent unnecessary reloads
  const [lastLoadedProjectId, setLastLoadedProjectId] = useState<number | null>(null);
  
  // Состояние истории действий (поднято из Canvas для централизации)
  type ActionType = 'add' | 'delete' | 'move' | 'update' | 'connect' | 'disconnect' | 'duplicate';
  interface ActionHistoryItem {
    id: string;
    type: ActionType;
    description: string;
    timestamp: number;
  }
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  
  // Callback для получения размеров узлов из Canvas
  const handleNodeSizesChange = useCallback((nodeSizes: Map<string, { width: number; height: number }>) => {
    setCurrentNodeSizes(nodeSizes);
  }, []);

  // Обработчик логирования действий в историю - теперь добавляет в состояние
  const handleActionLog = useCallback((type: string, description: string) => {
    console.log('📋 История действий:', type, '-', description);
    const newAction: ActionHistoryItem = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as ActionType,
      description,
      timestamp: Date.now()
    };
    setActionHistory(prev => [newAction, ...prev].slice(0, 50)); // Храним последние 50
  }, []);
  
  // Функции для управления видимостью панелей
  const handleToggleHeader = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'header'
          ? { ...element, visible: !element.visible }
          : element
      )
    }));
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'sidebar'
          ? { ...element, visible: !element.visible }
          : element
      )
    }));
  }, []);

  const handleToggleProperties = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'properties'
          ? { ...element, visible: !element.visible }
          : element
      )
    }));
  }, []);

  const handleToggleCanvas = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'canvas'
          ? { ...element, visible: !element.visible }
          : element
      )
    }));
  }, []);

  const handleToggleCode = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'code'
          ? { ...element, visible: !element.visible }
          : element
      )
    }));
  }, []);

  const handleOpenDialogPanel = useCallback((user: UserBotData) => {
    setSelectedDialogUser(user);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'dialog'
          ? { ...element, visible: true }
          : element
      )
    }));
  }, []);

  const handleCloseDialogPanel = useCallback(() => {
    setSelectedDialogUser(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === 'dialog'
          ? { ...element, visible: false }
          : element
      )
    }));
  }, []);

  const handleOpenMobileSidebar = useCallback(() => {
    setShowMobileSidebar(true);
  }, []);

  const handleOpenMobileProperties = useCallback(() => {
    setShowMobileProperties(true);
  }, []);

  // Создаем динамическую конфигурацию макета
  const getFlexibleLayoutConfig = useCallback((): SimpleLayoutConfig => {
    // Используем компактный заголовок для всех устройств
    const headerSize = isMobile ? 2.5 : 3;
    
    return {
      elements: [
        {
          id: 'header',
          type: 'header',
          name: 'Шапка',
          position: 'top',
          size: headerSize,
          visible: true
        },
        {
          id: 'sidebar',
          type: 'sidebar',
          name: 'Боковая панель',
          position: 'left',
          size: 20,
          visible: true
        },
        {
          id: 'canvas',
          type: 'canvas',
          name: 'Холст',
          position: 'center',
          size: 35,
          visible: true
        },
        {
          id: 'properties',
          type: 'properties',
          name: 'Свойства',
          position: 'right',
          size: 20,
          visible: true
        },
        {
          id: 'code',
          type: 'code',
          name: 'Код',
          position: 'right',
          size: 25,
          visible: false
        },
        {
          id: 'dialog',
          type: 'dialog',
          name: 'Диалог',
          position: 'right',
          size: 30,
          visible: false
        },
      ],
      compactMode: false,
      showGrid: true
    };
  }, [currentTab, isMobile]);

  const [flexibleLayoutConfig, setFlexibleLayoutConfig] = useState<SimpleLayoutConfig>(getFlexibleLayoutConfig());
  
  // Обновляем конфигурацию макета при изменении вкладки или размера экрана
  useEffect(() => {
    setFlexibleLayoutConfig(getFlexibleLayoutConfig());
  }, [getFlexibleLayoutConfig]);
  
  const { config: layoutConfig, updateConfig: updateLayoutConfig, resetConfig: resetLayoutConfig, applyConfig: applyLayoutConfig } = useLayoutManager();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define updateProjectMutation early so it can be used in callbacks
  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!activeProject?.id) {
        console.warn('Cannot save: activeProject or ID is undefined');
        return;
      }
      
      // Всегда используем текущие данные с холста для сохранения
      let projectData;
      
      if (botDataWithSheets) {
        // Обновляем активный лист текущими данными холста
        const currentCanvasData = getBotData();
        const activeSheetId = botDataWithSheets.activeSheetId;
        const updatedSheets = botDataWithSheets.sheets.map(sheet => 
          sheet.id === activeSheetId 
            ? { ...sheet, nodes: currentCanvasData.nodes, connections: currentCanvasData.connections, updatedAt: new Date() }
            : sheet
        );
        
        projectData = {
          ...botDataWithSheets,
          sheets: updatedSheets
        };
      } else {
        // Если нет формата с листами, используем текущие данные холста
        projectData = getBotData();
      }
      
      // Additional safety check before making the API request
      const projectId = activeProject.id;
      if (!projectId) {
        throw new Error('Project ID is required for update');
      }
      
      return apiRequest('PUT', `/api/projects/${projectId}`, {
        data: projectData
      });
    },
    onMutate: async (variables) => {
      if (!activeProject?.id) return;
      
      // Отменяем текущие запросы для предотвращения race condition
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
      await queryClient.cancelQueries({ queryKey: ['/api/projects/list'] });
      
      // Сохраняем предыдущие значения для отката
      const previousProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
      const previousProject = queryClient.getQueryData<BotProject>([`/api/projects/${activeProject.id}`]);
      const previousList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);
      
      // Используем botDataWithSheets напрямую (он уже содержит текущие данные активного листа)
      // так как onMutate вызывается после обновления локального состояния в обработчиках листов
      const optimisticProjectData = botDataWithSheets || activeProject.data;
      
      const optimisticProject: BotProject = {
        ...activeProject,
        data: optimisticProjectData,
        updatedAt: new Date()
      };
      
      // Оптимистично обновляем кеш
      queryClient.setQueryData<BotProject>([`/api/projects/${activeProject.id}`], optimisticProject);
      
      if (previousProjects) {
        const updatedProjects = previousProjects.map(p => 
          p.id === activeProject.id ? optimisticProject : p
        );
        queryClient.setQueryData<BotProject[]>(['/api/projects'], updatedProjects);
      }
      
      if (previousList) {
        const updatedList = previousList.map(p => 
          p.id === activeProject.id ? { ...p, updatedAt: optimisticProject.updatedAt } : p
        );
        queryClient.setQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list'], updatedList);
      }
      
      // Возвращаем контекст для отката
      return { previousProjects, previousProject, previousList };
    },
    onSuccess: async (updatedProject) => {
      // Reset local changes flag only after successful save
      setHasLocalChanges(false);
      
      toast({
        title: "Проект сохранен",
        description: "Изменения успешно сохранены",
      });
    },
    onError: (error, variables, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      if (context?.previousProject && activeProject?.id) {
        queryClient.setQueryData([`/api/projects/${activeProject.id}`], context.previousProject);
      }
      if (context?.previousList) {
        queryClient.setQueryData(['/api/projects/list'], context.previousList);
      }
      
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить проект",
        variant: "destructive",
      });
    }
  });

  // Load current project directly by ID (much faster than loading all projects)
  const { data: currentProject, isLoading: isProjectLoading } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId, // Всегда загружаем если есть ID в URL
    staleTime: 30000, // Кешируем на 30 секунд
  });

  // If no projectId in URL, load project list to get first project ID
  const { data: projectsList, isLoading: isListLoading } = useQuery<Array<Omit<BotProject, 'data'>>>({
    queryKey: ['/api/projects/list'],
    enabled: !projectId, // Загружаем список только если нет ID в URL
    staleTime: 30000,
  });

  // Get effective project ID (from URL or first in list)
  const effectiveProjectId = projectId || projectsList?.[0]?.id;

  // Load first project if no projectId in URL and we have the ID from list
  const { data: firstProject, isLoading: isFirstProjectLoading } = useQuery<BotProject>({
    queryKey: [`/api/projects/${effectiveProjectId}`],
    enabled: !projectId && !!effectiveProjectId && typeof effectiveProjectId === 'number', // Добавить проверку типа
    staleTime: 30000,
  });


  // Use the appropriate project
  const activeProject = projectId ? currentProject : firstProject;

  // Determine if we're still loading
  const isLoadingProject = projectId ? isProjectLoading : (isListLoading || isFirstProjectLoading);



  const {
    nodes,
    connections,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    duplicateNodes,
    addConnection,
    deleteConnection,
    updateConnection,
    updateNodeData,
    addButton,
    updateButton,
    deleteButton,
    updateNodes,
    setBotData,
    getBotData,
    undo,
    redo,
    canUndo,
    canRedo,
    copyToClipboard,
    pasteFromClipboard,
    hasClipboardData,
    isNodeBeingDragged,
    setIsNodeBeingDragged
  } = useBotEditor(activeProject?.data as BotData);

  // Вычисляем selectedNode из selectedNodeId и nodes
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Reset hasLocalChanges when activeProject changes
  useEffect(() => {
    if (activeProject?.id !== lastLoadedProjectId && lastLoadedProjectId !== null) {
      setHasLocalChanges(false);
    }
  }, [activeProject?.id, lastLoadedProjectId]);

  // Обработчик обновления данных листов
  const handleBotDataUpdate = useCallback((updatedData: BotDataWithSheets) => {
    setBotDataWithSheets(updatedData);
    
    // Синхронизируем активный лист с системой редактора
    const activeSheet = SheetsManager.getActiveSheet(updatedData);
    if (activeSheet) {
      // Всегда применяем автоиерархию при обновлении данных листов для правильного отображения
      const shouldSkipLayout = false; // Автоиерархия необходима для корректного расположения узлов
      setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
    }
  }, [setBotData, currentNodeSizes, isMobile, nodes.length]);

  // Обертка для обновления узлов, которая синхронизирует изменения с системой листов
  const handleNodeUpdateWithSheets = useCallback((nodeId: string, updates: any) => {
    // Обновляем в старой системе
    updateNodeData(nodeId, updates);
    
    // Также обновляем в новой системе листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, ...updates } }
                : node
            )
          };
        }
        return sheet;
      });
      
      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNodeData, botDataWithSheets]);

  // Обработчик смены типа узла
  const handleNodeTypeChange = useCallback((nodeId: string, newType: any, newData: any) => {
    // Обновляем в старой системе
    updateNode(nodeId, { type: newType, data: newData });
    
    // Также обновляем в новой системе листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, type: newType, data: newData }
                : node
            )
          };
        }
        return sheet;
      });
      
      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNode, botDataWithSheets]);

  // Обработчик смены ID узла
  const handleNodeIdChange = useCallback((oldId: string, newId: string) => {
    if (!botDataWithSheets || !botDataWithSheets.activeSheetId) return;
    
    const updatedSheets = botDataWithSheets.sheets.map(sheet => {
      if (sheet.id === botDataWithSheets.activeSheetId) {
        return {
          ...sheet,
          nodes: sheet.nodes.map(node => 
            node.id === oldId 
              ? { ...node, id: newId }
              : node
          ),
          connections: sheet.connections.map(conn => ({
            ...conn,
            source: conn.source === oldId ? newId : conn.source,
            target: conn.target === oldId ? newId : conn.target
          }))
        };
      }
      return sheet;
    });
    
    setBotDataWithSheets({
      ...botDataWithSheets,
      sheets: updatedSheets
    });
    
    if (selectedNodeId === oldId) {
      setSelectedNodeId(newId);
    }
  }, [botDataWithSheets, selectedNodeId]);

  // Обновляем данные бота при смене проекта
  useEffect(() => {
    if (activeProject?.data && !isLoadingTemplate && !hasLocalChanges && 
        (lastLoadedProjectId !== activeProject?.id)) {
      
      const projectData = activeProject.data as any;
      
      // Проверяем формат и мигрируем если нужно
      let sheetsData: BotDataWithSheets;
      if (SheetsManager.isNewFormat(projectData)) {
        sheetsData = projectData;
      } else {
        sheetsData = SheetsManager.migrateLegacyData(projectData as BotData);
        // Сохраняем мигрированные данные
        updateProjectMutation.mutate({ data: sheetsData });
      }
      
      // Устанавливаем данные листов для отображения панели
      setBotDataWithSheets(sheetsData);
      
      // Устанавливаем активный лист в редактор
      const activeSheet = SheetsManager.getActiveSheet(sheetsData);
      if (activeSheet) {
        setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections }, undefined, undefined, true);
      }
      
      // Обновляем отслеживание загруженного проекта
      setLastLoadedProjectId(activeProject.id);
      localStorage.setItem('lastProjectId', activeProject.id.toString());
    }
  }, [activeProject?.id, isLoadingTemplate, hasLocalChanges, lastLoadedProjectId]);


  const handleSave = useCallback(() => {
    if (activeProject?.id) {
      updateProjectMutation.mutate({});
    }
  }, [updateProjectMutation, activeProject]);

  const handleTabChange = useCallback((tab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups') => {
    setCurrentTab(tab);
    if (tab === 'preview') {
      // Auto-save before showing preview
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
      // Navigate to preview page instead of showing modal
      setLocation(`/preview/${activeProject?.id}`);
      return;
    } else if (tab === 'export') {
      // Auto-save before showing export page
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } else if (tab === 'bot') {
      // Auto-save before showing bot controls
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } else if (tab === 'users') {
      // Auto-save before showing users panel
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    }
  }, [updateProjectMutation, activeProject, setLocation]);

  // Функции управления листами
  const handleSheetAdd = useCallback((name: string) => {
    if (!botDataWithSheets) return;
    
    try {
      const updatedData = SheetsManager.addSheet(botDataWithSheets, name);
      setBotDataWithSheets(updatedData);
      
      // Переключаемся на новый лист
      const newSheet = SheetsManager.getActiveSheet(updatedData);
      if (newSheet) {
        // При добавлении нового листа всегда применяем автоиерархию
        const shouldSkipLayout = false; // Автоиерархия нужна для правильного расположения новых листов
        setBotData({ nodes: newSheet.nodes, connections: newSheet.connections }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }
      
      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
      
      toast({
        title: "Лист создан",
        description: `Лист "${name}" успешно создан`,
      });
    } catch (error) {
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, isMobile, nodes.length, currentNodeSizes, activeProject]);

  const handleSheetDelete = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;
    
    try {
      const updatedData = SheetsManager.deleteSheet(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);
      
      // Переключаемся на активный лист
      const activeSheet = SheetsManager.getActiveSheet(updatedData);
      if (activeSheet) {
        setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections }); // автоиерархия должна работать при переключении листов
      }
      
      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
      
      toast({
        title: "Лист удален",
        description: "Лист успешно удален",
      });
    } catch (error) {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, activeProject]);

  const handleSheetRename = useCallback((sheetId: string, newName: string) => {
    if (!botDataWithSheets) return;
    
    try {
      const updatedData = SheetsManager.renameSheet(botDataWithSheets, sheetId, newName);
      setBotDataWithSheets(updatedData);
      
      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
      
      toast({
        title: "Лист переименован",
        description: `Лист переименован в "${newName}"`,
      });
    } catch (error) {
      toast({
        title: "Ошибка переименования",
        description: "Не удалось переименовать лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, updateProjectMutation, toast, activeProject]);

  const handleSheetDuplicate = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;
    
    try {
      const updatedData = SheetsManager.duplicateSheetInProject(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);
      
      // Переключаемся на дублированный лист
      const newSheet = SheetsManager.getActiveSheet(updatedData);
      if (newSheet) {
        // При дублировании листа всегда применяем автоиерархию
        const shouldSkipLayout = false; // Автоиерархия нужна для правильного расположения дублированных листов
        setBotData({ nodes: newSheet.nodes, connections: newSheet.connections }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }
      
      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
      
      toast({
        title: "Лист дублирован",
        description: "Лист успешно дублирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка дублирования",
        description: "Не удалось дублировать лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, activeProject]);

  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;
    
    try {
      // Проверяем, существует ли лист с таким ID
      const sheetExists = botDataWithSheets.sheets.some(sheet => sheet.id === sheetId);
      if (!sheetExists) {
        console.warn(`Лист ${sheetId} не найден в проекте`);
        
        // Переключаемся на первый доступный лист
        if (botDataWithSheets.sheets.length > 0) {
          const firstAvailableSheet = botDataWithSheets.sheets[0];
          const updatedData = SheetsManager.setActiveSheet(botDataWithSheets, firstAvailableSheet.id);
          setBotDataWithSheets(updatedData);
          
          // Загружаем данные первого доступного листа
          const newActiveSheet = SheetsManager.getActiveSheet(updatedData);
          if (newActiveSheet) {
            const shouldSkipLayout = false;
            setBotData({ nodes: newActiveSheet.nodes, connections: newActiveSheet.connections }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
          }
          
          // Сохраняем и принудительно перезагружаем проект
          if (activeProject?.id) {
            updateProjectMutation.mutate({});
            // Принудительно перезагружаем данные проекта
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
              queryClient.refetchQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.refetchQueries({ queryKey: ['/api/projects'] });
            }, 100);
          }
        }
        
        toast({
          title: "Лист был удален",
          description: "Переключились на другой лист",
          variant: "destructive",
        });
        return;
      }
      
      // Сначала сохраняем текущие данные холста в активном листе
      const currentCanvasData = getBotData();
      const activeSheetId = botDataWithSheets.activeSheetId;
      const updatedSheets = botDataWithSheets.sheets.map(sheet => 
        sheet.id === activeSheetId 
          ? { ...sheet, nodes: currentCanvasData.nodes, connections: currentCanvasData.connections, updatedAt: new Date() }
          : sheet
      );
      
      // Затем переключаемся на новый лист
      const updatedData = SheetsManager.setActiveSheet(
        { ...botDataWithSheets, sheets: updatedSheets }, 
        sheetId
      );
      setBotDataWithSheets(updatedData);
      
      // Загружаем данные нового активного листа на холст
      const newActiveSheet = SheetsManager.getActiveSheet(updatedData);
      if (newActiveSheet) {
        // При переключении листов применяем автоиерархию для лучшего отображения
        const shouldSkipLayout = false; // Автоиерархия нужна для правильного отображения
        setBotData({ nodes: newActiveSheet.nodes, connections: newActiveSheet.connections }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }
      
      // Сохраняем изменения
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } catch (error) {
      toast({
        title: "Ошибка переключения",
        description: "Не удалось переключиться на лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, getBotData, setBotData, updateProjectMutation, toast, isMobile, nodes.length, currentNodeSizes, activeProject, queryClient]);

  // Проверяем, есть ли выбранный шаблон при загрузке страницы
  useEffect(() => {
    const selectedTemplateData = localStorage.getItem('selectedTemplate');
    if (selectedTemplateData && activeProject) {
      try {
        setIsLoadingTemplate(true); // Устанавливаем флаг загрузки шаблона
        const template = JSON.parse(selectedTemplateData);
        console.log('Применяем сохраненный шаблон:', template.name);
        
        // Проверяем, есть ли в шаблоне многолистовая структура
        if (template.data.sheets && Array.isArray(template.data.sheets)) {
          console.log('Применяем многолистовой шаблон с листами:', template.data.sheets.length);
          
          // Создаем новые ID для листов шаблона
          const updatedSheets = template.data.sheets.map((sheet: any) => {
            // Очищаем узлы от потенциальных циклических ссылок
            const cleanNodes = sheet.nodes?.map((node: any) => {
              const cleanNode = {
                id: node.id,
                type: node.type,
                position: node.position || { x: 0, y: 0 },
                data: {
                  ...node.data,
                  // Убираем любые потенциальные циклические ссылки
                  parent: undefined,
                  children: undefined
                }
              };
              return cleanNode;
            }) || [];

            // Очищаем соединения
            const cleanConnections = sheet.connections?.map((conn: any) => ({
              id: conn.id,
              source: conn.source,
              target: conn.target,
              sourceHandle: conn.sourceHandle,
              targetHandle: conn.targetHandle
            })) || [];

            return {
              id: nanoid(), // Новый уникальный ID для листа
              name: sheet.name,
              nodes: cleanNodes,
              connections: cleanConnections,
              viewState: sheet.viewState || { position: { x: 0, y: 0 }, zoom: 1 },
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
          
          const templateDataWithSheets = {
            sheets: updatedSheets,
            activeSheetId: updatedSheets[0]?.id,
            version: 2,
            interSheetConnections: template.data.interSheetConnections || []
          };
          
          // Устанавливаем многолистовые данные
          setBotDataWithSheets(templateDataWithSheets);
          
          // Устанавливаем первый лист как активный на холсте
          const firstSheet = updatedSheets[0];
          if (firstSheet) {
            // Всегда применяем автоиерархию при загрузке шаблонов для правильного расположения
            const shouldSkipLayout = false; // Автоиерархия необходима при загрузке многолистовых шаблонов
            setBotData({ nodes: firstSheet.nodes, connections: firstSheet.connections }, template.name, currentNodeSizes, shouldSkipLayout);
          }
          
          // Сохраняем в проект только если activeProject загружен
          if (activeProject?.id) {
            updateProjectMutation.mutate({
              data: templateDataWithSheets
            });
          }
        } else {
          // Обычный шаблон без листов - мигрируем к формату с листами
          console.log('Применяем обычный шаблон и мигрируем к формату с листами');
          const migratedData = SheetsManager.migrateLegacyData(template.data);
          setBotDataWithSheets(migratedData);
          // Всегда применяем автоиерархию при загрузке шаблонов для правильного расположения
          const shouldSkipLayout = false; // Автоиерархия необходима при загрузке обычных шаблонов
          setBotData(template.data, template.name, currentNodeSizes, shouldSkipLayout); // автоиерархия должна работать при загрузке шаблонов
          
          // Сохраняем в проект только если activeProject загружен
          if (activeProject?.id) {
            updateProjectMutation.mutate({
              data: migratedData
            });
          }
        }
        
        // Принудительно инвалидируем кеш проектов после применения шаблона
        // чтобы на странице "Проекты" отображалось правильное количество листов
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        
        toast({
          title: 'Шаблон применен',
          description: `Шаблон "${template.name}" успешно загружен`,
        });
        
        // Удаляем сохраненный шаблон
        localStorage.removeItem('selectedTemplate');
        
        // Небольшая задержка, чтобы дать время на сохранение, затем убираем флаг
        setTimeout(() => {
          setIsLoadingTemplate(false);
        }, 1000);
      } catch (error) {
        console.error('Ошибка применения сохраненного шаблона:', error);
        localStorage.removeItem('selectedTemplate');
        setIsLoadingTemplate(false); // Убираем флаг при ошибке
      }
    }
  }, [activeProject?.id, setBotData, setBotDataWithSheets, updateProjectMutation, toast, queryClient]);

  // Enhanced onNodeUpdate that auto-saves changes
  const handleNodeUpdate = useCallback((nodeId: string, updates: any) => {
    // First update local state
    updateNodeData(nodeId, updates);
    // Set local changes flag - don't reset it immediately
    setHasLocalChanges(true);
    // Then auto-save to database with a small delay
    setTimeout(() => {
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    }, 500); // 500ms delay to allow for rapid typing
  }, [updateNodeData, updateProjectMutation, activeProject]);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position });
  }, [updateNode]);

  // Обёртки для deleteNode и duplicateNode с логированием в историю
  const handleNodeDelete = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('delete', `Удален узел "${node?.type || 'Unknown'}"`);
    deleteNode(nodeId);
  }, [deleteNode, nodes, handleActionLog]);

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
    duplicateNode(nodeId);
  }, [duplicateNode, nodes, handleActionLog]);

  const handleComponentDrag = useCallback((component: ComponentDefinition) => {
    // Handle component drag start if needed
  }, []);

  const handleComponentAdd = useCallback((component: ComponentDefinition) => {
    // Prevent adding nodes during template loading
    if (isLoadingTemplate) {
      return;
    }
    
    // Set local changes flag first to prevent useEffect from running
    setHasLocalChanges(true);
    
    // Создаем новый узел из компонента
    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 }, // Случайная позиция с небольшим смещением
      data: component.defaultData || {}
    };
    
    // Логируем добавление в историю действий
    console.log('📝 Добавление узла:', component.type);
    handleActionLog('add', `Добавлен узел "${component.type}"`);
    
    // Добавляем узел на холст
    addNode(newNode);
    
    // Auto-save after a short delay to persist the new node
    setTimeout(() => {
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    }, 1000);
  }, [addNode, isLoadingTemplate, updateProjectMutation, activeProject, handleActionLog]);

  const handleSaveAsTemplate = useCallback(() => {
    setShowSaveTemplate(true);
  }, []);

  const handleLoadTemplate = useCallback(() => {
    console.log('Template button clicked, navigating to templates page...');
    setLocation('/templates');
  }, [setLocation]);

  const handleGoToProjects = useCallback(() => {
    setLocation('/projects');
  }, [setLocation]);

  const handleProjectSelect = useCallback((newProjectId: number) => {
    setLocation(`/editor/${newProjectId}`);
  }, [setLocation]);

  const handleSelectTemplate = useCallback((template: any) => {
    // Применяем шаблон к текущему проекту
    try {
      setIsLoadingTemplate(true); // Устанавливаем флаг загрузки шаблона
      console.log('Обработка выбора шаблона:', template.name);
      console.log('Данные шаблона:', template.data);
      
      // Проверяем, есть ли в шаблоне многолистовая структура
      if (template.data.sheets && Array.isArray(template.data.sheets)) {
        console.log('Применяем многолистовой шаблон с листами:', template.data.sheets.length);
        
        // Создаем новые ID для листов шаблона
        const updatedSheets = template.data.sheets.map((sheet: any) => {
          // Очищаем узлы от потенциальных циклических ссылок
          const cleanNodes = sheet.nodes?.map((node: any) => {
            const cleanNode = {
              id: node.id,
              type: node.type,
              position: node.position || { x: 0, y: 0 },
              data: {
                ...node.data,
                // Убираем любые потенциальные циклические ссылки
                parent: undefined,
                children: undefined
              }
            };
            return cleanNode;
          }) || [];

          // Очищаем соединения
          const cleanConnections = sheet.connections?.map((conn: any) => ({
            id: conn.id,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle
          })) || [];

          return {
            id: nanoid(), // Новый уникальный ID для листа
            name: sheet.name,
            nodes: cleanNodes,
            connections: cleanConnections,
            viewState: sheet.viewState || { position: { x: 0, y: 0 }, zoom: 1 },
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
        
        const templateDataWithSheets = {
          sheets: updatedSheets,
          activeSheetId: updatedSheets[0]?.id,
          version: 2,
          interSheetConnections: template.data.interSheetConnections || []
        };
        
        // Устанавливаем многолистовые данные
        setBotDataWithSheets(templateDataWithSheets);
        
        // Устанавливаем первый лист как активный на холсте
        const firstSheet = updatedSheets[0];
        if (firstSheet) {
          // При применении шаблона layout всегда применяется независимо от устройства
          setBotData({ nodes: firstSheet.nodes, connections: firstSheet.connections }, template.name, currentNodeSizes, false);
          console.log('Применили первый лист, узлов:', firstSheet.nodes.length);
          console.log('Применили первый лист, связей:', firstSheet.connections.length);
        }
        
        // Сохраняем в проект только если activeProject загружен
        if (activeProject?.id) {
          updateProjectMutation.mutate({
            data: templateDataWithSheets
          });
        }
      } else {
        // Обычный шаблон без листов
        console.log('Применяем обычный шаблон');
        const templateData = template.data;
        
        if (!templateData || !templateData.nodes) {
          throw new Error('Некорректные данные шаблона');
        }
        
        // Мигрируем к формату с листами
        const migratedData = SheetsManager.migrateLegacyData(templateData);
        setBotDataWithSheets(migratedData);
        // При применении шаблона layout всегда применяется независимо от устройства
        setBotData(templateData, template.name, currentNodeSizes, false);
        
        console.log('Применили данные шаблона, узлов:', templateData.nodes.length);
        console.log('Применили данные шаблона, связей:', templateData.connections?.length || 0);
        
        // Сохраняем изменения в базе данных сразу с новыми данными
        console.log('Сохраняем шаблон в БД, узлов:', migratedData.sheets?.[0]?.nodes?.length || templateData.nodes?.length);
        if (activeProject?.id) {
          updateProjectMutation.mutate({
            data: migratedData
          });
        }
      }
      
      // Обновляем кеш проектов для синхронизации панели компонентов  
      console.log('Шаблон применен, обновляем кеш проектов');
      // Даем небольшую задержку для завершения мутации, затем обновляем кеш
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      }, 500);
      
      toast({
        title: 'Шаблон применен',
        description: `Шаблон "${template.name}" успешно загружен`,
      });
      
      // Небольшая задержка, чтобы дать время на сохранение, затем убираем флаг
      setTimeout(() => {
        setIsLoadingTemplate(false);
      }, 1000);
    } catch (error) {
      console.error('Ошибка применения шаблона:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить шаблон',
        variant: 'destructive',
      });
      setIsLoadingTemplate(false); // Убираем флаг при ошибке
    }
  }, [setBotData, setBotDataWithSheets, updateProjectMutation, toast, queryClient]);

  // Обработчики для управления связями
  const handleConnectionsChange = useCallback((newConnections: Connection[]) => {
    // Обновляем связи через существующий механизм
    const currentData = getBotData();
    if (activeProject?.id) {
      updateProjectMutation.mutate({
        data: {
          ...currentData,
          connections: newConnections
        }
      });
    }
  }, [getBotData, updateProjectMutation, activeProject]);

  const handleConnectionSelect = useCallback((connection: Connection | null) => {
    setSelectedConnection(connection);
    setSelectedConnectionId(connection?.id || null);
  }, []);

  const handleConnectionEdit = useCallback((connection: Connection) => {
    setSelectedConnection(connection);
    setSelectedConnectionId(connection.id);
    // Можно добавить логику редактирования
  }, []);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    const wasDeleted = deleteConnection(connectionId);
    if (!wasDeleted) {
      toast({
        title: "Невозможно удалить соединение",
        description: "Это автоматическое соединение создано на основе свойства autoTransitionTo. Измените настройки узла, чтобы удалить его.",
        variant: "default",
      });
      return;
    }
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
      setSelectedConnection(null);
    }
  }, [deleteConnection, selectedConnectionId, toast]);



  // Определяем содержимое панели свойств для переиспользования
  const propertiesContent = activeProject ? (
    <PropertiesPanel
      projectId={activeProject.id}
      selectedNode={selectedNode}
      allNodes={nodes}
      allSheets={botDataWithSheets?.sheets || []}
      currentSheetId={botDataWithSheets?.activeSheetId || undefined}
      onNodeUpdate={handleNodeUpdateWithSheets}
      onNodeTypeChange={handleNodeTypeChange}
      onNodeIdChange={handleNodeIdChange}
      onButtonAdd={addButton}
      onButtonUpdate={updateButton}
      onButtonDelete={deleteButton}
      onClose={handleToggleProperties}
    />
  ) : null;

  // Определяем содержимое панели кода
  const codeContent = activeProject ? (
    <CodePanel
      botData={(botDataWithSheets || getBotData()) as any}
      projectName={activeProject.name}
      projectId={activeProject.id}
      selectedNodeId={selectedNodeId}
      onClose={handleToggleCode}
    />
  ) : null;

  if (!activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-gray-400 text-xl"></i>
          </div>
          <p className="text-gray-600">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  // Функция рендеринга содержимого для гибкого макета
  const renderFlexibleLayoutContent = () => {
    const headerContent = (
      <AdaptiveHeader
        config={layoutConfig}
        projectName={activeProject.name}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onExport={() => {}}
        onSaveAsTemplate={handleSaveAsTemplate}
        onLoadTemplate={handleLoadTemplate}
        onLayoutSettings={() => setShowLayoutManager(true)}
        onToggleHeader={handleToggleHeader}
        onToggleSidebar={handleToggleSidebar}
        onToggleProperties={handleToggleProperties}
        onToggleCanvas={handleToggleCanvas}
        onToggleCode={handleToggleCode}
        headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
        sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
        propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
        canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
        codeVisible={flexibleLayoutConfig.elements.find(el => el.id === 'code')?.visible ?? false}
        onOpenMobileSidebar={() => setShowMobileSidebar(true)}
        onOpenMobileProperties={() => setShowMobileProperties(true)}
      />
    );

    const canvasContent = (
      <div className="h-full">
        {currentTab === 'groups' ? (
          <GroupsPanel
            projectId={activeProject.id}
            projectName={activeProject.name}
          />
        ) : currentTab === 'editor' ? (
          <Canvas
            // Новая система листов
            botData={botDataWithSheets || undefined}
            onBotDataUpdate={handleBotDataUpdate}
            // Существующие пропсы для совместимости
            nodes={nodes}
            connections={connections}
            selectedNodeId={selectedNodeId}
            selectedConnectionId={selectedConnectionId ?? undefined}
            onNodeSelect={setSelectedNodeId}
            onNodeAdd={addNode}
            onNodeDelete={handleNodeDelete}
            onNodeDuplicate={handleNodeDuplicate}
            onNodeMove={handleNodeMove}
            onConnectionSelect={setSelectedConnectionId}
            onConnectionDelete={deleteConnection}
            onConnectionAdd={addConnection}
            onNodesUpdate={updateNodes}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onSave={() => updateProjectMutation.mutate({})}
            isSaving={updateProjectMutation.isPending}
            onCopyToClipboard={copyToClipboard}
            onPasteFromClipboard={pasteFromClipboard}
            hasClipboardData={hasClipboardData()}
            isNodeBeingDragged={isNodeBeingDragged}
            setIsNodeBeingDragged={setIsNodeBeingDragged}
            onToggleHeader={handleToggleHeader}
            onToggleSidebar={handleToggleSidebar}
            onToggleProperties={handleToggleProperties}
            onToggleCanvas={handleToggleCanvas}
            headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
            sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
            propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
            canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
            onOpenMobileSidebar={handleOpenMobileSidebar}
            onOpenMobileProperties={handleOpenMobileProperties}
            onNodeSizesChange={handleNodeSizesChange}
            onActionLog={handleActionLog}
            actionHistory={actionHistory}
          />
        ) : currentTab === 'bot' ? (
          <div className="h-full p-6 bg-background overflow-auto">
            <div className="max-w-2xl mx-auto">
              <BotControl
                projectId={activeProject.id}
                projectName={activeProject.name}
              />
            </div>
          </div>
        ) : currentTab === 'users' ? (
          <div className="h-full">
            <UserDatabasePanel
              projectId={activeProject.id}
              projectName={activeProject.name}
              onOpenDialogPanel={handleOpenDialogPanel}
            />
          </div>
        ) : currentTab === 'export' ? (
          <ExportPanel
            botData={(botDataWithSheets || getBotData()) as any}
            projectName={activeProject.name}
            projectId={activeProject.id}
            userDatabaseEnabled={activeProject.userDatabaseEnabled === 1}
          />
        ) : null}
      </div>
    );

    const sidebarContent = (
      <ComponentsSidebar 
        onComponentDrag={handleComponentDrag}
        onComponentAdd={handleComponentAdd}
        onLoadTemplate={handleLoadTemplate}
        onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
        onLayoutChange={updateLayoutConfig}
        onGoToProjects={handleGoToProjects}
        onProjectSelect={handleProjectSelect}
        currentProjectId={activeProject?.id}
        activeSheetId={botDataWithSheets?.activeSheetId}
        headerContent={headerContent}
        sidebarContent={<div>Sidebar</div>}
        canvasContent={canvasContent}
        propertiesContent={propertiesContent}
        onToggleCanvas={handleToggleCanvas}
        onToggleHeader={handleToggleHeader}
        onToggleProperties={handleToggleProperties}
        onShowFullLayout={() => {
          setFlexibleLayoutConfig(prev => ({
            ...prev,
            elements: prev.elements.map(element => ({ ...element, visible: true }))
          }))
        }}
        canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
        headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
        propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
        showLayoutButtons={!flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible && !flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible}
        onSheetAdd={handleSheetAdd}
        onSheetDelete={handleSheetDelete}
        onSheetRename={handleSheetRename}
        onSheetDuplicate={handleSheetDuplicate}
        onSheetSelect={handleSheetSelect}
        isMobile={isMobile}
      />
    );

    if (useFlexibleLayout) {
      return (
        <SimpleLayoutCustomizer
          config={flexibleLayoutConfig}
          onConfigChange={setFlexibleLayoutConfig}
        >
          <FlexibleLayout
            config={flexibleLayoutConfig}
            headerContent={headerContent}
            sidebarContent={sidebarContent}
            canvasContent={canvasContent}
            propertiesContent={propertiesContent}
            codeContent={codeContent}
            dialogContent={
              selectedDialogUser && activeProject && (
                <DialogPanel
                  projectId={activeProject.id}
                  user={selectedDialogUser}
                  onClose={handleCloseDialogPanel}
                />
              )
            }
            onConfigChange={setFlexibleLayoutConfig}
            hideOnMobile={isMobile}
            currentTab={currentTab}
          />
        </SimpleLayoutCustomizer>
      );
    }

    return null;
  };

  return (
    <>
      {useFlexibleLayout ? (
        renderFlexibleLayoutContent()
      ) : (
        <AdaptiveLayout
          config={layoutConfig}
          header={
            <AdaptiveHeader
              config={layoutConfig}
              projectName={activeProject.name}
              currentTab={currentTab}
              onTabChange={handleTabChange}
              onExport={() => {}}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              onToggleHeader={handleToggleHeader}
              onToggleSidebar={handleToggleSidebar}
              onToggleProperties={handleToggleProperties}
              onToggleCanvas={handleToggleCanvas}
              onToggleCode={handleToggleCode}
              headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
              sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
              propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
              canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
              codeVisible={flexibleLayoutConfig.elements.find(el => el.id === 'code')?.visible ?? false}
              onOpenMobileSidebar={() => setShowMobileSidebar(true)}
              onOpenMobileProperties={() => setShowMobileProperties(true)}
            />
          }
          sidebar={
            <ComponentsSidebar 
              onComponentDrag={handleComponentDrag}
              onComponentAdd={handleComponentAdd}
              onLoadTemplate={handleLoadTemplate}
              onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
              onLayoutChange={updateLayoutConfig}
              onGoToProjects={handleGoToProjects}
              onProjectSelect={handleProjectSelect}
              currentProjectId={activeProject?.id}
              activeSheetId={botDataWithSheets?.activeSheetId}
              onToggleCanvas={handleToggleCanvas}
              onToggleHeader={handleToggleHeader}
              onToggleProperties={handleToggleProperties}
              onShowFullLayout={() => {
                setFlexibleLayoutConfig(prev => ({
                  ...prev,
                  elements: prev.elements.map(element => ({ ...element, visible: true }))
                }))
              }}
              canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
              headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
              propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
              showLayoutButtons={!flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible && !flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible}
              onSheetAdd={handleSheetAdd}
              onSheetDelete={handleSheetDelete}
              onSheetRename={handleSheetRename}
              onSheetDuplicate={handleSheetDuplicate}
              onSheetSelect={handleSheetSelect}
              isMobile={isMobile}
            />
          }
          canvas={
            <div className="h-full">
              {currentTab === 'editor' ? (
                <Canvas
                  botData={botDataWithSheets || undefined}
                  onBotDataUpdate={handleBotDataUpdate}
                  nodes={nodes}
                  connections={connections}
                  selectedNodeId={selectedNodeId}
                  selectedConnectionId={selectedConnectionId || undefined}
                  onNodeSelect={setSelectedNodeId}
                  onNodeAdd={addNode}
                  onNodeDelete={deleteNode}
                  onNodeDuplicate={duplicateNode}
                  onNodeMove={handleNodeMove}
                  onConnectionSelect={setSelectedConnectionId}
                  onConnectionDelete={deleteConnection}
                  onConnectionAdd={addConnection}
                  onNodesUpdate={updateNodes}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onSave={() => updateProjectMutation.mutate({})}
                  isSaving={updateProjectMutation.isPending}
                  onCopyToClipboard={copyToClipboard}
                  onPasteFromClipboard={pasteFromClipboard}
                  hasClipboardData={hasClipboardData()}
                  onToggleHeader={handleToggleHeader}
                  onToggleSidebar={handleToggleSidebar}
                  onToggleProperties={handleToggleProperties}
                  onToggleCanvas={handleToggleCanvas}
                  headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
                  sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
                  propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
                  canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
                  onOpenMobileSidebar={handleOpenMobileSidebar}
                  onActionLog={handleActionLog}
                  actionHistory={actionHistory}
                />
              ) : currentTab === 'bot' ? (
                <div className="h-full p-6 bg-background overflow-auto">
                  <div className="max-w-2xl mx-auto">
                    <BotControl
                      projectId={activeProject.id}
                      projectName={activeProject.name}
                    />
                  </div>
                </div>
              ) : currentTab === 'users' ? (
                <div className="h-full">
                  <UserDatabasePanel
                    projectId={activeProject.id}
                    projectName={activeProject.name}
                    onOpenDialogPanel={handleOpenDialogPanel}
                  />
                </div>
              ) : currentTab === 'groups' ? (
                <div className="h-full">
                  <GroupsPanel
                    projectId={activeProject.id}
                    projectName={activeProject.name}
                  />
                </div>
              ) : currentTab === 'export' ? (
                <ExportPanel
                  botData={(botDataWithSheets || getBotData()) as any}
                  projectName={activeProject.name}
                  projectId={activeProject.id}
                  userDatabaseEnabled={activeProject.userDatabaseEnabled === 1}
                />
              ) : null}
            </div>
          }
          properties={
            <PropertiesPanel
              projectId={activeProject.id}
              selectedNode={selectedNode}
              allNodes={nodes}
              allSheets={botDataWithSheets?.sheets || []}
              currentSheetId={botDataWithSheets?.activeSheetId || undefined}
              onNodeUpdate={handleNodeUpdateWithSheets}
              onNodeTypeChange={handleNodeTypeChange}
              onNodeIdChange={handleNodeIdChange}
              onButtonAdd={addButton}
              onButtonUpdate={updateButton}
              onButtonDelete={deleteButton}
            />
          }
        />
      )}

      {showLayoutManager && (
        <LayoutManager
          config={layoutConfig}
          onConfigChange={updateLayoutConfig}
          onApply={applyLayoutConfig}
          onReset={resetLayoutConfig}
        />
      )}

      {showLayoutCustomizer && (
        <LayoutCustomizer
          headerContent={
            <AdaptiveHeader
              config={layoutConfig}
              projectName={activeProject.name}
              currentTab={currentTab}
              onTabChange={handleTabChange}
              onExport={() => {}}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              onToggleCode={handleToggleCode}
              codeVisible={flexibleLayoutConfig.elements.find(el => el.id === 'code')?.visible ?? false}
              onOpenMobileSidebar={() => setShowMobileSidebar(true)}
              onOpenMobileProperties={() => setShowMobileProperties(true)}
            />
          }
          sidebarContent={
            <ComponentsSidebar 
              onComponentDrag={handleComponentDrag}
              onComponentAdd={handleComponentAdd}
              onLoadTemplate={handleLoadTemplate}
              onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
              onLayoutChange={updateLayoutConfig}
              activeSheetId={botDataWithSheets?.activeSheetId}
              headerContent={
                <AdaptiveHeader
                  config={layoutConfig}
                  projectName={activeProject.name}
                  currentTab={currentTab}
                  onTabChange={handleTabChange}
                  onExport={() => {}}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onLoadTemplate={handleLoadTemplate}
                  onLayoutSettings={() => setShowLayoutManager(true)}
                  onToggleCode={handleToggleCode}
                  codeVisible={flexibleLayoutConfig.elements.find(el => el.id === 'code')?.visible ?? false}
                  onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                  onOpenMobileProperties={() => setShowMobileProperties(true)}
                />
              }
              sidebarContent={<div>Sidebar</div>}
              canvasContent={
                <div className="h-full">
                  {currentTab === 'editor' ? (
                    <Canvas
                      // Новая система листов
                      botData={botDataWithSheets || undefined}
                      onBotDataUpdate={handleBotDataUpdate}
                      // Существующие пропсы для совместимости
                      nodes={nodes}
                      connections={connections}
                      selectedNodeId={selectedNodeId}
                      selectedConnectionId={selectedConnectionId || undefined}
                      onNodeSelect={setSelectedNodeId}
                      onNodeAdd={addNode}
                      onNodeDelete={deleteNode}
                      onNodeDuplicate={duplicateNode}
                      onNodeMove={handleNodeMove}
                      onConnectionSelect={setSelectedConnectionId}
                      onConnectionDelete={deleteConnection}
                      onConnectionAdd={addConnection}
                      onNodesUpdate={updateNodes}
                      onUndo={undo}
                      onRedo={redo}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      onSave={() => updateProjectMutation.mutate({})}
                      isSaving={updateProjectMutation.isPending}
                      onCopyToClipboard={copyToClipboard}
                      onPasteFromClipboard={pasteFromClipboard}
                      hasClipboardData={hasClipboardData()}
                      onToggleHeader={handleToggleHeader}
                      onToggleSidebar={handleToggleSidebar}
                      onToggleProperties={handleToggleProperties}
                      headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
                      sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
                      propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
                      onActionLog={handleActionLog}
                      actionHistory={actionHistory}
                    />
                  ) : null}
                </div>
              }
              propertiesContent={
                <PropertiesPanel
                  projectId={activeProject.id}
                  selectedNode={selectedNode}
                  allNodes={nodes}
                  allSheets={botDataWithSheets?.sheets || []}
                  currentSheetId={botDataWithSheets?.activeSheetId || undefined}
                  onNodeUpdate={handleNodeUpdateWithSheets}
                  onNodeTypeChange={handleNodeTypeChange}
                  onNodeIdChange={handleNodeIdChange}
                  onButtonAdd={addButton}
                  onButtonUpdate={updateButton}
                  onButtonDelete={deleteButton}
                />
              }
              onSheetAdd={handleSheetAdd}
              onSheetDelete={handleSheetDelete}
              onSheetRename={handleSheetRename}
              onSheetDuplicate={handleSheetDuplicate}
              onSheetSelect={handleSheetSelect}
              isMobile={isMobile}
            />
          }
          canvasContent={
            <div className="h-full">
              {currentTab === 'editor' ? (
                <Canvas
                  botData={botDataWithSheets || undefined}
                  onBotDataUpdate={handleBotDataUpdate}
                  nodes={nodes}
                  connections={connections}
                  selectedNodeId={selectedNodeId}
                  selectedConnectionId={selectedConnectionId || undefined}
                  onNodeSelect={setSelectedNodeId}
                  onNodeAdd={addNode}
                  onNodeDelete={deleteNode}
                  onNodeDuplicate={duplicateNode}
                  onNodeMove={handleNodeMove}
                  onConnectionSelect={setSelectedConnectionId}
                  onConnectionDelete={deleteConnection}
                  onConnectionAdd={addConnection}
                  onNodesUpdate={updateNodes}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onSave={() => updateProjectMutation.mutate({})}
                  isSaving={updateProjectMutation.isPending}
                  isNodeBeingDragged={isNodeBeingDragged}
                  setIsNodeBeingDragged={setIsNodeBeingDragged}
                  onToggleHeader={handleToggleHeader}
                  onToggleSidebar={handleToggleSidebar}
                  onToggleProperties={handleToggleProperties}
                  headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
                  sidebarVisible={(() => { 
                    const calculated = !isMobile && (flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true);
                    console.log('🔧 SIDEBAR VISIBLE CALC:', { isMobile, flexSidebarVisible: flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible, calculated });
                    return calculated;
                  })()}
                  propertiesVisible={(() => { 
                    const calculated = !isMobile && (flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true);
                    console.log('🔧 PROPERTIES VISIBLE CALC:', { isMobile, flexPropertiesVisible: flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible, calculated });
                    return calculated;
                  })()}
                  onOpenMobileSidebar={handleOpenMobileSidebar}
                  onOpenMobileProperties={handleOpenMobileProperties}
                  onActionLog={handleActionLog}
                  actionHistory={actionHistory}
                />
              ) : null}
            </div>
          }
          propertiesContent={
            <PropertiesPanel
              projectId={activeProject.id}
              selectedNode={selectedNode}
              allNodes={nodes}
              allSheets={botDataWithSheets?.sheets || []}
              currentSheetId={botDataWithSheets?.activeSheetId || undefined}
              onNodeUpdate={handleNodeUpdateWithSheets}
              onNodeTypeChange={handleNodeTypeChange}
              onNodeIdChange={handleNodeIdChange}
              onButtonAdd={addButton}
              onButtonUpdate={updateButton}
              onButtonDelete={deleteButton}
            />
          }
          onLayoutChange={(elements) => {
            // Layout changed
            // Здесь можно обновить конфигурацию макета
          }}
        />
      )}



      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        botData={(botDataWithSheets || getBotData()) as any}
        projectName={activeProject.name}
      />


      {/* Мобильный sidebar */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Компоненты</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-auto">
            <ComponentsSidebar 
              onComponentDrag={handleComponentDrag}
              onComponentAdd={handleComponentAdd}
              onLoadTemplate={handleLoadTemplate}
              onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
              onLayoutChange={updateLayoutConfig}
              onGoToProjects={handleGoToProjects}
              onProjectSelect={handleProjectSelect}
              currentProjectId={activeProject?.id}
              activeSheetId={botDataWithSheets?.activeSheetId}
              onToggleCanvas={handleToggleCanvas}
              onToggleHeader={handleToggleHeader}
              onToggleProperties={handleToggleProperties}
              onShowFullLayout={() => {
                setFlexibleLayoutConfig(prev => ({
                  ...prev,
                  elements: prev.elements.map(element => ({ ...element, visible: true }))
                }))
              }}
              canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
              headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
              propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
              showLayoutButtons={!flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible && !flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible}
              onSheetAdd={handleSheetAdd}
              onSheetDelete={handleSheetDelete}
              onSheetRename={handleSheetRename}
              onSheetDuplicate={handleSheetDuplicate}
              onSheetSelect={handleSheetSelect}
              isMobile={isMobile}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Мобильная панель свойств - полноэкранная на мобильных */}
      <Sheet open={showMobileProperties} onOpenChange={setShowMobileProperties}>
        <SheetContent 
          side="right" 
          className="p-0 w-full max-w-full sm:w-96 sm:max-w-md"
        >
          <SheetHeader className="px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <SheetTitle className="text-lg font-semibold">Свойства элемента</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-60px)] overflow-auto pb-safe">
            {propertiesContent}
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}
