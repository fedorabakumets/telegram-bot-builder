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
import { BotProject, Connection, ComponentDefinition, BotData } from '@shared/schema';

export default function Editor() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/editor/:id');
  const projectId = params?.id ? parseInt(params.id) : null;
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'users'>('editor');
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

  // Обновляем данные бота при смене проекта
  useEffect(() => {
    if (currentProject?.data) {
      setBotData(currentProject.data as BotData);
      // Сохраняем ID текущего проекта для возврата со страницы шаблонов
      localStorage.setItem('lastProjectId', currentProject.id.toString());
    }
  }, [currentProject?.id, currentProject?.data, setBotData]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!currentProject) return;
      return apiRequest('PUT', `/api/projects/${currentProject.id}`, {
        data: getBotData()
      });
    },
    onSuccess: () => {
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

  const handleTabChange = useCallback((tab: 'editor' | 'preview' | 'export' | 'bot' | 'users') => {
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

  // Проверяем, есть ли выбранный шаблон при загрузке страницы
  useEffect(() => {
    const selectedTemplateData = localStorage.getItem('selectedTemplate');
    if (selectedTemplateData && currentProject) {
      try {
        const template = JSON.parse(selectedTemplateData);
        console.log('Применяем сохраненный шаблон:', template.name);
        
        // Применяем шаблон
        setBotData(template.data);
        updateProjectMutation.mutate({
          data: template.data
        });
        
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
  }, [currentProject?.id, setBotData, updateProjectMutation, toast]);

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
      console.log('Текущие узлы до применения:', nodes.length);
      console.log('Текущие связи до применения:', connections.length);
      
      // Получаем данные шаблона
      const templateData = template.data;
      
      if (!templateData || !templateData.nodes) {
        throw new Error('Некорректные данные шаблона');
      }
      
      // Немедленно обновляем локальное состояние редактора с именем шаблона
      setBotData(templateData, template.name);
      
      console.log('Применили данные шаблона, узлов:', templateData.nodes.length);
      console.log('Применили данные шаблона, связей:', templateData.connections?.length || 0);
      
      // Сохраняем изменения в базе данных
      updateProjectMutation.mutate({
        data: templateData
      });
      
      toast({
        title: 'Шаблон применен',
        description: `Шаблон "${template.name}" успешно загружен на холст`,
      });
    } catch (error) {
      console.error('Ошибка применения шаблона:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить шаблон',
        variant: 'destructive',
      });
    }
  }, [setBotData, updateProjectMutation, toast, nodes.length, connections.length]);

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
        {currentTab === 'editor' ? (
          <Canvas
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
            hasClipboardData={hasClipboardData}
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
        onNodeUpdate={handleNodeUpdate}
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
            />
          }
          canvas={
            <div className="h-full">
              {currentTab === 'editor' ? (
                <Canvas
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
                  hasClipboardData={hasClipboardData}
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
          }
          properties={
            <PropertiesPanel
              projectId={currentProject.id}
              selectedNode={selectedNode}
              allNodes={nodes}
              onNodeUpdate={updateNodeData}
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
                  onNodeUpdate={updateNodeData}
                  onButtonAdd={addButton}
                  onButtonUpdate={updateButton}
                  onButtonDelete={deleteButton}
                />
              }
            />
          }
          canvasContent={
            <div className="h-full">
              {currentTab === 'editor' ? (
                <Canvas
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
              onNodeUpdate={updateNodeData}
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
        botData={getBotData()}
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
