/**
 * @fileoverview Компонент редактора бота
 *
 * Этот компонент предоставляет основной интерфейс для создания и редактирования
 * телеграм-ботов с использованием визуального редактора узлов.
 *
 * @module Editor
 */

import { CodeEditorArea } from '@/components/editor/code/editor';
import { CodePanel } from '@/components/editor/code/panel';
import { ReadmePreview } from '@/components/editor/code/readme';
import { useCodeGenerator as useCodeGeneratorServer } from '@/components/editor/code/hooks';
import type { CodeFormat } from '@/components/editor/code/hooks';
import { AppSidebar } from '@/components/editor/sidebar';
import { useSidebarState } from '@/components/editor/sidebar/hooks/use-sidebar-state';
import { ComponentsSidebar } from '@/components/editor/sidebar/components-sidebar';
import { PropertiesPanel } from '@/components/editor/properties/components/main/properties-panel';
import { Canvas } from '@/components/editor/canvas/canvas/canvas';
import { BotLayout } from '@/components/editor/bot/panel/BotLayout';
import { BotControl } from '@/components/editor/bot/bot-control';
import { migrateAllKeyboardLayouts } from './editor/utils/keyboard-migration';
import { createActionHistoryItem } from './editor/utils/action-logger';
import type { ActionType, PreviousEditorTab, ActionHistoryItem, EditorTab } from './editor/types';
import { useProjectLoader } from './editor/hooks/use-project-loader';
import { useTabNavigation } from './editor/hooks/use-tab-navigation';
import { useLayoutManager as useFlexibleLayoutManager } from './editor/hooks/use-layout-management';
import { useNodeHandlers } from './editor/hooks/use-node-handlers';
import { useButtonHandlers } from './editor/hooks/use-button-handlers';
import {
  useSheetHandlers,
  useEditorUIStates,
  useSheetStates,
  useCodeStates,
  useMobileHandlers,
  useCodePanelHandlers,
} from '@/pages/editor/hooks';
import { useProjectReset } from '@/pages/editor/hooks/use-project-reset';
import { useNodeFocus } from '@/pages/editor/hooks/use-node-focus';
import { useDialogPanel } from '@/pages/editor/hooks/use-dialog-panel';
import { useProjectNavigation } from '@/pages/editor/hooks/use-project-navigation';
import { SaveTemplateModal } from '@/components/editor/header/components/save-template-modal';
import { TelegramClientConfig } from '@/components/editor/telegram-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';

import { DialogPanel } from '@/components/editor/database/dialog/dialog-panel';
import { GroupsPanel } from '@/components/editor/groups/groups-panel';
import { UserDatabasePanel } from '@/components/editor/database/user-database/user-database-panel';
import { UserDetailsPanel } from '@/components/editor/database/user-details/user-details-panel';
import { UserIdsDatabase } from '@/components/editor/user-ids-db';
import { ProjectNotFound } from '@/components/editor/project-not-found';
import { AdaptiveHeader } from '@/components/editor/header/adaptive-header';
import { AdaptiveLayout } from '@/components/layout/adaptive-layout';
import { FlexibleLayout } from '@/components/layout/flexible/flexible-layout';
import { LayoutManager, useLayoutManager } from '@/components/layout/layout-manager';
import { SimpleLayoutCustomizer } from '@/components/layout/simple-layout-customizer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MobilePropertiesSheet } from '@/pages/editor/components/mobile/mobile-properties-sheet';
import { CanvasViewToggle } from '@/pages/editor/components/canvas-view-toggle';
import { useCanvasView } from '@/pages/editor/hooks/use-canvas-view';
import { JsonApplyBar } from '@/components/editor/code/panel';
import { StagingBar, useStagingBar } from '@/components/editor/staging';
import { useBotEditor } from '@/components/editor/canvas/canvas/use-bot-editor';
import { useMoveNodeToSheet } from '@/components/editor/canvas/canvas/use-move-node-to-sheet';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { clearKeyboardNodeId, getKeyboardNodeId } from '@/components/editor/canvas/canvas-node/keyboard-connection';
import { BotData, BotDataWithSheets, BotProject, UserBotData } from '@shared/schema';
import type { ComponentDefinition, Node } from '@shared/schema';
import { nanoid } from 'nanoid';
import { generateButtonId } from '@/utils/generate-button-id';
import { applyTemplateLayout } from '@/utils/hierarchical-layout';

/**
 * Компонент редактора бота
 *
 * Основной компонент, предоставляющий интерфейс для создания и редактирования
 * телеграм-ботов с использованием визуального редактора узлов.
 *
 * @returns {JSX.Element} Компонент редактора бота
 */
