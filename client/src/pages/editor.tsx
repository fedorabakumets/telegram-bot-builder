import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams, useRoute } from 'wouter';
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
import { BotProject, Connection, ComponentDefinition, BotData, BotDataWithSheets, Node } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';
import { nanoid } from 'nanoid';

export default function Editor() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/editor/:id');
  const projectId = params?.id ? parseInt(params.id) : null;
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups'>('editor');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  
  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  // Эффект для корректного восстановления мобильного интерфейса при навигации
  useEffect(() => {
    if (isMobile) {
      // Закрываем все мобильные панели при возврате к редактору
      setShowMobileSidebar(false);
      setShowMobileProperties(false);
      
      // Устанавливаем корректную конфигурацию layout для мобильных устройств
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(element => {
          // На мобильных устройствах по умолчанию скрываем sidebar и properties панели,
          // но оставляем их в конфигурации, чтобы кнопки мобильного доступа работали
          if (element.type === 'sidebar' || element.type === 'properties') {
            return { ...element, visible: false };
          }
          return element;
        })
      }));
    } else {
      // На десктопе восстанавливаем все панели
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(element => ({
          ...element,
          visible: true
        }))
      }));
    }
  }, [isMobile]); // Убираем match из зависимостей, чтобы эффект не срабатывал при каждой навигации

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
  
  // Callback для получения размеров узлов из Canvas
  const handleNodeSizesChange = useCallback((nodeSizes: Map<string, { width: number; height: number }>) => {
    setCurrentNodeSizes(nodeSizes);
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
        }
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

  // Load current project directly by ID (much faster than loading all projects)
  const { data: currentProject, isLoading: isProjectLoading } = useQuery<BotProject>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  // If no projectId in URL, load project list to get first project ID
  const { data: projectsList, isLoading: isListLoading } = useQuery<Array<Omit<BotProject, 'data'>>>({
    queryKey: ['/api/projects/list'],
    enabled: !projectId,
  });

  // Get effective project ID (from URL or first in list)
  const effectiveProjectId = projectId || projectsList?.[0]?.id;

  // Load first project if no projectId in URL and we have the ID from list
  const { data: firstProject, isLoading: isFirstProjectLoading } = useQuery<BotProject>({
    queryKey: ['/api/projects', effectiveProjectId],
    enabled: !projectId && !!effectiveProjectId,
  });

  // Use the appropriate project
  const activeProject = projectId ? currentProject : firstProject;

  const {
    nodes,
    connections,
    selectedNode,
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

  // Обновляем данные бота при смене проекта - only when truly switching projects
  useEffect(() => {
    
    // Only load activeProject data when:
    // 1. We have a activeProject with data
    // 2. We're not loading a template  
    // 3. We don't have local changes in progress
    // 4. This is truly a new activeProject (ID changed) OR initial load (lastLoadedProjectId is null)
    if (activeProject?.data && !isLoadingTemplate && !hasLocalChanges && 
        (lastLoadedProjectId !== activeProject?.id)) {
      
      console.log('📂 Loading activeProject data for activeProject ID:', activeProject.id);
      const projectData = activeProject.data as any;
      
      // Проверяем, новый ли это формат с листами
      if (SheetsManager.isNewFormat(projectData)) {
        setBotDataWithSheets(projectData);
        // Устанавливаем активный лист для совместимости со старой системой
        const activeSheet = SheetsManager.getActiveSheet(projectData);
        if (activeSheet) {
          // Проверяем, есть ли у узлов уже расставленные позиции
          const hasValidPositions = activeSheet.nodes?.length > 0 && 
            activeSheet.nodes.every((n: any) => n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number');
          
          // Пропускаем layout если узлы уже имеют позиции (загрузка существующего проекта)
          const shouldSkipLayout = hasValidPositions;
          setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
        }
      } else {
        // Мигрируем старые данные к новому формату
        const migratedData = SheetsManager.migrateLegacyData(projectData as BotData);
        setBotDataWithSheets(migratedData);
        
        // Проверяем, есть ли у узлов уже расставленные позиции
        const dataNodes = (projectData as BotData).nodes || [];
        const hasValidPositions = dataNodes.length > 0 && 
          dataNodes.every((n: any) => n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number');
        
        // Пропускаем layout если узлы уже имеют позиции (загрузка существующего проекта)
        const shouldSkipLayout = hasValidPositions;
        setBotData(projectData as BotData, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }
      
      // Update the last loaded activeProject ID
      setLastLoadedProjectId(activeProject.id);
      
      // Сохраняем ID текущего проекта для возврата со страницы шаблонов
      localStorage.setItem('lastProjectId', activeProject.id.toString());
    }
  }, [activeProject?.id, activeProject?.data, setBotData, currentNodeSizes, isLoadingTemplate, hasLocalChanges, lastLoadedProjectId, isMobile, nodes.length]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!activeProject) return;
      
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
      
      return apiRequest('PUT', `/api/projects/${activeProject.id}`, {
        data: projectData
      });
    },
    onSuccess: (updatedProject) => {
      console.log('Проект сохранен, обновляем кеш проектов');
      
      // Reset local changes flag only after successful save
      setHasLocalChanges(false);
      
      // Обновляем кеш проектов
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      toast({
        title: "Проект сохранен",
        description: "Изменения успешно сохранены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить проект",
        variant: "destructive",
      });
    }
  });

  const handleSave = useCallback(() => {
    updateProjectMutation.mutate({});
  }, [updateProjectMutation]);

  const handleTabChange = useCallback((tab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups') => {
    setCurrentTab(tab);
    if (tab === 'preview') {
      // Auto-save before showing preview
      updateProjectMutation.mutate({});
      // Navigate to preview page instead of showing modal
      setLocation(`/preview/${activeProject?.id}`);
      return;
    } else if (tab === 'export') {
      // Auto-save before showing export page
      updateProjectMutation.mutate({});
    } else if (tab === 'bot') {
      // Auto-save before showing bot controls
      updateProjectMutation.mutate({});
    } else if (tab === 'users') {
      // Auto-save before showing users panel
      updateProjectMutation.mutate({});
    }
  }, [updateProjectMutation]);

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
      
      // Сохраняем изменения
      updateProjectMutation.mutate({});
      
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
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, isMobile, nodes.length, currentNodeSizes]);

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
      
      // Сохраняем изменения
      updateProjectMutation.mutate({});
      
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
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast]);

  const handleSheetRename = useCallback((sheetId: string, newName: string) => {
    if (!botDataWithSheets) return;
    
    try {
      const updatedData = SheetsManager.renameSheet(botDataWithSheets, sheetId, newName);
      setBotDataWithSheets(updatedData);
      
      // Сохраняем изменения
      updateProjectMutation.mutate({});
      
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
  }, [botDataWithSheets, updateProjectMutation, toast]);

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
      
      // Сохраняем изменения
      updateProjectMutation.mutate({});
      
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
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast]);

  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;
    
    try {
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
      updateProjectMutation.mutate({});
    } catch (error) {
      toast({
        title: "Ошибка переключения",
        description: "Не удалось переключиться на лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, getBotData, setBotData, updateProjectMutation, toast, isMobile, nodes.length, currentNodeSizes]);

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
          
          // Сохраняем в проект
          updateProjectMutation.mutate({
            data: templateDataWithSheets
          });
        } else {
          // Обычный шаблон без листов - мигрируем к формату с листами
          console.log('Применяем обычный шаблон и мигрируем к формату с листами');
          const migratedData = SheetsManager.migrateLegacyData(template.data);
          setBotDataWithSheets(migratedData);
          // Всегда применяем автоиерархию при загрузке шаблонов для правильного расположения
          const shouldSkipLayout = false; // Автоиерархия необходима при загрузке обычных шаблонов
          setBotData(template.data, template.name, currentNodeSizes, shouldSkipLayout); // автоиерархия должна работать при загрузке шаблонов
          
          updateProjectMutation.mutate({
            data: migratedData
          });
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
      updateProjectMutation.mutate({});
    }, 500); // 500ms delay to allow for rapid typing
  }, [updateNodeData, updateProjectMutation]);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position });
  }, [updateNode]);

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
    
    // Добавляем узел на холст
    addNode(newNode);
    
    
    // Auto-save after a short delay to persist the new node
    setTimeout(() => {
      updateProjectMutation.mutate({});
    }, 1000);
  }, [addNode, isLoadingTemplate, updateProjectMutation]);

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
        
        // Сохраняем в проект
        updateProjectMutation.mutate({
          data: templateDataWithSheets
        });
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
        updateProjectMutation.mutate({
          data: migratedData
        });
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
    updateProjectMutation.mutate({
      data: {
        ...currentData,
        connections: newConnections
      }
    });
  }, [getBotData, updateProjectMutation]);

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
    deleteConnection(connectionId);
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
      setSelectedConnection(null);
    }
  }, [deleteConnection, selectedConnectionId]);



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
      onButtonAdd={addButton}
      onButtonUpdate={updateButton}
      onButtonDelete={deleteButton}
    />
  ) : null;

  // Определяем содержимое панели кода
  const codeContent = activeProject ? (
    <CodePanel
      botData={(botDataWithSheets || getBotData()) as any}
      projectName={activeProject.name}
      projectId={activeProject.id}
      selectedNodeId={selectedNodeId}
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
            />
          </div>
        ) : currentTab === 'export' ? (
          <ExportPanel
            botData={(botDataWithSheets || getBotData()) as any}
            projectName={activeProject.name}
            projectId={activeProject.id}
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
        projectId={activeProject?.id}
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
              projectId={activeProject?.id}
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
              projectId={activeProject?.id}
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

      {/* Мобильная панель свойств */}
      <Sheet open={showMobileProperties} onOpenChange={setShowMobileProperties}>
        <SheetContent side="right" className="p-0 w-80">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Свойства</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-auto">
            {propertiesContent}
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}
