import { ComponentDefinition, BotProject } from '@shared/schema';
import { cn } from '@/utils/utils';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SheetsManager } from '@/utils/sheets-manager';
import { parsePythonCodeToJson } from '@lib/bot-generator/format';
import {
  handleProjectDragStart,
  handleProjectDragOver,
  handleProjectDragLeave,
  handleProjectDrop,
  handleProjectDragEnd,
  formatDate,
  getNodeCount,
  getSheetsInfo
} from './handlers';
import { componentCategories } from './constants';
import type { ComponentsSidebarProps } from './sidebar.types';
import { useSidebarTabs } from './hooks/use-sidebar-tabs';
import { useSidebarDragState } from './hooks/use-sidebar-drag-state';
import { useSidebarEditing } from './hooks/use-sidebar-editing';
import { useSidebarCategories } from './hooks/use-sidebar-categories';
import { useSidebarImport } from './hooks/use-sidebar-import';
import { useSidebarTouch } from './hooks/use-sidebar-touch';
import { useProjectsQuery } from './hooks/use-projects-query';
import { useCreateProjectMutation } from './hooks/use-create-project-mutation';
import { useDeleteProjectMutation } from './hooks/use-delete-project-mutation';
import { createTouchHandlers, registerGlobalTouchHandlers } from './components/sidebar-touch-handlers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Home, Plus, Trash2, Calendar, GripVertical, FileText, Copy, Share2, ChevronDown, ChevronRight, X, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { LayoutButtons } from '@/components/layout/layout-buttons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

  // Хук для создания проекта
  const { createProject, isPending: isCreatingProject } = useCreateProjectMutation();

  // Хук для удаления проекта
  const { deleteProject } = useDeleteProjectMutation();

  /**
   * Обработчик создания нового проекта
   * Запускает мутацию создания проекта
   */
  const handleCreateProject = () => {
    createProject({ projectCount: projects.length, onProjectSelect });
  };

  /**
   * Обработчик начала перетаскивания листа
   * Инициализирует drag-and-drop для перемещения листов между проектами
   * @param e - Событие перетаскивания
   * @param sheetId - Идентификатор листа
   * @param projectId - Идентификатор проекта
   */
  const handleSheetDragStart = (e: React.DragEvent, sheetId: string, projectId: number) => {
    e.stopPropagation();
    setDraggedSheet({ sheetId, projectId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sheetId);
  };

  /**
   * Обработчик сброса листа на проект
   * Перемещает лист из одного проекта в другой
   * @param e - Событие сброса
   * @param targetProjectId - Идентификатор целевого проекта
   */
  const handleSheetDropOnProject = async (e: React.DragEvent, targetProjectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSheet(null);

    const draggedSheet = sheetDragState.draggedSheet;
    if (!draggedSheet) {
      return;
    }

    // Если перемещаем в свой же проект - отменяем
    if (draggedSheet.projectId === targetProjectId) {
      setDraggedSheet(null);
      return;
    }

    // Находим исходный и целевой проекты
    const sourceProject = projects.find(p => p.id === draggedSheet.projectId);
    const targetProject = projects.find(p => p.id === targetProjectId);

    if (!sourceProject || !targetProject) {
      setDraggedSheet(null);
      return;
    }

    try {
      const sourceData = sourceProject.data as any;
      const targetData = targetProject.data as any;

      // Проверяем что оба проекта в новом формате
      if (!sourceData?.sheets || !targetData?.sheets) {
        toast({
          title: "❌ Ошибка",
          description: "Оба проекта должны быть в новом формате с листами",
          variant: "destructive",
        });
        setDraggedSheet(null);
        return;
      }

      // Находим лист в исходном проекте
      const sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === draggedSheet.sheetId);
      if (sourceSheetIndex === -1) {
        setDraggedSheet(null);
        return;
      }

      const sheetToMove = sourceData.sheets[sourceSheetIndex];

      // Добавляем лист в целевой проект
      const newSheet = JSON.parse(JSON.stringify(sheetToMove)); // Deep copy
      targetData.sheets.push(newSheet);

      // Удаляем из исходного проекта
      sourceData.sheets.splice(sourceSheetIndex, 1);

      // Обновляем оба проекта на сервере
      await Promise.all([
        apiRequest('PUT', `/api/projects/${sourceProject.id}`, { data: sourceData }),
        apiRequest('PUT', `/api/projects/${targetProject.id}`, { data: targetData })
      ]);

      // Обновляем кеш
      const updatedProjects = projects.map(p => {
        if (p.id === sourceProject.id) return { ...p, data: sourceData };
        if (p.id === targetProject.id) return { ...p, data: targetData };
        return p;
      });
      queryClient.setQueryData(['/api/projects'], updatedProjects);

      toast({
        title: "✅ Лист перемещен",
        description: `"${sheetToMove.name}" перемещен в "${targetProject.name}"`,
      });
    } catch (error: any) {
      console.error('Ошибка при перемещении листа:', error);
      toast({
        title: "❌ Ошибка перемещения",
        description: error.message || "Не удалось переместить лист",
        variant: "destructive",
      });
    } finally {
      setDraggedSheet(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportJsonText(content);
        setImportError('');
        toast({
          title: "Файл загружен",
          description: `Файл "${file.name}" успешно загружен. Нажмите "Импортировать" для создания проекта.`,
        });
      } catch (error) {
        setImportError('Ошибка при чтении файла');
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      setImportError('Ошибка при чтении файла');
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось прочитать файл",
        variant: "destructive",
      });
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePythonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportPythonText(content);
        setImportError('');
        toast({
          title: "Python файл загружен",
          description: `Файл "${file.name}" успешно загружен. Нажмите "Импортировать" для создания проекта.`,
        });
      } catch (error) {
        setImportError('Ошибка при чтении файла');
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      setImportError('Ошибка при чтении файла');
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось прочитать файл",
        variant: "destructive",
      });
    };
    reader.readAsText(file);

    if (pythonFileInputRef.current) {
      pythonFileInputRef.current.value = '';
    }
  };

  const parsePythonBotToJson = (pythonCode: string) => {
    const { nodes, connections } = parsePythonCodeToJson(pythonCode);

    const projectData = {
      sheets: [
        {
          id: 'main',
          name: 'Импортированный бот',
          nodes: nodes,
          connections: connections
        }
      ],
      version: 2,
      activeSheetId: 'main'
    };

    return {
      data: projectData,
      nodeCount: nodes.length
    };
  };

  const handleImportProject = () => {
    try {
      setImportError('');

      if (importState.pythonText.trim()) {
        try {
          if (importState.pythonText.includes('@@NODE_START:') && importState.pythonText.includes('@@NODE_END:')) {
            try {
              const result = parsePythonBotToJson(importState.pythonText);
              const projectName = `Python Bot ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              const projectDescription = `Импортирован из Python кода (${result.nodeCount} узлов)`;

              apiRequest('POST', '/api/projects', {
                name: projectName,
                description: projectDescription,
                data: result.data
              }).then(() => {
                closeImportDialog();
                clearImport();
                toast({
                  title: "✅ Успешно импортировано!",
                  description: `Python бот загружен (${result.nodeCount} узлов)`,
                  variant: "default",
                });
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                }, 300);
              }).catch((apiError: any) => {
                setImportError(apiError.message || 'Ошибка при создании проекта');
                toast({
                  title: "❌ Ошибка создания проекта",
                  description: apiError.message || 'Не удалось создать проект',
                  variant: "destructive",
                });
              });
            } catch (error: any) {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "❌ Ошибка импорта",
                description: error.message || 'Не удалось создать проект',
                variant: "destructive",
              });
            }
            return;
          } else {
            const jsonData = JSON.parse(importState.pythonText);

            let projectData: any;
            let projectName: string;
            let projectDescription: string;

            if (jsonData.name && jsonData.data) {
              projectName = jsonData.name;
              projectDescription = jsonData.description || '';
              projectData = jsonData.data;
            } else if (jsonData.sheets && (jsonData.version || jsonData.activeSheetId)) {
              projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              projectDescription = '';
              projectData = jsonData;

              if (!projectData.version) {
                projectData.version = 2;
              }
            } else if (jsonData.nodes) {
              projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
              projectDescription = '';
              projectData = jsonData;
            } else {
              throw new Error('Неподдерживаемый формат');
            }

            apiRequest('POST', '/api/projects', {
              name: projectName,
              description: projectDescription,
              data: projectData
            }).then(() => {
              closeImportDialog();
              clearImport();
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              }, 300);
            }).catch((error: any) => {
              setImportError(error.message || 'Ошибка при импорте проекта');
              toast({
                title: "Ошибка импорта",
                description: error.message,
                variant: "destructive",
              });
            });
            return;
          }
        } catch (error: any) {
          setImportError('Файл должен содержать либо Python код бота (с @@NODE_START@@), либо валидный JSON');
          toast({
            title: "Ошибка парсинга",
            description: "Неподдерживаемый формат файла",
            variant: "destructive",
          });
          return;
        }
      }

      // Импорт JSON
      const parsedData = JSON.parse(importState.jsonText);

      let projectData: any;
      let projectName: string;
      let projectDescription: string;

      if (parsedData.name && parsedData.data) {
        projectName = parsedData.name;
        projectDescription = parsedData.description || '';
        projectData = parsedData.data;
      }
      else if (parsedData.sheets && (parsedData.version || parsedData.activeSheetId)) {
        projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
        projectDescription = '';
        projectData = parsedData;

        if (!projectData.version) {
          projectData.version = 2;
        }
      }
      else if (parsedData.nodes) {
        projectName = `Импортированный проект ${new Date().toLocaleTimeString('ru-RU').slice(0, 5)}`;
        projectDescription = '';
        projectData = parsedData;
      }
      else {
        throw new Error('Неподдерживаемый формат JSON. Должен содержать поле "sheets", "nodes" или "data"');
      }

      apiRequest('POST', '/api/projects', {
        name: projectName,
        description: projectDescription,
        data: projectData
      }).then((newProject: BotProject) => {
        closeImportDialog();
        clearImport();

        setTimeout(() => {
          const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
          queryClient.setQueryData(['/api/projects'], [...currentProjects, newProject]);

          const currentList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']) || [];
          const { data, ...projectWithoutData } = newProject;
          queryClient.setQueryData(['/api/projects/list'], [...currentList, projectWithoutData]);

          toast({
            title: "Проект импортирован",
            description: `Проект "${newProject.name}" успешно импортирован. Проект готов к редактированию!`,
          });

          if (onProjectSelect) {
            onProjectSelect(newProject.id);
          }
        }, 300);
      }).catch((error) => {
        setImportError(`Ошибка импорта: ${error.message}`);
        toast({
          title: "Ошибка импорта",
          description: error.message,
          variant: "destructive",
        });
      });
    } catch (error: any) {
      const errorMsg = error instanceof SyntaxError ? 'Неверный JSON формат' : error.message;
      setImportError(errorMsg);
      toast({
        title: "Ошибка валидации",
        description: errorMsg,
        variant: "destructive",
      });
    }
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
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject })}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      handleProjectDragOver(e, project.id, setDragOverProject);
                      if (sheetDragState.draggedSheet) {
                        console.log('🎯 Sheet over project:', project.id);
                        setDragOverSheet(`project-${project.id}`);
                      }
                    }}
                    onDragLeave={() => {
                      handleProjectDragLeave(setDragOverProject);
                      setDragOverSheet(null);
                    }}
                    onDrop={(e) => {
                      console.log('🎯 Drop on project:', sheetDragState.draggedSheet, projectDragState.draggedProject);
                      if (sheetDragState.draggedSheet) {
                        handleSheetDropOnProject(e, project.id);
                      } else if (projectDragState.draggedProject) {
                        handleProjectDrop(e, { draggedProject: projectDragState.draggedProject, targetProject: project, queryClient, setDraggedProject, setDragOverProject, toast });
                      }
                    }}
                    onDragEnd={() => handleProjectDragEnd(setDraggedProject, setDragOverProject)}
                    className={`group p-2.5 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm overflow-hidden ${currentProjectId === project.id
                        ? 'bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-600/15 dark:from-blue-600/30 dark:via-blue-500/20 dark:to-cyan-600/25 border-blue-500/50 dark:border-blue-400/50 shadow-lg shadow-blue-500/25'
                        : 'bg-gradient-to-br from-slate-50/60 to-slate-100/40 dark:from-slate-900/50 dark:to-slate-800/40 border-slate-200/40 dark:border-slate-700/40 hover:border-slate-300/60 dark:hover:border-slate-600/60 hover:bg-gradient-to-br hover:from-slate-100/80 hover:to-slate-100/50 dark:hover:from-slate-800/70 dark:hover:to-slate-700/50 hover:shadow-md hover:shadow-slate-500/20'
                      } ${projectDragState.dragOverProject === project.id || sheetDragState.dragOverSheet === `project-${project.id}` ? 'border-blue-500 border-2 shadow-xl shadow-blue-500/50 bg-gradient-to-br from-blue-600/25 to-cyan-600/20 dark:from-blue-600/40 dark:to-cyan-600/30' : ''
                      } ${projectDragState.draggedProject?.id === project.id ? 'opacity-50 scale-95' : ''
                      }`}
                    onClick={() => onProjectSelect && onProjectSelect(project.id)}
                  >
                    {/* Header Section */}
                    <div className="flex gap-1.5 xs:gap-2 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4 items-start">
                      <div className="hidden xs:flex cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 flex-shrink-0 mt-0.5">
                        <GripVertical className="h-4 xs:h-4.5 w-4 xs:w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs xs:text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 break-words leading-tight line-clamp-2">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 break-words line-clamp-1 xs:line-clamp-2 leading-relaxed mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-xs px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap font-semibold flex-shrink-0 transition-all ${project.ownerId === null
                            ? 'bg-blue-500/25 text-blue-700 dark:text-blue-300'
                            : 'bg-green-500/25 text-green-700 dark:text-green-300'
                          }`}>
                          {project.ownerId === null ? '👥' : '👤'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 rounded-md flex-shrink-0"
                        >
                          <Trash2 className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 text-xs mb-2.5 xs:mb-3 sm:mb-4 flex-wrap">
                      <span className="flex items-center gap-1 bg-blue-500/15 dark:bg-blue-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-blue-400/30 dark:border-blue-500/30 font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">{getNodeCount(project)}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-purple-500/15 dark:bg-purple-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-purple-400/30 dark:border-purple-500/30 font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs">{(() => { const info = getSheetsInfo(project); return info.count; })()}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-500/15 dark:bg-slate-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-slate-400/30 dark:border-slate-500/30 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{formatDate(project.updatedAt).split(',')[0]}</span>
                      </span>
                    </div>

                    {/* Sheets Section */}
                    {(() => {
                      const sheetsInfo = getSheetsInfo(project);
                      return (
                        <div className="space-y-1 xs:space-y-1.5">
                          {sheetsInfo.names.length > 0 && (
                            <div className="space-y-0.5 sm:space-y-1">
                              {sheetsInfo.names.map((name: string, index: number) => {
                                const projectData = project.data as any;
                                const sheetId = SheetsManager.isNewFormat(projectData) ? projectData.sheets[index]?.id : null;
                                const isActive = currentProjectId === project.id && sheetId === activeSheetId;
                                const isEditing = editingState.editingSheetId !== null && sheetId !== null && editingState.editingSheetId === sheetId;

                                return (
                                  <div key={index} className="flex items-center gap-1 sm:gap-1.5 group/sheet px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md hover:bg-muted/50 transition-colors">
                                    {isEditing ? (
                                      <Input
                                        value={editingState.editingSheetName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveSheetName();
                                          } else if (e.key === 'Escape') {
                                            handleCancelEditingSheet();
                                          }
                                        }}
                                        onBlur={handleSaveSheetName}
                                        autoFocus
                                        className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6 flex-1 font-medium"
                                      />
                                    ) : (
                                      <div
                                        draggable
                                        onDragStart={(e) => {
                                          if (sheetId) handleSheetDragStart(e, sheetId, project.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedSheet(null);
                                        }}
                                        className={`text-xs px-1.5 sm:px-2 py-0.5 cursor-grab active:cursor-grabbing transition-all flex-1 font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent inline-flex items-center text-center line-clamp-1 ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-foreground hover:bg-muted'
                                          } ${sheetDragState.draggedSheet?.sheetId === sheetId && sheetDragState.draggedSheet?.projectId === project.id ? 'opacity-50' : ''
                                          }`}
                                        onClick={() => {
                                          if (currentProjectId === project.id && onSheetSelect && SheetsManager.isNewFormat(projectData)) {
                                            const sheetId = projectData.sheets[index]?.id;
                                            if (sheetId) {
                                              onSheetSelect(sheetId);
                                            }
                                          }
                                        }}
                                        onDoubleClick={() => {
                                          if (currentProjectId === project.id && SheetsManager.isNewFormat(projectData)) {
                                            const sheetId = projectData.sheets[index]?.id;
                                            if (sheetId) {
                                              handleStartEditingSheet(sheetId, name);
                                            }
                                          }
                                        }}
                                        title={name}
                                      >
                                        <span className="truncate">{name || 'Без названия'}</span>
                                      </div>
                                    )}

                                    {/* Кнопки управления листом */}
                                    {currentProjectId === project.id && !isEditing && (
                                      <div className="flex gap-0.5 sm:gap-1 opacity-0 group-hover/sheet:opacity-100 transition-opacity flex-shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (SheetsManager.isNewFormat(projectData)) {
                                              const sheetId = projectData.sheets[index]?.id;
                                              if (sheetId && onSheetDuplicate) {
                                                onSheetDuplicate(sheetId);
                                              }
                                            }
                                          }}
                                          title="Дублировать лист"
                                        >
                                          <Copy className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                                        </Button>

                                        {projects.length > 1 && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded transition-all"
                                                title="Переместить в другой проект"
                                              >
                                                <Share2 className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56" side="top" sideOffset={5}>
                                              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Переместить в</div>
                                              {projects.map((otherProject) => {
                                                if (otherProject.id === project.id) return null;
                                                const targetInfo = getSheetsInfo(otherProject);
                                                const targetNodeCount = getNodeCount(otherProject);
                                                return (
                                                  <DropdownMenuItem
                                                    key={otherProject.id}
                                                    onClick={async (e: React.MouseEvent) => {
                                                      e.stopPropagation();
                                                      const sourceData = projectData;
                                                      const targetData = otherProject.data as any;

                                                      if (!sourceData?.sheets || !targetData?.sheets) return;

                                                      const sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === sheetId);
                                                      if (sourceSheetIndex === -1) return;

                                                      const sheetToMove = sourceData.sheets[sourceSheetIndex];
                                                      const newSheet = JSON.parse(JSON.stringify(sheetToMove));
                                                      targetData.sheets.push(newSheet);
                                                      sourceData.sheets.splice(sourceSheetIndex, 1);

                                                      try {
                                                        await Promise.all([
                                                          apiRequest('PUT', `/api/projects/${project.id}`, { data: sourceData }),
                                                          apiRequest('PUT', `/api/projects/${otherProject.id}`, { data: targetData })
                                                        ]);

                                                        const updatedProjects = projects.map(p => {
                                                          if (p.id === project.id) return { ...p, data: sourceData };
                                                          if (p.id === otherProject.id) return { ...p, data: targetData };
                                                          return p;
                                                        });
                                                        queryClient.setQueryData(['/api/projects'], updatedProjects);

                                                        toast({
                                                          title: "✅ Лист перемещен",
                                                          description: `"${sheetToMove.name}" → "${otherProject.name}"`,
                                                        });
                                                      } catch (error: any) {
                                                        toast({
                                                          title: "❌ Ошибка",
                                                          description: error.message,
                                                          variant: "destructive",
                                                        });
                                                      }
                                                    }}
                                                    className="flex flex-col gap-1.5 cursor-pointer py-2.5"
                                                  >
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="font-medium text-sm truncate">{otherProject.name}</span>
                                                      {otherProject.ownerId === null && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium flex-shrink-0">👥</span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-xs bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Zap className="h-2.5 w-2.5" />
                                                        {targetNodeCount}
                                                      </span>
                                                      <span className="text-xs bg-purple-500/10 dark:bg-purple-600/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <FileText className="h-2.5 w-2.5" />
                                                        {targetInfo.count}
                                                      </span>
                                                    </div>
                                                  </DropdownMenuItem>
                                                );
                                              })}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}

                                        {sheetsInfo.count > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded transition-all"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (sheetId && SheetsManager.isNewFormat(projectData)) {
                                                if (onSheetDelete) {
                                                  onSheetDelete(sheetId);
                                                }
                                              }
                                            }}
                                            title="Удалить лист"
                                          >
                                            <Trash2 className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
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
