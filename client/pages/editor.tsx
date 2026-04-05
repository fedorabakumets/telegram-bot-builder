/**
 * @fileoverview Компонент редактора бота (новая версия)
 *
 * Основной компонент редактора, построенный на основе хуков и компонентов.
 * Использует FlexibleLayoutView и SidebarContent для рендера интерфейса.
 *
 * @module Editor
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';

import { Canvas } from '@/components/editor/canvas/canvas/canvas';
import { PropertiesPanel } from '@/components/editor/properties/components/main/properties-panel';
import { BotLayout } from '@/components/editor/bot/panel/BotLayout';
import { GroupsPanel } from '@/components/editor/groups/groups-panel';
import { UserDatabasePanel } from '@/components/editor/database/user-database/user-database-panel';
import { UserIdsDatabase } from '@/components/editor/user-ids-db';
import { TelegramClientConfig } from '@/components/editor/telegram-client';
import { AdaptiveHeader } from '@/components/editor/header/adaptive-header';
import { LayoutManager, useLayoutManager } from '@/components/layout/layout-manager';
import { SaveTemplateModal } from '@/components/editor/header/components/save-template-modal';
import { MobilePropertiesSheet } from '@/pages/editor/components/mobile/mobile-properties-sheet';
import { ReadmePreview } from '@/components/editor/code/readme';
import { CodeEditorArea } from '@/components/editor/code/editor';
import { ProjectNotFound } from '@/components/editor/project-not-found';
import { useCodeGenerator as useCodeGeneratorServer } from '@/components/editor/code/hooks';
import type { CodeFormat } from '@/components/editor/code/hooks';
import { useBotEditor } from '@/components/editor/canvas/canvas/use-bot-editor';
import { useMoveNodeToSheet } from '@/components/editor/canvas/canvas/use-move-node-to-sheet';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { clearKeyboardNodeId, getKeyboardNodeId } from '@/components/editor/canvas/canvas-node/keyboard-connection';
import { applyTemplateLayout } from '@/utils/hierarchical-layout';
import { generateButtonId } from '@/utils/generate-button-id';
import { migrateAllKeyboardLayouts } from './editor/utils/keyboard-migration';
import { createActionHistoryItem } from './editor/utils/action-logger';
import type { ActionType, ActionHistoryItem, EditorTab, PreviousEditorTab } from './editor/types';

import {
  useSheetHandlers, useEditorUIStates, useSheetStates, useCodeStates,
  useMobileHandlers, useCodePanelHandlers, useDialogHandlers,
  useApplyTemplate, useNodesSync, useNodeFocus,
} from '@/pages/editor/hooks';
import { useProjectLoader } from './editor/hooks/use-project-loader';
import { useTabNavigation } from './editor/hooks/use-tab-navigation';
import { useLayoutManager as useFlexibleLayoutManager } from './editor/hooks/use-layout-management';
import { useNodeHandlers } from './editor/hooks/use-node-handlers';
import { useButtonHandlers } from './editor/hooks/use-button-handlers';
import { FlexibleLayoutView, SidebarContent } from './editor/components';

import type { BotData, BotDataWithSheets, BotProject, UserBotData } from '@shared/schema';
import type { ComponentDefinition, Node } from '@shared/schema';

/**
 * Компонент редактора бота
 *
 * @returns JSX элемент редактора
 */
