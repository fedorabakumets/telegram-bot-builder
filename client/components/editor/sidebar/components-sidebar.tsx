import { ComponentDefinition, BotProject } from '@shared/schema';
import { cn } from '@/utils/utils';
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
import { createTouchHandlers, registerGlobalTouchHandlers } from './components/sidebar-touch-handlers';
import { ProjectCard } from './components/project-card';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Home, Plus, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { LayoutButtons } from '@/components/layout/layout-buttons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
            <Dialog open={importState.isOpen} onOpenChange={(open) => open ? openImportDialog() : closeImportDialog()}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Импортировать проект</DialogTitle>
                  <DialogDescription>Вставьте JSON или загрузите файл с данными проекта</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Три раздела: JSON текст, JSON файл и Python код */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Вставка JSON текста */}
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <i className="fas fa-paste text-blue-500" />
                        Вставьте JSON проекта
                      </label>
                      <Textarea
                        value={importState.jsonText}
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

                  {importState.error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <p className="text-sm text-destructive">{importState.error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        closeImportDialog();
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
                      disabled={!importState.jsonText.trim() && !importState.pythonText.trim()}
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
                <Button size="default" onClick={handleCreateProject} disabled={isCreatingProject} className="h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreatingProject ? 'Создание...' : 'Создать проект'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project: BotProject) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
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
                    onProjectDragStart={(e) => handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject })}
                    onProjectDragOver={(e) => {
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
                    onProjectDrop={(e) => {
                      console.log('🎯 Drop on project:', sheetDragState.draggedSheet, projectDragState.draggedProject);
                      if (sheetDragState.draggedSheet) {
                        handleSheetDropOnProject(e, project.id);
                      } else if (projectDragState.draggedProject) {
                        handleProjectDrop(e, { draggedProject: projectDragState.draggedProject, targetProject: project, queryClient, setDraggedProject, setDragOverProject, toast });
                      }
                    }}
                    onSheetDragStart={(e, sheetId) => {
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
                    allProjects={projects}
                    onMoveSheetToProject={async (sourceProjectId, targetProjectId, sheetId) => {
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
                      className={`component-item group/item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-br from-muted/40 to-muted/20 dark:from-slate-800/50 dark:to-slate-900/30 hover:from-muted/70 hover:to-muted/40 dark:hover:from-slate-700/60 dark:hover:to-slate-800/40 rounded-lg sm:rounded-xl cursor-move transition-all duration-200 touch-action-none no-select border border-border/30 hover:border-primary/30 ${touchHook.touchState.touchedComponent?.id === component.id && touchHook.touchState.isDragging ? 'opacity-50 scale-95' : ''
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
