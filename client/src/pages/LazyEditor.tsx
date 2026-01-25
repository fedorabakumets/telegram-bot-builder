/**
 * Lazy-loaded Editor Page
 * 
 * This is an optimized version of the editor page with lazy loading,
 * code splitting, and performance optimizations.
 */

import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Typography } from '@/components/atoms/Typography';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const LazyHeader = React.lazy(() => 
  import('@/components/editor/header').then(module => ({ default: module.Header }))
);

const LazyComponentsSidebar = React.lazy(() => 
  import('@/components/editor/components-sidebar').then(module => ({ default: module.ComponentsSidebar }))
);

const LazyBotControl = React.lazy(() => 
  import('@/components/editor/bot-control').then(module => ({ default: module.BotControl }))
);

const LazySaveTemplateModal = React.lazy(() => 
  import('@/components/editor/save-template-modal').then(module => ({ default: module.SaveTemplateModal }))
);

const LazyVisibilityControls = React.lazy(() => 
  import('@/components/editor/visibility-controls').then(module => ({ default: module.VisibilityControls }))
);

// Import lazy editor components
import {
  Canvas,
  PropertiesPanel,
  CodePanel,
  ExportPanel,
  ConnectionManagerPanel,
  UserDatabasePanel,
  DialogPanel,
  GroupsPanel,
  usePreloadComponents,
} from '@/components/lazy/LazyEditor';

// Import other necessary components and hooks
import { AdaptiveLayout } from '@/components/layout/adaptive-layout';
import { AdaptiveHeader } from '@/components/layout/adaptive-header';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useBotEditor } from '@/hooks/use-bot-editor';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProjects, useUpdateProject } from '@/hooks/use-user-data';
import { useTelegramAuth } from '@/hooks/use-telegram-auth';
import type { BotData } from '@shared/schema';

/**
 * Skeleton components for loading states
 */
const HeaderSkeleton = React.memo(() => (
  <div className="h-14 bg-background border-b border-border flex items-center px-4">
    <Skeleton className="h-8 w-32 mr-4" />
    <div className="flex space-x-2 ml-auto">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
));

HeaderSkeleton.displayName = 'HeaderSkeleton';

const SidebarSkeleton = React.memo(() => (
  <div className="h-full w-full bg-background border-r border-border p-4">
    <Skeleton className="h-6 w-3/4 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
));

SidebarSkeleton.displayName = 'SidebarSkeleton';

const EditorLoadingSkeleton = React.memo(() => (
  <div className="h-screen flex flex-col">
    <HeaderSkeleton />
    <div className="flex-1 flex">
      <div className="w-64 border-r border-border">
        <SidebarSkeleton />
      </div>
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-80 border-l border-border">
        <SidebarSkeleton />
      </div>
    </div>
  </div>
));

EditorLoadingSkeleton.displayName = 'EditorLoadingSkeleton';

/**
 * Tab type definition
 */
type EditorTab = 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups';

/**
 * Optimized Editor component with lazy loading and performance enhancements
 */
