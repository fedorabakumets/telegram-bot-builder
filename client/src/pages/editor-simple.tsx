import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { AdaptiveHeader } from '@/components/layout/adaptive-header';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { Canvas } from '@/components/editor/canvas';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { PreviewModal } from '@/components/editor/preview-modal';
import { ExportModal } from '@/components/editor/export-modal';
import { BotControl } from '@/components/editor/bot-control';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';

import { ConnectionManagerPanel } from '@/components/editor/connection-manager-panel';
import { EnhancedConnectionControls } from '@/components/editor/enhanced-connection-controls';
import { ConnectionVisualization } from '@/components/editor/connection-visualization';
import { SmartConnectionCreator } from '@/components/editor/smart-connection-creator';
import { UserDatabasePanel } from '@/components/editor/user-database-panel';
import { ResponsesPanel } from '@/components/editor/responses-panel';
import { SimpleLayoutCustomizer, SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';
import { FlexibleLayout } from '@/components/layout/flexible-layout';
import { useBotEditor } from '@/hooks/use-bot-editor';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotProject, Connection, ComponentDefinition, BotData } from '@shared/schema';

export default function EditorSimple() {
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'connections' | 'database' | 'responses'>('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  
  // Базовая конфигурация макета
  const baseLayoutConfig: SimpleLayoutConfig = {
    elements: [
      {
        id: 'header',
        type: 'header',
        name: 'Шапка',
        position: 'top',
        size: 64,
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
  };

  const [flexibleLayoutConfig, setFlexibleLayoutConfig] = useState<SimpleLayoutConfig>(baseLayoutConfig);

  // Используем хук для отслеживания размера экрана
  const isMobile = useMediaQuery('(max-width: 1200px)');

  // Создаем адаптивную конфигурацию в зависимости от текущей вкладки
  const adaptiveLayoutConfig = useMemo(() => {
    console.log('Adaptive Layout Config Update:', {
      currentTab,
      isMobile,
      shouldHidePanels: currentTab === 'bot' && isMobile
    });
    
    if (currentTab === 'bot' && isMobile) {
      // На странице бота на мобильных устройствах скрываем боковые панели
      const newConfig = {
        ...flexibleLayoutConfig,
        elements: flexibleLayoutConfig.elements.map(el => ({
          ...el,
          visible: el.type === 'sidebar' || el.type === 'properties' ? false : el.visible
        }))
      };
      console.log('Hiding panels for mobile bot page', newConfig);
      return newConfig;
    }
    
    console.log('Using default layout', flexibleLayoutConfig);
    return flexibleLayoutConfig;
  }, [flexibleLayoutConfig, currentTab, isMobile]);
  
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

  const handleTabChange = useCallback((tab: 'editor' | 'preview' | 'export' | 'bot' | 'connections' | 'database' | 'responses') => {
    setCurrentTab(tab);
    if (tab === 'preview') {
      updateProjectMutation.mutate({});
      setShowPreview(true);
    } else if (tab === 'export') {
      setShowExport(true);
    } else if (tab === 'bot') {
      updateProjectMutation.mutate({});
    } else if (tab === 'connections') {
      updateProjectMutation.mutate({});
    } else if (tab === 'database') {
      // Перенаправляем на страницу базы данных
      setLocation('/database');
    } else if (tab === 'responses') {
      updateProjectMutation.mutate({});
    }
  }, [updateProjectMutation, setLocation]);

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
    setLocation('/templates');
  }, [setLocation]);

  const handleSelectTemplate = useCallback((template: any) => {
    try {
      const templateData = template.data;
      if (!templateData || !templateData.nodes) {
        throw new Error('Некорректные данные шаблона');
      }
      
      setBotData(templateData);
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
  }, [setBotData, updateProjectMutation, toast]);

  // Проверяем наличие выбранного шаблона в localStorage при загрузке
  useEffect(() => {
    const selectedTemplateData = localStorage.getItem('selectedTemplate');
    if (selectedTemplateData && currentProject) {
      try {
        const template = JSON.parse(selectedTemplateData);
        handleSelectTemplate(template);
        localStorage.removeItem('selectedTemplate'); // Удаляем после использования
      } catch (error) {
        console.error('Ошибка применения шаблона из localStorage:', error);
        localStorage.removeItem('selectedTemplate');
      }
    }
  }, [currentProject, handleSelectTemplate]);

  const handleConnectionSelect = useCallback((connection: Connection | null) => {
    setSelectedConnection(connection);
    setSelectedConnectionId(connection?.id || null);
  }, []);

  const handleConnectionEdit = useCallback((connection: Connection) => {
    setSelectedConnection(connection);
    setSelectedConnectionId(connection.id);
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

  // Создаем содержимое для каждого элемента макета
  const headerContent = (
    <AdaptiveHeader
      config={{
        headerPosition: 'top',
        sidebarPosition: 'left',
        propertiesPosition: 'right',
        canvasFullscreen: false,
        compactMode: false,
        showGrid: true,
        panelSizes: {
          sidebar: 20,
          properties: 25,
          canvas: 55
        }
      }}
      projectName={currentProject.name}
      currentTab={currentTab}
      onTabChange={handleTabChange}
      onSave={handleSave}
      onExport={() => setShowExport(true)}
      onSaveAsTemplate={handleSaveAsTemplate}
      onLoadTemplate={handleLoadTemplate}
      onLayoutSettings={() => {}}
      isSaving={updateProjectMutation.isPending}
    />
  );

  const sidebarContent = (
    <ComponentsSidebar 
      onComponentDrag={handleComponentDrag} 
      onLoadTemplate={handleLoadTemplate}
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
      ) : currentTab === 'database' ? (
        <div className="h-full">
          <UserDatabasePanel
            projectId={currentProject.id}
            projectName={currentProject.name}
          />
        </div>
      ) : currentTab === 'responses' ? (
        <div className="h-full">
          <ResponsesPanel
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
      onNodeUpdate={updateNodeData}
      onButtonAdd={addButton}
      onButtonUpdate={updateButton}
      onButtonDelete={deleteButton}
    />
  );

  return (
    <>
      <SimpleLayoutCustomizer
        config={flexibleLayoutConfig}
        onConfigChange={setFlexibleLayoutConfig}
      >
        <FlexibleLayout
          config={adaptiveLayoutConfig}
          headerContent={headerContent}
          sidebarContent={sidebarContent}
          canvasContent={canvasContent}
          propertiesContent={propertiesContent}
          onConfigChange={setFlexibleLayoutConfig}
        />
      </SimpleLayoutCustomizer>

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


    </>
  );
}