export default function Editor() {
  const [location, setLocation] = useLocation();

  /** ID проекта из URL */
  const projectId = useMemo(() => {
    const match = location.match(/^\/editor\/(\d+)/) || location.match(/^\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }, [location]);

  const [currentTab, setCurrentTab] = useState<EditorTab>('editor');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [editedJsonContent, setEditedJsonContent] = useState('');
  /** Флаг программного сброса редактора — игнорируем onChange во время setValue */
  const isResettingEditorRef = useRef(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Состояния ---
  const {
    isLoadingTemplate, showLayoutManager, showMobileProperties, showMobileSidebar,
    setIsLoadingTemplate, setShowLayoutManager, setShowMobileProperties, setShowMobileSidebar,
  } = useEditorUIStates();

  const {
    botDataWithSheets, currentNodeSizes, actionHistory, lastLoadedProjectId, hasLocalChanges,
    setBotDataWithSheets, setCurrentNodeSizes, setActionHistory, setLastLoadedProjectId, setHasLocalChanges,
  } = useSheetStates();

  const {
    selectedFormat, theme, areAllCollapsed, showFullCode, codeEditorVisible, codePanelVisible,
    editorRef, setSelectedFormat, setTheme, setAreAllCollapsed, setShowFullCode,
    setCodeEditorVisible, setCodePanelVisible,
  } = useCodeStates();

  // --- Макет ---
  const {
    flexibleLayoutConfig, setFlexibleLayoutConfig,
    handleToggleHeader, handleToggleSidebar, handleToggleProperties, handleToggleCanvas,
  } = useFlexibleLayoutManager(isMobile, currentTab);

  const { config: layoutConfig, updateConfig: updateLayoutConfig, resetConfig: resetLayoutConfig, applyConfig: applyLayoutConfig } = useLayoutManager();

  // --- Диалоги ---
  const {
    selectedDialogUser, selectedUserDetails,
    handleOpenDialogPanel, handleCloseDialogPanel,
    handleOpenUserDetailsPanel, handleCloseUserDetailsPanel,
    setSelectedDialogUser, setSelectedUserDetails,
  } = useDialogHandlers({ setFlexibleLayoutConfig });

  // --- Фокус узла ---
  const { focusNodeId, highlightNodeId, focusButtonId, setHighlightNodeId, handleNodeFocus } = useNodeFocus();

  // --- Мобильные обработчики ---
  const { handleOpenMobileSidebar, handleOpenMobileProperties } = useMobileHandlers({ setShowMobileSidebar, setShowMobileProperties });

  // --- Панель кода ---
  const { handleToggleCodePanel, handleOpenCodePanel, handleCloseCodePanel, handleToggleCodeEditor } = useCodePanelHandlers({
    setCodePanelVisible, setCodeEditorVisible, currentTab, setFlexibleLayoutConfig, codeEditorVisible,
  });

  // --- Загрузка проекта ---
  const { currentProject, firstProject, isProjectNotFound: projectNotFound } = useProjectLoader({ projectId });
  const activeProject = projectId ? currentProject : firstProject;

  /** Ref для доступа к getBotData внутри мутации (объявляется до useBotEditor) */
  const getBotDataRef = useRef<() => { nodes: Node[] }>(() => ({ nodes: [] }));

  // --- Мутация сохранения (инлайн — нужен newName) ---
  /**
   * Мутация обновления проекта на сервере.
   * Поддерживает параметр newName для переименования при применении сценария.
   */
  const updateProjectMutation = useMutation({
    mutationFn: async (params: { restartOnUpdate?: boolean; newName?: string } = {}) => {
      if (!activeProject?.id) return;
      let projectData: BotDataWithSheets | BotData;
      if (botDataWithSheets) {
        const currentCanvasData = getBotDataRef.current();
        const activeSheetId = botDataWithSheets.activeSheetId;
        projectData = {
          ...botDataWithSheets,
          sheets: botDataWithSheets.sheets.map(sheet =>
            sheet.id === activeSheetId ? { ...sheet, nodes: currentCanvasData.nodes, updatedAt: new Date() } : sheet
          ),
        };
      } else {
        projectData = getBotDataRef.current();
      }
      return apiRequest('PUT', `/api/projects/${activeProject.id}`, {
        data: projectData,
        restartOnUpdate: params.restartOnUpdate || false,
        ...(params.newName ? { name: params.newName } : {}),
      });
    },
    onMutate: async (_variables) => {
      if (!activeProject?.id) return;
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${activeProject.id}`] });
      await queryClient.cancelQueries({ queryKey: ['/api/projects/list'] });
      const previousProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
      const previousProject = queryClient.getQueryData<BotProject>([`/api/projects/${activeProject.id}`]);
      const previousList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);
      const optimisticProjectData = botDataWithSheets || activeProject.data;
      const optimisticProject: BotProject = {
        ...activeProject,
        name: _variables?.newName ?? activeProject.name,
        data: optimisticProjectData,
        updatedAt: new Date(),
      };
      queryClient.setQueryData<BotProject>([`/api/projects/${activeProject.id}`], optimisticProject);
      if (previousProjects) {
        queryClient.setQueryData<BotProject[]>(['/api/projects'], previousProjects.map(p => p.id === activeProject.id ? optimisticProject : p));
      }
      if (previousList) {
        queryClient.setQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list'], previousList.map(p => p.id === activeProject.id ? { ...p, updatedAt: optimisticProject.updatedAt } : p));
      }
      return { previousProjects, previousProject, previousList };
    },
    onSuccess: async () => {
      setHasLocalChanges(false);
      if (activeProject?.id) {
        await queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProject.id}`], exact: true });
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProjects) queryClient.setQueryData(['/api/projects'], context.previousProjects);
      if (context?.previousProject && activeProject?.id) queryClient.setQueryData([`/api/projects/${activeProject.id}`], context.previousProject);
      if (context?.previousList) queryClient.setQueryData(['/api/projects/list'], context.previousList);
      toast({ title: 'Ошибка сохранения', description: 'Не удалось сохранить проект', variant: 'destructive' as any });
    },
  });

  // --- useBotEditor ---
  const {
    nodes, selectedNodeId, setSelectedNodeId,
    addNode, updateNode, updateNodeData, duplicateNode: _duplicateNode,
    addButton, updateButton, deleteButton, updateNodes,
    setBotData, getBotData, undo, redo, canUndo, canRedo,
    copyToClipboard, pasteFromClipboard, hasClipboardData,
    isNodeBeingDragged, setIsNodeBeingDragged, saveToHistory,
  } = useBotEditor();

  // Обновляем ref после получения getBotData
  getBotDataRef.current = getBotData;

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  /**
   * Обёртка над setSelectedNodeId — сбрасывает highlight при клике на пустое место
   * @param nodeId - ID выбранного узла или '' если кликнули на пустое место
   */
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) setHighlightNodeId(null);
  }, [setSelectedNodeId, setHighlightNodeId]);

  /** Логирование действий в историю */
  const handleActionLog = useCallback((type: string, description: string) => {
    setActionHistory((prev: ActionHistoryItem[]) =>
      [createActionHistoryItem(type as ActionType, description), ...prev].slice(0, 50)
    );
  }, [setActionHistory]);

  /** Callback для получения размеров узлов */
  const handleNodeSizesChange = useCallback((sizes: Map<string, { width: number; height: number }>) => {
    setCurrentNodeSizes(sizes);
  }, [setCurrentNodeSizes]);

  // --- Синхронизация nodes → botDataWithSheets ---
  useNodesSync({ nodes, botDataWithSheets, setBotDataWithSheets });

  // --- Применение сценария из localStorage ---
  useApplyTemplate({
    activeProject, botDataWithSheets, setBotDataWithSheets, setBotData,
    currentNodeSizes, setIsLoadingTemplate, setFitTrigger,
    updateProjectMutation, queryClient,
    toast: (opts) => toast(opts as any),
  });

  // --- Обработчики узлов ---
  const { handleNodeUpdateWithSheets, handleNodeTypeChange, handleNodeIdChange, handleNodeMove, handleNodeMoveStart, handleNodeMoveEnd } = useNodeHandlers({
    nodes, updateNode, updateNodeData, onActionLog: handleActionLog,
    saveToHistory, botDataWithSheets, setBotDataWithSheets, selectedNodeId, setSelectedNodeId,
  });

  // --- Обработчики кнопок ---
  const { handleButtonAdd, handleButtonUpdate, handleButtonDelete } = useButtonHandlers({
    nodes, addButton, updateButton, deleteButton, onActionLog: handleActionLog, saveToHistory,
  });

  // --- Обработчики листов ---
  const { handleSheetAdd, handleSheetDelete, handleSheetRename, handleSheetDuplicate, handleSheetSelect } = useSheetHandlers({
    botDataWithSheets, setBotDataWithSheets, setBotData, getBotData,
    handleActionLog, saveToHistory, updateProjectMutation, toast, queryClient,
    currentNodeSizes, nodes, activeProjectId: activeProject?.id || null,
    onAfterSelect: () => setFitTrigger(t => t + 1),
  });

  // --- Перемещение узла между листами ---
  const { moveNodeToSheet } = useMoveNodeToSheet(botDataWithSheets || undefined, handleBotDataUpdate);

  // --- Генератор кода ---
  const { codeContent: generatedCodeContent, isLoading: isCodeLoading, loadContent, setCodeContent } = useCodeGeneratorServer({
    botData: (botDataWithSheets ?? activeProject?.data) as BotData || { nodes: [] },
    projectName: activeProject?.name || 'project',
    userDatabaseEnabled: activeProject?.userDatabaseEnabled === 1,
    projectId: activeProject?.id || null,
    mode: 'server',
  });

  // --- Загрузка пользователей ---
  const { data: users = [] } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${activeProject?.id}/users`],
    enabled: !!activeProject?.id && currentTab === 'users',
    staleTime: 0, gcTime: 0,
  });

  // --- Загрузка всех проектов для CodePanel ---
  const { data: allProjects = [] } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    staleTime: 30000,
  });

  // --- Навигация по вкладкам ---
  const [, setPreviousTab] = useState<PreviousEditorTab>('editor');

  /**
   * Восстанавливает видимость canvas и основных элементов
   */
  const handleRestoreCanvas = useCallback(() => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.type === 'canvas') return el.visible ? el : { ...el, visible: true };
        if (el.id === 'sidebar') return el.visible ? el : { ...el, visible: true };
        if (el.id === 'properties') {
          const next = !!selectedNodeId;
          return el.visible === next ? el : { ...el, visible: next };
        }
        return el;
      }),
    }));
  }, [setFlexibleLayoutConfig, selectedNodeId]);

  const { handleTabChange } = useTabNavigation({
    currentTab, setCurrentTab, setPreviousTab,
    onSaveProject: () => activeProject?.id && updateProjectMutation.mutate({}),
    onOpenCodePanel: handleOpenCodePanel,
    onCloseCodePanel: handleCloseCodePanel,
    onRestoreCanvas: handleRestoreCanvas,
    setLocation,
    projectId: activeProject?.id || null,
  });

  // --- Инлайн обработчики ---

  /**
   * Синхронизирует активный лист с холстом при обновлении данных
   * @param updatedData - Обновлённые данные бота с листами
   */
  function handleBotDataUpdate(updatedData: BotDataWithSheets) {
    const activeSheet = SheetsManager.getActiveSheet(updatedData);
    if (activeSheet) {
      const migratedNodes = setBotData({ nodes: activeSheet.nodes }, undefined, currentNodeSizes, true);
      if (migratedNodes && migratedNodes.length !== activeSheet.nodes.length) {
        setBotDataWithSheets({
          ...updatedData,
          sheets: updatedData.sheets.map(s =>
            s.id === activeSheet.id ? { ...s, nodes: migratedNodes } : s
          ),
        });
      } else {
        setBotDataWithSheets(updatedData);
      }
    } else {
      setBotDataWithSheets(updatedData);
    }
  }

  /**
   * Применяет отредактированный JSON к данным бота
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
        handleBotDataUpdate({
          ...current,
          sheets: current.sheets.map((s, i) => i === 0 ? { ...s, nodes: (parsed as BotData).nodes } : s),
        });
      }
      setEditedJsonContent('');
    } catch { /* игнорируем ошибки парсинга */ }
  }, [botDataWithSheets]);

  /**
   * Удаляет узел с сохранением в историю
   * @param nodeId - ID удаляемого узла
   */
  const handleNodeDelete = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('delete', `Удален узел "${node?.type || 'Unknown'}"`);
    saveToHistory();
    const updated = nodes
      .map(n => getKeyboardNodeId(n.data) === nodeId ? { ...n, data: clearKeyboardNodeId(n.data) } : n)
      .filter(n => n.id !== nodeId);
    updateNodes(updated);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [nodes, handleActionLog, saveToHistory, updateNodes, selectedNodeId, setSelectedNodeId]);

  /**
   * Удаляет соединение между узлами
   * @param fromId - ID исходного узла
   * @param toId - ID целевого узла
   * @param type - Тип соединения
   */
  const handleConnectionDelete = useCallback((fromId: string, toId: string, type: string) => {
    saveToHistory();
    const updated = nodes.map(n => {
      const data = { ...n.data };
      if (n.id === fromId) {
        if (type === 'trigger-next') { delete data.autoTransitionTo; }
        else if (type === 'auto-transition') { data.enableAutoTransition = false; delete data.autoTransitionTo; }
        else if (type === 'button-goto') {
          data.buttons = ((data.buttons as any[]) ?? []).map((btn: any) =>
            btn.action === 'goto' && btn.target === toId ? { ...btn, target: undefined } : btn
          );
          data.branches = ((data.branches as any[]) ?? []).map((b: any) =>
            b.target === toId ? { ...b, target: undefined } : b
          );
        } else if (type === 'input-target') { delete data.inputTargetNodeId; }
        else if (type === 'keyboard-link') { return { ...n, data: clearKeyboardNodeId(data) }; }
        return { ...n, data };
      }
      if (n.id === toId && type === 'condition-source') {
        delete (data as any).sourceNodeId;
        return { ...n, data };
      }
      if (n.id === toId && type === 'forward-source' && n.type === 'forward_message') {
        delete (data as any).sourceMessageId;
        delete (data as any).sourceMessageVariableName;
        delete (data as any).sourceMessageNodeId;
        (data as any).sourceMessageIdSource = 'current_message';
        return { ...n, data };
      }
      return n;
    });
    updateNodes(updated);
    handleActionLog('disconnect', 'Удалено соединение');
  }, [nodes, updateNodes, saveToHistory, handleActionLog]);

  /**
   * Дублирует узел с логированием
   * @param nodeId - ID дублируемого узла
   * @param targetPosition - Целевая позиция (опционально)
   */
  const handleNodeDuplicate = useCallback((nodeId: string, targetPosition?: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === nodeId);
    handleActionLog('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
    saveToHistory();
    _duplicateNode(nodeId, targetPosition);
  }, [_duplicateNode, nodes, handleActionLog, saveToHistory]);

  /**
   * Выполняет автоматическую иерархическую расстановку узлов
   */
  const handleAutoLayout = useCallback(() => {
    const newNodes = applyTemplateLayout(getBotData().nodes, [], undefined, currentNodeSizes);
    saveToHistory();
    handleActionLog('update', 'Авто-расстановка узлов');
    updateNodes(newNodes);
  }, [getBotData, currentNodeSizes, saveToHistory, handleActionLog, updateNodes]);

  /** Обработчик перетаскивания компонента (заглушка) */
  const handleComponentDrag = useCallback((_component: ComponentDefinition) => {}, []);

  /**
   * Добавляет новый компонент на холст
   * @param component - Определение компонента
   */
  const handleComponentAdd = useCallback((component: ComponentDefinition) => {
    if (isLoadingTemplate) return;
    setHasLocalChanges(true);
    const clonedData = structuredClone(component.defaultData || {});
    if (Array.isArray((clonedData as any).buttons)) {
      (clonedData as any).buttons = (clonedData as any).buttons.map((btn: any) => ({ ...btn, id: generateButtonId() }));
    }
    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: clonedData,
    };
    handleActionLog('add', `Добавлен узел "${component.type}"`);
    saveToHistory();
    addNode(newNode);
    setTimeout(() => { if (activeProject?.id) updateProjectMutation.mutate({}); }, 1000);
  }, [addNode, isLoadingTemplate, updateProjectMutation, activeProject, handleActionLog, saveToHistory]);

  /** Явное сохранение проекта */
  const handleSaveProject = useCallback(() => {
    if (activeProject?.id) updateProjectMutation.mutate({});
  }, [activeProject?.id, updateProjectMutation]);

  /** Открывает модальное окно сохранения сценария */
  const handleSaveAsTemplate = useCallback(() => setShowSaveTemplate(true), []);

  /** Переходит на страницу сценариев */
  const handleLoadTemplate = useCallback(() => setLocation('/templates'), [setLocation]);

  /** Переходит к списку проектов */
  const handleGoToProjects = useCallback(() => setLocation('/projects'), [setLocation]);

  /**
   * Выбирает проект по ID
   * @param newProjectId - ID проекта
   */
  const handleProjectSelect = useCallback((newProjectId: number) => {
    setLocation(`/editor/${newProjectId}`);
  }, [setLocation]);

  /**
   * Обработчик смены формата кода
   * @param format - Новый формат
   */
  const handleFormatChange = useCallback((format: CodeFormat) => {
    setSelectedFormat(format);
    setEditedJsonContent('');
  }, [setSelectedFormat]);

  // --- useEffect: тема ---
  useEffect(() => {
    const check = () => setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [setTheme]);

  // --- useEffect: загрузка кода ---
  useEffect(() => { loadContent(selectedFormat); }, [selectedFormat, loadContent]);

  useEffect(() => {
    if (codePanelVisible || codeEditorVisible) loadContent(selectedFormat);
  }, [codePanelVisible, codeEditorVisible]);

  // --- useEffect: обновление данных при смене проекта ---
  useEffect(() => {
    if (activeProject?.data && !isLoadingTemplate && !hasLocalChanges && lastLoadedProjectId !== activeProject.id) {
      const projectData = activeProject.data as any;
      let sheetsData: BotDataWithSheets = SheetsManager.isNewFormat(projectData)
        ? projectData
        : SheetsManager.migrateLegacyData(projectData as BotData);
      if (!SheetsManager.isNewFormat(projectData)) updateProjectMutation.mutate({});
      sheetsData = { ...sheetsData, sheets: migrateAllKeyboardLayouts(sheetsData.sheets) };
      setBotDataWithSheets(sheetsData);
      const activeSheet = SheetsManager.getActiveSheet(sheetsData);
      if (activeSheet) setBotData({ nodes: activeSheet.nodes }, undefined, undefined, true);
      setLastLoadedProjectId(activeProject.id);
      localStorage.setItem('lastProjectId', activeProject.id.toString());
    }
  }, [activeProject?.id, isLoadingTemplate, hasLocalChanges, lastLoadedProjectId]);

  // --- useEffect: сброс hasLocalChanges при смене проекта ---
  useEffect(() => {
    if (activeProject?.id !== lastLoadedProjectId && lastLoadedProjectId !== null) {
      setHasLocalChanges(false);
    }
  }, [activeProject?.id, lastLoadedProjectId]);

  // --- useLayoutEffect: панель свойств ---
  useLayoutEffect(() => {
    if (currentTab !== 'editor') return;
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id !== 'properties') return el;
        const next = !!selectedNodeId;
        return el.visible === next ? el : { ...el, visible: next };
      }),
    }));
  }, [selectedNodeId, currentTab, setFlexibleLayoutConfig]);

  // --- useEffect: первый пользователь ---
  useEffect(() => {
    if (currentTab === 'users' && users.length > 0) {
      const first = users[0];
      setSelectedUserDetails(first);
      setSelectedDialogUser(first);
    }
  }, [currentTab, users]);

  // --- useEffect: сброс Monaco при сбросе editedJsonContent ---
  useEffect(() => {
    if (editedJsonContent === '' && selectedFormat === 'json' && editorRef.current) {
      isResettingEditorRef.current = true;
      editorRef.current.setValue(displayContent);
      setTimeout(() => { isResettingEditorRef.current = false; }, 0);
    }
  }, [editedJsonContent, selectedFormat]);

  // --- Вычисляемые значения ---
  const content = generatedCodeContent[selectedFormat] || '';
  const displayContent = useMemo(() => content, [content]);

  const codeStats = useMemo(() => {
    const lines = displayContent.split('\n');
    return {
      totalLines: lines.length,
      truncated: false,
      functions: (displayContent.match(/^def |^async def /gm) || []).length,
      classes: (displayContent.match(/^class /gm) || []).length,
      comments: (displayContent.match(/^[^#]*#/gm) || []).length,
    };
  }, [displayContent]);

  const getVisible = (id: string) =>
    flexibleLayoutConfig.elements.find(el => el.id === id)?.visible ?? true;

  // --- Ранний возврат ---
  if (projectNotFound) return <ProjectNotFound />;

  if (!activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-gray-400 text-xl" />
          </div>
          <p className="text-gray-600">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  // --- Контент заголовка ---
  const headerContent = (
    <AdaptiveHeader
      config={layoutConfig}
      projectName={activeProject.name}
      currentTab={currentTab}
      onTabChange={handleTabChange}
      onExport={() => {}}
      onSaveAsTemplate={handleSaveAsTemplate}
      onLoadTemplate={handleLoadTemplate}
      onLayoutSettings={() => setShowLayoutManager(true)}
      onToggleHeader={handleToggleHeader}
      onToggleSidebar={handleToggleSidebar}
      onToggleProperties={handleToggleProperties}
      onToggleCanvas={handleToggleCanvas}
      onToggleCode={handleToggleCodePanel}
      onToggleCodeEditor={handleToggleCodeEditor}
      headerVisible={getVisible('header')}
      sidebarVisible={getVisible('sidebar')}
      propertiesVisible={getVisible('properties')}
      canvasVisible={getVisible('canvas')}
      codeVisible={codePanelVisible}
      codeEditorVisible={codeEditorVisible}
      onOpenMobileSidebar={() => setShowMobileSidebar(true)}
      onOpenMobileProperties={() => setShowMobileProperties(true)}
    />
  );

  // --- Контент canvas ---
  const canvasContent = codeEditorVisible ? (
    <div className="h-full flex flex-col">
      {selectedFormat === 'readme' ? (
        <ReadmePreview
          markdownContent={displayContent}
          theme={theme}
          onContentChange={(c) => setCodeContent(prev => ({ ...prev, readme: c }))}
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
          onContentChange={(v) => { if (!isResettingEditorRef.current) setEditedJsonContent(v); }}
        />
      )}
    </div>
  ) : (
    <div className="h-full">
      {currentTab === 'groups' ? (
        <GroupsPanel projectId={activeProject.id} projectName={activeProject.name} />
      ) : currentTab === 'editor' ? (
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
          headerVisible={getVisible('header')}
          sidebarVisible={getVisible('sidebar')}
          propertiesVisible={getVisible('properties')}
          canvasVisible={getVisible('canvas')}
          onOpenMobileSidebar={handleOpenMobileSidebar}
          onOpenMobileProperties={handleOpenMobileProperties}
          onNodeSizesChange={handleNodeSizesChange}
          onActionLog={handleActionLog}
          actionHistory={actionHistory}
          onActionHistoryRemove={(ids) => setActionHistory((prev: ActionHistoryItem[]) => prev.filter(a => !ids.has(a.id)))}
          onConnectionDelete={handleConnectionDelete}
          onConnectionCreate={saveToHistory}
          autoFitOnLoad
          fitTrigger={fitTrigger}
          focusNodeId={focusNodeId}
          highlightNodeId={highlightNodeId}
          onMoveNodeToSheet={moveNodeToSheet}
          onAutoLayout={handleAutoLayout}
        />
      ) : currentTab === 'bot' ? (
        <div className="h-full">
          <BotLayout projectId={activeProject.id} projectName={activeProject.name} />
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
          <div className="max-w-3xl mx-auto"><TelegramClientConfig /></div>
        </div>
      ) : currentTab === 'export' ? (
        <div className="h-full bg-background" />
      ) : null}
    </div>
  );

  // --- Контент свойств ---
  const propertiesContent = currentTab === 'editor' ? (
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

  // --- Контент панели кода ---
  const codePanelContent = activeProject ? (
    <div className="h-full border-r bg-background">
      {/* Используется внутри SidebarContent */}
    </div>
  ) : null;

  // --- Контент сайдбара ---
  const sidebarContent = (
    <SidebarContent
      codePanelVisible={codePanelVisible}
      currentTab={currentTab}
      allProjects={allProjects}
      activeProject={activeProject}
      flexibleLayoutConfig={flexibleLayoutConfig}
      setFlexibleLayoutConfig={setFlexibleLayoutConfig}
      selectedFormat={selectedFormat}
      onFormatChange={handleFormatChange}
      areAllCollapsed={areAllCollapsed}
      setAreAllCollapsed={setAreAllCollapsed}
      showFullCode={showFullCode}
      setShowFullCode={setShowFullCode}
      generatedCodeContent={generatedCodeContent}
      isCodeLoading={isCodeLoading}
      displayContent={displayContent}
      onApplyJson={handleApplyJsonToBotData}
      editedJsonContent={editedJsonContent}
      onResetEditor={() => {
        isResettingEditorRef.current = true;
        setEditedJsonContent('');
        editorRef.current?.setValue(displayContent);
        setTimeout(() => { isResettingEditorRef.current = false; }, 0);
      }}
      onToggleCodePanel={handleToggleCodePanel}
      onComponentDrag={handleComponentDrag}
      onComponentAdd={handleComponentAdd}
      onLayoutChange={(config) => updateLayoutConfig(config as any)}
      onGoToProjects={handleGoToProjects}
      onProjectSelect={handleProjectSelect}
      activeSheetId={botDataWithSheets?.activeSheetId}
      headerContent={headerContent}
      canvasContent={canvasContent}
      propertiesContent={propertiesContent}
      onToggleCanvas={handleToggleCanvas}
      onToggleHeader={handleToggleHeader}
      onToggleProperties={handleToggleProperties}
      onSheetAdd={() => handleSheetAdd('Новый лист')}
      onSheetDelete={handleSheetDelete}
      onSheetRename={handleSheetRename}
      onSheetDuplicate={handleSheetDuplicate}
      onSheetSelect={handleSheetSelect}
      isMobile={isMobile}
      onClose={handleToggleSidebar}
      onNodeFocus={handleNodeFocus}
    />
  );

  return (
    <>
      <FlexibleLayoutView
        flexibleLayoutConfig={flexibleLayoutConfig}
        setFlexibleLayoutConfig={setFlexibleLayoutConfig}
        headerContent={headerContent}
        sidebarContent={sidebarContent}
        canvasContent={canvasContent}
        propertiesContent={propertiesContent}
        codeContent={codePanelContent}
        activeProject={activeProject}
        selectedDialogUser={selectedDialogUser}
        selectedUserDetails={selectedUserDetails}
        onCloseDialogPanel={handleCloseDialogPanel}
        onOpenDialogPanel={handleOpenDialogPanel}
        onCloseUserDetailsPanel={handleCloseUserDetailsPanel}
        onOpenUserDetailsPanel={handleOpenUserDetailsPanel}
        onSelectDialogUser={(u) => { setSelectedDialogUser(u); }}
        onSelectUserDetails={(u) => { setSelectedUserDetails(u); }}
        isCodeLoading={isCodeLoading}
        displayContent={displayContent}
        selectedFormat={selectedFormat}
        theme={theme}
        editorRef={editorRef}
        codeStats={codeStats}
        setAreAllCollapsed={setAreAllCollapsed}
        areAllCollapsed={areAllCollapsed}
        onContentChange={(v) => { if (!isResettingEditorRef.current) setEditedJsonContent(v); }}
        isMobile={isMobile}
        currentTab={currentTab}
      />

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
        botData={(botDataWithSheets || getBotDataRef.current()) as any}
        projectName={activeProject.name}
      />

      <MobilePropertiesSheet
        open={showMobileProperties && currentTab === 'editor'}
        onOpenChange={setShowMobileProperties}
      >
        {propertiesContent}
      </MobilePropertiesSheet>
    </>
  );
}