const LazyEditor = React.memo(() => {
  // Get current location and parse project ID
  const [location, setLocation] = useLocation();
  const projectId = useMemo(() => {
    const match = location.match(/^\/editor\/(\d+)/) || location.match(/^\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }, [location]);

  // State management
  const [currentTab, setCurrentTab] = useState<EditorTab>('editor');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Hooks
  const { user } = useTelegramAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Preload components when user hovers over editor elements
  const { preload } = usePreloadComponents();

  // Data fetching
  const { data: projects, isLoading: projectsLoading } = useProjects({
    isAuthenticated: !!user,
    userId: user?.id,
  });

  const updateProjectMutation = useUpdateProject({
    isAuthenticated: !!user,
    userId: user?.id,
  });

  // Find active project
  const activeProject = useMemo(() => {
    return projects?.find((p: any) => p.id === projectId);
  }, [projects, projectId]);

  // Auto-redirect to first project if no projectId is specified
  React.useEffect(() => {
    if (!projectsLoading && projects && projects.length > 0 && !projectId) {
      const firstProject = projects[0];
      setLocation(`/editor/${firstProject.id}`);
    }
  }, [projects, projectsLoading, projectId, setLocation]);

  // Bot editor hook
  const botEditorState = useBotEditor(activeProject?.data as BotData);

  // Create a proper getBotData function for compatibility
  const getBotData = useCallback(() => {
    return {
      nodes: botEditorState?.nodes || [],
      connections: botEditorState?.connections || []
    };
  }, [botEditorState?.nodes, botEditorState?.connections]);

  // Memoized handlers
  const handleTabChange = useCallback((tab: EditorTab) => {
    setCurrentTab(tab);
    // Preload components for the selected tab
    if (tab === 'editor') {
      preload();
    }
  }, [preload]);

  const handleProjectSelect = useCallback((newProjectId: number) => {
    setLocation(`/editor/${newProjectId}`);
  }, [setLocation]);

  const handleSaveProject = useCallback(async () => {
    if (!activeProject || !botEditorState) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: activeProject.id,
        data: {
          data: getBotData(),
        },
      });
      
      toast({
        title: "Проект сохранен",
        description: "Изменения успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить проект",
        variant: "destructive",
      });
    }
  }, [activeProject, botEditorState, updateProjectMutation, toast]);

  // Loading states
  if (projectsLoading) {
    return <EditorLoadingSkeleton />;
  }

  // If no projectId and we have projects, we're redirecting
  if (!projectId && projects && projects.length > 0) {
    return <EditorLoadingSkeleton />;
  }

  // If no projects exist at all
  if (!projectsLoading && projects && projects.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Typography variant="h3" className="mb-4">
            Нет проектов
          </Typography>
          <Typography variant="body" color="muted" className="mb-6">
            У вас пока нет созданных проектов. Создайте свой первый бот!
          </Typography>
          <Button onClick={() => setLocation('/templates')}>
            <Icon name="fa-solid fa-plus" className="mr-2" />
            Создать проект
          </Button>
        </Card>
      </div>
    );
  }

  // If projectId is specified but project not found
  if (projectId && !activeProject) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Typography variant="h3" className="mb-4">
            Проект не найден
          </Typography>
          <Typography variant="body" color="muted" className="mb-6">
            Проект с ID {projectId} не существует или был удален
          </Typography>
          <Button onClick={() => setLocation('/')}>
            <Icon name="fa-solid fa-home" className="mr-2" />
            На главную
          </Button>
        </Card>
      </div>
    );
  }

  // Render tab content with lazy loading
  const renderTabContent = () => {
    switch (currentTab) {
      case 'editor':
        return (
          <Canvas
            nodes={botEditorState?.nodes || []}
            connections={botEditorState?.connections || []}
            selectedNodeId={botEditorState?.selectedNodeId || null}
            onNodeSelect={botEditorState?.setSelectedNodeId || (() => {})}
            onNodeAdd={botEditorState?.addNode || (() => {})}
            onNodeDelete={botEditorState?.deleteNode || (() => {})}
            onNodeMove={(nodeId: string, position: { x: number; y: number }) => {
              botEditorState?.updateNode?.(nodeId, { position });
            }}
            onNodesUpdate={botEditorState?.updateNodes || (() => {})}
            // ... other props
          />
        );
      
      case 'export':
        return (
          <ExportPanel
            botData={getBotData()}
            projectName={activeProject.name}
            projectId={activeProject.id}
          />
        );
      
      case 'bot':
        return (
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <LazyBotControl
              projectId={activeProject.id}
              projectName={activeProject.name}
            />
          </Suspense>
        );
      
      case 'users':
        return (
          <UserDatabasePanel
            projectId={activeProject.id}
            projectName={activeProject.name}
            onOpenDialogPanel={() => {}}
            onOpenUserDetailsPanel={() => {}}
          />
        );
      
      case 'groups':
        return (
          <GroupsPanel
            projectId={activeProject.id}
            projectName={activeProject.name}
          />
        );
      
      default:
        return null;
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <Suspense fallback={<HeaderSkeleton />}>
          <LazyHeader
            currentTab={currentTab as 'editor' | 'preview' | 'export' | 'bot'}
            onTabChange={(tab) => handleTabChange(tab as EditorTab)}
            onSave={handleSaveProject}
            onExport={() => {}}
            isSaving={updateProjectMutation.isPending}
            projectName={activeProject.name}
          />
        </Suspense>

        <div className="flex-1 relative">
          {renderTabContent()}
          
          {/* Mobile sidebar */}
          <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 z-50"
              >
                <Icon name="fa-solid fa-bars" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Компоненты</SheetTitle>
              </SheetHeader>
              <Suspense fallback={<SidebarSkeleton />}>
                <LazyComponentsSidebar
                  onComponentDrag={() => {}}
                  onComponentAdd={(component) => {
                    const newNode = {
                      id: `node-${Date.now()}`,
                      type: component.type,
                      position: { x: 100, y: 100 },
                      data: component.defaultData || {}
                    } as any;
                    botEditorState?.addNode?.(newNode);
                  }}
                />
              </Suspense>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={<HeaderSkeleton />}>
        <LazyHeader
          currentTab={currentTab as 'editor' | 'preview' | 'export' | 'bot'}
          onTabChange={(tab) => handleTabChange(tab as EditorTab)}
          onSave={handleSaveProject}
          onExport={() => {}}
          isSaving={updateProjectMutation.isPending}
          projectName={activeProject.name}
        />
      </Suspense>

      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          {/* Left sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Suspense fallback={<SidebarSkeleton />}>
              <LazyComponentsSidebar
                onComponentDrag={() => {}}
                onComponentAdd={(component) => {
                  const newNode = {
                    id: `node-${Date.now()}`,
                    type: component.type,
                    position: { x: 100, y: 100 },
                    data: component.defaultData || {}
                  } as any;
                  botEditorState?.addNode?.(newNode);
                }}
              />
            </Suspense>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main content */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full" onMouseEnter={preload}>
              {renderTabContent()}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            {currentTab === 'editor' && (
              <PropertiesPanel
                projectId={activeProject.id}
                selectedNode={botEditorState?.selectedNode || null}
                allNodes={botEditorState?.nodes || []}
                allSheets={[]}
                currentSheetId={undefined}
                onNodeUpdate={(nodeId: string, updates: any) => {
                  botEditorState?.updateNodeData?.(nodeId, updates);
                }}
                onNodeTypeChange={(nodeId: string, newType: any, newData: any) => {
                  botEditorState?.updateNode?.(nodeId, { type: newType, data: newData });
                }}
                onNodeIdChange={() => {}}
                onButtonAdd={(nodeId: string, button: any) => {
                  botEditorState?.addButton?.(nodeId, button);
                }}
                onButtonUpdate={(nodeId: string, buttonId: string, updates: any) => {
                  botEditorState?.updateButton?.(nodeId, buttonId, updates);
                }}
                onButtonDelete={(nodeId: string, buttonId: string) => {
                  botEditorState?.deleteButton?.(nodeId, buttonId);
                }}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <LazySaveTemplateModal
          isOpen={showSaveTemplate}
          onClose={() => setShowSaveTemplate(false)}
          botData={getBotData()}
          projectName={activeProject.name}
        />
      </Suspense>
    </div>
  );
});

LazyEditor.displayName = 'LazyEditor';

export default LazyEditor;