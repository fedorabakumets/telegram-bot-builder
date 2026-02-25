import { useRef, useCallback, useState, useEffect } from 'react';
import { CanvasSheets } from '@/components/editor/canvas/canvas-sheets';
import { useTouchGestures } from './use-touch-gestures';
import { CanvasToolbar } from './canvas-toolbar';
import { CanvasContent } from './canvas-content';

import { Node, ComponentDefinition } from '@/types/bot';
import { BotDataWithSheets } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';
import { nanoid } from 'nanoid';

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
  onNodeDuplicate?: (nodeId: string) => void;
  /** Колбэк при перемещении узла */
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
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
  onNodeMoveEnd,
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
  actionHistory: externalActionHistory
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
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
    console.log('📝 addAction called:', type, description);
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
        console.log('📝 actionHistory updated, now has', updated.length, 'actions');
        return updated;
      });
    }
  }, [onActionLog]);

  // Функция для отмены выбранных действий
  const handleUndoSelected = useCallback(() => {
    if (selectedActionsForUndo.size > 0 && onUndo) {
      // Отменяем столько раз, сколько выбранных действий
      for (let i = 0; i < selectedActionsForUndo.size; i++) {
        onUndo();
      }
      setSelectedActionsForUndo(new Set());
    }
  }, [selectedActionsForUndo, onUndo]);

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
        x: Math.max(50, centerX - 160), // -160 чтобы центрировать узел (половина ширины узла)
        y: Math.max(50, centerY - 50)   // -50 чтобы центрировать узел (половина высоты узла)
      };

      console.log('getCenterPosition:', { containerWidth, containerHeight, pan, zoom, centerX, centerY, position });
      return position;
    }
    console.log('getCenterPosition: using fallback');
    return { x: 400, y: 300 }; // fallback если canvas не найден
  }, [pan, zoom]);


  const fitToContent = useCallback(() => {
    if (nodes.length === 0) return;

    // Вычисляем границы всех узлов
    const nodeBounds = nodes.reduce((bounds, node) => {
      const left = node.position.x;
      const right = node.position.x + 320; // Approximate node width
      const top = node.position.y;
      const bottom = node.position.y + 100; // Approximate node height

      return {
        left: Math.min(bounds.left, left),
        right: Math.max(bounds.right, right),
        top: Math.min(bounds.top, top),
        bottom: Math.max(bounds.bottom, bottom)
      };
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

    // Проверяем валидность границ
    if (!isFinite(nodeBounds.left) || !isFinite(nodeBounds.right) ||
      !isFinite(nodeBounds.top) || !isFinite(nodeBounds.bottom)) {
      return;
    }

    const contentWidth = nodeBounds.right - nodeBounds.left;
    const contentHeight = nodeBounds.bottom - nodeBounds.top;

    // Проверяем размеры контента
    if (contentWidth <= 0 || contentHeight <= 0) {
      return;
    }

    if (canvasRef.current) {
      // Получаем размеры видимой области (родительского контейнера с overflow)
      const scrollContainer = canvasRef.current.parentElement;
      let containerWidth = scrollContainer ? scrollContainer.clientWidth - 64 : window.innerWidth - 64;
      let containerHeight = scrollContainer ? scrollContainer.clientHeight - 64 : window.innerHeight - 64;

      // Вычитаем высоту toolbar (вверху)
      const toolbarHeight = 64; // ~64px для toolbar
      containerHeight -= toolbarHeight;

      // Вычитаем высоту панели листов (внизу) - примерно 60px
      const sheetsHeight = botData?.sheets && botData.sheets.length > 0 ? 60 : 0;
      containerHeight -= sheetsHeight;

      // Проверяем размеры контейнера
      if (containerWidth <= 0 || containerHeight <= 0) {
        return;
      }

      // Вычисляем масштаб с отступами
      const scaleX = (containerWidth * 0.9) / contentWidth;
      const scaleY = (containerHeight * 0.9) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Ограничиваем максимум 100%

      // Ограничиваем zoom разумными пределами
      const newZoom = Math.max(Math.min(scale * 100, 100), 20); // min 20%, max 100%

      // Вычисляем центр контента
      const centerX = (nodeBounds.left + nodeBounds.right) / 2;
      const centerY = (nodeBounds.top + nodeBounds.bottom) / 2;
      const containerCenterX = containerWidth / 2;
      // Центрируем в доступном пространстве между toolbar и sheets panel
      const containerCenterY = containerHeight / 2;

      // Вычисляем новые значения pan
      const newPanX = containerCenterX - centerX * (newZoom / 100);
      const newPanY = containerCenterY - centerY * (newZoom / 100);

      // Проверяем валидность pan значений
      if (!isFinite(newPanX) || !isFinite(newPanY)) {
        return;
      }

      // Применяем изменения
      setZoom(newZoom);
      setPan({
        x: newPanX,
        y: newPanY
      });
    }
  }, [nodes, botData]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
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
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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
                // pan.x может быть отрицательным (когда холст сдвинут вправо)
                // Формула: client / zoom - pan (вычитаем отрицательный = добавляем)
                const targetX = lastClickPosition.x / (clickTransform.zoom / 100) - clickTransform.pan.x;
                const targetY = lastClickPosition.y / (clickTransform.zoom / 100) - clickTransform.pan.y;
                console.log('📍 Вставка:', {
                  targetX, targetY,
                  click: lastClickPosition,
                  clickTransform,
                  formula: `${lastClickPosition.x} / ${clickTransform.zoom / 100} - ${clickTransform.pan.x} = ${targetX}`
                });
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
            console.log('📋 Ctrl+C pressed:', { selectedNodeId, hasOnNodeDuplicate: !!onNodeDuplicate });
            if (selectedNodeId && onNodeDuplicate) {
              const node = nodes.find(n => n.id === selectedNodeId);
              addAction('duplicate', `Дублирован узел "${node?.type || 'Unknown'}"`);
              onNodeDuplicate(selectedNodeId);
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
              onNodeDuplicate(selectedNodeId);
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
              // pan.x может быть отрицательным (когда холст сдвинут вправо)
              // Формула: client / zoom - pan (вычитаем отрицательный = добавляем)
              const targetX = lastClickPosition.x / (clickTransform.zoom / 100) - clickTransform.pan.x;
              const targetY = lastClickPosition.y / (clickTransform.zoom / 100) - clickTransform.pan.y;
              console.log('📍 Вставка:', {
                targetX, targetY,
                click: lastClickPosition,
                clickTransform,
                formula: `${lastClickPosition.x} / ${clickTransform.zoom / 100} - ${clickTransform.pan.x} = ${targetX}`
              });
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
  }, [zoomIn, zoomOut, resetZoom, fitToContent, onUndo, onRedo, canUndo, canRedo, onSave, isSaving, selectedNodeId, onNodeDelete, onNodeDuplicate, nodes, addAction]);



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

    const componentData = e.dataTransfer.getData('application/json');
    if (!componentData) return;

    const component: ComponentDefinition = JSON.parse(componentData);
    const rect = canvasRef.current?.getBoundingClientRect();

    let nodePosition;

    if (rect) {
      // Transform screen coordinates to canvas coordinates
      const screenX = e.clientX - rect.left - 160; // Adjust for node width  
      const screenY = e.clientY - rect.top - 50;   // Adjust for node height

      // Apply inverse transformation to get canvas coordinates
      const canvasX = (screenX - pan.x) / (zoom / 100);
      const canvasY = (screenY - pan.y) / (zoom / 100);

      // Если координаты разумные (не слишком близко к краю), используем их
      if (canvasX > 20 && canvasY > 20 && canvasX < 10000 && canvasY < 10000) {
        nodePosition = { x: Math.max(50, canvasX), y: Math.max(50, canvasY) };
      } else {
        // Иначе используем центр видимой области
        nodePosition = getCenterPosition();
      }
    } else {
      // Если не удалось получить rect, используем центр
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

  // Обработчик canvas-drop события для touch устройств  
  const handleCanvasDrop = useCallback((e: CustomEvent) => {
    console.log('Canvas drop event received:', e.detail);
    const { component, position } = e.detail;

    if (!component) {
      console.error('Invalid drop data: no component');
      return;
    }

    let nodePosition;

    if (position) {
      // Transform screen coordinates to canvas coordinates
      const canvasX = (position.x - pan.x) / (zoom / 100);
      const canvasY = (position.y - pan.y) / (zoom / 100);

      console.log('Drop position calculation:', {
        screenPos: position,
        pan,
        zoom,
        canvasPos: { x: canvasX, y: canvasY }
      });

      nodePosition = { x: Math.max(0, canvasX - 80), y: Math.max(0, canvasY - 25) };
    } else {
      // Если нет позиции drop, используем центр видимой области
      nodePosition = getCenterPosition();
      console.log('Using center position:', nodePosition);
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

    console.log('Creating new node:', newNode);
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
    const clickPos = { x: e.clientX, y: e.clientY };
    setLastClickPosition(clickPos);
    setClickTransform({ pan: { x: pan.x, y: pan.y }, zoom });
    console.log('🖱️ Клик сохранён:', clickPos, 'transform:', { pan: { x: pan.x, y: pan.y }, zoom });
    
    if (e.target === e.currentTarget) {
      onNodeSelect('');
    }
  }, [onNodeSelect, pan.x, pan.y, zoom]);

  return (
    <main className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      <div className="absolute inset-0 overflow-auto">

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
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
            onNodeMove={onNodeMove}
            onNodeMoveEnd={onNodeMoveEnd}
            onActionLog={(type, description) => addAction(type, description)}
            setIsNodeBeingDragged={setIsNodeBeingDragged}
            onSizeChange={handleNodeSizeChange}
          />

          {/* Drop Zone Hint */}
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
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
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