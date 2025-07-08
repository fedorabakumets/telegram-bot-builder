import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Header } from '@/components/editor/header';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { Canvas } from '@/components/editor/canvas';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { PreviewModal } from '@/components/editor/preview-modal';
import { ExportModal } from '@/components/editor/export-modal';
import { BotControl } from '@/components/editor/bot-control';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplatesModal } from '@/components/editor/templates-modal';
import { ConnectionManagerPanel } from '@/components/editor/connection-manager-panel';
import { EnhancedConnectionControls } from '@/components/editor/enhanced-connection-controls';
import { ConnectionVisualization } from '@/components/editor/connection-visualization';
import { SmartConnectionCreator } from '@/components/editor/smart-connection-creator';
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
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'connections'>('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showLayoutCustomizer, setShowLayoutCustomizer] = useState(false);
  const [useFlexibleLayout, setUseFlexibleLayout] = useState(true);
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

  // Load the first project for demo
  const { data: projects } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
  });

  const currentProject = projects?.[0];

  const {
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    updateConnection,
    updateNodeData,
    addButton,
    updateButton,
    deleteButton,
    updateNodes,
    setBotData,
    getBotData
  } = useBotEditor(currentProject?.data as BotData);

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

  const handleTabChange = useCallback((tab: 'editor' | 'preview' | 'export' | 'bot' | 'connections') => {
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
    } else if (tab === 'connections') {
      // Auto-save before showing connections
      updateProjectMutation.mutate({});
    }
  }, [updateProjectMutation]);

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
    console.log('Template button clicked, opening modal...');
    setShowTemplates(true);
  }, []);

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
      
      // Немедленно обновляем локальное состояние редактора
      setBotData(templateData);
      
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
        onSave={handleSave}
        onExport={() => setShowExport(true)}
        onSaveAsTemplate={handleSaveAsTemplate}
        onLoadTemplate={handleLoadTemplate}
        onLayoutSettings={() => setShowLayoutManager(true)}
        isSaving={updateProjectMutation.isPending}
      />
    );

    const canvasContent = (
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
            onNodeMove={handleNodeMove}
            onConnectionSelect={setSelectedConnectionId}
            onConnectionDelete={deleteConnection}
            onConnectionAdd={addConnection}
            onNodesUpdate={updateNodes}
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
        ) : currentTab === 'connections' ? (
          <div className="h-full bg-background">
            <div className="h-full flex">
              <div className="w-1/2 p-4 space-y-4 overflow-auto">
                <SmartConnectionCreator
                  nodes={nodes}
                  connections={connections}
                  onConnectionAdd={addConnection}
                  onNodesChange={updateNodes}
                  autoButtonCreation={autoButtonCreation}
                  selectedNodeId={selectedNodeId || undefined}
                />
                
                <EnhancedConnectionControls
                  nodes={nodes}
                  connections={connections}
                  onConnectionAdd={addConnection}
                  onConnectionDelete={deleteConnection}
                  onConnectionUpdate={updateConnection}
                  onNodesChange={updateNodes}
                  autoButtonCreation={autoButtonCreation}
                  onAutoButtonCreationChange={setAutoButtonCreation}
                  selectedConnection={selectedConnection}
                  onConnectionSelect={setSelectedConnection}
                />
              </div>
              
              <div className="w-1/2 p-4 overflow-auto border-l">
                <ConnectionVisualization
                  nodes={nodes}
                  connections={connections}
                  onConnectionSelect={handleConnectionSelect}
                  onConnectionDelete={handleConnectionDelete}
                  onConnectionEdit={handleConnectionEdit}
                  selectedConnectionId={selectedConnectionId || undefined}
                  showLabels={true}
                  showMetrics={true}
                  interactive={true}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );

    const propertiesContent = (
      <PropertiesPanel
        projectId={currentProject.id}
        selectedNode={selectedNode}
        allNodes={nodes}
        onNodeUpdate={updateNodeData}
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
        headerContent={headerContent}
        sidebarContent={<div>Sidebar</div>}
        canvasContent={canvasContent}
        propertiesContent={propertiesContent}
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
              onSave={handleSave}
              onExport={() => setShowExport(true)}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              isSaving={updateProjectMutation.isPending}
            />
          }
          sidebar={
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
                  onSave={handleSave}
                  onExport={() => setShowExport(true)}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onLoadTemplate={handleLoadTemplate}
                  onLayoutSettings={() => setShowLayoutManager(true)}
                  isSaving={updateProjectMutation.isPending}
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
                      onNodeMove={handleNodeMove}
                      onConnectionSelect={setSelectedConnectionId}
                      onConnectionDelete={deleteConnection}
                      onConnectionAdd={addConnection}
                      onNodesUpdate={updateNodes}
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
                  onNodeMove={handleNodeMove}
                  onConnectionSelect={setSelectedConnectionId}
                  onConnectionDelete={deleteConnection}
                  onConnectionAdd={addConnection}
                  onNodesUpdate={updateNodes}
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
              ) : currentTab === 'connections' ? (
                <div className="h-full bg-background">
                  <div className="h-full flex">
                    <div className="w-1/2 p-4 space-y-4 overflow-auto">
                      <SmartConnectionCreator
                        nodes={nodes}
                        connections={connections}
                        onConnectionAdd={addConnection}
                        onNodesChange={updateNodes}
                        autoButtonCreation={autoButtonCreation}
                        selectedNodeId={selectedNodeId || undefined}
                      />
                      
                      <EnhancedConnectionControls
                        nodes={nodes}
                        connections={connections}
                        onConnectionAdd={addConnection}
                        onConnectionDelete={deleteConnection}
                        onConnectionUpdate={updateConnection}
                        onNodesChange={updateNodes}
                        autoButtonCreation={autoButtonCreation}
                        onAutoButtonCreationChange={setAutoButtonCreation}
                        selectedConnection={selectedConnection}
                        onConnectionSelect={setSelectedConnection}
                      />
                    </div>
                    
                    <div className="w-1/2 p-4 overflow-auto border-l">
                      <ConnectionVisualization
                        nodes={nodes}
                        connections={connections}
                        onConnectionSelect={handleConnectionSelect}
                        onConnectionDelete={handleConnectionDelete}
                        onConnectionEdit={handleConnectionEdit}
                        selectedConnectionId={selectedConnectionId || undefined}
                        showLabels={true}
                        showMetrics={true}
                        interactive={true}
                      />
                    </div>
                  </div>
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
              onSave={handleSave}
              onExport={() => setShowExport(true)}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              isSaving={updateProjectMutation.isPending}
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
                  onSave={handleSave}
                  onExport={() => setShowExport(true)}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onLoadTemplate={handleLoadTemplate}
                  onLayoutSettings={() => setShowLayoutManager(true)}
                  isSaving={updateProjectMutation.isPending}
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
                      onNodeMove={handleNodeMove}
                      onConnectionSelect={setSelectedConnectionId}
                      onConnectionDelete={deleteConnection}
                      onConnectionAdd={addConnection}
                      onNodesUpdate={updateNodes}
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
                  onNodeMove={handleNodeMove}
                  onConnectionSelect={setSelectedConnectionId}
                  onConnectionDelete={deleteConnection}
                  onConnectionAdd={addConnection}
                  onNodesUpdate={updateNodes}
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

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
}
