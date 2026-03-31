/**
 * @fileoverview Холст визуального редактора Telegram-бота.
 *
 * Компонент отвечает за отображение узлов, drag-to-connect связи,
 * историю операций и специальные семантики соединений на канвасе.
 * Для `forward_message` связь от message/media-узла трактуется как
 * привязка источника сообщения, а не как автопереход выполнения.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { CanvasSheets } from '@/components/editor/canvas/canvas-sheets';
import { useTouchGestures } from './use-touch-gestures';
import { CanvasToolbar } from './canvas-toolbar';
import { CanvasContent } from './canvas-content';
import { useConnectionDrag } from './use-connection-drag';
import { clearKeyboardNodeId, setKeyboardNodeId } from '../canvas-node/keyboard-connection';
import { PortType } from '../canvas-node/port-colors';
import { getCanvasViewportMetrics, screenPointToCanvasPoint } from './utils/canvas-coordinate-utils';

import { Node, ComponentDefinition } from '@/types/bot';
import type { CommandPreset } from '@/components/editor/sidebar/massive/commands';
import { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { nanoid } from 'nanoid';

/**
 * Типы узлов, которые могут выступать источником сообщения для `forward_message`.
 */
const FORWARD_MESSAGE_SOURCE_NODE_TYPES = new Set<Node['type']>([
  'message',
  'media',
  'photo',
  'video',
  'audio',
  'document',
  'sticker',
  'voice',
  'animation',
  'location',
  'contact',
]);

/**
 * Проверяет, можно ли трактовать связь как source-link для `forward_message`.
 *
 * @param node - Исходный узел связи.
 * @returns `true`, если узел может быть источником пересылаемого сообщения.
 */
function canLinkForwardMessageSource(node: Node | undefined): boolean {
  return Boolean(node && FORWARD_MESSAGE_SOURCE_NODE_TYPES.has(node.type));
}

/**
 * Интерфейс действия в истории операций
 * @interface Action
 */
export interface Action {
  /** Уникальный идентификатор действия */
  id: string;
  /** Тип выполненного действия */
  type: 'add' | 'delete' | 'move' | 'move_end' | 'update' | 'connect' | 'disconnect' | 'duplicate' | 'reset' | 'type_change' | 'id_change' | 'button_add' | 'button_update' | 'button_delete' | 'sheet_add' | 'sheet_delete' | 'sheet_rename' | 'sheet_duplicate' | 'sheet_switch';
  /** Описание действия для пользователя */
  description: string;
  /** Временная метка выполнения действия */
  timestamp: number;
}

/**
 * Свойства компонента холста для редактирования бота
 * @interface CanvasProps
 */
interface CanvasProps {
  // Новая система листов (опциональные для совместимости)
  /** Данные бота с поддержкой листов */
  botData?: BotDataWithSheets;
  /** Колбэк для обновления данных бота */
  onBotDataUpdate?: (data: BotDataWithSheets) => void;

  // Существующие пропсы для совместимости
  /** Массив узлов на холсте */
  nodes: Node[];
  /** Идентификатор выбранного узла */
  selectedNodeId: string | null;
  /** Колбэк при выборе узла */
  onNodeSelect: (nodeId: string) => void;
  /** Колбэк при добавлении узла */
  onNodeAdd: (node: Node) => void;
  /** Колбэк при удалении узла */
  onNodeDelete: (nodeId: string) => void;
  /** Колбэк при дублировании узла */
  onNodeDuplicate?: (nodeId: string, targetPosition?: { x: number; y: number }) => void;
  /** Колбэк при перемещении узла */
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  /** Колбэк в начале перемещения узла (для сохранения в историю) */
  onNodeMoveStart?: (nodeId: string) => void;
  /** Колбэк в конце перемещения узла (для сохранения в историю) */
  onNodeMoveEnd?: (nodeId: string) => void;
  /** Колбэк при обновлении узлов */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNodesUpdate?: (nodes: Node[]) => void;
  /** Колбэк для отмены действия */
  onUndo?: () => void;
  /** Колбэк для повтора действия */
  onRedo?: () => void;
  /** Доступность отмены */
  canUndo?: boolean;
  /** Доступность повтора */
  canRedo?: boolean;
  /** Колбэк для сохранения */
  onSave?: () => void;
  /** Флаг процесса сохранения */
  isSaving?: boolean;
  /** Колбэк для копирования в буфер обмена */
  onCopyToClipboard?: (nodeIds: string[]) => void;
  /** Колбэк для вставки из буфера обмена */
  onPasteFromClipboard?: (offsetX?: number, offsetY?: number) => void;
  /** Наличие данных в буфере обмена */
  hasClipboardData?: boolean;

  // Глобальное состояние перетаскивания узлов
  /** Флаг перетаскивания узла */
  isNodeBeingDragged?: boolean;
  /** Установка флага перетаскивания */
  setIsNodeBeingDragged?: (isDragging: boolean) => void;

  // Кнопки управления интерфейсом
  /** Переключение видимости заголовка */
  onToggleHeader?: () => void;
  /** Переключение видимости боковой панели */
  onToggleSidebar?: () => void;
  /** Переключение видимости панели свойств */
  onToggleProperties?: () => void;
  /** Переключение видимости холста */
  onToggleCanvas?: () => void;
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Видимость боковой панели */
  sidebarVisible?: boolean;
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Видимость холста */
  canvasVisible?: boolean;

