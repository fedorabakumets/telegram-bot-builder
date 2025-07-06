import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/editor/header';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { Canvas } from '@/components/editor/canvas';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { PreviewModal } from '@/components/editor/preview-modal';
import { ExportModal } from '@/components/editor/export-modal';
import { BotControl } from '@/components/editor/bot-control';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
// import { TemplatesModal } from '@/components/editor/templates-modal'; // Заменено на отдельную страницу
import { ConnectionManagerPanel } from '@/components/editor/connection-manager-panel';
import { EnhancedConnectionControls } from '@/components/editor/enhanced-connection-controls';
import { ConnectionVisualization } from '@/components/editor/connection-visualization';
import { SmartConnectionCreator } from '@/components/editor/smart-connection-creator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useBotEditor } from '@/hooks/use-bot-editor';
import { useAutoSave } from '@/hooks/use-auto-save-simple';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BotProject, Connection, ComponentDefinition, BotData } from '@shared/schema';

export default function Editor() {
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export' | 'bot' | 'connections'>('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  // const [showTemplates, setShowTemplates] = useState(false); // Заменено на переход к странице
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load the first project for demo
  const { data: projects } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
  });

  const currentProject = projects?.[0];

  // Создаем ref для автосохранения
  const autoSaveRef = useRef<((data: BotData) => void) | null>(null);

  const {
    nodes,
    connections,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    updateNodePositionLive,
    deleteNode,
    addConnection,
    deleteConnection,
    updateNodeData,
    addButton,
    updateButton,
    deleteButton,
    updateNodes,
    setBotData,
    getBotData,
    // История изменений
    canUndo,
    canRedo,
    undo,
    redo,
    resetHistory
  } = useBotEditor(currentProject?.data as BotData, {
    onChange: (data) => autoSaveRef.current?.(data) // Подключаем автосохранение к изменениям
  });

  // Инициализируем auto-save hook после получения getBotData
  const autoSave = useAutoSave(
    currentProject,
    getBotData,
    {
      enabled: true,
      delay: 800, // Автосохранение через 800мс после изменений
      showToasts: false, // Не показываем уведомления чтобы не отвлекать
    }
  );

  // Обновляем ref для автосохранения
  useEffect(() => {
    autoSaveRef.current = autoSave.triggerAutoSave;
  }, [autoSave.triggerAutoSave]);

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
    updateNodePositionLive(nodeId, position);
  }, [updateNodePositionLive]);

  const handleComponentDrag = useCallback((component: ComponentDefinition) => {
    // Handle component drag start if needed
  }, []);

  const handleSaveAsTemplate = useCallback(() => {
    setShowSaveTemplate(true);
  }, []);

  const handleSelectTemplate = useCallback(async (template: any) => {
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

      // Если это системный шаблон (не пользовательский), сохраняем его как пользовательский
      if (template.category !== 'custom') {
        try {
          await apiRequest('POST', '/api/templates', {
            name: template.name,
            description: template.description || `Сохранен из библиотеки: ${template.name}`,
            category: 'custom',
            data: templateData,
            difficulty: template.difficulty || 'easy',
            tags: template.tags || [],
            isPublic: 0,
            requiresToken: 1,
            language: 'ru',
            complexity: template.complexity || 1,
            estimatedTime: template.estimatedTime || 5
          });
          
          // Инвалидируем кэш пользовательских шаблонов
          queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
          
          console.log('Шаблон сохранен в пользовательских');
        } catch (saveError) {
          console.error('Ошибка сохранения шаблона в пользовательских:', saveError);
          // Не показываем ошибку пользователю, это не критично
        }
      }
      
      toast({
        title: 'Шаблон применен',
        description: `Шаблон "${template.name}" успешно загружен и сохранен в ваших шаблонах`,
      });
    } catch (error) {
      console.error('Ошибка применения шаблона:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось применить шаблон',
        variant: 'destructive',
      });
    }
  }, [setBotData, updateProjectMutation, toast, nodes.length, connections.length, queryClient]);

  const handleLoadTemplate = useCallback(() => {
    console.log('Template button clicked, redirecting to templates page...');
    setLocation('/templates');
  }, [setLocation]);

  // Проверяем, есть ли ожидающий шаблон в localStorage
  useEffect(() => {
    const pendingTemplate = localStorage.getItem('pendingTemplate');
    if (pendingTemplate && currentProject) {
      try {
        const template = JSON.parse(pendingTemplate);
        console.log('Найден ожидающий шаблон:', template.name);
        
        // Очищаем localStorage
        localStorage.removeItem('pendingTemplate');
        
        // Применяем шаблон
        handleSelectTemplate(template);
      } catch (error) {
        console.error('Ошибка загрузки ожидающего шаблона:', error);
        localStorage.removeItem('pendingTemplate');
      }
    }
  }, [currentProject, handleSelectTemplate]);

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

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <Header
        projectName={currentProject.name}
        projectId={currentProject.id}
        projectDescription={currentProject.description ?? undefined}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onSave={handleSave}
        onExport={() => setShowExport(true)}
        onSaveAsTemplate={handleSaveAsTemplate}
        onLoadTemplate={handleLoadTemplate}
        isSaving={updateProjectMutation.isPending}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        botData={{ nodes, connections }}
        onTemplateSaved={(templateId) => {
          toast({
            title: "Шаблон сохранен",
            description: "Шаблон успешно добавлен в библиотеку",
          });
        }}
        onImportSuccess={(result) => {
          toast({
            title: "Импорт завершен",
            description: result.message,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
          queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
        }}
        autoSaveStatus={{
          isSaving: autoSave.isSaving,
          lastSaved: null, // Можно добавить отслеживание времени последнего сохранения позже
          hasUnsavedChanges: false, // Простая реализация для начала
          isEnabled: autoSave.isEnabled
        }}
      />

      <div className="h-[calc(100vh-4rem)]">
        {currentTab === 'editor' ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <ComponentsSidebar 
                onComponentDrag={handleComponentDrag} 
                onLoadTemplate={handleLoadTemplate}
                onSelectTemplate={handleSelectTemplate}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={60} minSize={30}>
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
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <PropertiesPanel
                selectedNode={selectedNode}
                allNodes={nodes}
                onNodeUpdate={updateNodeData}
                onButtonAdd={addButton}
                onButtonUpdate={updateButton}
                onButtonDelete={deleteButton}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
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
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4 space-y-4 overflow-auto">
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
                    onConnectionsChange={handleConnectionsChange}
                    onNodesChange={updateNodes}
                    selectedConnection={selectedConnection || undefined}
                    onConnectionSelect={handleConnectionSelect}
                    autoButtonCreation={autoButtonCreation}
                    onAutoButtonCreationChange={setAutoButtonCreation}
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4 overflow-auto">
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
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        ) : null}
      </div>

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

      {/* TemplatesModal заменено на отдельную страницу /templates */}
    </div>
  );
}
