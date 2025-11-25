import { useRef, useCallback, useState, useEffect } from 'react';
import { CanvasNode } from '@/components/ui/canvas-node';
import { ConnectionsLayer } from '@/components/ui/connections-layer';
import { TemporaryConnection } from '@/components/ui/temporary-connection';
import { ConnectionSuggestions } from '@/components/ui/connection-suggestions';
import { AutoConnectionPanel } from '@/components/ui/auto-connection-panel';
import { CanvasSheets } from '@/components/ui/canvas-sheets';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Navigation, Sidebar, Sliders, Monitor, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { Node, ComponentDefinition, Connection } from '@/types/bot';
import { BotDataWithSheets, CanvasSheet } from '@shared/schema';
import { generateAutoConnections } from '@/utils/auto-connection';
import { ConnectionManager } from '@/utils/connection-manager';
import { SheetsManager } from '@/utils/sheets-manager';
import { applyTemplateLayout } from '@/utils/hierarchical-layout';
import { nanoid } from 'nanoid';

interface CanvasProps {
  // Новая система листов (опциональные для совместимости)
  botData?: BotDataWithSheets;
  onBotDataUpdate?: (data: BotDataWithSheets) => void;

  // Существующие пропсы для совместимости
  nodes: Node[];
  connections: Connection[];
  selectedNodeId: string | null;
  selectedConnectionId?: string;
  onNodeSelect: (nodeId: string) => void;
  onNodeAdd: (node: Node) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDuplicate?: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionSelect?: (connectionId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
  onConnectionAdd?: (connection: Connection) => void;
  onNodesUpdate?: (nodes: Node[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  onCopyToClipboard?: (nodeIds: string[]) => void;
  onPasteFromClipboard?: () => void;
  hasClipboardData?: boolean;

  // Глобальное состояние перетаскивания узлов
  isNodeBeingDragged?: boolean;
  setIsNodeBeingDragged?: (isDragging: boolean) => void;

  // Кнопки управления интерфейсом
  onToggleHeader?: () => void;
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
  onToggleCanvas?: () => void;
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  propertiesVisible?: boolean;
  canvasVisible?: boolean;

  // Мобильные функции
  onOpenMobileSidebar?: () => void;
  onOpenMobileProperties?: () => void;

  // Передача размеров узлов для иерархического макета
  onNodeSizesChange?: (nodeSizes: Map<string, { width: number; height: number }>) => void;
}

export function Canvas({ 
  botData,
  onBotDataUpdate,
  nodes, 
  connections,
  selectedNodeId,
  selectedConnectionId,
  onNodeSelect, 
  onNodeAdd, 
  onNodeDelete,
  onNodeDuplicate,
  onNodeMove,
  onConnectionSelect,
  onConnectionDelete,
  onConnectionAdd,
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
  onOpenMobileSidebar,
  onOpenMobileProperties,
  onNodeSizesChange
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isDragOver, setIsDragOver] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    handle: 'source' | 'target';
  } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [showAutoPanel, setShowAutoPanel] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  // Touch состояние для мобильного управления
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [initialPinchZoom, setInitialPinchZoom] = useState(100);

  // Состояние для хранения реальных размеров узлов
  const [nodeSizes, setNodeSizes] = useState<Map<string, { width: number; height: number }>>(new Map());

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
  const activeSheet = botData ? SheetsManager.getActiveSheet(botData) : null;

  // Получение всех узлов со всех листов для отображения связей между листами
  const getAllNodesFromAllSheets = useCallback(() => {
    if (!botData?.sheets) return [];
    const allNodes: Node[] = [];
    botData.sheets.forEach(sheet => {
      if (sheet.nodes) {
        allNodes.push(...sheet.nodes);
      }
    });
    return allNodes;
  }, [botData]);

  // Обработчики для работы с листами
  const handleSheetSelect = useCallback((sheetId: string) => {
    if (!botData || !onBotDataUpdate) return;

    // ВАЖНО: Сначала сохраняем текущее состояние редактора в активный лист
    let dataWithCurrentSheetSaved = botData;
    if (botData.activeSheetId) {
      dataWithCurrentSheetSaved = SheetsManager.updateSheetData(
        botData, 
        botData.activeSheetId, 
        nodes, 
        connections
      );
    }

    // Затем переключаемся на новый лист
    const updatedData = SheetsManager.setActiveSheet(dataWithCurrentSheetSaved, sheetId);
    onBotDataUpdate(updatedData);
  }, [botData, onBotDataUpdate, nodes, connections]);

  const handleSheetAdd = useCallback((name: string) => {
    if (!botData || !onBotDataUpdate) return;

    // Сохраняем текущее состояние перед добавлением нового листа
    let dataWithCurrentSheetSaved = botData;
    if (botData.activeSheetId) {
      dataWithCurrentSheetSaved = SheetsManager.updateSheetData(
        botData, 
        botData.activeSheetId, 
        nodes, 
        connections
      );
    }

    const updatedData = SheetsManager.addSheet(dataWithCurrentSheetSaved, name);
    onBotDataUpdate(updatedData);
  }, [botData, onBotDataUpdate, nodes, connections]);

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
          nodes, 
          connections
        );
      }