export default function Editor() {
  // Используем useLocation для получения текущего пути
  const [location, setLocation] = useLocation();

  /**
   * ID проекта, извлеченный из URL
   * @type {number|null}
   */
  const projectId = (() => {
    const match = location.match(/^\/editor\/(\d+)/) || location.match(/^\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  })();

  /**
   * Текущая выбранная вкладка в интерфейсе редактора
   * @type {EditorTab}
   */
  const [currentTab, setCurrentTab] = useState<EditorTab>('editor');

  /**
   * Флаг отображения модального окна сохранения сценария
   * @type {boolean}
   */
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  /** Состояние свёрнутости левого сайдбара */
  const { isCollapsed, toggleCollapsed } = useSidebarState();

  /**
   * Флаг автоматического создания кнопок при добавлении соединений
   * @type {boolean}
   */
  const [] = useState(true);

  /**
   * Идентификатор выбранного токена на вкладке базы пользователей
   * @type {number|null}
   */
  const [selectedDatabaseTokenId, setSelectedDatabaseTokenId] = useState<number | null>(null);

  /**
   * Флаг использования гибкого макета
   * @type {boolean}
   */
  const [useFlexibleLayout] = useState(true);

  /** Триггер для принудительного fitToContent после применения шаблона */
  const [fitTrigger, setFitTrigger] = useState(0);

  /** ID узла для фокусировки на канвасе */
  const {
    focusNodeId,
    highlightNodeId,
    focusButtonId,
    setHighlightNodeId,
    handleNodeFocus,
  } = useNodeFocus();

  // Хуки состояний
  const {
    isLoadingTemplate,
    showLayoutManager,
    showMobileProperties,
    showMobileSidebar,
    setIsLoadingTemplate,
    setShowLayoutManager,
    setShowMobileProperties,
    setShowMobileSidebar,
  } = useEditorUIStates();

  // Хук состояний листов
  const {
    botDataWithSheets,
    currentNodeSizes,
    actionHistory,
    lastLoadedProjectId,
    hasLocalChanges,
    setBotDataWithSheets,
    setCurrentNodeSizes,
    setActionHistory,
    setLastLoadedProjectId,
    setHasLocalChanges,
  } = useSheetStates();

  // Хук состояний кода
  const {
    selectedFormat,
    theme,
    areAllCollapsed,
    showFullCode,
    codeEditorVisible,
    codePanelVisible,
    editorRef,
    setSelectedFormat,
    setTheme,
    setAreAllCollapsed,
    setShowFullCode,
    setCodeEditorVisible,
    setCodePanelVisible,
  } = useCodeStates();

  /** Текущий отредактированный JSON контент из Monaco Editor */
  const [editedJsonContent, setEditedJsonContent] = useState<string>('');
  /** Флаг программного сброса редактора — игнорируем onChange во время setValue */
  const isResettingEditorRef = useRef(false);

  /**
   * Обрабатывает смену формата кода, сбрасывая редактируемый JSON
   * @param format - Новый формат кода
   */
  const handleFormatChange = useCallback((format: CodeFormat) => {
    setSelectedFormat(format);
    setEditedJsonContent('');
  }, [setSelectedFormat]);

  // Хук обработчиков мобильных панелей
  const {
    handleOpenMobileSidebar,
    handleOpenMobileProperties,
  } = useMobileHandlers({ setShowMobileSidebar, setShowMobileProperties });

  // Обработчик логирования действий
  const handleActionLog = useCallback((type: string, description: string) => {
    setActionHistory((prevHistory: ActionHistoryItem[]) => [createActionHistoryItem(type as ActionType, description), ...prevHistory].slice(0, 50));
    setHasLocalChanges(true);
  }, [setActionHistory, setHasLocalChanges]);

  // Callback для получения размеров узлов
  const handleNodeSizesChange = useCallback((nodeSizes: Map<string, { width: number; height: number }>) => {
    setCurrentNodeSizes(nodeSizes);
  }, [setCurrentNodeSizes]);

  // Управление макетом через хук
  const {
    flexibleLayoutConfig,
    setFlexibleLayoutConfig,
    handleToggleHeader,
    handleToggleSidebar,
    handleToggleProperties,
    handleToggleCanvas
  } = useFlexibleLayoutManager(isMobile, currentTab);

  const { config: layoutConfig, updateConfig: updateLayoutConfig, resetConfig: resetLayoutConfig, applyConfig: applyLayoutConfig } = useLayoutManager();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Хук обработчиков диалогов
  const {
    selectedDialogUser,
    selectedUserDetails,
    handleCloseDialogPanel,
    handleCloseUserDetailsPanel,
    handleSelectDialogUser,
    handleSelectUserDetails,
    handleOpenDialogPanel,
    handleOpenUserDetailsPanel,
  } = useDialogPanel({ setFlexibleLayoutConfig });

  // Хук состояний вкладок
  const [, setPreviousTab] = useState<PreviousEditorTab>('editor');

  // Хук обработчиков кодовых панелей
  const {
    handleToggleCodePanel,
    handleOpenCodePanel,
    handleCloseCodePanel,
    handleToggleCodeEditor,
  } = useCodePanelHandlers({
    setCodePanelVisible,
    setCodeEditorVisible,
    currentTab,
    setFlexibleLayoutConfig,
    codeEditorVisible,
  });

  /**
   * Мутация для обновления проекта
   *
   * Используется для сохранения изменений в проекте на сервере
   */
  const updateProjectMutation = useMutation({
    mutationFn: async (params: { restartOnUpdate?: boolean; newName?: string } = {}) => {
      if (!activeProject?.id) {
        console.warn('Cannot save: activeProject or ID is undefined');
        return;
      }

      // Всегда используем текущие данные с холста для сохранения
      let projectData;

      if (botDataWithSheets) {
        // Обновляем активный лист текущими данными холста
        const currentCanvasData = getBotData();
        const activeSheetId = botDataWithSheets.activeSheetId;
        const updatedSheets = botDataWithSheets.sheets.map(sheet =>
          sheet.id === activeSheetId
            ? { ...sheet, nodes: currentCanvasData.nodes, updatedAt: new Date() }
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

      // Additional safety check before making the API request
      const projectId = activeProject.id;
      if (!projectId) {
        throw new Error('Project ID is required for update');
      }

      return apiRequest('PUT', `/api/projects/${projectId}`, {
        data: projectData,
        restartOnUpdate: params.restartOnUpdate || false,
        // Передаём новое имя если оно было указано при вызове мутации
        ...(params.newName ? { name: params.newName } : {}),
      });
    },
    onMutate: async (_variables) => {
      if (!activeProject?.id) return;

      // Отменяем текущие запросы для предотвращения race condition
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
      await queryClient.cancelQueries({ queryKey: ['/api/projects/list'] });

      // Сохраняем предыдущие значения для отката
      const previousProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
      const previousProject = queryClient.getQueryData<BotProject>([`/api/projects/${activeProject.id}`]);
      const previousList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);

      // Используем botDataWithSheets напрямую (он уже содержит текущие данные активного листа)
      // так как onMutate вызывается после обновления локального состояния в обработчиках листов
      const optimisticProjectData = botDataWithSheets || activeProject.data;

      const optimisticProject: BotProject = {
        ...activeProject,
        // Используем переданное новое имя если есть, иначе текущее
        name: _variables?.newName ?? activeProject.name,
        data: optimisticProjectData,
        updatedAt: new Date()
      };

      // Оптимистично обновляем кеш
      queryClient.setQueryData<BotProject>([`/api/projects/${activeProject.id}`], optimisticProject);

      if (previousProjects) {
        const updatedProjects = previousProjects.map(p =>
          p.id === activeProject.id ? optimisticProject : p
        );
        queryClient.setQueryData<BotProject[]>(['/api/projects'], updatedProjects);
      }

      if (previousList) {
        const updatedList = previousList.map(p =>
          p.id === activeProject.id ? { ...p, updatedAt: optimisticProject.updatedAt } : p
        );
        queryClient.setQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list'], updatedList);
      }

      // Возвращаем контекст для отката
      return { previousProjects, previousProject, previousList };
    },
    onSuccess: async (_updatedProject) => {
      // Reset local changes flag only after successful save
      setHasLocalChanges(false);

      // Инвалидируем кеш для загрузки актуальных данных с сервера
      if (activeProject?.id) {
        await queryClient.invalidateQueries({
          queryKey: [`/api/projects/${activeProject.id}`],
          exact: true
        });
      }
    },
    onError: (_error, _variables, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      if (context?.previousProject && activeProject?.id) {
        queryClient.setQueryData([`/api/projects/${activeProject.id}`], context.previousProject);
      }
      if (context?.previousList) {
        queryClient.setQueryData(['/api/projects/list'], context.previousList);
      }

      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить проект",
        variant: "destructive",
      });
    }
  });

  // Загрузка проекта через хук
  const {
    currentProject,
    firstProject,
    isProjectNotFound: projectNotFound
  } = useProjectLoader({ projectId });

  // Активный проект
  const activeProject = projectId ? currentProject : firstProject;

  // Загрузка пользователей для вкладки "Пользователи"
  const { data: users = [] } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${activeProject?.id}/users`],
    enabled: !!activeProject?.id && currentTab === 'users',
    staleTime: 0,
    gcTime: 0,
  });

  /**
   * Эффект для автоматического выбора первого пользователя при переключении на вкладку "Пользователи"
   */
  useEffect(() => {
    if (currentTab === 'users' && users.length > 0) {
      const firstUser = users[0];
      // Открываем обе панели с первым пользователем
      handleSelectUserDetails(firstUser);
      handleSelectDialogUser(firstUser);
    }
  }, [currentTab, users, handleSelectUserDetails, handleSelectDialogUser]);

  // Использование хука генератора кода.
  // Передаём botDataWithSheets вместо activeProject?.data, чтобы генератор
  // видел актуальные данные после редактирования JSON через Monaco Editor.
  const { codeContent: generatedCodeContent, isLoading: isCodeLoading, loadContent, setCodeContent } = useCodeGeneratorServer({
    botData: (botDataWithSheets ?? activeProject?.data) as BotData || { nodes: [] },
    projectName: activeProject?.name || 'project',
    userDatabaseEnabled: activeProject?.userDatabaseEnabled === 1,
    projectId: activeProject?.id || null,
    mode: 'server',
  });

  // Определение и отслеживание темы приложения
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Загрузка контента только при открытии панели кода или смене формата внутри открытой панели
  useEffect(() => {
    if (codePanelVisible || codeEditorVisible) {
      loadContent(selectedFormat);
    }
  }, [codePanelVisible, codeEditorVisible, selectedFormat]);

  // Получение текущего содержимого кода для выбранного формата
  const getCurrentContent = () => generatedCodeContent[selectedFormat] || '';

  const content = getCurrentContent();
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Отображаемый контент (без обрезки)
  const displayContent = useMemo(() => {
    return content;
  }, [content]);

  /**
   * Эффект: когда editedJsonContent сброшен в '' (после применения JSON),
   * обновляем Monaco Editor актуальным displayContent.
   * Это гарантирует что редактор показывает применённые данные.
   */
  useEffect(() => {
    if (editedJsonContent === '' && selectedFormat === 'json' && editorRef.current) {
      isResettingEditorRef.current = true;
      editorRef.current.setValue(displayContent);
      // Снимаем флаг после того как Monaco обработает setValue
      setTimeout(() => { isResettingEditorRef.current = false; }, 0);
    }
  }, [editedJsonContent, selectedFormat, displayContent]);

  // Статистика кода для отображения информации о структуре (считается от отображаемого контента)
  const codeStats = useMemo(() => {
    const displayLines = displayContent.split('\n');
    return {
      totalLines: displayLines.length,
      truncated: false,
      functions: (displayContent.match(/^def |^async def /gm) || []).length,
      classes: (displayContent.match(/^class /gm) || []).length,
      comments: (displayContent.match(/^[^#]*#/gm) || []).length
    };
  }, [displayContent]);

  // Determine if we're still loading



  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    duplicateNode: _duplicateNode,
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
    setIsNodeBeingDragged,
    saveToHistory,
    undoSteps,
  } = useBotEditor();

  // Вычисляем selectedNode из selectedNodeId и nodes
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  /**
   * Обёртка над setSelectedNodeId — сбрасывает highlight при клике на пустое место
   * @param nodeId - ID выбранного узла или '' если кликнули на пустое место
   */
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) setHighlightNodeId(null);
  }, [setSelectedNodeId]);

  // Реактивно открываем/закрываем панель свойств при выборе/снятии выбора узла
  // useLayoutEffect — синхронно до отрисовки, чтобы не было мигания пустой панели
  useLayoutEffect(() => {
    if (currentTab !== 'editor') return;
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== 'properties') return el;

        const nextVisible = !!selectedNodeId;
        return el.visible === nextVisible ? el : { ...el, visible: nextVisible };
      })
    }));
  }, [selectedNodeId, currentTab, setFlexibleLayoutConfig]);

  // Сбрасываем состояние при смене проекта
  useProjectReset({
    activeProjectId: activeProject?.id,
    setBotDataWithSheets,
    setHasLocalChanges,
  });

  // Обработчик обновления данных листов
  const handleBotDataUpdate = useCallback((updatedData: BotDataWithSheets) => {
    // Синхронизируем активный лист с системой редактора
    const activeSheet = SheetsManager.getActiveSheet(updatedData);
    if (activeSheet) {
      // Применяем миграции и получаем итоговые узлы (без автоиерархии)
      const migratedNodes = setBotData({ nodes: activeSheet.nodes }, undefined, currentNodeSizes, true);

      // Сохраняем мигрированные узлы обратно в botDataWithSheets
      // чтобы при следующем вызове handleBotDataUpdate не было дублей
      if (migratedNodes && migratedNodes.length !== activeSheet.nodes.length) {
        const updatedWithMigrated = {
          ...updatedData,
          sheets: updatedData.sheets.map(sheet =>
            sheet.id === activeSheet.id
              ? { ...sheet, nodes: migratedNodes }
              : sheet
          ),
        };
        setBotDataWithSheets(updatedWithMigrated);
      } else {
        setBotDataWithSheets(updatedData);
      }
    } else {
      setBotDataWithSheets(updatedData);
    }
  }, [setBotData, currentNodeSizes, setBotDataWithSheets]);

  /**
   * Применяет отредактированный JSON к данным бота.
   * После успешного применения сбрасывает editedJsonContent,
   * чтобы isDirty стал false и панель применения скрылась.
   * @param jsonString - Строка JSON для применения
   */
  const handleApplyJsonToBotData = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as BotDataWithSheets | BotData;
      if ((parsed as BotDataWithSheets).sheets) {
        handleBotDataUpdate(parsed as BotDataWithSheets);
      } else if ((parsed as BotData).nodes) {
        const current = botDataWithSheets;
        if (!current) return;
        const updated: BotDataWithSheets = {
          ...current,
          sheets: current.sheets.map((sheet, i) =>
            i === 0 ? { ...sheet, nodes: (parsed as BotData).nodes } : sheet
          ),
        };
        handleBotDataUpdate(updated);
      }
      // Сбрасываем редактируемый контент — данные успешно применены
      setEditedJsonContent('');
      // Сохраняем на сервер и инвалидируем кэш — чтобы левая панель увидела новые листы
      setTimeout(() => updateProjectMutation.mutate({}), 50);
    } catch (e) {
      console.error('Ошибка применения JSON:', e);
    }
  }, [botDataWithSheets, handleBotDataUpdate, updateProjectMutation]);

  // Хук перемещения узла между листами
  const { moveNodeToSheet } = useMoveNodeToSheet(botDataWithSheets || undefined, handleBotDataUpdate);

  /**
   * Хук управления переключением режима просмотра (Холст / JSON)
   */
  const {
    canvasView,
    jsonContent,
    isDirty,
    jsonError,
    handleViewChange: handleViewChangeRaw,
    handleJsonChange: handleJsonChangeRaw,
    handleApplyJson: handleApplyJsonView,
    handleApplyJsonInPlace,
    handleResetJson,
  } = useCanvasView({
    botDataWithSheets,
    onApplyJson: handleApplyJsonToBotData,
  });

  /**
   * Обёртка над handleJsonChange — при первом изменении добавляет запись в историю действий
   * @param value - Новое содержимое JSON редактора
   */
  const handleJsonChange = useCallback((value: string) => {
    if (!isDirty) {
      handleActionLog('update', 'Изменён JSON сценария');
    }
    handleJsonChangeRaw(value);
  }, [isDirty, handleJsonChangeRaw, handleActionLog]);

  /**
   * Обёртка над handleViewChange — при переходе в JSON разворачивает все блоки редактора
   * @param view - Новый режим просмотра
   */
  const handleViewChange = useCallback((view: import('@/pages/editor/components/canvas-view-toggle').CanvasView) => {
    if (view === 'json') setAreAllCollapsed(false);
    handleViewChangeRaw(view);
  }, [handleViewChangeRaw, setAreAllCollapsed]);

  // Универсальная панель изменений (staging bar)
  const stagingBar = useStagingBar({
    hasLocalChanges,
    actionHistory,
    onSave: () => updateProjectMutation.mutate({}),
    onSaveAndRestart: () => {
      // Сохраняем проект, затем перезапускаем все боты сценария
      updateProjectMutation.mutate({}, {
        onSuccess: () => {
          if (activeProject?.id) {
            apiRequest('POST', `/api/projects/${activeProject.id}/bot/restart-all`).catch(console.error);
          }
        },
      });
    },
    onDiscard: () => {
      // Откатываем все несохранённые изменения на холсте
      if (actionHistory.length > 0) {
        undoSteps(actionHistory.length);
      }
      setHasLocalChanges(false);
      setActionHistory([]);
    },
    isSaving: updateProjectMutation.isPending,
    isDirty,
    jsonError,
    onApplyJson: handleApplyJsonInPlace,
    onResetJson: handleResetJson,
    mode: canvasView,
  });

  // Обработчики узлов через хук
  const {
    handleNodeUpdateWithSheets,
    handleNodeTypeChange,
    handleNodeIdChange,
    handleNodeMove,
    handleNodeMoveStart,
    handleNodeMoveEnd
  } = useNodeHandlers({
    nodes,
    updateNode,
    updateNodeData,
    onActionLog: handleActionLog,
    saveToHistory,
    botDataWithSheets,
    setBotDataWithSheets,
    selectedNodeId,
    setSelectedNodeId
  });

  // Синхронизация nodes → botDataWithSheets для undo/redo
  useEffect(() => {
    if (!botDataWithSheets || !botDataWithSheets.activeSheetId) return;
    const activeSheet = botDataWithSheets.sheets.find(sheet => sheet.id === botDataWithSheets.activeSheetId);
    if (!activeSheet || activeSheet.nodes === nodes) return;

    // Обновляем узлы в активном листе при изменении nodes
    const updatedSheets = botDataWithSheets.sheets.map(sheet => {
      if (sheet.id === botDataWithSheets.activeSheetId) {
        return {
          ...sheet,
          nodes
        };
      }
      return sheet;
    });

    setBotDataWithSheets({
      ...botDataWithSheets,
      sheets: updatedSheets
    });
  }, [nodes, botDataWithSheets, setBotDataWithSheets]);

  // Обновляем данные бота при смене проекта
  useEffect(() => {
    if (activeProject?.data && !isLoadingTemplate && !hasLocalChanges &&
      (lastLoadedProjectId !== activeProject?.id)) {

      const projectData = activeProject.data as any;

      // Проверяем формат и мигрируем если нужно
      let sheetsData: BotDataWithSheets;
      if (SheetsManager.isNewFormat(projectData)) {
        sheetsData = projectData;
      } else {
        sheetsData = SheetsManager.migrateLegacyData(projectData as BotData);
        // Сохраняем мигрированные данные
        updateProjectMutation.mutate({});
      }

      // Миграция keyboardLayout для всех узлов
      sheetsData = {
        ...sheetsData,
        sheets: migrateAllKeyboardLayouts(sheetsData.sheets)
      };

      // Устанавливаем данные листов для отображения панели
      setBotDataWithSheets(sheetsData);

      // Устанавливаем активный лист в редактор
      const activeSheet = SheetsManager.getActiveSheet(sheetsData);
      if (activeSheet) {
        setBotData({ nodes: activeSheet.nodes }, undefined, undefined, true);
      }

      // Обновляем отслеживание загруженного проекта
      setLastLoadedProjectId(activeProject.id);
      localStorage.setItem('lastProjectId', activeProject.id.toString());
    }
  }, [activeProject?.id, isLoadingTemplate, hasLocalChanges, lastLoadedProjectId]);



  /**
   * Обработчик восстановления видимости canvas
   */
  const handleRestoreCanvas = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        // Восстанавливаем все основные элементы интерфейса
        if (el.type === 'canvas') return el.visible ? el : { ...el, visible: true };
        if (el.id === 'sidebar') return el.visible ? el : { ...el, visible: true };
        if (el.id === 'properties') {
          const nextVisible = !!selectedNodeId;
          return el.visible === nextVisible ? el : { ...el, visible: nextVisible };
        }
        return el;
      })
    }));
  }, [setFlexibleLayoutConfig, selectedNodeId]);

  // Навигация по вкладкам через хук
  const { handleTabChange } = useTabNavigation({
    currentTab,
    setCurrentTab,
    setPreviousTab,
    onSaveProject: () => activeProject?.id && updateProjectMutation.mutate({}),
    onOpenCodePanel: handleOpenCodePanel,
    onCloseCodePanel: handleCloseCodePanel,
    onRestoreCanvas: handleRestoreCanvas,
    setLocation,
    projectId: activeProject?.id || null
  });

  // Хук для управления операциями с листами
  const {
    handleSheetAdd,
    handleSheetDelete,
    handleSheetRename,
    handleSheetDuplicate,
    handleSheetSelect,
  } = useSheetHandlers({
    botDataWithSheets,
    setBotDataWithSheets,
    setBotData,
    getBotData,
    handleActionLog,
    saveToHistory,
    updateProjectMutation,
    toast,
    queryClient,
    currentNodeSizes,
    nodes,
    activeProjectId: activeProject?.id || null,
    onAfterSelect: () => setFitTrigger(t => t + 1),
  });

  // Проверяем, есть ли выбранный сценарий при загрузке страницы
  useEffect(() => {
    /**
     * Асинхронная функция применения сценария из localStorage к текущему проекту.
     * Используется IIFE-паттерн, так как useEffect не поддерживает async напрямую.
     */
    const apply = async () => {
      const selectedTemplateData = localStorage.getItem('selectedTemplate');
      if (selectedTemplateData && activeProject) {
        try {
          setIsLoadingTemplate(true); // Устанавливаем флаг загрузки сценария
          const template = JSON.parse(selectedTemplateData);
          console.log('Применяем сохраненный сценарий:', template.name);

          // Проверяем, есть ли в сценарии многолистовая структура
          if (template.data.sheets && Array.isArray(template.data.sheets)) {
            console.log('Применяем многолистовой сценарий с листами:', template.data.sheets.length);

            // Создаем новые ID для листов сценария
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

              return {
                id: nanoid(), // Новый уникальный ID для листа
                name: sheet.name,
                nodes: cleanNodes,
                viewState: sheet.viewState || { position: { x: 0, y: 0 }, zoom: 1 },
                createdAt: new Date(),
                updatedAt: new Date()
              };
            });

            const templateDataWithSheets = {
              sheets: updatedSheets,
              activeSheetId: updatedSheets[0]?.id,
              version: 2
            };

            // Устанавливаем многолистовые данные
            setBotDataWithSheets(templateDataWithSheets);

            // Устанавливаем первый лист как активный на холсте
            const firstSheet = updatedSheets[0];
            if (firstSheet) {
              // Пропускаем автоиерархию при загрузке сценариев — расположение сохраняется как есть
              const shouldSkipLayout = true; // Автоиерархия отключена: применяется только вручную через тулбар
              setBotData({ nodes: firstSheet.nodes }, template.name, currentNodeSizes, shouldSkipLayout);
            }

            // Вписываем содержимое в экран после применения шаблона
            setFitTrigger(t => t + 1);

            // Сохраняем в проект только если activeProject загружен
            if (activeProject?.id) {
              // Обновляем botDataWithSheets напрямую, а затем вызываем сохранение
              setBotDataWithSheets({
                ...botDataWithSheets,
                ...templateDataWithSheets
              });

              if (template.name) {
                // Оптимистично обновляем имя в кеше списка проектов
                const currentList = queryClient.getQueryData<Array<{ id: number; name: string }>>(['/api/projects/list']);
                if (currentList) {
                  queryClient.setQueryData(
                    ['/api/projects/list'],
                    currentList.map(p => p.id === activeProject.id ? { ...p, name: template.name } : p)
                  );
                }
                // Оптимистично обновляем имя в полном кеше проектов (используется сайдбаром)
                const currentProjects = queryClient.getQueryData<Array<{ id: number; name: string }>>(['/api/projects']);
                if (currentProjects) {
                  queryClient.setQueryData(
                    ['/api/projects'],
                    currentProjects.map(p => p.id === activeProject.id ? { ...p, name: template.name } : p)
                  );
                }
              }

              // Сохраняем данные холста и новое имя одним запросом
              updateProjectMutation.mutate({ newName: template.name });
            }
          } else {
            // Обычный сценарий без листов - мигрируем к формату с листами
            console.log('Применяем обычный сценарий и мигрируем к формату с листами');
            const migratedData = SheetsManager.migrateLegacyData(template.data);
            setBotDataWithSheets(migratedData);
            // Пропускаем автоиерархию при загрузке сценариев — расположение сохраняется как есть
            const shouldSkipLayout = true; // Автоиерархия отключена: применяется только вручную через тулбар
            setBotData(template.data, template.name, currentNodeSizes, shouldSkipLayout); // автоиерархия отключена при загрузке сценариев

            // Вписываем содержимое в экран после применения шаблона
            setFitTrigger(t => t + 1);

            // Сохраняем в проект только если activeProject загружен
            if (activeProject?.id) {
              // Обновляем botDataWithSheets напрямую, а затем вызываем сохранение
              setBotDataWithSheets({
                ...botDataWithSheets,
                ...migratedData
              });

              if (template.name) {
                // Оптимистично обновляем имя в кеше списка проектов
                const currentList = queryClient.getQueryData<Array<{ id: number; name: string }>>(['/api/projects/list']);
                if (currentList) {
                  queryClient.setQueryData(
                    ['/api/projects/list'],
                    currentList.map(p => p.id === activeProject.id ? { ...p, name: template.name } : p)
                  );
                }
                // Оптимистично обновляем имя в полном кеше проектов (используется сайдбаром)
                const currentProjects = queryClient.getQueryData<Array<{ id: number; name: string }>>(['/api/projects']);
                if (currentProjects) {
                  queryClient.setQueryData(
                    ['/api/projects'],
                    currentProjects.map(p => p.id === activeProject.id ? { ...p, name: template.name } : p)
                  );
                }
              }

              // Сохраняем данные холста и новое имя одним запросом
              updateProjectMutation.mutate({ newName: template.name });
            }
          }

          // Принудительно инвалидируем кеш проектов после применения сценария
          // чтобы на странице "Проекты" отображалось правильное количество листов
          queryClient.invalidateQueries({ queryKey: ['/api/projects'] });

          toast({
            title: 'Сценарий применен',
            description: `Сценарий "${template.name}" успешно загружен`,
          });

          // Удаляем сохраненный сценарий
          localStorage.removeItem('selectedTemplate');

          // Небольшая задержка, чтобы дать время на сохранение, затем убираем флаг
          setTimeout(() => {
            setIsLoadingTemplate(false);
          }, 1000);
        } catch (error) {
          console.error('Ошибка применения сохраненного сценария:', error);
          localStorage.removeItem('selectedTemplate');
          setIsLoadingTemplate(false); // Убираем флаг при ошибке
        }
      }
    };
    apply();
  }, [activeProject?.id, setBotData, setBotDataWithSheets, updateProjectMutation, toast, queryClient]);

  // Обёртки для deleteNode и duplicateNode с логированием в историю
  const handleNodeDelete = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('delete', `Удален узел "${node?.type || 'Unknown'}"`);
    // Сохраняем в историю ДО изменений
    saveToHistory();
    const updatedNodes = nodes
      .map(n => getKeyboardNodeId(n.data) === nodeId
        ? { ...n, data: clearKeyboardNodeId(n.data) }
        : n)
      .filter(n => n.id !== nodeId);
    updateNodes(updatedNodes);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [nodes, handleActionLog, saveToHistory, updateNodes, selectedNodeId, setSelectedNodeId]);

  /**
   * Удаляет соединение между узлами с сохранением в историю.
   */
  const handleConnectionDelete = useCallback((fromId: string, toId: string, type: string) => {
    saveToHistory();
    const updatedNodes = nodes.map(n => {
      const data = { ...n.data };

      if (n.id === fromId) {
        if (type === 'trigger-next') {
          delete data.autoTransitionTo;
        } else if (type === 'auto-transition') {
          data.enableAutoTransition = false;
          delete data.autoTransitionTo;
        } else if (type === 'button-goto') {
          const buttons = (data.buttons as any[] | undefined) ?? [];
          data.buttons = buttons.map((btn: any) =>
            btn.action === 'goto' && btn.target === toId ? { ...btn, target: undefined } : btn
          );
          // condition-узел хранит переходы в branches, а не в buttons
          const branches = (data.branches as any[] | undefined) ?? [];
          if (branches.length > 0) {
            data.branches = branches.map((b: any) =>
              b.target === toId ? { ...b, target: undefined } : b
            );
          }
        } else if (type === 'input-target') {
          delete data.inputTargetNodeId;
          // Также чистим autoTransitionTo для input-узлов (fallback для старых данных)
          if (n.type === 'input') {
            delete data.autoTransitionTo;
          }
        } else if (type === 'keyboard-link') {
          return { ...n, data: clearKeyboardNodeId(data) };
        }
        return { ...n, data };
      }

      // condition-source хранится в condition-узле (toId) как sourceNodeId
      if (n.id === toId && type === 'condition-source') {
        delete (data as typeof data & { sourceNodeId?: string }).sourceNodeId;
        return { ...n, data };
      }

      if (n.id === toId && type === 'forward-source' && n.type === 'forward_message') {
        delete (data as typeof data & {
          sourceMessageId?: string;
          sourceMessageVariableName?: string;
          sourceMessageNodeId?: string;
        }).sourceMessageId;
        delete (data as typeof data & {
          sourceMessageId?: string;
          sourceMessageVariableName?: string;
          sourceMessageNodeId?: string;
        }).sourceMessageVariableName;
        delete (data as typeof data & {
          sourceMessageId?: string;
          sourceMessageVariableName?: string;
          sourceMessageNodeId?: string;
        }).sourceMessageNodeId;
        (data as typeof data & { sourceMessageIdSource?: string }).sourceMessageIdSource = 'current_message';
        return { ...n, data };
      }

      return n;
    });
    updateNodes(updatedNodes);
    handleActionLog('disconnect', 'Удалено соединение');
  }, [nodes, updateNodes, saveToHistory, handleActionLog]);

  /**
   * Обёртка над duplicateNode с логированием в историю.
   * Принимает опциональную целевую позицию и передаёт её в duplicateNode,
   * чтобы дубль появлялся именно там, где пользователь кликнул правой кнопкой
   * или где находится курсор при нажатии Ctrl+C / Ctrl+D.
   *
   * @param nodeId - ID узла для дублирования
   * @param targetPosition - Целевая позиция в координатах канваса (опционально)
   */
  const handleNodeDuplicate = useCallback((nodeId: string, targetPosition?: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
    // Сохраняем в историю ДО изменений
    saveToHistory();
    _duplicateNode(nodeId, targetPosition);
  }, [_duplicateNode, nodes, handleActionLog, saveToHistory]);

  /**
   * Выполняет автоматическую иерархическую расстановку всех узлов на холсте.
   * Сохраняет текущее состояние в историю перед применением раскладки.
   */
  const handleAutoLayout = useCallback(() => {
    const currentData = getBotData();
    const newNodes = applyTemplateLayout(currentData.nodes, [], undefined, currentNodeSizes);
    saveToHistory();
    handleActionLog('update', 'Авто-расстановка узлов');
    updateNodes(newNodes);
  }, [getBotData, currentNodeSizes, saveToHistory, handleActionLog, updateNodes]);

  // Обработчики кнопок через хук
  const { handleButtonAdd, handleButtonUpdate, handleButtonDelete } = useButtonHandlers({
    nodes,
    addButton,
    updateButton,
    deleteButton,
    onActionLog: handleActionLog,
    saveToHistory
  });

  const handleComponentDrag = useCallback((_component: ComponentDefinition) => {
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
    const clonedData = structuredClone(component.defaultData || {});
    // Регенерируем id кнопок чтобы они были уникальны между узлами
    if (Array.isArray((clonedData as any).buttons)) {
      (clonedData as any).buttons = (clonedData as any).buttons.map((btn: any) => ({ ...btn, id: generateButtonId() }));
    }
    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 }, // Случайная позиция с небольшим смещением
      data: clonedData
    };

    // Логируем добавление в историю действий
    console.log('📝 Добавление узла:', component.type);
    handleActionLog('add', `Добавлен узел "${component.type}"`);

    // Сохраняем в историю ДО изменений
    saveToHistory();

    // Добавляем узел на холст
    addNode(newNode);

    // Auto-save after a short delay to persist the new node
    setTimeout(() => {
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    }, 1000);
  }, [addNode, isLoadingTemplate, updateProjectMutation, activeProject, handleActionLog, saveToHistory, nodes]);

  /**
   * Обработчик явного сохранения проекта
   *
   * Вызывается при нажатии кнопки "Применить" в панели свойств
   */
  const handleSaveProject = useCallback(() => {
    if (activeProject?.id) {
      updateProjectMutation.mutate({ restartOnUpdate: true });
    }
  }, [activeProject?.id, updateProjectMutation]);

  /**
   * Обработчик открытия модального окна сохранения сценария
   */
  const handleSaveAsTemplate = useCallback(() => {
    setShowSaveTemplate(true);
  }, []);

  const {
    handleLoadTemplate,
    handleGoToProjects,
    handleProjectSelect,
  } = useProjectNavigation();





  // Определяем содержимое панели свойств для переиспользования
  // В режиме JSON скрываем панель свойств
  const propertiesContent = activeProject && currentTab === 'editor' && canvasView !== 'json' ? (
    <PropertiesPanel
      projectId={activeProject.id}
      selectedNode={selectedNode}
      allNodes={nodes}
      allSheets={botDataWithSheets?.sheets || []}
      currentSheetId={botDataWithSheets?.activeSheetId || undefined}
      onNodeUpdate={handleNodeUpdateWithSheets}
      onNodeTypeChange={handleNodeTypeChange}
      onNodeIdChange={handleNodeIdChange}
      onButtonAdd={handleButtonAdd}
      onButtonUpdate={handleButtonUpdate}
      onButtonDelete={handleButtonDelete}
      onNodeAdd={addNode}
      onNodeDelete={handleNodeDelete}
      onClose={handleToggleProperties}
      onActionLog={handleActionLog}
      onSaveProject={handleSaveProject}
      focusButtonId={focusButtonId}
    />
  ) : null;

  // Загрузка всех проектов для передачи в CodePanel
  const { data: allProjects = [] } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    staleTime: 30000,
  });

  // Определяем содержимое панели кода
  const codeContent = activeProject ? (
    <CodePanel
      botDataArray={[activeProject.data as BotData]}
      projectIds={[activeProject.id]}
      projectName={activeProject.name}
      onClose={handleCloseCodePanel}
      selectedFormat={selectedFormat}
      onFormatChange={handleFormatChange}
      areAllCollapsed={areAllCollapsed}
      onCollapseChange={setAreAllCollapsed}
      showFullCode={showFullCode}
      onShowFullCodeChange={setShowFullCode}
      codeContent={generatedCodeContent}
      isLoading={isCodeLoading}
      displayContent={displayContent}
      onApplyJson={(jsonString) => handleApplyJsonToBotData(jsonString)}
      editedContent={editedJsonContent}
      onResetEditor={() => {
        isResettingEditorRef.current = true;
        setEditedJsonContent('');
        editorRef.current?.setValue(displayContent);
        setTimeout(() => { isResettingEditorRef.current = false; }, 0);
      }}
    />
  ) : null;

  // Показываем компонент 404 если проект не найден
  if (projectNotFound) {
    return <ProjectNotFound />;
  }

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
        onExport={() => { }}
        onSaveAsTemplate={handleSaveAsTemplate}
        onLoadTemplate={handleLoadTemplate}
        onLayoutSettings={() => setShowLayoutManager(true)}
        onToggleHeader={handleToggleHeader}
        onToggleSidebar={handleToggleSidebar}
        onToggleProperties={handleToggleProperties}
        onToggleCanvas={handleToggleCanvas}
        onToggleCode={handleToggleCodePanel}
        onToggleCodeEditor={handleToggleCodeEditor}
        headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
        sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
        propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
        canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
        codeVisible={codePanelVisible}
        codeEditorVisible={codeEditorVisible}
        onOpenMobileSidebar={() => setShowMobileSidebar(true)}
        onOpenMobileProperties={() => setShowMobileProperties(true)}
      />
    );

    const canvasContent = codeEditorVisible ? (
      // Показываем редактор кода поверх canvas
      <div className="h-full flex flex-col">
        {selectedFormat === 'readme' ? (
          <ReadmePreview
            markdownContent={displayContent}
            theme={theme}
            onContentChange={(content) => {
              // Обновляем контент README в состоянии генератора
              setCodeContent(prev => ({ ...prev, readme: content }));
            }}
          />
        ) : (
          <CodeEditorArea
            isMobile={false}
            isLoading={isCodeLoading}
            displayContent={displayContent}
            selectedFormat={selectedFormat}
            theme={theme}
            editorRef={editorRef}
            codeStats={codeStats}
            setAreAllCollapsed={setAreAllCollapsed}
            areAllCollapsed={areAllCollapsed}
            onContentChange={(value) => { if (!isResettingEditorRef.current) setEditedJsonContent(value); }}
          />
        )}
      </div>
    ) : (
      <div className="h-full flex flex-col">
        {/* Универсальная панель изменений сверху */}
        {currentTab === 'editor' && (
          <StagingBar {...stagingBar} actionHistory={actionHistory} />
        )}
        {/* Контейнер вкладок: relative нужен для absolute-позиционирования JSON-редактора поверх Canvas */}
        <div className="flex-1 min-h-0 relative">

          {/* JSON-редактор — абсолютно поверх Canvas, виден только в json-режиме вкладки editor */}
          {currentTab === 'editor' && canvasView === 'json' && (
            <div className="absolute inset-0 z-10 flex flex-col">
              {/* Тулбар JSON-режима: кнопки fold/unfold и переключатель вида */}
              <div className="flex items-center justify-end gap-2 px-4 py-2 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 border-b border-slate-200/50 dark:border-slate-600/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setAreAllCollapsed(!areAllCollapsed)}
                  className="flex items-center gap-1 h-6 px-2 text-xs rounded-sm border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={areAllCollapsed ? 'Развернуть всё' : 'Свернуть всё'}
                >
                  {areAllCollapsed ? (
                    <>
                      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l4 4 4-4M4 8l4 4 4-4"/></svg>
                      Развернуть
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4-4 4 4M4 10l4 4 4-4"/></svg>
                      Свернуть
                    </>
                  )}
                </button>
                <div className="h-4 w-px bg-slate-300/50 dark:bg-slate-600/50" />
                <CanvasViewToggle value={canvasView} onChange={handleViewChange} />
              </div>
              <div className="flex-1 min-h-0">
                <CodeEditorArea
                  isMobile={false}
                  isLoading={false}
                  displayContent={jsonContent}
                  selectedFormat="json"
                  theme={theme}
                  editorRef={editorRef}
                  codeStats={codeStats}
                  setAreAllCollapsed={setAreAllCollapsed}
                  areAllCollapsed={areAllCollapsed}
                  onContentChange={handleJsonChange}
                  className="border-0 rounded-none shadow-none"
                />
              </div>
            </div>
          )}

          {/* Canvas — всегда в DOM пока активна вкладка editor, скрыт в json-режиме.
              Это сохраняет zoom/pan состояние при переключении между canvas и json видами. */}
          {currentTab === 'editor' && (
            <div className={`h-full${canvasView === 'json' ? ' invisible pointer-events-none' : ''}`}>
              <Canvas
                botData={botDataWithSheets || undefined}
                onBotDataUpdate={handleBotDataUpdate}
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onNodeSelect={handleNodeSelect}
                onNodeAdd={addNode}
                onNodeDelete={handleNodeDelete}
                onNodeDuplicate={handleNodeDuplicate}
                onNodeMove={handleNodeMove}
                onNodeMoveStart={handleNodeMoveStart}
                onNodeMoveEnd={handleNodeMoveEnd}
                onNodesUpdate={updateNodes}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onSave={() => updateProjectMutation.mutate({ restartOnUpdate: true })}
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
                onActionLog={handleActionLog}
                actionHistory={actionHistory}
                onActionHistoryRemove={(ids) => setActionHistory((prev: ActionHistoryItem[]) => prev.filter(a => !ids.has(a.id)))}
                onConnectionDelete={handleConnectionDelete}
                onConnectionCreate={saveToHistory}
                autoFitOnLoad
                suppressAutoFit={canvasView === 'json'}
                fitTrigger={fitTrigger}
                focusNodeId={focusNodeId}
                highlightNodeId={highlightNodeId}
                onMoveNodeToSheet={moveNodeToSheet}
                onAutoLayout={handleAutoLayout}
                canvasView={canvasView}
                onViewChange={currentTab === 'editor' ? handleViewChange : undefined}
              />
            </div>
          )}

          {/* Остальные вкладки */}
          {currentTab === 'groups' && (
            <GroupsPanel
              projectId={activeProject.id}
              projectName={activeProject.name}
            />
          )}
          {currentTab === 'bot' && (
            <div className="h-full">
              <BotLayout
                projectId={activeProject.id}
                projectName={activeProject.name}
              />
            </div>
          )}
          {currentTab === 'users' && (
            <div className="h-full overflow-hidden">
              <UserDatabasePanel
                projectId={activeProject.id}
                projectName={activeProject.name}
                onOpenDialogPanel={handleOpenDialogPanel}
                onOpenUserDetailsPanel={handleOpenUserDetailsPanel}
                selectedTokenId={selectedDatabaseTokenId}
                onSelectToken={setSelectedDatabaseTokenId}
              />
            </div>
          )}
          {currentTab === 'user-ids' && <UserIdsDatabase />}
          {currentTab === 'client-api' && (
            <div className="h-full p-6 bg-background overflow-auto">
              <div className="max-w-3xl mx-auto">
                <TelegramClientConfig />
              </div>
            </div>
          )}
          {/* Для вкладки Экспорт показываем пустой контейнер */}
          {currentTab === 'export' && <div className="h-full bg-background" />}
        </div>
      </div>
    );

    const sidebarContent = codePanelVisible ? (
      // Показываем CodePanel поверх sidebar
      <div className="h-full border-r bg-background">
        <CodePanel
          botDataArray={[activeProject.data as BotData]}
          projectIds={[activeProject.id]}
          projectName={activeProject.name}
          onClose={handleToggleCodePanel}
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
          areAllCollapsed={areAllCollapsed}
          onCollapseChange={setAreAllCollapsed}
          showFullCode={showFullCode}
          onShowFullCodeChange={setShowFullCode}
          codeContent={generatedCodeContent}
          isLoading={isCodeLoading}
          displayContent={displayContent}
          onApplyJson={(jsonString) => handleApplyJsonToBotData(jsonString)}
          editedContent={editedJsonContent}
          onResetEditor={() => {
            isResettingEditorRef.current = true;
            setEditedJsonContent('');
            editorRef.current?.setValue(displayContent);
            setTimeout(() => { isResettingEditorRef.current = false; }, 0);
          }}
        />
      </div>
    ) : currentTab === 'editor' ? (
      <ComponentsSidebar
        onComponentDrag={handleComponentDrag}
        onComponentAdd={handleComponentAdd}
        onLayoutChange={updateLayoutConfig}
        onGoToProjects={handleGoToProjects}
        onProjectSelect={handleProjectSelect}
        currentProjectId={activeProject?.id}
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
        onClose={handleToggleSidebar}
        onNodeFocus={handleNodeFocus}
      />
    ) : null;

    if (useFlexibleLayout) {
      return (
        <div className="flex h-screen w-full overflow-hidden">
          {/** Левый сайдбар навигации — временно скрыт */}
          {/* <AppSidebar
            projectName={activeProject.name}
            botInfo={null}
            currentTab={currentTab}
            onTabChange={handleTabChange}
            onSaveAsTemplate={handleSaveAsTemplate}
            onLoadTemplate={handleLoadTemplate}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
            headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? false}
            onToggleHeader={handleToggleHeader}
          /> */}
          {/** Основная рабочая область */}
          <div className="flex-1 min-w-0 overflow-hidden h-full">
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
            codeEditorContent={
              activeProject ? (
                <div className="h-full flex flex-col">
                  <CodeEditorArea
                    isMobile={false}
                    isLoading={isCodeLoading}
                    displayContent={displayContent}
                    selectedFormat={selectedFormat}
                    theme={theme}
                    editorRef={editorRef}
                    codeStats={codeStats}
                    setAreAllCollapsed={setAreAllCollapsed}
                    areAllCollapsed={areAllCollapsed}
                    onContentChange={(value) => { if (!isResettingEditorRef.current) setEditedJsonContent(value); }}
                  />
                </div>
              ) : null
            }
            dialogContent={
              selectedDialogUser && activeProject && (
                <DialogPanel
                  key={`dialog-${selectedDialogUser?.userId || 'none'}`}
                  projectId={activeProject.id}
                  selectedTokenId={selectedDatabaseTokenId}
                  user={selectedDialogUser}
                  onClose={handleCloseDialogPanel}
                  onSelectUser={handleSelectDialogUser}
                />
              )
            }
            userDetailsContent={
              selectedUserDetails && activeProject && (
                <UserDetailsPanel
                  key={`userdetails-${selectedUserDetails?.userId || 'none'}`}
                  projectId={activeProject.id}
                  selectedTokenId={selectedDatabaseTokenId}
                  user={selectedUserDetails}
                  onClose={handleCloseUserDetailsPanel}
                  onOpenDialog={handleOpenDialogPanel}
                  onSelectUser={handleSelectUserDetails}
                />
              )
            }
            onConfigChange={setFlexibleLayoutConfig}
            hideOnMobile={isMobile}
            currentTab={currentTab}
          />
        </SimpleLayoutCustomizer>
          </div>
        </div>
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
              onExport={() => { }}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              onToggleHeader={handleToggleHeader}
              onToggleSidebar={handleToggleSidebar}
              onToggleProperties={handleToggleProperties}
              onToggleCanvas={handleToggleCanvas}
              onToggleCode={handleToggleCodePanel}
              onToggleCodeEditor={handleToggleCodeEditor}
              headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
              sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
              propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
              canvasVisible={flexibleLayoutConfig.elements.find(el => el.id === 'canvas')?.visible ?? true}
              codeVisible={codePanelVisible}
              codeEditorVisible={codeEditorVisible}
              onOpenMobileSidebar={() => setShowMobileSidebar(true)}
              onOpenMobileProperties={() => setShowMobileProperties(true)}
            />
          }
          sidebar={
            currentTab === 'editor' ? (
              <ComponentsSidebar
                onComponentDrag={handleComponentDrag}
                onComponentAdd={handleComponentAdd}
                onLayoutChange={updateLayoutConfig}
                onGoToProjects={handleGoToProjects}
                onProjectSelect={handleProjectSelect}
                currentProjectId={activeProject?.id}
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
                onClose={handleToggleSidebar}
                onNodeFocus={handleNodeFocus}
              />
            ) : null
          }
          canvas={
            <div className="h-full">
              {currentTab === 'editor' ? (
                <Canvas
                  botData={botDataWithSheets || undefined}
                  onBotDataUpdate={handleBotDataUpdate}
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  onNodeSelect={handleNodeSelect}
                  onNodeAdd={addNode}
                  onNodeDelete={handleNodeDelete}
                  onNodeDuplicate={handleNodeDuplicate}
                  onNodeMove={handleNodeMove}
                  onNodeMoveStart={handleNodeMoveStart}
                  onNodeMoveEnd={handleNodeMoveEnd}
                  onNodesUpdate={updateNodes}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onSave={() => updateProjectMutation.mutate({ restartOnUpdate: true })}
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
                  onActionLog={handleActionLog}
                  actionHistory={actionHistory}
                  onActionHistoryRemove={(ids) => setActionHistory((prev: ActionHistoryItem[]) => prev.filter(a => !ids.has(a.id)))}
                  onConnectionDelete={handleConnectionDelete}
                  onConnectionCreate={saveToHistory}
                  autoFitOnLoad
                  suppressAutoFit={canvasView === 'json'}
                  fitTrigger={fitTrigger}
                  focusNodeId={focusNodeId}
                  highlightNodeId={highlightNodeId}
                  onAutoLayout={handleAutoLayout}
                />
              ) : currentTab === 'bot' ? (
                <div className="h-full p-6 bg-background overflow-auto">
                  <div className="max-w-2xl mx-auto">
                    <BotControl
                      projectId={activeProject.id}
                      projectName={activeProject.name}
                      onBotStarted={handleOpenCodePanel}
                    />
                  </div>
                </div>
              ) : currentTab === 'users' ? (
                <div className="h-full">
                  <UserDatabasePanel
                    projectId={activeProject.id}
                    projectName={activeProject.name}
                    onOpenDialogPanel={handleOpenDialogPanel}
                    onOpenUserDetailsPanel={handleOpenUserDetailsPanel}
                    selectedTokenId={selectedDatabaseTokenId}
                    onSelectToken={setSelectedDatabaseTokenId}
                  />
                </div>
              ) : currentTab === 'groups' ? (
                <div className="h-full">
                  <GroupsPanel
                    projectId={activeProject.id}
                    projectName={activeProject.name}
                  />
                </div>
              ) : currentTab === 'export' ? null : null}
            </div>
          }
          properties={
            currentTab === 'editor' ? (
              <PropertiesPanel
                projectId={activeProject.id}
                selectedNode={selectedNode}
                allNodes={nodes}
                allSheets={botDataWithSheets?.sheets || []}
                currentSheetId={botDataWithSheets?.activeSheetId || undefined}
                onNodeUpdate={handleNodeUpdateWithSheets}
                onNodeTypeChange={handleNodeTypeChange}
                onNodeIdChange={handleNodeIdChange}
                onButtonAdd={handleButtonAdd}
                onButtonUpdate={handleButtonUpdate}
                onButtonDelete={handleButtonDelete}
                onNodeAdd={addNode}
                onNodeDelete={handleNodeDelete}
                onActionLog={handleActionLog}
                focusButtonId={focusButtonId}
              />
            ) : null
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

      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        botData={(botDataWithSheets || getBotData()) as any}
        projectName={activeProject.name}
      />


      {/* Мобильный sidebar */}
      <Sheet open={showMobileSidebar && currentTab === 'editor'} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Компоненты</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-auto">
            <ComponentsSidebar
              onComponentDrag={handleComponentDrag}
              onComponentAdd={handleComponentAdd}
              onLayoutChange={updateLayoutConfig}
              onGoToProjects={handleGoToProjects}
              onProjectSelect={handleProjectSelect}
              currentProjectId={activeProject?.id}
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
              onClose={() => setShowMobileSidebar(false)}
              onNodeFocus={handleNodeFocus}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Мобильная панель свойств - полноэкранная на мобильных */}
      <MobilePropertiesSheet
        open={showMobileProperties && currentTab === 'editor'}
        onOpenChange={setShowMobileProperties}
      >
        {propertiesContent}
      </MobilePropertiesSheet>

    </>
  );
}


