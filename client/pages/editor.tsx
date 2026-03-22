/**
 * @fileoverview Компонент редактора бота
 *
 * Этот компонент предоставляет основной интерфейс для создания и редактирования
 * телеграм-ботов с использованием визуального редактора узлов.
 *
 * @module Editor
 */

import { CodeEditorArea } from '@/components/editor/code/code-editor-area';
import { CodePanel } from '@/components/editor/code/code-panel';
import { ReadmePreview } from '@/components/editor/code/readme-preview';
import { useCodeGeneratorServer } from '@/components/editor/code/useCodeGeneratorServer';
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
import { SaveTemplateModal } from '@/components/editor/header/components/save-template-modal';
import { TelegramClientConfig } from '@/components/editor/telegram-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useBotEditor } from '@/components/editor/canvas/canvas/use-bot-editor';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { BotData, BotDataWithSheets, BotProject, UserBotData } from '@shared/schema';
import type { ComponentDefinition, Node } from '@shared/schema';
import { nanoid } from 'nanoid';

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

  /**
   * Флаг автоматического создания кнопок при добавлении соединений
   * @type {boolean}
   */
  const [] = useState(true);

  /**
   * Флаг использования гибкого макета
   * @type {boolean}
   */
  const [useFlexibleLayout] = useState(true);

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

  // Хук обработчиков мобильных панелей
  const {
    handleOpenMobileSidebar,
    handleOpenMobileProperties,
  } = useMobileHandlers({ setShowMobileSidebar, setShowMobileProperties });

  // Обработчик логирования действий
  const handleActionLog = useCallback((type: string, description: string) => {
    setActionHistory((prevHistory: ActionHistoryItem[]) => [createActionHistoryItem(type as ActionType, description), ...prevHistory].slice(0, 50));
  }, [setActionHistory]);

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
  const [selectedDialogUser, setSelectedDialogUser] = useState<UserBotData | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserBotData | null>(null);

  // Обработчики закрытия панелей (объявляем первыми для использования в других функциях)
  const handleCloseDialogPanel = useCallback(() => {
    setSelectedDialogUser(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === 'dialog' ? { ...el, visible: false } : el
      )
    }));
  }, [setFlexibleLayoutConfig]);

  const handleCloseUserDetailsPanel = useCallback(() => {
    setSelectedUserDetails(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === 'userDetails') return { ...el, visible: false };
        if (el.id === 'sidebar') return { ...el, visible: true };
        return el;
      })
    }));
  }, [setFlexibleLayoutConfig]);

  // Обработчик выбора пользователя в диалоге
  const handleSelectDialogUser = useCallback((user: UserBotData) => {
    console.log('[handleSelectDialogUser] Selecting user:', user);
    // Обновляем выбранного пользователя и открываем панель
    setSelectedDialogUser(user);
    setFlexibleLayoutConfig(prev => {
      const newConfig = {
        ...prev,
        elements: prev.elements.map(el => {
          if (el.id === 'dialog') return { ...el, visible: true };
          if (el.id === 'properties') return { ...el, visible: false };
          return el;
        })
      };
      console.log('[handleSelectDialogUser] New config:', newConfig);
      return newConfig;
    });
  }, [setFlexibleLayoutConfig]);

  // Обработчик выбора пользователя в деталях
  const handleSelectUserDetails = useCallback((user: UserBotData) => {
    console.log('[handleSelectUserDetails] Selecting user:', user);
    // Обновляем выбранного пользователя и открываем панель
    setSelectedUserDetails(user);
    setFlexibleLayoutConfig(prev => {
      const newConfig = {
        ...prev,
        elements: prev.elements.map(el => {
          if (el.id === 'userDetails') return { ...el, visible: true };
          if (el.id === 'sidebar') return { ...el, visible: false };
          return el;
        })
      };
      console.log('[handleSelectUserDetails] New config:', newConfig);
      return newConfig;
    });
  }, [setFlexibleLayoutConfig]);

  // Обработчики для передачи в UserDatabasePanel (с toggle-логикой для кнопок)
  const handleOpenDialogPanel = useCallback((user: UserBotData) => {
    // Если панель уже открыта для этого пользователя, закрываем её
    if (selectedDialogUser?.userId === user.userId) {
      handleCloseDialogPanel();
    } else {
      handleSelectDialogUser(user);
    }
  }, [selectedDialogUser, handleSelectDialogUser, handleCloseDialogPanel]);

  const handleOpenUserDetailsPanel = useCallback((user: UserBotData) => {
    // Если панель уже открыта для этого пользователя, закрываем её
    if (selectedUserDetails?.userId === user.userId) {
      handleCloseUserDetailsPanel();
    } else {
      handleSelectUserDetails(user);
    }
  }, [selectedUserDetails, handleSelectUserDetails, handleCloseUserDetailsPanel]);

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
    mutationFn: async (params: { restartOnUpdate?: boolean } = {}) => {
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
        restartOnUpdate: params.restartOnUpdate || false
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

  // Использование хука генератора кода
  const { codeContent: generatedCodeContent, isLoading: isCodeLoading, loadContent, setCodeContent } = useCodeGeneratorServer(
    activeProject?.data as BotData || { nodes: [] },
    activeProject?.name || 'project',
    activeProject?.userDatabaseEnabled === 1,
    activeProject?.id || null
  );

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

  // Загрузка контента при изменении выбранного формата
  useEffect(() => {
    loadContent(selectedFormat);
  }, [selectedFormat, loadContent]);

  // Получение текущего содержимого кода для выбранного формата
  const getCurrentContent = () => generatedCodeContent[selectedFormat] || '';

  const content = getCurrentContent();
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Отображаемый контент (без обрезки)
  const displayContent = useMemo(() => {
    return content;
  }, [content]);

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
    deleteNode: _deleteNode,
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
    saveToHistory
  } = useBotEditor(activeProject?.data as BotData);

  // Вычисляем selectedNode из selectedNodeId и nodes
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Reset hasLocalChanges when activeProject changes
  useEffect(() => {
    if (activeProject?.id !== lastLoadedProjectId && lastLoadedProjectId !== null) {
      setHasLocalChanges(false);
    }
  }, [activeProject?.id, lastLoadedProjectId]);

  // Обработчик обновления данных листов
  const handleBotDataUpdate = useCallback((updatedData: BotDataWithSheets) => {
    setBotDataWithSheets(updatedData);

    // Синхронизируем активный лист с системой редактора
    const activeSheet = SheetsManager.getActiveSheet(updatedData);
    if (activeSheet) {
      // Всегда применяем автоиерархию при обновлении данных листов для правильного отображения
      const shouldSkipLayout = false; // Автоиерархия необходима для корректного расположения узлов
      setBotData({ nodes: activeSheet.nodes }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
    }
  }, [setBotData, currentNodeSizes, isMobile, nodes.length]);

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

    // Обновляем узлы в активном листе при изменении nodes
    const updatedSheets = botDataWithSheets.sheets.map(sheet => {
      if (sheet.id === botDataWithSheets.activeSheetId) {
        return {
          ...sheet,
          nodes: nodes
        };
      }
      return sheet;
    });

    setBotDataWithSheets({
      ...botDataWithSheets,
      sheets: updatedSheets
    });
  }, [nodes, botDataWithSheets?.activeSheetId]);

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
        if (el.type === 'canvas') return { ...el, visible: true };
        if (el.id === 'sidebar') return { ...el, visible: true };
        if (el.id === 'properties') return { ...el, visible: true };
        return el;
      })
    }));
  }, [setFlexibleLayoutConfig]);

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
  });

  // Проверяем, есть ли выбранный сценарий при загрузке страницы
  useEffect(() => {
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
            // Всегда применяем автоиерархию при загрузке сценариев для правильного расположения
            const shouldSkipLayout = false; // Автоиерархия необходима при загрузке многолистовых сценариев
            setBotData({ nodes: firstSheet.nodes }, template.name, currentNodeSizes, shouldSkipLayout);
          }

          // Сохраняем в проект только если activeProject загружен
          if (activeProject?.id) {
            // Обновляем botDataWithSheets напрямую, а затем вызываем сохранение
            setBotDataWithSheets({
              ...botDataWithSheets,
              ...templateDataWithSheets
            });

            // Сохраняем изменения в проекте
            updateProjectMutation.mutate({});
          }
        } else {
          // Обычный сценарий без листов - мигрируем к формату с листами
          console.log('Применяем обычный сценарий и мигрируем к формату с листами');
          const migratedData = SheetsManager.migrateLegacyData(template.data);
          setBotDataWithSheets(migratedData);
          // Всегда применяем автоиерархию при загрузке сценариев для правильного расположения
          const shouldSkipLayout = false; // Автоиерархия необходима при загрузке обычных сценариев
          setBotData(template.data, template.name, currentNodeSizes, shouldSkipLayout); // автоиерархия должна работать при загрузке сценариев

          // Сохраняем в проект только если activeProject загружен
          if (activeProject?.id) {
            // Обновляем botDataWithSheets напрямую, а затем вызываем сохранение
            setBotDataWithSheets({
              ...botDataWithSheets,
              ...migratedData
            });

            // Сохраняем изменения в проекте
            updateProjectMutation.mutate({});
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
  }, [activeProject?.id, setBotData, setBotDataWithSheets, updateProjectMutation, toast, queryClient]);

  // Обёртки для deleteNode и duplicateNode с логированием в историю
  const handleNodeDelete = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('delete', `Удален узел "${node?.type || 'Unknown'}"`);
    // Сохраняем в историю ДО изменений
    saveToHistory();
    _deleteNode(nodeId);
  }, [_deleteNode, nodes, handleActionLog, saveToHistory]);

  /**
   * Удаляет соединение между узлами с сохранением в историю.
   */
  const handleConnectionDelete = useCallback((fromId: string, toId: string, type: string) => {
    saveToHistory();
    const updatedNodes = nodes.map(n => {
      if (n.id !== fromId) return n;
      const data = { ...n.data } as Record<string, unknown>;
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
      } else if (type === 'input-target') {
        delete data.inputTargetNodeId;
      }
      return { ...n, data };
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
    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 }, // Случайная позиция с небольшим смещением
      data: component.defaultData || {}
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
      updateProjectMutation.mutate({});
    }
  }, [activeProject?.id, updateProjectMutation]);

  /**
   * Обработчик открытия модального окна сохранения сценария
   */
  const handleSaveAsTemplate = useCallback(() => {
    setShowSaveTemplate(true);
  }, []);

  /**
   * Обработчик загрузки сценария
   *
   * Переходит на страницу сценариев для выбора сценария
   */
  const handleLoadTemplate = useCallback(() => {
    console.log('Template button clicked, navigating to templates page...');
    setLocation('/templates');
  }, [setLocation]);

  /**
   * Обработчик перехода к списку проектов
   */
  const handleGoToProjects = useCallback(() => {
    setLocation('/projects');
  }, [setLocation]);

  /**
   * Обработчик выбора проекта
   *
   * @param {number} newProjectId - ID выбранного проекта
   */
  const handleProjectSelect = useCallback((newProjectId: number) => {
    setLocation(`/editor/${newProjectId}`);
  }, [setLocation]);





  // Определяем содержимое панели свойств для переиспользования
  const propertiesContent = activeProject && currentTab === 'editor' ? (
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
      botDataArray={allProjects.length > 0
        ? allProjects.map(project =>
            project.id === activeProject.id
              ? activeProject.data as BotData  // Используем актуальные данные активного проекта
              : project.data as BotData
          )
        : [activeProject.data as BotData]
      }
      projectIds={allProjects.length > 0
        ? allProjects.map(project => project.id)
        : [activeProject.id]
      }
      projectName={activeProject.name}
      onClose={handleCloseCodePanel}
      selectedFormat={selectedFormat}
      onFormatChange={setSelectedFormat}
      areAllCollapsed={areAllCollapsed}
      onCollapseChange={setAreAllCollapsed}
      showFullCode={showFullCode}
      onShowFullCodeChange={setShowFullCode}
      codeContent={generatedCodeContent}
      isLoading={isCodeLoading}
      displayContent={displayContent}
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
          />
        )}
      </div>
    ) : (
      <div className="h-full">
        {currentTab === 'groups' ? (
          <GroupsPanel
            projectId={activeProject.id}
            projectName={activeProject.name}
          />
        ) : currentTab === 'editor' ? (
          <Canvas
            // Новая система листов
            botData={botDataWithSheets || undefined}
            onBotDataUpdate={handleBotDataUpdate}
            // Существующие пропсы для совместимости
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            onNodeAdd={addNode}
            onNodeDelete={handleNodeDelete}
            onNodeMove={handleNodeMove}
            onNodeMoveStart={handleNodeMoveStart}
            onNodeMoveEnd={handleNodeMoveEnd}
            onNodesUpdate={updateNodes}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onSave={() => updateProjectMutation.mutate({})}
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
          />
        ) : currentTab === 'bot' ? (
          <div className="h-full">
            <BotLayout
              projectId={activeProject.id}
              projectName={activeProject.name}
            />
          </div>
        ) : currentTab === 'users' ? (
          <div className="h-full overflow-hidden">
            <UserDatabasePanel
              projectId={activeProject.id}
              projectName={activeProject.name}
              onOpenDialogPanel={handleOpenDialogPanel}
              onOpenUserDetailsPanel={handleOpenUserDetailsPanel}
            />
          </div>
        ) : currentTab === 'user-ids' ? (
          <UserIdsDatabase />
        ) : currentTab === 'client-api' ? (
          <div className="h-full p-6 bg-background overflow-auto">
            <div className="max-w-3xl mx-auto">
              <TelegramClientConfig />
            </div>
          </div>
        ) : currentTab === 'export' ? (
          // Для вкладки Код показываем пустой контейнер (код показывается в CodeEditorArea и CodePanel)
          <div className="h-full bg-background" />
        ) : null}
      </div>
    );

    const sidebarContent = codePanelVisible ? (
      // Показываем CodePanel поверх sidebar
      <div className="h-full border-r bg-background">
        <CodePanel
          botDataArray={allProjects.map(project => project.data as BotData)}
          projectIds={allProjects.map(project => project.id)}
          projectName={activeProject.name}
          onClose={handleToggleCodePanel}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          areAllCollapsed={areAllCollapsed}
          onCollapseChange={setAreAllCollapsed}
          showFullCode={showFullCode}
          onShowFullCodeChange={setShowFullCode}
          codeContent={generatedCodeContent}
          isLoading={isCodeLoading}
          displayContent={displayContent}
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
      />
    ) : null;

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
                  />
                </div>
              ) : null
            }
            dialogContent={
              selectedDialogUser && activeProject && (
                <DialogPanel
                  key={`dialog-${selectedDialogUser?.userId || 'none'}`}
                  projectId={activeProject.id}
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
                  onNodeSelect={setSelectedNodeId}
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
                  onSave={() => updateProjectMutation.mutate({})}
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
