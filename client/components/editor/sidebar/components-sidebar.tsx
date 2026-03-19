import { BotProject } from '@shared/schema';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  handleProjectDragStart,
  handleProjectDragOver,
  handleProjectDragLeave,
  handleProjectDrop,
} from './handlers';
import { componentCategories } from './constants';
import type { ComponentsSidebarProps } from './sidebar.types';
import { useSidebarTabs } from './hooks/use-sidebar-tabs';
import { useSidebarDragState } from './hooks/use-sidebar-drag-state';
import { useSidebarEditing } from './hooks/use-sidebar-editing';
import { useSidebarCategories } from './hooks/use-sidebar-categories';
import { useSidebarImport } from './hooks/use-sidebar-import';
import { useSidebarImportHandler } from './hooks/use-sidebar-import-handler';
import { useSidebarTouch } from './hooks/use-sidebar-touch';
import { useSidebarFileUpload } from './hooks/use-sidebar-file-upload';
import { useProjectsQuery } from './hooks/use-projects-query';
import { useCreateProjectMutation } from './hooks/use-create-project-mutation';
import { useDeleteProjectMutation } from './hooks/use-delete-project-mutation';
import { useSidebarSheetDrag } from './hooks/use-sidebar-sheet-drag';
import { useProjectEditing } from './hooks/use-project-editing';
import { createTouchHandlers, registerGlobalTouchHandlers } from './components/sidebar-touch-handlers';
import { ProjectCardWrapper } from './components/project-card-wrapper';
import { ComponentsTab } from './components/components-tab';
import { SidebarHeader } from './components/sidebar-header';
import { ImportDialog } from './components/import-dialog';

import { Button } from '@/components/ui/button';

