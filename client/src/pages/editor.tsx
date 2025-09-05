import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams, useRoute } from 'wouter';
import { Header } from '@/components/editor/header';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { Canvas } from '@/components/editor/canvas';
import { FullscreenCanvas } from '@/components/editor/fullscreen-canvas';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { PreviewModal } from '@/components/editor/preview-modal';
import { ExportModal } from '@/components/editor/export-modal';
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
import { useBotEditor } from '@/hooks/use-bot-editor';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotProject, Connection, ComponentDefinition, BotData, BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';
import { nanoid } from 'nanoid';

export default function Editor() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/editor/:id');
  const projectId = params?.id ? parseInt(params.id) : null;
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups'>('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showLayoutCustomizer, setShowLayoutCustomizer] = useState(false);
  const [useFlexibleLayout, setUseFlexibleLayout] = useState(true);
  
  // Новая система листов
  const [botDataWithSheets, setBotDataWithSheets] = useState<BotDataWithSheets | null>(null);
  
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

  const [flexibleLayoutConfig, setFlexibleLayoutConfig] = useState<SimpleLayoutConfig>({
    elements: [
      {
        id: 'header',
        type: 'header',
        name: 'Шапка',
        position: 'top',
        size: 8,
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
        size: 55,
        visible: true
      },
      {
        id: 'properties',
        type: 'properties',
        name: 'Свойства',
        position: 'right',
        size: 25,
        visible: true
      }
    ],
    compactMode: false,
    showGrid: true
  });
  const { config: layoutConfig, updateConfig: updateLayoutConfig, resetConfig: resetLayoutConfig, applyConfig: applyLayoutConfig } = useLayoutManager();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load all projects
  const { data: projects } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
  });

  // Find current project by ID from URL
  const currentProject = projects?.find(p => p.id === projectId) || projects?.[0];

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
    hasClipboardData
  } = useBotEditor(currentProject?.data as BotData);

  // Обработчик обновления данных листов
  const handleBotDataUpdate = useCallback((updatedData: BotDataWithSheets) => {
    setBotDataWithSheets(updatedData);
    
    // Синхронизируем активный лист с системой редактора
    const activeSheet = SheetsManager.getActiveSheet(updatedData);
    if (activeSheet) {
      setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections });
    }
  }, [setBotData]);

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

  // Обновляем данные бота при смене проекта
  useEffect(() => {
    if (currentProject?.data) {
      const projectData = currentProject.data as any;
      
      // Проверяем, новый ли это формат с листами
      if (SheetsManager.isNewFormat(projectData)) {
        setBotDataWithSheets(projectData);
        // Устанавливаем активный лист для совместимости со старой системой
        const activeSheet = SheetsManager.getActiveSheet(projectData);
        if (activeSheet) {
          setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections });
        }
      } else {
        // Мигрируем старые данные к новому формату
        const migratedData = SheetsManager.migrateLegacyData(projectData as BotData);
        setBotDataWithSheets(migratedData);
        setBotData(projectData as BotData);
      }
      
      // Сохраняем ID текущего проекта для возврата со страницы шаблонов
      localStorage.setItem('lastProjectId', currentProject.id.toString());
    }
  }, [currentProject?.id, currentProject?.data, setBotData]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!currentProject) return;
      
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
      
      return apiRequest('PUT', `/api/projects/${currentProject.id}`, {
        data: projectData
      });
    },
    onSuccess: (updatedProject) => {
      console.log('Проект сохранен, обновляем кеш проектов');
      
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
      setShowPreview(true);
    } else if (tab === 'export') {
      setShowExport(true);
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
        setBotData({ nodes: newSheet.nodes, connections: newSheet.connections });
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
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast]);

  const handleSheetDelete = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;
    
    try {
      const updatedData = SheetsManager.deleteSheet(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);
      
      // Переключаемся на активный лист
      const activeSheet = SheetsManager.getActiveSheet(updatedData);
      if (activeSheet) {
        setBotData({ nodes: activeSheet.nodes, connections: activeSheet.connections });
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
        setBotData({ nodes: newSheet.nodes, connections: newSheet.connections });
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
        setBotData({ nodes: newActiveSheet.nodes, connections: newActiveSheet.connections });
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
  }, [botDataWithSheets, getBotData, setBotData, updateProjectMutation, toast]);

  // Проверяем, есть ли выбранный шаблон при загрузке страницы
  useEffect(() => {
    const selectedTemplateData = localStorage.getItem('selectedTemplate');
    if (selectedTemplateData && currentProject) {
      try {
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
            setBotData({ nodes: firstSheet.nodes, connections: firstSheet.connections });
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
          setBotData(template.data);
          
          updateProjectMutation.mutate({
            data: migratedData
          });
        }
        
        toast({
          title: 'Шаблон применен',
          description: `Шаблон "${template.name}" успешно загружен`,
        });
        
        // Удаляем сохраненный шаблон
        localStorage.removeItem('selectedTemplate');
      } catch (error) {
        console.error('Ошибка применения сохраненного шаблона:', error);
        localStorage.removeItem('selectedTemplate');
      }
    }
  }, [currentProject?.id, setBotData, setBotDataWithSheets, updateProjectMutation, toast]);

  // Enhanced onNodeUpdate that auto-saves changes
  const handleNodeUpdate = useCallback((nodeId: string, updates: any) => {
    // First update local state
    updateNodeData(nodeId, updates);
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
          setBotData({ nodes: firstSheet.nodes, connections: firstSheet.connections });
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
        setBotData(templateData);
        
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
    } catch (error) {
      console.error('Ошибка применения шаблона:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить шаблон',
        variant: 'destructive',
      });
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

  const handleEnterFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Handle F11 key for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11' && currentTab === 'editor') {
        event.preventDefault();
        if (isFullscreen) {
          handleExitFullscreen();
        } else {
          handleEnterFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, currentTab, handleEnterFullscreen, handleExitFullscreen]);

  if (!currentProject) {
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
        projectName={currentProject.name}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onExport={() => setShowExport(true)}
        onSaveAsTemplate={handleSaveAsTemplate}
        onLoadTemplate={handleLoadTemplate}
        onLayoutSettings={() => setShowLayoutManager(true)}
        onToggleHeader={handleToggleHeader}
        onToggleSidebar={handleToggleSidebar}
        onToggleProperties={handleToggleProperties}
        onToggleCanvas={handleToggleCanvas}
        headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
        sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
        propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
        canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
      />
    );

    const canvasContent = (
      <div className="h-full">
        {currentTab === 'groups' ? (
          <GroupsPanel
            projectId={currentProject.id}
            projectName={currentProject.name}
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
            onFullscreen={handleEnterFullscreen}
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
          />
        ) : currentTab === 'bot' ? (
          <div className="h-full p-6 bg-gray-50 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <BotControl
                projectId={currentProject.id}
                projectName={currentProject.name}
              />
            </div>
          </div>
        ) : currentTab === 'users' ? (
          <div className="h-full">
            <UserDatabasePanel
              projectId={currentProject.id}
              projectName={currentProject.name}
            />
          </div>
        ) : null}
      </div>
    );

    const propertiesContent = (
      <PropertiesPanel
        projectId={currentProject.id}
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
    );

    const sidebarContent = (
      <ComponentsSidebar 
        onComponentDrag={handleComponentDrag} 
        onLoadTemplate={handleLoadTemplate}
        onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
        onLayoutChange={updateLayoutConfig}
        onGoToProjects={handleGoToProjects}
        onProjectSelect={handleProjectSelect}
        currentProjectId={currentProject?.id}
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
            onConfigChange={setFlexibleLayoutConfig}
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
              projectName={currentProject.name}
              currentTab={currentTab}
              onTabChange={handleTabChange}
              onExport={() => setShowExport(true)}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              onToggleHeader={handleToggleHeader}
              onToggleSidebar={handleToggleSidebar}
              onToggleProperties={handleToggleProperties}
              onToggleCanvas={handleToggleCanvas}
              headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
              sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
              propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
              canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
            />
          }
          sidebar={
            <ComponentsSidebar 
              onComponentDrag={handleComponentDrag} 
              onLoadTemplate={handleLoadTemplate}
              onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
              onLayoutChange={updateLayoutConfig}
              onGoToProjects={handleGoToProjects}
              onProjectSelect={handleProjectSelect}
              currentProjectId={currentProject?.id}
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
                  onFullscreen={handleEnterFullscreen}
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
                />
              ) : currentTab === 'bot' ? (
                <div className="h-full p-6 bg-gray-50 overflow-auto">
                  <div className="max-w-2xl mx-auto">
                    <BotControl
                      projectId={currentProject.id}
                      projectName={currentProject.name}
                    />
                  </div>
                </div>
              ) : currentTab === 'users' ? (
                <div className="h-full">
                  <UserDatabasePanel
                    projectId={currentProject.id}
                    projectName={currentProject.name}
                  />
                </div>
              ) : currentTab === 'groups' ? (
                <div className="h-full">
                  <GroupsPanel
                    projectId={currentProject.id}
                    projectName={currentProject.name}
                  />
                </div>
              ) : null}
            </div>
          }
          properties={
            <PropertiesPanel
              projectId={currentProject.id}
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
              projectName={currentProject.name}
              currentTab={currentTab}
              onTabChange={handleTabChange}
              onExport={() => setShowExport(true)}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
            />
          }
          sidebarContent={
            <ComponentsSidebar 
              onComponentDrag={handleComponentDrag} 
              onLoadTemplate={handleLoadTemplate}
              onOpenLayoutCustomizer={() => setShowLayoutCustomizer(true)}
              onLayoutChange={updateLayoutConfig}
              headerContent={
                <AdaptiveHeader
                  config={layoutConfig}
                  projectName={currentProject.name}
                  currentTab={currentTab}
                  onTabChange={handleTabChange}
                  onExport={() => setShowExport(true)}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onLoadTemplate={handleLoadTemplate}
                  onLayoutSettings={() => setShowLayoutManager(true)}
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
                      onFullscreen={handleEnterFullscreen}
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
                  projectId={currentProject.id}
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
                  onFullscreen={handleEnterFullscreen}
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
              projectId={currentProject.id}
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
            console.log('Layout changed:', elements);
            // Здесь можно обновить конфигурацию макета
          }}
        />
      )}

      <PreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setCurrentTab('editor');
        }}
        nodes={nodes}
        connections={connections}
        projectName={currentProject.name}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => {
          setShowExport(false);
          setCurrentTab('editor');
        }}
        botData={getBotData()}
        projectName={currentProject.name}
      />

      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        botData={(botDataWithSheets || getBotData()) as any}
        projectName={currentProject.name}
      />

      {/* Fullscreen Canvas */}
      {isFullscreen && (
        <FullscreenCanvas
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
          onSave={handleSave}
          isSaving={updateProjectMutation.isPending}
          onExitFullscreen={handleExitFullscreen}
        />
      )}

    </>
  );
}