  // Мобильные функции
  /** Открытие мобильной боковой панели */
  onOpenMobileSidebar?: () => void;
  /** Открытие мобильной панели свойств */
  onOpenMobileProperties?: () => void;

  // Передача размеров узлов для иерархического макета
  /** Колбэк для передачи размеров узлов */
  onNodeSizesChange?: (nodeSizes: Map<string, { width: number; height: number }>) => void;

  // Логирование действий в историю
  /** Колбэк для логирования действий */
  onActionLog?: (type: Action['type'], description: string) => void;

  // История действий (передаётся из родителя)
  /** Массив истории действий */
  actionHistory?: Action[];
  /** Колбэк для удаления записей из внешней истории по id */
  onActionHistoryRemove?: (ids: Set<string>) => void;
  /** Колбэк удаления соединения (вызывается из ConnectionsLayer) */
  onConnectionDelete?: (fromId: string, toId: string, type: string) => void;
  /** Колбэк перед созданием соединения — для сохранения в историю */
  onConnectionCreate?: () => void;
}

export function Canvas({
  botData,
  onBotDataUpdate,
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodeAdd,
  onNodeDelete,
  onNodeDuplicate,
  onNodeMove,
  onNodeMoveStart,
  onNodeMoveEnd,
  onNodesUpdate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  isSaving,
  onCopyToClipboard,
  onPasteFromClipboard,
  hasClipboardData,
  isNodeBeingDragged,
  setIsNodeBeingDragged,
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  onToggleCanvas,
  headerVisible,
  sidebarVisible,
  propertiesVisible,
  canvasVisible,
  onNodeSizesChange,
  onActionLog,
  actionHistory: externalActionHistory,
  onActionHistoryRemove,
  onConnectionDelete: onConnectionDeleteProp,
  onConnectionCreate,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  /** Ref для onConnectionCreate чтобы handleConnectionComplete не устаревал */
  const onConnectionCreateRef = useRef(onConnectionCreate);
  useEffect(() => { onConnectionCreateRef.current = onConnectionCreate; }, [onConnectionCreate]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [lastClickPosition, setLastClickPosition] = useState({ x: 100, y: 100 });
  const [clickTransform, setClickTransform] = useState({ pan: { x: 0, y: 0 }, zoom: 100 });

  // Touch состояние для мобильного управления
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [initialPinchZoom, setInitialPinchZoom] = useState(100);

  // Состояние для хранения реальных размеров узлов
  const [nodeSizes, setNodeSizes] = useState<Map<string, { width: number; height: number }>>(new Map());

  // Система истории действий - используем внешнюю историю если передана, иначе локальную
  const [localActionHistory, setLocalActionHistory] = useState<Action[]>([]);
  const actionHistory = externalActionHistory || localActionHistory;
  const [selectedActionsForUndo, setSelectedActionsForUndo] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  // Функция для добавления действия в историю
  const addAction = useCallback((type: Action['type'], description: string) => {
    // Если есть внешний обработчик - используем его (централизованное управление)
    if (onActionLog) {
      onActionLog(type, description);
    } else {
      // Иначе используем локальное состояние
      setLocalActionHistory(prev => {
        const newAction: Action = {
          id: nanoid(),
          type,
          description,
          timestamp: Date.now()
        };
        const updated = [newAction, ...prev].slice(0, 50);
        return updated;
      });
    }
  }, [onActionLog]);

  /**
   * Применяет результат drag-to-connect одним проходом, чтобы сохранить
   * и источник, и цель связи без конфликтов между последовательными обновлениями.
   */
  const handleConnectionComplete = useCallback(({
    sourceNodeId,
    targetNodeId,
    portType,
    buttonId,
  }: {
    sourceNodeId: string;
    targetNodeId: string;
    portType: PortType;
    buttonId?: string;
  }) => {
    onConnectionCreateRef.current?.();

    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);
    const existingSourceNodeId = typeof (targetNode?.data as any)?.sourceMessageNodeId === 'string'
      ? (targetNode?.data as any).sourceMessageNodeId.trim()
      : '';
    const existingSourceMode = (targetNode?.data as any)?.sourceMessageIdSource;
    const isForwardMessageSourceLink =
      portType === 'auto-transition' &&
      targetNode?.type === 'forward_message' &&
      canLinkForwardMessageSource(sourceNode) &&
      existingSourceMode !== 'manual' &&
      existingSourceMode !== 'variable' &&
      (!existingSourceNodeId || existingSourceNodeId === sourceNodeId);

    const updatedNodes = nodes.map((n) => {
      const data = { ...n.data } as Record<string, unknown>;

      if (n.id === sourceNodeId) {
        if (isForwardMessageSourceLink) {
          return n;
        }

        if (portType === 'trigger-next' || portType === 'auto-transition') {
          /**
           * Сообщение использует один общий порт.
           * При дропе на keyboard создаём привязку клавиатуры,
           * а при дропе на любой другой узел — обычный переход.
           */
          if (portType === 'auto-transition' && sourceNode?.type === 'message' && targetNode?.type === 'keyboard') {
            return { ...n, data: setKeyboardNodeId(data, targetNodeId) as unknown as Node['data'] };
          }

          data.autoTransitionTo = targetNodeId;
          if (portType === 'auto-transition') {
            data.enableAutoTransition = true;
          }
          return { ...n, data };
        }

        if (portType === 'button-goto' && buttonId) {
          const buttons = (data.buttons as any[] | undefined) ?? [];
          data.buttons = buttons.map((btn: any) =>
            btn.id === buttonId ? { ...btn, target: targetNodeId } : btn
          );
          const branches = (data.branches as any[] | undefined) ?? [];
          if (branches.length > 0) {
            data.branches = branches.map((b: any) =>
              b.id === buttonId ? { ...b, target: targetNodeId } : b
            );
          }
          return { ...n, data };
        }

        if (`${portType}` === 'input-target') {
          data.inputTargetNodeId = targetNodeId;
          return { ...n, data };
        }
      }

      if (n.id === targetNodeId && n.type === 'forward_message' && isForwardMessageSourceLink) {
        return {
          ...n,
          data: {
            ...data,
            sourceMessageIdSource:
              data.sourceMessageIdSource === 'manual' || data.sourceMessageIdSource === 'variable'
                ? 'current_message'
                : (data.sourceMessageIdSource as string | undefined) || 'current_message',
            sourceMessageId: '',
            sourceMessageVariableName: '',
            sourceMessageNodeId: sourceNodeId,
          },
        };
      }

      return n;
    }) as Node[];

    onNodesUpdate?.(updatedNodes);
    addAction('connect', `Создано соединение от узла ${sourceNodeId}`);
  }, [nodes, onNodesUpdate, addAction]);

  /**
   * Удаляет соединение между двумя узлами.
   * Если передан внешний onConnectionDelete — делегируем ему (он вызовет saveToHistory).
   * Иначе — очищаем соответствующее поле в данных исходного узла напрямую.
   */
  const handleConnectionDelete = useCallback((fromId: string, toId: string, type: string) => {
    if (onConnectionDeleteProp) {
      onConnectionDeleteProp(fromId, toId, type);
      return;
    }

    const updatedNodes = nodes.map(n => {
      const data = { ...n.data } as Record<string, unknown>;

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
          const branches = (data.branches as any[] | undefined) ?? [];
          if (branches.length > 0) {
            data.branches = branches.map((b: any) =>
              b.target === toId ? { ...b, target: undefined } : b
            );
          }
        } else if (type === 'input-target') {
          delete data.inputTargetNodeId;
        } else if (type === 'keyboard-link') {
          return { ...n, data: clearKeyboardNodeId(data) };
        }
        return { ...n, data };
      }

      if (n.id === toId && type === 'condition-source') {
        delete data.sourceNodeId;
        return { ...n, data };
      }

      if (n.id === toId && type === 'forward-source' && n.type === 'forward_message') {
        delete data.sourceMessageId;
        delete data.sourceMessageVariableName;
        delete data.sourceMessageNodeId;
        data.sourceMessageIdSource = 'current_message';
        return { ...n, data };
      }

      return n;
    }) as Node[];
    onNodesUpdate?.(updatedNodes);
    addAction('disconnect', `Удалено соединение`);
  }, [onConnectionDeleteProp, nodes, onNodesUpdate, addAction]);

  const {
    draftConnection,
    hoveredTargetNodeId,
    handlePortMouseDown,
  } = useConnectionDrag({
    nodes,
    zoom,
    pan,
    canvasRef,
    nodeSizes,
    onConnectionComplete: handleConnectionComplete,
  });

  // Функция для отмены выбранных действий
  const handleUndoSelected = useCallback(() => {
    if (selectedActionsForUndo.size === 0) return;
    if (onUndo) {
      // onUndo() не принимает параметр количества шагов, а React батчит синхронные вызовы,
      // поэтому цикл вызовов применял бы только первый undo. Вызываем один раз.
      onUndo();
    }
    // Удаляем выбранные записи из истории
    if (onActionHistoryRemove) {
      onActionHistoryRemove(selectedActionsForUndo);
    } else {
      // Локальная история
      setLocalActionHistory(prev => prev.filter(a => !selectedActionsForUndo.has(a.id)));
    }
    setSelectedActionsForUndo(new Set());
  }, [selectedActionsForUndo, onUndo, onActionHistoryRemove]);

  // Toggle selection for an action
  const toggleActionSelection = useCallback((actionId: string) => {
    setSelectedActionsForUndo(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  }, []);

  // Выбор диапазона действий
  const selectRange = useCallback((startIndex: number, endIndex: number) => {
    setSelectedActionsForUndo(() => {
      const [min, max] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const newSet = new Set<string>();
      for (let i = min; i <= max; i++) {
        if (actionHistory[i]) {
          newSet.add(actionHistory[i].id);
        }
      }
      return newSet;
    });
  }, [actionHistory]);

  // Начало выделения
  const handleMouseDownAction = useCallback((index: number) => {
    if (actionHistory[index]) {
      setIsSelecting(true);
      setSelectionStart(index);
      toggleActionSelection(actionHistory[index].id);
    }
  }, [actionHistory, toggleActionSelection]);

  // Во время выделения
  const handleMouseOverAction = useCallback((index: number) => {
    if (isSelecting && selectionStart !== null) {
      selectRange(selectionStart, index);
    }
  }, [isSelecting, selectionStart, selectRange]);

  // Конец выделения
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };

    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {};
  }, [isSelecting]);

  // Обработчик изменения размеров узлов
  const handleNodeSizeChange = useCallback((nodeId: string, size: { width: number; height: number }) => {
    setNodeSizes(prev => {
      const newMap = new Map(prev);
      newMap.set(nodeId, size);
      return newMap;
    });
  }, []);

  // Отдельный эффект для передачи размеров в родительский компонент
  useEffect(() => {
    if (onNodeSizesChange && nodeSizes.size > 0) {
      onNodeSizesChange(nodeSizes);
    }
  }, [nodeSizes, onNodeSizesChange]);

  // Убираем автоматический layout при изменении nodeSizes - он был слишком агрессивным
  // Автоиерархия должна работать только при загрузке шаблонов, а не постоянно

  // Получение активного листа (с fallback'ом для совместимости)
  // const activeSheet = botData ? SheetsManager.getActiveSheet(botData) : null;

  // Обработчики для работы с листами
  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botData || !onBotDataUpdate) return;

    // ВАЖНО: Сначала сохраняем текущее состояние редактора в активный лист
    let dataWithCurrentSheetSaved = botData;
    if (botData.activeSheetId) {
      dataWithCurrentSheetSaved = SheetsManager.updateSheetData(
        botData,
        botData.activeSheetId,
        nodes
      );
    }

    // Затем переключаемся на новый лист
    const updatedData = SheetsManager.setActiveSheet(dataWithCurrentSheetSaved, sheetId);
    onBotDataUpdate(updatedData);
  }, [botData, onBotDataUpdate, nodes]);

  const handleSheetAdd = useCallback((name: string) => {
    if (!botData || !onBotDataUpdate) return;

    // Сохраняем текущее состояние перед добавлением нового листа
    let dataWithCurrentSheetSaved = botData;
    if (botData.activeSheetId) {
      dataWithCurrentSheetSaved = SheetsManager.updateSheetData(
        botData,
        botData.activeSheetId,
        nodes
      );
    }

    const updatedData = SheetsManager.addSheet(dataWithCurrentSheetSaved, name);
    onBotDataUpdate(updatedData);
  }, [botData, onBotDataUpdate, nodes]);

  const handleSheetDelete = useCallback((sheetId: string) => {
    if (!botData || !onBotDataUpdate) return;
    try {
      const updatedData = SheetsManager.deleteSheet(botData, sheetId);
      onBotDataUpdate(updatedData);
    } catch (error) {
      console.error('Ошибка удаления листа:', error);
    }
  }, [botData, onBotDataUpdate]);

  const handleSheetRename = useCallback((sheetId: string, newName: string) => {
    if (!botData || !onBotDataUpdate) return;
    const updatedData = SheetsManager.renameSheet(botData, sheetId, newName);
    onBotDataUpdate(updatedData);
  }, [botData, onBotDataUpdate]);

  const handleSheetDuplicate = useCallback((sheetId: string) => {
    if (!botData || !onBotDataUpdate) return;
    try {
      // Сохраняем текущее состояние перед дублированием
      let dataWithCurrentSheetSaved = botData;
      if (botData.activeSheetId) {
        dataWithCurrentSheetSaved = SheetsManager.updateSheetData(
          botData,
          botData.activeSheetId,
          nodes
        );
      }

      const updatedData = SheetsManager.duplicateSheetInProject(dataWithCurrentSheetSaved, sheetId);
      onBotDataUpdate(updatedData);
    } catch (error) {
      console.error('Ошибка дублирования листа:', error);
    }
  }, [botData, onBotDataUpdate, nodes]);

  // Получить размеры контейнера
  const getContainerDimensions = useCallback(() => {
    if (canvasRef.current?.parentElement) {
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      return { width: rect.width - 64, height: rect.height - 64 };
    }
    return { width: window.innerWidth - 64, height: window.innerHeight - 64 };
  }, []);

  // Масштабирование от центра
  const zoomFromCenter = useCallback((newZoom: number) => {
    const { width, height } = getContainerDimensions();
    const centerX = width / 2;
    const centerY = height / 2;

    setPan(prevPan => {
      const prevZoomPercent = zoom / 100;
      const newZoomPercent = newZoom / 100;

      // Вычисляем координаты центра в canvas координатах
      const centerCanvasX = (centerX - prevPan.x) / prevZoomPercent;
      const centerCanvasY = (centerY - prevPan.y) / prevZoomPercent;

      // Вычисляем новый pan, чтобы центр остался на месте
      return {
        x: centerX - centerCanvasX * newZoomPercent,
        y: centerY - centerCanvasY * newZoomPercent
      };
    });

    setZoom(newZoom);
  }, [zoom, getContainerDimensions]);

  // Zoom utility functions
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.05, 200);
    zoomFromCenter(newZoom);
  }, [zoom, zoomFromCenter]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom * 0.95, 1);
    zoomFromCenter(newZoom);
  }, [zoom, zoomFromCenter]);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    const constrainedZoom = Math.max(Math.min(level, 200), 1);
    zoomFromCenter(constrainedZoom);
  }, [zoomFromCenter]);

  // Функция для получения центральной позиции видимой области canvas
  const getCenterPosition = useCallback(() => {
    if (canvasRef.current) {
      const scrollContainer = canvasRef.current.parentElement;
      const containerWidth = scrollContainer ? scrollContainer.clientWidth - 64 : window.innerWidth - 64;
      const containerHeight = scrollContainer ? scrollContainer.clientHeight - 64 : window.innerHeight - 64;

      // Вычисляем центр в координатах canvas (с учетом текущего pan и zoom)
      const centerX = (containerWidth / 2 - pan.x) / (zoom / 100);
      const centerY = (containerHeight / 2 - pan.y) / (zoom / 100);

      const position = {
        x: Math.max(50, centerX - 160),
        y: Math.max(50, centerY - 50)
      };

      return position;
    }
    return { x: 400, y: 300 }; // fallback если canvas не найден
  }, [pan, zoom]);

  // Вычисляет canvas-координаты для вставки: из lastClickPosition или центр видимой области
  const getPastePosition = useCallback(() => {
    if (canvasRef.current && lastClickPosition.x !== 100 && lastClickPosition.y !== 100) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = lastClickPosition.x - rect.left;
      const screenY = lastClickPosition.y - rect.top;
      // Правильная формула: (screen - pan) / zoom
      const canvasX = (screenX - clickTransform.pan.x) / (clickTransform.zoom / 100);
      const canvasY = (screenY - clickTransform.pan.y) / (clickTransform.zoom / 100);
      // Проверяем что координаты в разумных пределах видимой области
      const scrollContainer = canvasRef.current.parentElement;
      const vw = scrollContainer ? scrollContainer.clientWidth : window.innerWidth;
      const vh = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
      const visibleMinX = -clickTransform.pan.x / (clickTransform.zoom / 100);
      const visibleMinY = -clickTransform.pan.y / (clickTransform.zoom / 100);
      const visibleMaxX = visibleMinX + vw / (clickTransform.zoom / 100);
      const visibleMaxY = visibleMinY + vh / (clickTransform.zoom / 100);
      if (canvasX >= visibleMinX && canvasX <= visibleMaxX && canvasY >= visibleMinY && canvasY <= visibleMaxY) {
        return { x: canvasX, y: canvasY };
      }
    }
    return getCenterPosition();
  }, [lastClickPosition, clickTransform, getCenterPosition]);


  const fitToContent = useCallback(() => {
    if (nodes.length === 0) return;
    if (!canvasRef.current) return;

    // Вычисляем границы всех узлов
    // Приоритет: nodeSizes (из ResizeObserver) → DOM измерение → fallback
    const nodeBounds = nodes.reduce((bounds, node) => {
      let w = 320;
      let h = 200;

      const measured = nodeSizes.get(node.id);
      if (measured) {
        w = measured.width;
        h = measured.height;
      } else {
        // Пробуем измерить из DOM напрямую
        const allNodeEls = canvasRef.current?.querySelectorAll<HTMLElement>('[data-canvas-node]');
        if (allNodeEls) {
          // Ищем узел по индексу (порядок совпадает с nodes array)
          const idx = nodes.indexOf(node);
          const el = allNodeEls[idx];
          if (el) {
            const rect = el.getBoundingClientRect();
            const zoom100 = 1 / (zoom / 100);
            w = rect.width * zoom100;
            h = rect.height * zoom100;
          }
        }
      }

      return {
        left: Math.min(bounds.left, node.position.x),
        right: Math.max(bounds.right, node.position.x + w),
        top: Math.min(bounds.top, node.position.y),
        bottom: Math.max(bounds.bottom, node.position.y + h)
      };
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

    if (!isFinite(nodeBounds.left) || !isFinite(nodeBounds.right) ||
      !isFinite(nodeBounds.top) || !isFinite(nodeBounds.bottom)) return;

    const contentWidth = nodeBounds.right - nodeBounds.left;
    const contentHeight = nodeBounds.bottom - nodeBounds.top;
    if (contentWidth <= 0 || contentHeight <= 0) return;

    // Берём размеры из main — он занимает всю видимую область
    const mainEl = canvasRef.current.closest('main');
    if (!mainEl) return;
    const mainRect = mainEl.getBoundingClientRect();
    const containerWidth = mainRect.width;
    const containerHeight = mainRect.height;

    // Измеряем реальные высоты toolbar и sheets через data-атрибуты
    const toolbarEl = mainEl.querySelector<HTMLElement>('[data-canvas-toolbar]');
    const sheetsEl = mainEl.querySelector<HTMLElement>('[data-canvas-sheets]');
    const toolbarHeight = toolbarEl ? toolbarEl.getBoundingClientRect().height : 60;
    const sheetsHeight = sheetsEl ? sheetsEl.getBoundingClientRect().height : 0;

    // Видимая область между toolbar и sheets
    const visibleWidth = containerWidth;
    const visibleHeight = containerHeight - toolbarHeight - sheetsHeight;

    if (visibleWidth <= 0 || visibleHeight <= 0) return;

    // Масштаб с 10% отступами
    const scaleX = (visibleWidth * 0.9) / contentWidth;
    const scaleY = (visibleHeight * 0.9) / contentHeight;
    const newZoom = Math.max(Math.min(Math.min(scaleX, scaleY) * 100, 100), 1);

    // Центр контента в canvas-координатах
    const centerX = (nodeBounds.left + nodeBounds.right) / 2;
    const centerY = (nodeBounds.top + nodeBounds.bottom) / 2;

    // Центр видимой области в экранных координатах (относительно контейнера скролла, без тулбара)
    const screenCenterX = visibleWidth / 2;
    const screenCenterY = visibleHeight / 2;

    const newPanX = screenCenterX - centerX * (newZoom / 100);
    const newPanY = screenCenterY - centerY * (newZoom / 100);

    if (!isFinite(newPanX) || !isFinite(newPanY)) return;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
    // Сбрасываем scroll контейнера — pan управляет позицией через transform
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [nodes, nodeSizes, zoom]);

  // Handle wheel zoom (native handler, registered with { passive: false })
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newZoom = Math.max(Math.min(zoom * zoomFactor, 200), 1);
        const zoomRatio = newZoom / zoom;

        setPan(prev => ({
          x: mouseX - (mouseX - prev.x) * zoomRatio,
          y: mouseY - (mouseY - prev.y) * zoomRatio
        }));

        setZoom(newZoom);
      }
    }
    // Prevent page zoom on trackpad pinch gesture
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, [zoom]);

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if click is on empty canvas (not on a node)
    const target = e.target as HTMLElement;
    const isEmptyCanvas = target.classList.contains('canvas-grid-modern') ||
      target.closest('.canvas-grid-modern') === target;

    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey) ||
      (e.button === 0 && isEmptyCanvas)) { // Middle mouse, right mouse, Alt+click, or left-click on empty canvas
      e.preventDefault();
      // Сбрасываем scroll контейнера — позиция управляется через pan/transform
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        scrollContainerRef.current.scrollLeft = 0;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setLastPanPosition(pan);
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;

      setPan({
        x: lastPanPosition.x + deltaX,
        y: lastPanPosition.y + deltaY
      });
    }
  }, [isPanning, panStart, lastPanPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Обработчики touch-жестов для мобильных устройств
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    canvasRef,
    pan,
    zoom,
    setPan,
    setZoom,
    isTouchPanning,
    setIsTouchPanning,
    touchStart,
    setTouchStart,
    lastTouchPosition,
    setLastTouchPosition,
    lastPinchDistance,
    setLastPinchDistance,
    initialPinchZoom,
    setInitialPinchZoom,
    isNodeBeingDragged
  });

  // Prevent context menu on right-click when using for panning
  // Не блокируем если событие пришло с узла (у него есть data-canvas-node)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-canvas-node]')) return;
    e.preventDefault();
  }, []);

  // Attach wheel and touch handlers as non-passive so preventDefault() works
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle keyboard shortcuts
  useEffect(() => {
    
    
    const handleKeyDown = (e: KeyboardEvent) => {
      
      
      // Проверяем, что фокус не находится на input или textarea
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      if (!isInputField) {
        // Обработка клавиши Delete для удаления выбранного узла
        if (e.key === 'Delete' && selectedNodeId && onNodeDelete) {
          e.preventDefault();
          const node = nodes.find(n => n.id === selectedNodeId);
          addAction('delete', `Удален узел "${node?.type || 'Unknown'}"`);
          onNodeDelete(selectedNodeId);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        // Обработка Ctrl+Shift+C/V в первую очередь (межпроектное копирование)
        if (e.shiftKey) {
          switch (e.key) {
            case 'c':
            case 'C':
            case 'с':
            case 'С':
              e.preventDefault();
              e.stopPropagation();
              if (selectedNodeId && onCopyToClipboard) {
                onCopyToClipboard([selectedNodeId]);
              }
              return;
            case 'v':
            case 'V':
            case 'м':
            case 'М':
              e.preventDefault();
              e.stopPropagation();
              if (onPasteFromClipboard) {
                const { x: targetX, y: targetY } = getPastePosition();
                onPasteFromClipboard(targetX, targetY);
              }
              return;
          }
        }
        
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
          case '1':
            e.preventDefault();
            fitToContent();
            break;
          case 'z':
          case 'Z':
          case 'я':
          case 'Я':
            e.preventDefault();
            if (e.shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
            break;
          case 'y':
          case 'Y':
          case 'н':
          case 'Н':
            e.preventDefault();
            onRedo?.();
            break;
          case 's':
          case 'S':
          case 'ы':
          case 'Ы':
            e.preventDefault();
            if (onSave && !isSaving) {
              onSave();
            }
            break;
          case 'c':
          case 'C':
          case 'с':
          case 'С':
            e.preventDefault();
            e.stopPropagation();
            // Ctrl+C без Shift - дублирование узла
            if (selectedNodeId && onNodeDuplicate) {
              const node = nodes.find(n => n.id === selectedNodeId);
              addAction('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
              onNodeDuplicate(selectedNodeId, getPastePosition());
            }
            break;
          case 'd':
          case 'D':
          case 'в':
          case 'В':
            e.preventDefault();
            if (selectedNodeId && onNodeDuplicate) {
              const node = nodes.find(n => n.id === selectedNodeId);
              addAction('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
              onNodeDuplicate(selectedNodeId, getPastePosition());
            }
            break;
          case 'v':
          case 'V':
          case 'м':
          case 'М':
            e.preventDefault();
            e.stopPropagation();
            // Ctrl+V без Shift - вставка из буфера
            if (onPasteFromClipboard) {
              const { x: targetX, y: targetY } = getPastePosition();
              onPasteFromClipboard(targetX, targetY);
            }
            break;
        }
      }
    };

    // Обработчик для предотвращения масштабирования всей страницы на trackpad
    const handleGesture = (e: Event) => {
      if ((e as any).ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Добавляем обработчики для предотвращения жестов масштабирования
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('gestureend', handleGesture, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
    };
  }, [zoomIn, zoomOut, resetZoom, fitToContent, onUndo, onRedo, canUndo, canRedo, onSave, isSaving, selectedNodeId, onNodeDelete, onNodeDuplicate, nodes, addAction, getPastePosition, onPasteFromClipboard, onCopyToClipboard]);



  // Handle mouse events for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        setPan({
          x: lastPanPosition.x + deltaX,
          y: lastPanPosition.y + deltaY
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };

    // Обработчик для предотвращения масштабирования всей страницы при ctrl+колесо мыши
    const preventPageZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    // Добавляем обработчик для предотвращения масштабирования всей страницы
    document.addEventListener('wheel', preventPageZoom, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('wheel', preventPageZoom);
    };
  }, [isPanning, panStart, lastPanPosition]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    /** Вычисляет позицию дропа в координатах холста */
    const getDropPosition = () => {
      const scrollContainer = canvasRef.current?.parentElement;
      const viewport = getCanvasViewportMetrics(scrollContainer);
      if (!viewport) return getCenterPosition();

      const point = screenPointToCanvasPoint(e.clientX, e.clientY, viewport, pan, zoom);
      if (point.x >= -10000 && point.y >= -10000 && point.x <= 10000 && point.y <= 10000) {
        return {
          x: point.x - 160,
          y: point.y - 50,
        };
      }
      return getCenterPosition();
    };

    // Проверяем сначала command_preset
    const presetData = e.dataTransfer.getData('application/command-preset');
    if (presetData) {
      const preset = JSON.parse(presetData) as CommandPreset;
      const dropPosition = getDropPosition();
      const triggerId = nanoid();
      const messageId = nanoid();

      // Создаём command_trigger
      onNodeAdd({
        id: triggerId,
        type: 'command_trigger',
        position: dropPosition,
        data: {
          command: preset.triggerData.command,
          description: preset.triggerData.description || '',
          showInMenu: preset.triggerData.showInMenu ?? true,
          isPrivateOnly: preset.triggerData.isPrivateOnly ?? false,
          autoTransitionTo: messageId,
        },
      } as unknown as Node);

      // Создаём message рядом (+320px по X)
      const buttons = (preset.messageData.buttons || []).map(btn => ({
        id: nanoid(),
        text: btn.text,
        action: 'default' as const,
        buttonType: 'normal' as const,
        skipDataCollection: false,
        hideAfterClick: false,
      }));

      onNodeAdd({
        id: messageId,
        type: 'message',
        position: { x: dropPosition.x + 320, y: dropPosition.y },
        data: {
          messageText: preset.messageData.text,
          keyboardType: buttons.length > 0 ? 'inline' : 'none',
          buttons,
          markdown: false,
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        },
      } as unknown as Node);

      addAction('add', `Добавлена команда "${preset.triggerData.command}" с ответом`);
      return;
    }

    const componentData = e.dataTransfer.getData('application/json');
    if (!componentData) return;

    const component: ComponentDefinition = JSON.parse(componentData);
    const nodePosition = getDropPosition();

    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: nodePosition,
      data: {
        keyboardType: 'none',
        buttons: [],
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        markdown: false,
        ...component.defaultData
      }
    };

    addAction('add', `Добавлен узел "${component.type}"`);
    onNodeAdd(newNode);
  }, [onNodeAdd, pan, zoom, getCenterPosition, addAction]);

  // Обработчик canvas-drop события для touch устройств  
  const handleCanvasDrop = useCallback((e: CustomEvent) => {
    const { component, position } = e.detail;

    if (!component) {
      return;
    }

    let nodePosition;

    if (position && canvasRef.current) {
      const scrollContainer = canvasRef.current.parentElement;
      const viewport = getCanvasViewportMetrics(scrollContainer);
      const canvasRect = canvasRef.current.getBoundingClientRect();

      if (viewport) {
        const point = screenPointToCanvasPoint(
          canvasRect.left + position.x,
          canvasRect.top + position.y,
          viewport,
          pan,
          zoom
        );
        nodePosition = { x: point.x - 160, y: point.y - 50 };
      } else {
        nodePosition = getCenterPosition();
      }
    } else {
      nodePosition = getCenterPosition();
    }

    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: nodePosition,
      data: {
        keyboardType: 'none',
        buttons: [],
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        markdown: false,
        ...component.defaultData
      }
    };

    addAction('add', `Добавлен узел "${component.type}"`);
    onNodeAdd(newNode);
  }, [onNodeAdd, pan, zoom, getCenterPosition, addAction]);

  // Handle canvas-drop событие для touch устройств
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('canvas-drop', handleCanvasDrop as EventListener);
      return () => canvasElement.removeEventListener('canvas-drop', handleCanvasDrop as EventListener);
    }
    return () => {};
  }, [handleCanvasDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Сохраняем позицию клика и текущий transform для последующей вставки
    setLastClickPosition({ x: e.clientX, y: e.clientY });
    setClickTransform({ pan: { x: pan.x, y: pan.y }, zoom });
    
    if (e.target === e.currentTarget) {
      onNodeSelect('');
    }
  }, [onNodeSelect, pan.x, pan.y, zoom]);

  return (
    <main className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      <div ref={scrollContainerRef} className="absolute inset-x-0 overflow-hidden" style={{ top: 60, bottom: 60 }}>

        {/* Enhanced Canvas Grid */}
        <div
          ref={canvasRef}
          className="min-h-full relative canvas-grid-modern"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)
            `,
            backgroundSize: `${24 * zoom / 100}px ${24 * zoom / 100}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            minHeight: '2000vh',
            minWidth: '2000vw',
            cursor: isPanning ? 'grabbing' : 'grab',
            // Предотвращение масштабирования на сенсорных устройствах
            touchAction: 'none'
          }}
          data-drag-over={isDragOver}
          data-canvas-drop-zone
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          {/* Transformable Canvas Content */}
          <CanvasContent
            botData={botData}
            nodes={nodes}
            pan={pan}
            zoom={zoom}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
            onNodeDelete={onNodeDelete}
            onNodeDuplicate={onNodeDuplicate}
            onNodeDuplicateAtPosition={onNodeDuplicate ? (nodeId) => {
              /**
               * Дублирование через контекстное меню: позиция вычисляется через
               * getPastePosition() — ту же функцию, что использует Ctrl+V.
               * Это гарантирует одинаковое поведение обоих способов дублирования.
               */
              onNodeDuplicate(nodeId, getPastePosition());
            } : undefined}
            onNodeMove={onNodeMove}
            onNodeMoveStart={onNodeMoveStart}
            onNodeMoveEnd={onNodeMoveEnd}
            setIsNodeBeingDragged={setIsNodeBeingDragged}
            onSizeChange={handleNodeSizeChange}
            nodeSizes={nodeSizes}
            onPortMouseDown={handlePortMouseDown}
            draftConnection={draftConnection}
            hoveredTargetNodeId={hoveredTargetNodeId}
            onConnectionDelete={handleConnectionDelete}
          />
          {nodes.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-12 w-96 text-center transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-200/50 dark:border-blue-600/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20">
                <i className="fas fa-plus text-blue-600 dark:text-blue-400 text-3xl drop-shadow-sm"></i>
              </div>
              <h3 className="text-gray-800 dark:text-gray-200 mb-4 font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Перетащите элемент сюда</h3>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">Выберите компонент из левой панели и перетащите на холст для создания бота</p>
            </div>
          )}
        </div>

      </div>

      {/* Панель инструментов - фиксированная панель вверху */}
      <CanvasToolbar
        nodes={nodes}
        zoom={zoom}
        actionHistory={actionHistory}
        canRedo={canRedo}
        isSaving={isSaving}
        selectedNodeId={selectedNodeId}
        hasClipboardData={hasClipboardData}
        headerVisible={headerVisible}
        sidebarVisible={sidebarVisible}
        canvasVisible={canvasVisible}
        propertiesVisible={propertiesVisible}
        onZoomOut={zoomOut}
        onZoomIn={zoomIn}
        onResetZoom={resetZoom}
        onFitToContent={fitToContent}
        onZoomLevelChange={setZoomLevel}
        onUndo={onUndo}
        onRedo={onRedo}
        onSave={onSave}
        onCopyToClipboard={onCopyToClipboard}
        onPasteFromClipboard={onPasteFromClipboard}
        lastClickPosition={lastClickPosition}
        clickTransform={clickTransform}
        onToggleHeader={onToggleHeader}
        onToggleSidebar={onToggleSidebar}
        onToggleCanvas={onToggleCanvas}
        onToggleProperties={onToggleProperties}
        handleMouseDownAction={handleMouseDownAction}
        handleMouseOverAction={handleMouseOverAction}
        toggleActionSelection={toggleActionSelection}
        selectedActionsForUndo={selectedActionsForUndo}
        handleUndoSelected={handleUndoSelected}
      />

      {/* Компонент листов холста - фиксированная панель внизу */}
      {botData && botData.sheets && botData.sheets.length > 0 && onBotDataUpdate && (
        <div data-canvas-sheets className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
          <CanvasSheets
            sheets={botData.sheets}
            activeSheetId={botData.activeSheetId || botData.sheets[0]?.id || null}
            onSheetSelect={handleSheetSelect}
            onSheetAdd={handleSheetAdd}
            onSheetDelete={handleSheetDelete}
            onSheetRename={handleSheetRename}
            onSheetDuplicate={handleSheetDuplicate}
            maxVisibleTabs={5}
          />
        </div>
      )}
    </main>
  );
}