import { Home, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';

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
  // Хук управления вкладками
  const { currentTab, setCurrentTab } = useSidebarTabs();

  // Хук управления drag-and-drop
  const {
    projectDragState,
    sheetDragState,
    setDraggedProject,
    setDragOverProject,
    setDraggedSheet,
    setDragOverSheet,
  } = useSidebarDragState();

  // Хук управления редактированием
  const {
    editingState,
    startEditing: startEditingSheet,
    saveEditing: saveEditingSheet,
    cancelEditing: cancelEditingSheet,
    setEditingName,
  } = useSidebarEditing();

  // Хук управления редактированием проекта
  const {
    editingState: projectEditingState,
    startEditing: startEditingProject,
    saveEditing: saveEditingProject,
    cancelEditing: cancelEditingProject,
    setEditingName: setProjectEditingName,
  } = useProjectEditing();

  // Хук управления категориями
  const {
    collapsedCategories,
    toggleCategory,
  } = useSidebarCategories();

  // Хук управления импортом
  const {
    importState,
    openDialog: openImportDialog,
    closeDialog: closeImportDialog,
    setJsonText: setImportJsonText,
    setPythonText: setImportPythonText,
    setError: setImportError,
    clearImport,
  } = useSidebarImport();

  // Хук управления touch
  const touchHook = useSidebarTouch();

  // Создаём touch-обработчики
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = createTouchHandlers({
    touchHook,
    onComponentDrag
  });

  // Рефы для импорта файлов
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pythonFileInputRef = useRef<HTMLInputElement>(null);

  const isActuallyMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Хук загрузки файлов
  const { handleFileUpload, handlePythonFileUpload } = useSidebarFileUpload({
    setImportJsonText,
    setImportPythonText,
    setImportError,
    toast,
  });

  /**
   * Глобальные touch обработчики для лучшей поддержки мобильных устройств
   * Обеспечивают корректную работу drag-and-drop на всем экране
   */
  useEffect(() => {
    return registerGlobalTouchHandlers(touchHook.touchState, touchHook.endTouch);
  }, [touchHook.touchState.isDragging, touchHook.touchState.touchedComponent, touchHook.endTouch]);

  /**
   * Загрузка списка проектов с сервера
   * Данные всегда считаются устаревшими для немедленного обновления
   */
  const { projects, isLoading } = useProjectsQuery();

  // Хук обработки импорта проектов
  const { handleImportProject } = useSidebarImportHandler({
    queryClient,
    toast,
    onProjectSelect,
    importState,
    clearImport,
    closeImportDialog,
    setImportError,
    projects,
  });

  // Хук для создания проекта
  const { createProject, isPending: isCreatingProject } = useCreateProjectMutation();

  // Хук для удаления проекта
  const { deleteProject } = useDeleteProjectMutation();

  // Хук для управления перетаскиванием листов
  const { handleSheetDragStart, handleSheetDropOnProject } = useSidebarSheetDrag({
    setDraggedSheet,
    setDragOverSheet,
    sheetDragState,
    projects,
  });

  /**
   * Обработчик создания нового проекта
   * Запускает мутацию создания проекта
   */
  const handleCreateProject = () => {
    createProject({ projectCount: projects.length, onProjectSelect });
  };

  const handleDeleteProject = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project && confirm(`Вы уверены, что хотите удалить проект "${project.name}"? Это действие нельзя отменить.`)) {
      deleteProject(project.id);
    }
  };

  // Обработчики inline редактирования листов
  const handleStartEditingSheet = (sheetId: string, currentName: string) => {
    startEditingSheet(sheetId, currentName);
  };

  const handleSaveSheetName = () => {
    const { sheetId, newName } = saveEditingSheet();
    if (sheetId && newName.trim() && onSheetRename) {
      onSheetRename(sheetId, newName.trim());
    }
  };

  const handleCancelEditingSheet = () => {
    cancelEditingSheet();
  };

  // Обработчики inline редактирования проекта
  const handleStartEditingProject = (projectId: number, currentName: string) => {
    startEditingProject(projectId, currentName);
  };

  const handleSaveProjectName = async () => {
    const { projectId, newName } = saveEditingProject();
    if (projectId && newName.trim() && currentProjectId === projectId) {
      try {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          await apiRequest('PUT', `/api/projects/${projectId}`, {
            ...project,
            name: newName.trim()
          });
          await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
          toast({
            title: "✅ Проект переименован",
            description: `"${project.name}" → "${newName.trim()}"`,
          });
        }
      } catch (error: any) {
        toast({
          title: "❌ Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEditingProject = () => {
    cancelEditingProject();
  };

  // Создаем контент панели
  const SidebarContent = () => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <SidebarHeader
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        showLayoutButtons={showLayoutButtons}
        canvasVisible={canvasVisible}
        headerVisible={headerVisible}
        propertiesVisible={propertiesVisible}
        onToggleCanvas={onToggleCanvas}
        onToggleHeader={onToggleHeader}
        onToggleProperties={onToggleProperties}
        onShowFullLayout={onShowFullLayout}
        onClose={onClose}
      />

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
                    disabled={isCreatingProject}
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
                      openImportDialog();
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
            <ImportDialog
              isOpen={importState.isOpen}
              importState={importState}
              onOpenChange={(open) => open ? openImportDialog() : closeImportDialog()}
              onJsonTextChange={setImportJsonText}
              onPythonTextChange={setImportPythonText}
              onErrorChange={setImportError}
              onImport={handleImportProject}
              fileInputRef={fileInputRef}
              pythonFileInputRef={pythonFileInputRef}
              onFileUpload={handleFileUpload}
              onPythonFileUpload={handlePythonFileUpload}
            />

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
                <Button size="default" onClick={handleCreateProject} disabled={isCreatingProject} className="h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreatingProject ? 'Создание...' : 'Создать проект'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project: BotProject) => (
                  <ProjectCardWrapper
                    key={project.id}
                    project={project}
                    queryClient={queryClient}
                    setDraggedProject={setDraggedProject}
                    setDragOverProject={setDragOverProject}
                    toast={toast}
                    isActive={currentProjectId === project.id}
                    currentProjectId={currentProjectId}
                    activeSheetId={activeSheetId}
                    onProjectSelect={onProjectSelect}
                    onProjectDelete={handleDeleteProject}
                    onSheetSelect={onSheetSelect}
                    onSheetRename={onSheetRename}
                    onSheetDuplicate={onSheetDuplicate}
                    onSheetDelete={onSheetDelete}
                    dragState={{
                      draggedProject: projectDragState.draggedProject,
                      dragOverProject: projectDragState.dragOverProject,
                      draggedSheet: sheetDragState.draggedSheet,
                      dragOverSheet: sheetDragState.dragOverSheet,
                    }}
                    onProjectDragStart={(e: React.DragEvent) => handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject })}
                    onProjectDragOver={(e: React.DragEvent) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      handleProjectDragOver(e, project.id, setDragOverProject);
                      if (sheetDragState.draggedSheet) {
                        console.log('🎯 Sheet over project:', project.id);
                        setDragOverSheet(`project-${project.id}`);
                      }
                    }}
                    onProjectDragLeave={() => {
                      handleProjectDragLeave(setDragOverProject);
                      setDragOverSheet(null);
                    }}
                    onProjectDrop={(e: React.DragEvent) => {
                      console.log('🎯 Drop on project:', sheetDragState.draggedSheet, projectDragState.draggedProject);
                      if (sheetDragState.draggedSheet) {
                        handleSheetDropOnProject(e, project.id);
                      } else if (projectDragState.draggedProject) {
                        handleProjectDrop(e, { draggedProject: projectDragState.draggedProject, targetProject: project, queryClient, setDraggedProject, setDragOverProject, toast });
                      }
                    }}
                    onSheetDragStart={(e: React.DragEvent, sheetId: string) => {
                      if (sheetId) handleSheetDragStart(e, sheetId, project.id);
                    }}
                    onSheetDragOver={() => {}}
                    onSheetDragLeave={() => {
                      setDraggedSheet(null);
                    }}
                    onSheetDrop={() => {}}
                    editingState={editingState}
                    onStartEditingSheet={handleStartEditingSheet}
                    onSaveSheetName={handleSaveSheetName}
                    onCancelEditSheetName={handleCancelEditingSheet}
                    onEditingSheetNameChange={setEditingName}
                    projectEditingState={projectEditingState}
                    onStartEditingProject={handleStartEditingProject}
                    onSaveProjectName={handleSaveProjectName}
                    onCancelEditProjectName={handleCancelEditingProject}
                    onEditingProjectNameChange={setProjectEditingName}
                    allProjects={projects}
                    onMoveSheetToProject={async (sourceProjectId: number, targetProjectId: number, sheetId: string) => {
                      const sourceProject = projects.find(p => p.id === sourceProjectId);
                      const targetProject = projects.find(p => p.id === targetProjectId);
                      if (!sourceProject || !targetProject) return;

                      const sourceData = sourceProject.data as any;
                      const targetData = targetProject.data as any;

                      if (!sourceData?.sheets || !targetData?.sheets) return;

                      const sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === sheetId);
                      if (sourceSheetIndex === -1) return;

                      const sheetToMove = sourceData.sheets[sourceSheetIndex];
                      const newSheet = JSON.parse(JSON.stringify(sheetToMove));
                      targetData.sheets.push(newSheet);
                      sourceData.sheets.splice(sourceSheetIndex, 1);

                      try {
                        await Promise.all([
                          apiRequest('PUT', `/api/projects/${sourceProjectId}`, { data: sourceData }),
                          apiRequest('PUT', `/api/projects/${targetProjectId}`, { data: targetData })
                        ]);

                        const updatedProjects = projects.map(p => {
                          if (p.id === sourceProjectId) return { ...p, data: sourceData };
                          if (p.id === targetProjectId) return { ...p, data: targetData };
                          return p;
                        });
                        queryClient.setQueryData(['/api/projects'], updatedProjects);

                        toast({
                          title: "✅ Лист перемещен",
                          description: `"${sheetToMove.name}" → "${targetProject.name}"`,
                        });
                      } catch (error: any) {
                        toast({
                          title: "❌ Ошибка",
                          description: error.message,
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'elements' && (
          <ComponentsTab
            categories={componentCategories}
            collapsedCategories={collapsedCategories}
            touchState={touchHook.touchState}
            onToggleCategory={toggleCategory}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onComponentDrag={onComponentDrag}
            onComponentAdd={onComponentAdd}
          />
        )}
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
