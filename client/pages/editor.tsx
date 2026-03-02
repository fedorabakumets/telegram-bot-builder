/**
 * @fileoverview Компонент редактора бота
 *
 * Этот компонент предоставляет основной интерфейс для создания и редактирования
 * телеграм-ботов с использованием визуального редактора узлов.
 *
 * @module Editor
 */

import { BotControl } from '@/components/editor/bot/bot-control';
import { Canvas } from '@/components/editor/canvas/canvas/canvas';
import { CodeEditorArea } from '@/components/editor/code/code-editor-area';
import { CodePanel } from '@/components/editor/code/code-panel';
import { ReadmePreview } from '@/components/editor/code/readme-preview';
import { ComponentsSidebar } from '@/components/editor/components-sidebar';
import { PropertiesPanel } from '@/components/editor/properties/components/main/properties-panel';
import { logNodeUpdate, logNodeTypeChange, logNodeIdChange, logButtonAdd, logButtonUpdate, logButtonDelete, logSheetAdd, logSheetDelete, logSheetRename, logSheetDuplicate, logSheetSwitch } from '@/components/editor/properties';
import { migrateKeyboardLayout, fixAutoLayout } from '@/components/editor/properties/utils';
import { migrateAllKeyboardLayouts } from './editor/utils/keyboard-migration';
import { createActionHistoryItem } from './editor/utils/action-logger';
import type { ActionType, ActionHistoryItem, EditorTab, PreviousEditorTab, NodeSizeMap } from './editor/types';
import { useProjectLoader } from './editor/hooks/use-project-loader';
import { useProjectSave } from './editor/hooks/use-project-save';
import { useTabNavigation } from './editor/hooks/use-tab-navigation';
import { useLayoutManager as useFlexibleLayoutManager } from './editor/hooks/use-layout-management';
import { useNodeHandlers } from './editor/hooks/use-node-handlers';
import { useButtonHandlers } from './editor/hooks/use-button-handlers';
import { SaveTemplateModal } from '@/components/editor/template/save-template-modal';
import { TelegramClientConfig } from '@/components/editor/telegram-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';