      const updatedData = SheetsManager.duplicateSheetInProject(dataWithCurrentSheetSaved, sheetId);
      onBotDataUpdate(updatedData);
    } catch (error) {
      console.error('Ошибка дублирования листа:', error);
    }
  }, [botData, onBotDataUpdate, nodes, connections]);

  // Zoom utility functions
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 1));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setZoom(Math.max(Math.min(level, 200), 1));
  }, []);

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

  // Функция автоматической раскладки узлов
  const autoArrange = useCallback(() => {
    if (nodes.length === 0) return;
    
    console.log('🎯 Применяем автоматическую раскладку для', nodes.length, 'узлов');
    
    // Применяем иерархическую раскладку с центрированием узлов
    const arrangedNodes = applyTemplateLayout(
      nodes,
      connections,
      undefined, // templateName не используется для общей раскладки
      nodeSizes
    );
    
    // Обновляем позиции узлов
    if (onNodesUpdate) {
      onNodesUpdate(arrangedNodes);
      console.log('✅ Автоматическая раскладка применена');
    }
  }, [nodes, connections, nodeSizes, onNodesUpdate]);

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
      const containerWidth = scrollContainer ? scrollContainer.clientWidth - 64 : window.innerWidth - 64; // -64 для padding
      const containerHeight = scrollContainer ? scrollContainer.clientHeight - 64 : window.innerHeight - 64;

      // Проверяем размеры контейнера
      if (containerWidth <= 0 || containerHeight <= 0) {
        return;
      }

      // Вычисляем масштаб с отступами
      const scaleX = (containerWidth * 0.8) / contentWidth;
      const scaleY = (containerHeight * 0.8) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1.5); // Ограничиваем max zoom до 150%

      // Ограничиваем zoom разумными пределами
      const newZoom = Math.max(Math.min(scale * 100, 150), 50); // min 50%, max 150%

      // Вычисляем центр контента
      const centerX = (nodeBounds.left + nodeBounds.right) / 2;
      const centerY = (nodeBounds.top + nodeBounds.bottom) / 2;
      const containerCenterX = containerWidth / 2;
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
  }, [nodes]);

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

  // Вспомогательная функция для расчета расстояния между двумя точками touch
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Получение центра между двумя касаниями
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  // Обработка touch событий для мобильного управления
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Проверяем, не происходит ли касание на узле или перетаскивается ли уже узел
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('[data-canvas-node]');

    // Если касание на узле или уже перетаскивается узел, не начинаем панорамирование холста
    if (isOnNode || isNodeBeingDragged) {
      return;
    }

    // Предотвращаем default действия браузера
    e.preventDefault();

    const touches = e.touches;

    if (touches.length === 1) {
      // Одно касание - панорамирование
      const touch = touches[0];
      setIsTouchPanning(true);
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setLastTouchPosition(pan);
    } else if (touches.length === 2) {
      // Два касания - масштабирование
      const distance = getTouchDistance(touches);
      setLastPinchDistance(distance);
      setInitialPinchZoom(zoom);
      setIsTouchPanning(false); // Отключаем панорамирование при pinch
    }
  }, [pan, zoom, isNodeBeingDragged]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Проверяем, не происходит ли касание на узле или перетаскивается ли узел
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('[data-canvas-node]');

    // Если касание на узле или перетаскивается узел, не панорамируем холст
    if (isOnNode || isNodeBeingDragged) {
      return;
    }

    e.preventDefault();

    const touches = e.touches;

    if (touches.length === 1 && isTouchPanning) {
      // Панорамирование одним пальцем
      const touch = touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      setPan({
        x: lastTouchPosition.x + deltaX,
        y: lastTouchPosition.y + deltaY
      });
    } else if (touches.length === 2) {
      // Pinch zoom двумя пальцами
      const currentDistance = getTouchDistance(touches);
      const center = getTouchCenter(touches);

      if (lastPinchDistance > 0) {
        const scaleFactor = currentDistance / lastPinchDistance;
        const newZoom = Math.max(Math.min(initialPinchZoom * scaleFactor, 200), 10);

        // Масштабирование относительно центра касания
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = center.x - rect.left;
          const centerY = center.y - rect.top;

          const zoomRatio = newZoom / zoom;

          setPan(prev => ({
            x: centerX - (centerX - prev.x) * zoomRatio,
            y: centerY - (centerY - prev.y) * zoomRatio
          }));

          setZoom(newZoom);
        }
      }
    }
  }, [isTouchPanning, touchStart, lastTouchPosition, lastPinchDistance, initialPinchZoom, zoom, isNodeBeingDragged]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 0) {
      // Все касания завершены
      setIsTouchPanning(false);
      setLastPinchDistance(0);
    } else if (e.touches.length === 1) {
      // Осталось одно касание - возможно продолжение панорамирования
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setLastTouchPosition(pan);
      setIsTouchPanning(true);
      setLastPinchDistance(0);
    }
  }, [pan]);

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
          onNodeDelete(selectedNodeId);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
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
            e.preventDefault();
            if (e.shiftKey && onRedo && canRedo) {
              onRedo();
            } else if (onUndo && canUndo) {
              onUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (onRedo && canRedo) {
              onRedo();
            }
            break;
          case 's':
            e.preventDefault();
            if (onSave && !isSaving) {
              onSave();
            }
            break;
          case 'c':
            e.preventDefault();
            if (e.shiftKey && selectedNodeId && onCopyToClipboard) {
              // Shift+Ctrl+C - копировать в межпроектный буфер обмена
              onCopyToClipboard([selectedNodeId]);
            } else if (selectedNodeId && onNodeDuplicate) {
              // Ctrl+C - дублировать в текущем проекте
              onNodeDuplicate(selectedNodeId);
            }
            break;
          case 'd':
            e.preventDefault();
            if (selectedNodeId && onNodeDuplicate) {
              onNodeDuplicate(selectedNodeId);
            }
            break;
          case 'v':
            e.preventDefault();
            if (e.shiftKey && onPasteFromClipboard) {
              // Shift+Ctrl+V - вставить из межпроектного буфера обмена
              onPasteFromClipboard();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom, fitToContent, onUndo, onRedo, canUndo, canRedo, onSave, isSaving, selectedNodeId, onNodeDelete, onNodeDuplicate]);



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

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
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

    onNodeAdd(newNode);
  }, [onNodeAdd, pan, zoom, getCenterPosition]);

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
    onNodeAdd(newNode);
  }, [onNodeAdd, pan, zoom, getCenterPosition]);

  // Handle canvas-drop событие для touch устройств
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('canvas-drop', handleCanvasDrop as EventListener);
      return () => canvasElement.removeEventListener('canvas-drop', handleCanvasDrop as EventListener);
    }
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
    if (e.target === e.currentTarget) {
      onNodeSelect('');
      onConnectionSelect?.('');
      setConnectionStart(null);
    }
  }, [onNodeSelect, onConnectionSelect]);

  // Отслеживание движения мыши для предварительного просмотра соединения
  useEffect(() => {
    if (!connectionStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectionStart(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectionStart]);

  const handleConnectionStart = useCallback((nodeId: string, handle: 'source' | 'target') => {
    if (connectionStart) {
      // Если уже есть начало соединения, пытаемся завершить его
      if (connectionStart.nodeId !== nodeId) {
        const sourceId = connectionStart.handle === 'source' ? connectionStart.nodeId : nodeId;
        const targetId = connectionStart.handle === 'source' ? nodeId : connectionStart.nodeId;

        // Используем ConnectionManager для создания соединения
        const connectionManager = new ConnectionManager({
          nodes,
          connections,
          autoButtonCreation
        });

        try {
          const { connection, updatedNodes } = connectionManager.createConnection(sourceId, targetId, {
            autoCreateButton: autoButtonCreation
          });

          onConnectionAdd?.(connection);
          if (onNodesUpdate) {
            onNodesUpdate(updatedNodes);
          }
        } catch (error) {
          console.error('Ошибка при создании соединения:', error);
        }
      }
      setConnectionStart(null);
    } else {
      // Начинаем новое соединение
      setConnectionStart({ nodeId, handle });
    }
  }, [connectionStart, onConnectionAdd, onNodesUpdate, nodes, connections, autoButtonCreation]);

  const handleCreateSuggestedConnection = useCallback((source: string, target: string) => {
    const newConnection: Connection = {
      id: nanoid(),
      source,
      target,
      isInterSheet: false,
      isAutoGenerated: false,
    };
    onConnectionAdd?.(newConnection);
    setShowSuggestions(false);
  }, [onConnectionAdd]);

  const handleAutoConnect = useCallback(() => {
    const suggestions = generateAutoConnections(nodes, connections);
    const bestSuggestion = suggestions.find(s => s.confidence > 0.8);

    if (bestSuggestion) {
      handleCreateSuggestedConnection(bestSuggestion.source, bestSuggestion.target);
    } else {
      setShowSuggestions(true);
    }
  }, [nodes, connections, handleCreateSuggestedConnection]);

  // Обновленные обработчики для ConnectionsLayer
  const handleConnectionClick = useCallback((connectionId: string) => {
    onConnectionSelect?.(connectionId);
  }, [onConnectionSelect]);

  const handleDeleteConnection = useCallback((connectionId: string) => {
    onConnectionDelete?.(connectionId);
  }, [onConnectionDelete]);

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
            cursor: isPanning ? 'grabbing' : 'grab'
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
          <div 
            className="relative origin-top-left transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Connections Layer */}
            <ConnectionsLayer
              connections={connections}
              nodes={nodes}
              selectedConnectionId={selectedConnectionId}
              onConnectionSelect={handleConnectionClick}
              onConnectionDelete={handleDeleteConnection}
            />

            {/* Temporary connection preview */}
            {connectionStart && (
              <TemporaryConnection
                startNode={nodes.find(n => n.id === connectionStart.nodeId)!}
                endPosition={{
                  x: (mousePosition.x - pan.x) / (zoom / 100),
                  y: (mousePosition.y - pan.y) / (zoom / 100)
                }}
                handle={connectionStart.handle}
              />
            )}

            {/* Nodes */}
            {nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                allNodes={botData ? getAllNodesFromAllSheets() : nodes}
                isSelected={selectedNodeId === node.id}
                onClick={() => onNodeSelect(node.id)}
                onDelete={() => onNodeDelete(node.id)}
                onDuplicate={onNodeDuplicate ? () => onNodeDuplicate(node.id) : undefined}
                onMove={(position) => onNodeMove(node.id, position)}
                onConnectionStart={handleConnectionStart}
                connectionStart={connectionStart}
                zoom={zoom}
                pan={pan}
                setIsNodeBeingDragged={setIsNodeBeingDragged}
                onSizeChange={handleNodeSizeChange}
              />
            ))}
          </div>

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

          {/* Smart Connection Tools */}
          {nodes.length > 1 && (
            <div className="absolute bottom-24 right-4 flex flex-col space-y-2 z-20">
              {/* Auto Connection Panel */}
              <Popover open={showAutoPanel} onOpenChange={setShowAutoPanel}>
                <PopoverTrigger asChild>
                  <Button
                    className="rounded-full w-10 h-10 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    title="Управление автосоединениями"
                  >
                    <i className="fas fa-magic text-white text-sm" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-auto p-0">
                  <AutoConnectionPanel
                    nodes={nodes}
                    connections={connections}
                    onConnectionAdd={(connection) => onConnectionAdd?.(connection)}
                    onNodesUpdate={(updatedNodes) => onNodesUpdate?.(updatedNodes)}
                    autoButtonCreation={autoButtonCreation}
                    onAutoButtonCreationChange={setAutoButtonCreation}
                  />
                </PopoverContent>
              </Popover>

              {/* Auto-connect button */}
              <Button
                onClick={handleAutoConnect}
                className="rounded-full w-10 h-10 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                title="Быстрое автосоединение"
              >
                <i className="fas fa-bolt text-white text-sm" />
              </Button>

              {/* Connection suggestions */}
              <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full w-10 h-10 shadow-md hover:shadow-lg transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
                    title="Рекомендации соединений"
                  >
                    <i className="fas fa-lightbulb text-yellow-500 text-sm" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-80 p-0">
                  <ConnectionSuggestions
                    nodes={nodes}
                    connections={connections}
                    onCreateConnection={handleCreateSuggestedConnection}
                  />
                </PopoverContent>
              </Popover>

              {/* Clear connections button */}
              {connections.length > 0 && (
                <Button
                  onClick={() => {
                    connections.forEach(conn => onConnectionDelete?.(conn.id));
                  }}
                  variant="outline"
                  className="rounded-full w-10 h-10 shadow-md hover:shadow-lg transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Очистить все соединения"
                >
                  <i className="fas fa-eraser text-red-500 text-sm" />
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Панель инструментов - фиксированная панель вверху */}
      <div className="absolute top-0 z-40 pointer-events-none w-full transition-all duration-300" style={{
        left: 0,
        right: 0
      }}>
        <div className="flex items-center gap-3 relative z-50 w-full px-4 py-3 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-600/50 shadow-lg shadow-slate-300/10 dark:shadow-black/20 pointer-events-auto">
          <div className={`flex items-center canvas-controls overflow-x-auto w-full gap-2 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>

            <div className={`flex items-center flex-shrink-0 gap-2`}>
              {/* Кнопки масштаба */}
              <button 
                onClick={zoomOut}
                disabled={zoom <= 1}
                className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed`}
                title="Уменьшить масштаб (Ctrl + -)"
              >
                <i className="fas fa-search-minus text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-center"></i>
              </button>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`flex-shrink-0 px-2 py-0 h-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 text-slate-700 dark:text-slate-300 font-mono text-xs group flex items-center gap-1`}
                    title="Выбрать масштаб"
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <span>{Math.round(zoom)}%</span>
                      <i className="fas fa-chevron-down text-xs opacity-50 group-hover:opacity-100 transition-opacity"></i>
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="w-40 p-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 py-1">Быстрый масштаб</div>
                    {[1, 5, 10, 25, 50, 75, 100, 125, 150, 200].map((level) => (
                      <button
                        key={level}
                        onClick={() => setZoomLevel(level)}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                          Math.abs(zoom - level) < 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{level}%</span>
                          {level === 100 && <span className="text-xs opacity-60">По умолчанию</span>}
                          {level === 200 && <span className="text-xs opacity-60">Максимум</span>}
                          {level === 1 && <span className="text-xs opacity-60">Минимум</span>}
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 dark:border-slate-600 my-1"></div>
                    <button
                      onClick={resetZoom}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
                    >
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-home text-xs"></i>
                        <span>Сбросить вид</span>
                      </div>
                    </button>
                    <button
                      onClick={fitToContent}
                      disabled={nodes.length === 0}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-green-600 dark:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-expand-arrows-alt text-xs"></i>
                        <span>Уместить всё</span>
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <button 
                onClick={zoomIn}
                disabled={zoom >= 200}
                className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
                title="Увеличить масштаб (Ctrl + +)"
              >
                <i className="fas fa-search-plus text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
              </button>
              <button 
                onClick={fitToContent}
                disabled={nodes.length === 0}
                className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
                title="Уместить в экран (Ctrl + 1)"
              >
                <i className="fas fa-expand-arrows-alt text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
              </button>

              {/* Кнопка автоматической раскладки */}
              <button 
                onClick={autoArrange}
                disabled={nodes.length === 0}
                className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
                title="Автоматическая раскладка (центрирует узлы между родителями)"
              >
                <i className="fas fa-magic text-slate-600 dark:text-slate-400 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"></i>
              </button>

              <button 
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
                title="Отменить действие (Ctrl + Z)"
              >
                <i className="fas fa-undo text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
              </button>

              <button 
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
                title="Повторить действие (Ctrl + Y)"
              >
                <i className="fas fa-redo text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
              </button>

              {/* История действий */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center`}
                    title="История действий"
                  >
                    <i className="fas fa-history text-slate-600 dark:text-slate-400 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"></i>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="w-64 p-3">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">История действий</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400">Отмена:</span>
                        <span className={canUndo ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-600 opacity-50'}>
                          {canUndo ? 'Доступно' : 'Недоступно'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400">Повтор:</span>
                        <span className={canRedo ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-600 opacity-50'}>
                          {canRedo ? 'Доступно' : 'Недоступно'}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                        <p className="text-slate-500 dark:text-slate-400 opacity-70">Используйте Ctrl+Z и Ctrl+Y для быстрого доступа</p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {onSave && (
                <button 
                  onClick={onSave}
                  disabled={isSaving}
                  className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center`}
                  title="Сохранить проект (Ctrl + S)"
                >
                  {isSaving ? (
                    <i className="fas fa-spinner fa-spin text-slate-600 dark:text-slate-400 text-sm"></i>
                  ) : (
                    <i className="fas fa-save text-slate-600 dark:text-slate-400 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"></i>
                  )}
                </button>
              )}

              {/* Межпроектное копирование/вставка */}
              {onCopyToClipboard && selectedNodeId && (
                <button 
                  onClick={() => onCopyToClipboard([selectedNodeId])}
                  className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center`}
                  title="Копировать в буфер (Shift + Ctrl + C)"
                >
                  <i className="fas fa-clipboard text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
                </button>
              )}

              {onPasteFromClipboard && hasClipboardData && (
                <button 
                  onClick={onPasteFromClipboard}
                  className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center`}
                  title="Вставить из буфера (Shift + Ctrl + V)"
                >
                  <i className="fas fa-paste text-slate-600 dark:text-slate-400 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"></i>
                </button>
              )}

              {/* Разделитель */}
              <div className="h-6 w-px bg-slate-300/50 dark:bg-slate-600/50"></div>

              {/* Кнопки управления интерфейсом - показываем только когда шапка скрыта */}
              {headerVisible === false && (onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas) && (
                <div className="flex items-center gap-2">
                  {onToggleHeader && (
                    <button
                      onClick={onToggleHeader}
                      className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl transition-colors duration-200 flex items-center justify-center border ${
                        headerVisible 
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                          : 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 text-slate-600 dark:text-slate-400 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50'
                      }`}
                      title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  )}

                  {onToggleSidebar && (
                    <button
                      onClick={onToggleSidebar}
                      className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl transition-colors duration-200 flex items-center justify-center border ${
                        sidebarVisible 
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                          : 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 text-slate-600 dark:text-slate-400 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50'
                      }`}
                      title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
                    >
                      <Sidebar className="w-4 h-4" />
                    </button>
                  )}

                  {onToggleCanvas && (
                    <button
                      onClick={onToggleCanvas}
                      className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl transition-colors duration-200 flex items-center justify-center border ${
                        canvasVisible 
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                          : 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 text-slate-600 dark:text-slate-400 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50'
                      }`}
                      title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  )}

                  {onToggleProperties && (
                    <button
                      onClick={onToggleProperties}
                      className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl transition-colors duration-200 flex items-center justify-center border ${
                        propertiesVisible 
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                          : 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 text-slate-600 dark:text-slate-400 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50'
                      }`}
                      title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Zoom Info and Help */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {zoom !== 100 && (
                <div className="bg-slate-200/60 dark:bg-slate-700/50 backdrop-blur-md rounded-xl border border-slate-300/50 dark:border-slate-600/50 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-info-circle text-blue-500"></i>
                    <span>
                      {zoom > 100 ? 'Увеличено' : 'Уменьшено'} до {Math.round(zoom)}%
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span>Ctrl+0 для сброса</span>
                  </div>
                </div>
              )}

              {/* Zoom Help */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={`flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center`}>
                    <i className="fas fa-question-circle text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-500 transition-colors"></i>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="w-64 p-3">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Управление масштабом</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Увеличить:</span>
                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + +</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Уменьшить:</span>
                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + -</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Сбросить:</span>
                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + 0</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Уместить всё:</span>
                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + 1</code>
                      </div>
                      <div className="border-t border-gray-200 dark:border-slate-600 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Масштабирование:</span>
                          <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + колесо</code>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Панорамирование:</span>
                          <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Alt + ЛКМ</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Компонент листов холста - фиксированная панель внизу */}
      {botData && botData.sheets && botData.sheets.length > 0 && onBotDataUpdate && (
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto">
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