import { DialogPanel } from '@/components/editor/database/dialog/dialog-panel';
import { GroupsPanel } from '@/components/editor/groups/groups-panel';
import { UserDatabasePanel } from '@/components/editor/database/user-database/user-database-panel';
import { UserDetailsPanel } from '@/components/editor/database/user-details/user-details-panel';
import { UserIdsDatabase } from '@/components/editor/user-ids-db';
import { ProjectNotFound } from '@/components/editor/project-not-found';
import { AdaptiveHeader } from '@/components/layout/adaptive-header';
import { AdaptiveLayout } from '@/components/layout/adaptive-layout';
import { FlexibleLayout } from '@/components/layout/flexible/flexible-layout';
import { LayoutCustomizer } from '@/components/layout/layout-customizer';
import { LayoutManager, useLayoutManager } from '@/components/layout/layout-manager';
import { SimpleLayoutConfig, SimpleLayoutCustomizer } from '@/components/layout/simple-layout-customizer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBotEditor } from '@/components/editor/canvas/canvas/use-bot-editor';
import { CodeFormat, useCodeGenerator } from '@/components/editor/code/use-code-generator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SheetsManager } from '@/utils/sheets-manager';
import { BotData, BotDataWithSheets, BotProject, Button, ComponentDefinition, Node, UserBotData } from '@shared/schema';
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
  const [previousTab, setPreviousTab] = useState<PreviousEditorTab>('editor');

  /**
   * Флаг отображения модального окна сохранения шаблона
   * @type {boolean}
   */
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  /**
   * Флаг отображения мобильного сайдбара
   * @type {boolean}
   */
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  /**
   * Флаг отображения мобильной панели свойств
   * @type {boolean}
   */
  const [showMobileProperties, setShowMobileProperties] = useState(false);

  /**
   * Выбранный пользователь для отображения диалога
   * @type {UserBotData|null}
   */
  const [selectedDialogUser, setSelectedDialogUser] = useState<UserBotData | null>(null);

  /**
   * Выбранный пользователь для отображения деталей
   * @type {UserBotData|null}
   */
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserBotData | null>(null);

  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  /**
   * Флаг автоматического создания кнопок при добавлении соединений
   * @type {boolean}
   */
  const [] = useState(true);

  /**
   * Флаг отображения менеджера макета
   * @type {boolean}
   */
  const [showLayoutManager, setShowLayoutManager] = useState(false);

  /**
   * Флаг использования гибкого макета
   * @type {boolean}
   */
  const [useFlexibleLayout] = useState(true);

  /**
   * Флаг отображения настройщика макета
   * @type {boolean}
   */
  const [showLayoutCustomizer] = useState(false);

  // Новая система листов
  /**
   * Данные проекта с поддержкой листов
   * @type {BotDataWithSheets|null}
   */
  const [botDataWithSheets, setBotDataWithSheets] = useState<BotDataWithSheets | null>(null);

  /**
   * Реальные размеры узлов (для иерархического layout)
   * @type {NodeSizeMap}
   */
  const [currentNodeSizes, setCurrentNodeSizes] = useState<NodeSizeMap>(new Map());

  /**
   * Флаг загрузки шаблона
   * @type {boolean}
   */
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  /**
   * Флаг наличия локальных изменений
   * @type {boolean}
   */
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  /**
   * ID последнего загруженного проекта
   * @type {number|null}
   */
  const [lastLoadedProjectId, setLastLoadedProjectId] = useState<number | null>(null);

  /**
   * История действий пользователя
   * @type {ActionHistoryItem[]}
   */
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);

  /**
   * Callback для получения размеров узлов из Canvas
   *
   * @param {NodeSizeMap} nodeSizes - Размеры узлов
   */
  const handleNodeSizesChange = useCallback((nodeSizes: NodeSizeMap) => {
    setCurrentNodeSizes(nodeSizes);
  }, []);

  /**
   * Обработчик логирования действий в историю
   *
   * @param {string} type - Тип действия
   * @param {string} description - Описание действия
   */
  const handleActionLog = useCallback((type: string, description: string) => {
    console.log('📋 История действий:', type, '-', description);
    setActionHistory(prev => [createActionHistoryItem(type as ActionType, description), ...prev].slice(0, 50));
  }, []);

  /**
   * Функция переключения видимости шапки
   */
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

  /**
   * Функция переключения видимости сайдбара
   */
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

  /**
   * Функция переключения видимости панели свойств
   */
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

  /**
   * Функция переключения видимости холста
   */
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

  /**
   * Обработчик переключения видимости CodePanel
   * Управляет видимостью только CodePanel (левая панель с проектами)
   */
  const handleToggleCodePanel = useCallback(() => {
    setCodePanelVisible(prev => !prev);
  }, []);

  /**
   * Обработчик открытия панели кода (открывает обе панели - левую и центральную)
   */
  const handleOpenCodePanel = useCallback(() => {
    setCodePanelVisible(true);
    setCodeEditorVisible(true);
    // Скрываем панель свойств при открытии панелей кода
    handleToggleProperties();
    // На вкладке "Экспорт" скрываем canvas, чтобы codeEditor занял центр
    if (currentTab === 'export') {
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(el =>
          el.type === 'canvas' ? { ...el, visible: false } : el
        )
      }));
    }
  }, [currentTab]);

  /**
   * Обработчик закрытия панели кода
   */
  const handleCloseCodePanel = useCallback(() => {
    setCodePanelVisible(false);
    setCodeEditorVisible(false);
  }, []);


  /**
   * Обработчик открытия панели диалога
   *
   * @param {UserBotData} user - Пользователь, для которого открывается диалог
   */
  const handleOpenDialogPanel = useCallback((user: UserBotData) => {
    const isAlreadyOpen = selectedDialogUser && selectedDialogUser.id === user.id;

    if (isAlreadyOpen) {
      handleCloseDialogPanel();
    } else {
      setSelectedDialogUser(user);
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(element => {
          if (element.id === 'dialog') {
            return { ...element, visible: true };
          }
          if (element.id === 'properties') {
            return { ...element, visible: false };
          }
          return element;
        })
      }));
    }
  }, [selectedDialogUser]);

  /**
   * Обработчик закрытия панели диалога
   */
  const handleCloseDialogPanel = useCallback(() => {
    setSelectedDialogUser(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === 'dialog') {
          return { ...element, visible: false };
        }
        return element;
      })
    }));
  }, []);

  /**
   * Обработчик выбора пользователя в панели диалога
   * @param {UserBotData} user - Выбранный пользователь
   */
  const handleSelectDialogUser = useCallback((user: UserBotData) => {
    setSelectedDialogUser(user);
  }, []);

  /**
   * Обработчик открытия панели деталей пользователя
   *
   * @param {UserBotData} user - Пользователь, для которого открываются детали
   */
  const handleOpenUserDetailsPanel = useCallback((user: UserBotData) => {
    const isAlreadyOpen = selectedUserDetails && selectedUserDetails.id === user.id;

    if (isAlreadyOpen) {
      handleCloseUserDetailsPanel();
    } else {
      setSelectedUserDetails(user);
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(element => {
          if (element.id === 'userDetails') {
            return { ...element, visible: true };
          }
          if (element.id === 'sidebar') {
            return { ...element, visible: false };
          }
          return element;
        })
      }));
    }
  }, [selectedUserDetails]);

  /**
   * Обработчик закрытия панели деталей пользователя
   */
  const handleCloseUserDetailsPanel = useCallback(() => {
    setSelectedUserDetails(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === 'userDetails') {
          return { ...element, visible: false };
        }
        if (element.id === 'sidebar') {
          return { ...element, visible: true };
        }
        return element;
      })
    }));
  }, []);


  /**
   * Обработчик открытия мобильного сайдбара
   */
  const handleOpenMobileSidebar = useCallback(() => {
    setShowMobileSidebar(true);
  }, []);

  /**
   * Обработчик открытия мобильной панели свойств
   */
  const handleOpenMobileProperties = useCallback(() => {
    setShowMobileProperties(true);
  }, []);

  /**
   * Создает динамическую конфигурацию макета
   *
   * @returns {SimpleLayoutConfig} Конфигурация макета
   */
  const getFlexibleLayoutConfig = useCallback((): SimpleLayoutConfig => {
    // Используем компактный заголовок для всех устройств
    const headerSize = isMobile ? 2.5 : 3;
    // Скрываем боковую панель и свойства на вкладке "Бот" и "Пользователи"
    const isBotTab = currentTab === 'bot';
    const isUsersTab = currentTab === 'users';
    const hidePanels = isBotTab || isUsersTab;

    return {
      elements: [
        {
          id: 'header',
          type: 'header',
          name: 'Шапка',
          position: 'top',
          size: headerSize,
          visible: true
        },
        {
          id: 'sidebar',
          type: 'sidebar',
          name: 'Боковая панель',
          position: 'left',
          size: 20,
          visible: !hidePanels
        },
        {
          id: 'canvas',
          type: 'canvas',
          name: 'Холст',
          position: 'center',
          size: 35,
          visible: true
        },
        {
          id: 'properties',
          type: 'properties',
          name: 'Свойства',
          position: 'right',
          size: 20,
          visible: !hidePanels
        },
        {
          id: 'code',
          type: 'code',
          name: 'Код',
          position: 'left',
          size: 25,
          visible: false
        },
        {
          id: 'codeEditor',
          type: 'codeEditor',
          name: 'Редактор кода',
          position: 'center',
          size: 40,
          visible: false
        },
        {
          id: 'dialog',
          type: 'dialog',
          name: 'Диалог',
          position: 'right',
          size: 25,
          visible: isUsersTab
        },
        {
          id: 'userDetails',
          type: 'userDetails',
          name: 'Детали пользователя',
          position: 'left',
          size: 25,
          visible: isUsersTab
        },
        {
          id: 'fileExplorer',
          type: 'fileExplorer',
          name: 'Проводник файлов',
          position: 'left',
          size: 25,
          visible: false
        },
      ],
      compactMode: false,
      showGrid: true
    };
  }, [currentTab, isMobile]);

  const [flexibleLayoutConfig, setFlexibleLayoutConfig] = useState<SimpleLayoutConfig>(getFlexibleLayoutConfig());

  /**
   * Эффект для обновления конфигурации макета при изменении вкладки
   * Сбрасывает видимость элементов к значениям по умолчанию для новой вкладки
   */
  useEffect(() => {
    setFlexibleLayoutConfig(getFlexibleLayoutConfig());
  }, [currentTab, isMobile]);

  const { config: layoutConfig, updateConfig: updateLayoutConfig, resetConfig: resetLayoutConfig, applyConfig: applyLayoutConfig } = useLayoutManager();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Устанавливаем первого пользователя как выбранного для обеих панелей
      setSelectedUserDetails(firstUser);
      setSelectedDialogUser(firstUser);
    }
  }, [currentTab, users]);

  // Состояние для управления форматом кода
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('python');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const [showFullCode, setShowFullCode] = useState(false);

  // Ссылка на редактор Monaco для управления сворачиванием
  const editorRef = useRef<any>(null);

  // Состояние для управления видимостью редактора кода
  const [codeEditorVisible, setCodeEditorVisible] = useState(false);

  // Состояние для управления видимостью CodePanel
  const [codePanelVisible, setCodePanelVisible] = useState(false);

  /**
   * Обработчик переключения видимости редактора кода
   * Управляет видимостью только CodeEditorArea (панели с Monaco Editor)
   */
  const handleToggleCodeEditor = useCallback(() => {
    const isVisible = !codeEditorVisible;
    setCodeEditorVisible(isVisible);
    
    // Обновляем видимость элемента в конфигурации макета
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === 'codeEditor') {
          return { ...element, visible: isVisible };
        }
        return { ...element, visible: element.visible ?? true };
      })
    }));
  }, [codeEditorVisible]);

  // Использование хука генератора кода
  const { codeContent: generatedCodeContent, isLoading: isCodeLoading, loadContent, setCodeContent } = useCodeGenerator(
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
  const MAX_VISIBLE_LINES = 1000;

  // Отображаемый контент с учетом ограничения по количеству строк
  const displayContent = useMemo(() => {
    if (!showFullCode && lines.length > MAX_VISIBLE_LINES) {
      return lines.slice(0, MAX_VISIBLE_LINES).join('\n');
    }
    return content;
  }, [content, showFullCode]);

  // Статистика кода для отображения информации о структуре
  const codeStats = useMemo(() => {
    return {
      totalLines: lineCount,
      truncated: !showFullCode && lineCount > 1000,
      functions: (content.match(/^def |^async def /gm) || []).length,
      classes: (content.match(/^class /gm) || []).length,
      comments: (content.match(/^[^#]*#/gm) || []).length
    };
  }, [content, showFullCode]);

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

  // Обертка для обновления узлов, которая синхронизирует изменения с системой листов
  const handleNodeUpdateWithSheets = useCallback((nodeId: string, updates: any) => {
    // Находим узел для логирования
    const node = nodes.find(n => n.id === nodeId);
    const updatedFields = Object.keys(updates);

    // Миграция keyboardLayout если нужно
    if (updates.keyboardLayout || updates.buttons) {
      const currentLayout = updates.keyboardLayout || node?.data.keyboardLayout;
      const buttons = updates.buttons || node?.data.buttons || [];
      
      // 1. Создаём/получаем keyboardLayout
      updates.keyboardLayout = migrateKeyboardLayout(buttons, currentLayout);
      
      // 2. Исправляем autoLayout если он не соответствует раскладке
      updates.keyboardLayout = fixAutoLayout(updates.keyboardLayout, buttons.length);
    }

    // Логируем обновление
    if (node && handleActionLog) {
      logNodeUpdate({
        node,
        onActionLog: handleActionLog,
        updatedFields
      });
    }

    // Сохраняем в историю ДО изменений
    saveToHistory();

    // Обновляем в старой системе
    updateNodeData(nodeId, updates);

    // Также обновляем в новой системе листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, ...updates } }
                : node
            )
          };
        }
        return sheet;
      });

      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNodeData, botDataWithSheets, nodes, handleActionLog, saveToHistory]);

  // Обработчик смены типа узла
  const handleNodeTypeChange = useCallback((nodeId: string, newType: any, newData: any) => {
    // Находим узел для логирования
    const node = nodes.find(n => n.id === nodeId);
    const oldType = node?.type;
    
    // Логируем изменение типа
    if (node && oldType && handleActionLog) {
      logNodeTypeChange({
        node,
        oldType,
        newType,
        onActionLog: handleActionLog
      });
    }
    
    // Сохраняем в историю ДО изменений
    saveToHistory();
    
    // Обновляем в старой системе
    updateNode(nodeId, { type: newType, data: newData });

    // Также обновляем в новой системе листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node =>
              node.id === nodeId
                ? { ...node, type: newType, data: newData }
                : node
            )
          };
        }
        return sheet;
      });

      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNode, botDataWithSheets, nodes, handleActionLog, saveToHistory]);

  // Обработчик смены ID узла
  const handleNodeIdChange = useCallback((oldId: string, newId: string) => {
    // Находим узел для логирования
    const node = nodes.find(n => n.id === oldId);
    
    // Логируем изменение ID
    if (node && handleActionLog) {
      logNodeIdChange({
        node,
        oldId,
        newId,
        onActionLog: handleActionLog
      });
    }
    
    // Сохраняем в историю ДО изменений
    saveToHistory();
    
    if (!botDataWithSheets || !botDataWithSheets.activeSheetId) return;

    const updatedSheets = botDataWithSheets.sheets.map(sheet => {
      if (sheet.id === botDataWithSheets.activeSheetId) {
        return {
          ...sheet,
          nodes: sheet.nodes.map(node =>
            node.id === oldId
              ? { ...node, id: newId }
              : node
          )
        };
      }
      return sheet;
    });

    setBotDataWithSheets({
      ...botDataWithSheets,
      sheets: updatedSheets
    });

    if (selectedNodeId === oldId) {
      setSelectedNodeId(newId);
    }
  }, [botDataWithSheets, selectedNodeId, nodes, handleActionLog, saveToHistory]);

  // Синхронизация nodes → botDataWithSheets для undo/redo
  useEffect(() => {
    if (!botDataWithSheets || !botDataWithSheets.activeSheetId) return;
    
    console.log('🔄 Синхронизация nodes → botDataWithSheets:', {
      nodesCount: nodes.length,
      activeSheetId: botDataWithSheets.activeSheetId
    });
    
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
   * Обработчик изменения вкладки
   *
   * @param {EditorTab} tab - Выбранная вкладка
   */
  const handleTabChange = useCallback((tab: EditorTab) => {
    // Если нажали на ту же вкладку "Код" - ничего не делаем (чтобы панель не закрывалась)
    if (tab === 'export' && currentTab === 'export') {
      return;
    }

    // Сохраняем предыдущую вкладку (если не переключались на 'export')
    if (currentTab !== 'export' && tab !== 'export') {
      setPreviousTab(currentTab as PreviousEditorTab);
    }

    setCurrentTab(tab);
    if (tab === 'preview') {
      // Auto-save before showing preview
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
      // Navigate to preview page instead of showing modal
      setLocation(`/preview/${activeProject?.id}`);
      return;
    } else if (tab === 'export') {
      // Auto-save before showing export page и открываем панель кода
      if (activeProject?.id) {
        updateProjectMutation.mutate({}, {
          onSuccess: () => {
            // Открываем панель кода после успешного сохранения
            handleOpenCodePanel();
          }
        });
      } else {
        handleOpenCodePanel();
      }
    } else if ((currentTab as string) === 'export') {
      // Закрываем панель кода при переключении с вкладки экспорт
      handleCloseCodePanel();
      // Восстанавливаем видимость canvas
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(el =>
          el.type === 'canvas' ? { ...el, visible: true } : el
        )
      }));
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } else if (tab === 'bot') {
      // Auto-save before showing bot controls
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } else if (tab === 'users') {
      // Auto-save before showing users panel
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } else if (tab === 'user-ids') {
      // Auto-save before showing user IDs panel
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    }
  }, [updateProjectMutation, activeProject, setLocation, handleOpenCodePanel, handleCloseCodePanel, currentTab, previousTab, setPreviousTab]);

  // Функции управления листами
  /**
   * Обработчик добавления нового листа
   *
   * @param {string} name - Название нового листа
   */
  const handleSheetAdd = useCallback((name: string) => {
    if (!botDataWithSheets) return;

    try {
      // Логируем ДО изменений
      if (handleActionLog) {
        logSheetAdd({
          sheetName: name,
          onActionLog: handleActionLog
        });
      }
      
      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.addSheet(botDataWithSheets, name);
      setBotDataWithSheets(updatedData);

      // Переключаемся на новый лист
      const newSheet = SheetsManager.getActiveSheet(updatedData);
      if (newSheet) {
        // При добавлении нового листа всегда применяем автоиерархию
        const shouldSkipLayout = false; // Автоиерархия нужна для правильного расположения новых листов
        setBotData({ nodes: newSheet.nodes }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }

      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }

      toast({
        title: "Лист создан",
        description: `Лист "${name}" успешно создан`,
      });
    } catch (error) {
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, isMobile, nodes.length, currentNodeSizes, activeProject, handleActionLog, saveToHistory]);

  /**
   * Обработчик удаления листа
   *
   * @param {string} sheetId - ID удаляемого листа
   */
  const handleSheetDelete = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим лист для логирования
      const sheet = botDataWithSheets.sheets.find(s => s.id === sheetId);
      
      // Логируем ДО изменений
      if (sheet && handleActionLog) {
        logSheetDelete({
          sheetName: sheet.name,
          sheetId,
          onActionLog: handleActionLog
        });
      }
      
      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.deleteSheet(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);

      // Переключаемся на активный лист
      const activeSheet = SheetsManager.getActiveSheet(updatedData);
      if (activeSheet) {
        setBotData({ nodes: activeSheet.nodes }); // автоиерархия должна работать при переключении листов
      }

      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }

      toast({
        title: "Лист удален",
        description: "Лист успешно удален",
      });
    } catch (error) {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, activeProject, handleActionLog, saveToHistory, nodes]);

  /**
   * Обработчик переименования листа
   *
   * @param {string} sheetId - ID листа
   * @param {string} newName - Новое название листа
   */
  const handleSheetRename = useCallback((sheetId: string, newName: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим лист для логирования
      const sheet = botDataWithSheets.sheets.find(s => s.id === sheetId);
      
      // Логируем ДО изменений
      if (sheet && handleActionLog) {
        logSheetRename({
          sheetId,
          oldName: sheet.name,
          newName,
          onActionLog: handleActionLog
        });
      }
      
      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.renameSheet(botDataWithSheets, sheetId, newName);
      setBotDataWithSheets(updatedData);

      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }

      toast({
        title: "Лист переименован",
        description: `Лист переименован в "${newName}"`,
      });
    } catch (error) {
      toast({
        title: "Ошибка переименования",
        description: "Не удалось переименовать лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, updateProjectMutation, toast, activeProject, handleActionLog, saveToHistory, nodes]);

  /**
   * Обработчик дублирования листа
   *
   * @param {string} sheetId - ID листа для дублирования
   */
  const handleSheetDuplicate = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим оригинальный лист для логирования
      const originalSheet = botDataWithSheets.sheets.find(s => s.id === sheetId);
      
      // Логируем ДО изменений
      if (originalSheet && handleActionLog) {
        // Имя нового листа будет сгенерировано функцией duplicateSheetInProject
        // Поэтому логируем с placeholder
        logSheetDuplicate({
          originalName: originalSheet.name,
          newName: `${originalSheet.name} (копия)`,
          onActionLog: handleActionLog
        });
      }
      
      // Сохраняем в историю ДО изменений
      saveToHistory();

      const updatedData = SheetsManager.duplicateSheetInProject(botDataWithSheets, sheetId);
      setBotDataWithSheets(updatedData);

      // Переключаемся на дублированный лист
      const newSheet = SheetsManager.getActiveSheet(updatedData);
      if (newSheet) {
        // При дублировании листа всегда применяем автоиерархию
        const shouldSkipLayout = false; // Автоиерархия нужна для правильного расположения дублированных листов
        setBotData({ nodes: newSheet.nodes }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }

      // Сохраняем изменения (мутация сама позаботится об инвалидации кэша)
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }

      toast({
        title: "Лист дублирован",
        description: "Лист успешно дублирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка дублирования",
        description: "Не удалось дублировать лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, setBotData, updateProjectMutation, toast, activeProject, handleActionLog, saveToHistory, nodes, currentNodeSizes]);

  /**
   * Обработчик выбора листа
   *
   * @param {string} sheetId - ID выбираемого листа
   */
  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botDataWithSheets) return;

    try {
      // Находим текущий и новый листы для логирования
      const currentSheet = botDataWithSheets.sheets.find(s => s.id === botDataWithSheets.activeSheetId);
      const newSheet = botDataWithSheets.sheets.find(s => s.id === sheetId);
      
      // Логируем ДО изменений
      if (newSheet && handleActionLog) {
        logSheetSwitch({
          fromSheet: currentSheet?.name,
          toSheet: newSheet.name,
          onActionLog: handleActionLog
        });
      }
      
      // Сохраняем в историю ДО изменений
      saveToHistory();

      // Проверяем, существует ли лист с таким ID
      const sheetExists = botDataWithSheets.sheets.some(sheet => sheet.id === sheetId);
      if (!sheetExists) {
        console.warn(`Лист ${sheetId} не найден в проекте`);

        // Переключаемся на первый доступный лист
        if (botDataWithSheets.sheets.length > 0) {
          const firstAvailableSheet = botDataWithSheets.sheets[0];
          const updatedData = SheetsManager.setActiveSheet(botDataWithSheets, firstAvailableSheet.id);
          setBotDataWithSheets(updatedData);

          // Загружаем данные первого доступного листа
          const newActiveSheet = SheetsManager.getActiveSheet(updatedData);
          if (newActiveSheet) {
            const shouldSkipLayout = false;
            setBotData({ nodes: newActiveSheet.nodes }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
          }

          // Сохраняем и принудительно перезагружаем проект
          if (activeProject?.id) {
            updateProjectMutation.mutate({});
            // Принудительно перезагружаем данные проекта
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
              queryClient.refetchQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.refetchQueries({ queryKey: ['/api/projects'] });
            }, 100);
          }
        }

        toast({
          title: "Лист был удален",
          description: "Переключились на другой лист",
          variant: "destructive",
        });
        return;
      }

      // Сначала сохраняем текущие данные холста в активном листе
      const currentCanvasData = getBotData();
      const activeSheetId = botDataWithSheets.activeSheetId;
      const updatedSheets = botDataWithSheets.sheets.map(sheet =>
        sheet.id === activeSheetId
          ? { ...sheet, nodes: currentCanvasData.nodes, updatedAt: new Date() }
          : sheet
      );

      // Затем переключаемся на новый лист
      const updatedData = SheetsManager.setActiveSheet(
        { ...botDataWithSheets, sheets: updatedSheets },
        sheetId
      );
      setBotDataWithSheets(updatedData);

      // Загружаем данные нового активного листа на холст
      const newActiveSheet = SheetsManager.getActiveSheet(updatedData);
      if (newActiveSheet) {
        // При переключении листов применяем автоиерархию для лучшего отображения
        const shouldSkipLayout = false; // Автоиерархия нужна для правильного отображения
        setBotData({ nodes: newActiveSheet.nodes }, undefined, shouldSkipLayout ? undefined : currentNodeSizes, shouldSkipLayout);
      }

      // Сохраняем изменения
      if (activeProject?.id) {
        updateProjectMutation.mutate({});
      }
    } catch (error) {
      toast({
        title: "Ошибка переключения",
        description: "Не удалось переключиться на лист",
        variant: "destructive",
      });
    }
  }, [botDataWithSheets, getBotData, setBotData, updateProjectMutation, toast, isMobile, nodes.length, currentNodeSizes, activeProject, queryClient, handleActionLog, saveToHistory]);

  // Проверяем, есть ли выбранный шаблон при загрузке страницы
  useEffect(() => {
    const selectedTemplateData = localStorage.getItem('selectedTemplate');
    if (selectedTemplateData && activeProject) {
      try {
        setIsLoadingTemplate(true); // Устанавливаем флаг загрузки шаблона
        const template = JSON.parse(selectedTemplateData);
        console.log('Применяем сохраненный шаблон:', template.name);

        // Проверяем, есть ли в шаблоне многолистовая структура
        if (template.data.sheets && Array.isArray(template.data.sheets)) {
          console.log('Применяем многолистовой шаблон с листами:', template.data.sheets.length);

          // Создаем новые ID для листов шаблона
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
            // Всегда применяем автоиерархию при загрузке шаблонов для правильного расположения
            const shouldSkipLayout = false; // Автоиерархия необходима при загрузке многолистовых шаблонов
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
          // Обычный шаблон без листов - мигрируем к формату с листами
          console.log('Применяем обычный шаблон и мигрируем к формату с листами');
          const migratedData = SheetsManager.migrateLegacyData(template.data);
          setBotDataWithSheets(migratedData);
          // Всегда применяем автоиерархию при загрузке шаблонов для правильного расположения
          const shouldSkipLayout = false; // Автоиерархия необходима при загрузке обычных шаблонов
          setBotData(template.data, template.name, currentNodeSizes, shouldSkipLayout); // автоиерархия должна работать при загрузке шаблонов

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

        // Принудительно инвалидируем кеш проектов после применения шаблона
        // чтобы на странице "Проекты" отображалось правильное количество листов
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });

        toast({
          title: 'Шаблон применен',
          description: `Шаблон "${template.name}" успешно загружен`,
        });

        // Удаляем сохраненный шаблон
        localStorage.removeItem('selectedTemplate');

        // Небольшая задержка, чтобы дать время на сохранение, затем убираем флаг
        setTimeout(() => {
          setIsLoadingTemplate(false);
        }, 1000);
      } catch (error) {
        console.error('Ошибка применения сохраненного шаблона:', error);
        localStorage.removeItem('selectedTemplate');
        setIsLoadingTemplate(false); // Убираем флаг при ошибке
      }
    }
  }, [activeProject?.id, setBotData, setBotDataWithSheets, updateProjectMutation, toast, queryClient]);

  // Enhanced onNodeUpdate that auto-saves changes

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position });
    // Не сохраняем каждое перемещение - это будет слишком часто
    // Сохранение происходит только в конце перетаскивания
  }, [updateNode]);

  // Вызываем один раз в конце перетаскивания узла
  const handleNodeMoveEnd = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && handleActionLog) {
      handleActionLog('move_end', `Перемещён узел "${node.type}" (${node.id})`);
    }
    saveToHistory();
    console.log('🏁 Конец перемещения, сохранено в историю');
  }, [nodes, handleActionLog, saveToHistory]);

  // Обёртки для deleteNode и duplicateNode с логированием в историю
  const handleNodeDelete = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('delete', `Удален узел "${node?.type || 'Unknown'}"`);
    // Сохраняем в историю ДО изменений
    saveToHistory();
    _deleteNode(nodeId);
  }, [_deleteNode, nodes, handleActionLog, saveToHistory]);

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
    // Сохраняем в историю ДО изменений
    saveToHistory();
    _duplicateNode(nodeId);
  }, [_duplicateNode, nodes, handleActionLog, saveToHistory]);

  // Обёртки для кнопок с логированием
  const handleButtonAdd = useCallback((nodeId: string, button: Button) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && handleActionLog) {
      logButtonAdd({
        node,
        buttonText: button.text,
        onActionLog: handleActionLog
      });
    }
    // Сохраняем в историю ДО изменений
    saveToHistory();
    addButton(nodeId, button);
  }, [addButton, nodes, handleActionLog, saveToHistory]);

  const handleButtonUpdate = useCallback((nodeId: string, buttonId: string, updates: Partial<Button>) => {
    const node = nodes.find(n => n.id === nodeId);
    const updatedFields = Object.keys(updates);
    if (node && handleActionLog) {
      logButtonUpdate({
        node,
        buttonId,
        updatedFields,
        onActionLog: handleActionLog
      });
    }
    // Сохраняем в историю ДО изменений
    saveToHistory();
    updateButton(nodeId, buttonId, updates);
  }, [updateButton, nodes, handleActionLog, saveToHistory]);

  const handleButtonDelete = useCallback((nodeId: string, buttonId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const button = node?.data.buttons?.find(b => b.id === buttonId);
    if (node && handleActionLog) {
      logButtonDelete({
        node,
        buttonId,
        buttonText: button?.text,
        onActionLog: handleActionLog
      });
    }
    // Сохраняем в историю ДО изменений
    saveToHistory();
    deleteButton(nodeId, buttonId);
  }, [deleteButton, nodes, handleActionLog, saveToHistory]);

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
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 }, // Случайная позици�� с небольшим смещением
      data: component.defaultData || {}
    };

    // Логируем добавление в историю действий
    console.log('📝 Добавление узла:', component.type);
    handleActionLog('add', `Добавлен узел "${component.type}"`);

    // Сохраняем в историю ДО изменений
    saveToHistory();

    // Добавляем у��ел на холст
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
   * Обработчик открытия модального окна сохранения шаблона
   */
  const handleSaveAsTemplate = useCallback(() => {
    setShowSaveTemplate(true);
  }, []);

  /**
   * Обработчик загрузки шаблона
   *
   * Переходит на страницу шаблонов для выбора шаблона
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
  const propertiesContent = activeProject ? (
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
        ) : currentTab === 'export' ? null : null}
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
        />
      </div>
    ) : (
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
                  projectId={activeProject.id}
                  user={selectedUserDetails}
                  onClose={handleCloseUserDetailsPanel}
                  onOpenDialog={handleOpenDialogPanel}
                  onSelectUser={handleOpenUserDetailsPanel}
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
              onActionLog={handleActionLog}
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
              projectName={activeProject.name}
              currentTab={currentTab}
              onTabChange={handleTabChange}
              onExport={() => { }}
              onSaveAsTemplate={handleSaveAsTemplate}
              onLoadTemplate={handleLoadTemplate}
              onLayoutSettings={() => setShowLayoutManager(true)}
              onToggleCode={handleToggleCodePanel}
              onToggleCodeEditor={handleToggleCodeEditor}
              codeVisible={codePanelVisible}
              codeEditorVisible={codeEditorVisible}
              onOpenMobileSidebar={() => setShowMobileSidebar(true)}
              onOpenMobileProperties={() => setShowMobileProperties(true)}
            />
          }
          sidebarContent={
            <ComponentsSidebar
              onComponentDrag={handleComponentDrag}
              onComponentAdd={handleComponentAdd}
              onLayoutChange={updateLayoutConfig}
              activeSheetId={botDataWithSheets?.activeSheetId}
              headerContent={
                <AdaptiveHeader
                  config={layoutConfig}
                  projectName={activeProject.name}
                  currentTab={currentTab}
                  onTabChange={handleTabChange}
                  onExport={() => { }}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onLoadTemplate={handleLoadTemplate}
                  onLayoutSettings={() => setShowLayoutManager(true)}
                  onToggleCode={handleToggleCodePanel}
                  onToggleCodeEditor={handleToggleCodeEditor}
                  codeVisible={flexibleLayoutConfig.elements.find(el => el.id === 'code')?.visible ?? false}
                  codeEditorVisible={codeEditorVisible}
                  onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                  onOpenMobileProperties={() => setShowMobileProperties(true)}
                />
              }
              sidebarContent={<div>Sidebar</div>}
              canvasContent={
                <div className="h-full">
                  {currentTab === 'editor' ? (
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
                      onNodeDuplicate={handleNodeDuplicate}
                      onNodeMove={handleNodeMove}
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
                      headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
                      sidebarVisible={flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true}
                      propertiesVisible={flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true}
                      onActionLog={handleActionLog}
                      actionHistory={actionHistory}
                    />
                  ) : null}
                </div>
              }
              propertiesContent={
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
                  onActionLog={handleActionLog}
                />
              }
              onSheetAdd={handleSheetAdd}
              onSheetDelete={handleSheetDelete}
              onSheetRename={handleSheetRename}
              onSheetDuplicate={handleSheetDuplicate}
              onSheetSelect={handleSheetSelect}
              isMobile={isMobile}
              onClose={handleToggleSidebar}
            />
          }
          canvasContent={
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
                  onNodeMoveEnd={handleNodeMoveEnd}
                  onNodesUpdate={updateNodes}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onSave={() => updateProjectMutation.mutate({})}
                  isSaving={updateProjectMutation.isPending}
                  isNodeBeingDragged={isNodeBeingDragged}
                  setIsNodeBeingDragged={setIsNodeBeingDragged}
                  onToggleHeader={handleToggleHeader}
                  onToggleSidebar={handleToggleSidebar}
                  onToggleProperties={handleToggleProperties}
                  headerVisible={flexibleLayoutConfig.elements.find(el => el.id === 'header')?.visible ?? true}
                  sidebarVisible={(() => {
                    const calculated = !isMobile && (flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible ?? true);
                    console.log('🔧 SIDEBAR VISIBLE CALC:', { isMobile, flexSidebarVisible: flexibleLayoutConfig.elements.find(el => el.id === 'sidebar')?.visible, calculated });
                    return calculated;
                  })()}
                  propertiesVisible={(() => {
                    const calculated = !isMobile && (flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible ?? true);
                    console.log('🔧 PROPERTIES VISIBLE CALC:', { isMobile, flexPropertiesVisible: flexibleLayoutConfig.elements.find(el => el.id === 'properties')?.visible, calculated });
                    return calculated;
                  })()}
                  onOpenMobileSidebar={handleOpenMobileSidebar}
                  onOpenMobileProperties={handleOpenMobileProperties}
                  onActionLog={handleActionLog}
                  actionHistory={actionHistory}
                />
              ) : null}
            </div>
          }
          propertiesContent={
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
              onActionLog={handleActionLog}
            />
          }
          onLayoutChange={(_elements) => {
            // Layout changed
            // Здесь можно обновить конфигурацию макета
          }}
        />
      )}



      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        botData={(botDataWithSheets || getBotData()) as any}
        projectName={activeProject.name}
      />


      {/* Мобильный sidebar */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
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
      <Sheet open={showMobileProperties} onOpenChange={setShowMobileProperties}>
        <SheetContent
          side="right"
          className="p-0 w-full max-w-full sm:w-96 sm:max-w-md"
        >
          <SheetHeader className="px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <SheetTitle className="text-lg font-semibold">Свойства элемента</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-60px)] overflow-auto pb-safe">
            {propertiesContent}
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}
