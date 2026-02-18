import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  GripVertical,
  RotateCcw,
  Layout,
  Eye,
  EyeOff,
  Lock,
  Unlock} from 'lucide-react';

/**
 * @interface DraggableLayoutConfig
 * @description Конфигурация перетаскиваемого макета
 * @property {LayoutElement[]} elements - Массив элементов макета
 * @property {number} gridSize - Размер сетки для привязки
 * @property {boolean} snapToGrid - Включить привязку к сетке
 * @property {boolean} showGrid - Показывать сетку
 * @property {boolean} lockElements - Заблокировать элементы
 * @property {boolean} previewMode - Режим предпросмотра
 */
export interface DraggableLayoutConfig {
  elements: LayoutElement[];
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  lockElements: boolean;
  previewMode: boolean;
}

/**
 * @interface LayoutElement
 * @description Описывает элемент макета
 * @property {string} id - Уникальный идентификатор элемента
 * @property {'header' | 'sidebar' | 'canvas' | 'properties'} type - Тип элемента
 * @property {{x: number; y: number}} position - Позиция элемента
 * @property {{width: number; height: number}} size - Размер элемента
 * @property {boolean} visible - Видимость элемента
 * @property {boolean} locked - Заблокирован ли элемент
 * @property {number} zIndex - Z-индекс элемента
 * @property {{width: number; height: number}} minSize - Минимальный размер элемента
 * @property {{width: number; height: number}} maxSize - Максимальный размер элемента
 * @property {boolean} resizable - Можно ли изменять размер элемента
 * @property {boolean} draggable - Можно ли перетаскивать элемент
 * @property {React.ReactNode} [content] - Контент элемента
 */
export interface LayoutElement {
  id: string;
  type: 'header' | 'sidebar' | 'canvas' | 'properties';
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  zIndex: number;
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  resizable: boolean;
  draggable: boolean;
  content?: React.ReactNode;
}

const DEFAULT_ELEMENTS: LayoutElement[] = [
  {
    id: 'header',
    type: 'header',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 60 },
    visible: true,
    locked: false,
    zIndex: 1000,
    minSize: { width: 200, height: 40 },
    maxSize: { width: 2000, height: 100 },
    resizable: true,
    draggable: true,
  },
  {
    id: 'sidebar',
    type: 'sidebar',
    position: { x: 0, y: 60 },
    size: { width: 280, height: 80 },
    visible: true,
    locked: false,
    zIndex: 100,
    minSize: { width: 200, height: 200 },
    maxSize: { width: 600, height: 2000 },
    resizable: true,
    draggable: true,
  },
  {
    id: 'canvas',
    type: 'canvas',
    position: { x: 280, y: 60 },
    size: { width: 60, height: 80 },
    visible: true,
    locked: false,
    zIndex: 1,
    minSize: { width: 300, height: 200 },
    maxSize: { width: 2000, height: 2000 },
    resizable: true,
    draggable: true,
  },
  {
    id: 'properties',
    type: 'properties',
    position: { x: 75, y: 60 },
    size: { width: 25, height: 80 },
    visible: true,
    locked: false,
    zIndex: 100,
    minSize: { width: 200, height: 200 },
    maxSize: { width: 500, height: 2000 },
    resizable: true,
    draggable: true,
  },
];

interface DraggableElementProps {
  element: LayoutElement;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  previewMode: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  onMove,
  onResize,
  onToggleVisibility,
  onToggleLock,
  gridSize,
  snapToGrid,
  previewMode,
  containerRef
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'layout-element',
    item: { id: element.id, type: element.type },
    canDrag: element.draggable && !element.locked && !previewMode,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'layout-element',
    hover: (item: { id: string; type: string }, monitor) => {
      if (!elementRef.current || !containerRef.current) return;
      
      const draggedElement = item;
      if (draggedElement.id === element.id) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = clientOffset.x - containerRect.left;
      const relativeY = clientOffset.y - containerRect.top;

      let newX = (relativeX / containerRect.width) * 100;
      let newY = (relativeY / containerRect.height) * 100;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      onMove(draggedElement.id, { x: newX, y: newY });
    },
  });

  drag(drop(elementRef));

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (element.locked || previewMode || !element.resizable) return;
    
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
    });
  }, [element.locked, element.resizable, element.size, previewMode]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    let newWidth = resizeStart.width + (deltaX / containerRect.width) * 100;
    let newHeight = resizeStart.height + (deltaY / containerRect.height) * 100;

    // Применяем ограничения размера
    newWidth = Math.max(element.minSize.width, Math.min(element.maxSize.width, newWidth));
    newHeight = Math.max(element.minSize.height, Math.min(element.maxSize.height, newHeight));

    if (snapToGrid) {
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
    }

    onResize(element.id, { width: newWidth, height: newHeight });
  }, [isResizing, resizeStart, element.minSize, element.maxSize, element.id, onResize, snapToGrid, gridSize, containerRef]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
    return () => {};
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  if (!element.visible) return null;

  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    width: `${element.size.width}%`,
    height: `${element.size.height}%`,
    zIndex: element.zIndex,
    opacity: isDragging ? 0.5 : 1,
    cursor: element.locked ? 'not-allowed' : element.draggable ? 'move' : 'default',
  };

  return (
    <div
      ref={elementRef}
      style={elementStyle}
      className={`
        border-2 border-dashed transition-all duration-200
        ${element.locked ? 'border-gray-400' : 'border-blue-500'}
        ${isDragging ? 'scale-105' : ''}
        ${previewMode ? 'border-transparent' : ''}
        bg-white dark:bg-gray-800 rounded-lg shadow-lg
        ${element.locked ? 'opacity-75' : ''}
      `}
    >
      {/* Header Controls */}
      {!previewMode && (
        <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-t-lg">
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3" />
            <span className="font-medium capitalize">{element.type}</span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(element.size.width)}x{Math.round(element.size.height)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleVisibility(element.id)}
              className="p-1 hover:bg-gray-600 rounded"
              title="Переключить видимость"
            >
              {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={() => onToggleLock(element.id)}
              className="p-1 hover:bg-gray-600 rounded"
              title="Заблокировать/разблокировать"
            >
              {element.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="h-full p-4 flex items-center justify-center">
        {element.content || (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Layout className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium capitalize">{element.type}</p>
            <p className="text-xs opacity-75">
              {Math.round(element.position.x)}, {Math.round(element.position.y)}
            </p>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {!previewMode && element.resizable && !element.locked && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl-lg hover:bg-blue-600 transition-colors"
          onMouseDown={handleResizeStart}
          title="Изменить размер"
        />
      )}
    </div>
  );
};

interface DraggableLayoutProps {
  elements: LayoutElement[];
  config: DraggableLayoutConfig;
  onElementMove: (id: string, position: { x: number; y: number }) => void;
  onElementResize: (id: string, size: { width: number; height: number }) => void;
  onElementToggleVisibility: (id: string) => void;
  onElementToggleLock: (id: string) => void;
  onConfigChange: (config: Partial<DraggableLayoutConfig>) => void;
  children?: React.ReactNode;
}

export const DraggableLayout: React.FC<DraggableLayoutProps> = ({
  elements,
  config,
  onElementMove,
  onElementResize,
  onElementToggleVisibility,
  onElementToggleLock,
  onConfigChange,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const gridStyle = config.showGrid ? {
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `,
    backgroundSize: `${config.gridSize}% ${config.gridSize}%`,
  } : {};

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Controls */}
        {!config.previewMode && (
          <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  id="preview-mode"
                  checked={config.previewMode}
                  onCheckedChange={(checked) => onConfigChange({ previewMode: checked })}
                />
                <Label htmlFor="preview-mode">Режим предпросмотра</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="snap-to-grid"
                  checked={config.snapToGrid}
                  onCheckedChange={(checked) => onConfigChange({ snapToGrid: checked })}
                />
                <Label htmlFor="snap-to-grid">Привязка к сетке</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="show-grid"
                  checked={config.showGrid}
                  onCheckedChange={(checked) => onConfigChange({ showGrid: checked })}
                />
                <Label htmlFor="show-grid">Показать сетку</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="lock-elements"
                  checked={config.lockElements}
                  onCheckedChange={(checked) => onConfigChange({ lockElements: checked })}
                />
                <Label htmlFor="lock-elements">Заблокировать все</Label>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Сброс к умолчанию
                  onConfigChange({ 
                    elements: DEFAULT_ELEMENTS,
                    gridSize: 5,
                    snapToGrid: true,
                    showGrid: true,
                    lockElements: false,
                    previewMode: false
                  });
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
            </div>
          </div>
        )}

        {/* Layout Container */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900"
          style={gridStyle}
        >
          {elements.map((element) => (
            <DraggableElement
              key={element.id}
              element={element}
              onMove={onElementMove}
              onResize={onElementResize}
              onToggleVisibility={onElementToggleVisibility}
              onToggleLock={onElementToggleLock}
              gridSize={config.gridSize}
              snapToGrid={config.snapToGrid}
              showGrid={config.showGrid}
              previewMode={config.previewMode}
              containerRef={containerRef}
            />
          ))}
          {children}
        </div>
      </div>
    </DndProvider>
  );
};

/**
 * @function useDraggableLayout
 * @description Хук для управления перетаскиваемым макетом
 * Обеспечивает состояние и методы для работы с конфигурацией макета
 * @returns {Object} Объект с состоянием и методами управления макетом
 * @returns {DraggableLayoutConfig} return.config - Текущая конфигурация макета
 * @returns {Function} return.updateConfig - Функция обновления конфигурации
 * @returns {Function} return.moveElement - Функция перемещения элемента
 * @returns {Function} return.resizeElement - Функция изменения размера элемента
 * @returns {Function} return.toggleElementVisibility - Функция переключения видимости элемента
 * @returns {Function} return.toggleElementLock - Функция переключения блокировки элемента
 * @returns {Function} return.resetLayout - Функция сброса макета
 */
export const useDraggableLayout = () => {
  const [config, setConfig] = useState<DraggableLayoutConfig>({
    elements: DEFAULT_ELEMENTS,
    gridSize: 5,
    snapToGrid: true,
    showGrid: true,
    lockElements: false,
    previewMode: false,
  });

  /**
   * @function updateConfig
   * @description Обновляет конфигурацию макета
   * @param {Partial<DraggableLayoutConfig>} newConfig - Новая конфигурация
   * @returns {void}
   */
  const updateConfig = useCallback((newConfig: Partial<DraggableLayoutConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * @function updateElement
   * @description Обновляет элемент макета
   * @param {string} id - Идентификатор элемента
   * @param {Partial<LayoutElement>} updates - Обновления элемента
   * @returns {void}
   */
  const updateElement = useCallback((id: string, updates: Partial<LayoutElement>) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  }, []);

  /**
   * @function moveElement
   * @description Перемещает элемент макета
   * @param {string} id - Идентификатор элемента
   * @param {{x: number; y: number}} position - Новая позиция элемента
   * @returns {void}
   */
  const moveElement = useCallback((id: string, position: { x: number; y: number }) => {
    updateElement(id, { position });
  }, [updateElement]);

  /**
   * @function resizeElement
   * @description Изменяет размер элемента макета
   * @param {string} id - Идентификатор элемента
   * @param {{width: number; height: number}} size - Новый размер элемента
   * @returns {void}
   */
  const resizeElement = useCallback((id: string, size: { width: number; height: number }) => {
    updateElement(id, { size });
  }, [updateElement]);

  /**
   * @function toggleElementVisibility
   * @description Переключает видимость элемента макета
   * @param {string} id - Идентификатор элемента
   * @returns {void}
   */
  const toggleElementVisibility = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, visible: !el.visible } : el
      )
    }));
  }, []);

  /**
   * @function toggleElementLock
   * @description Переключает блокировку элемента макета
   * @param {string} id - Идентификатор элемента
   * @returns {void}
   */
  const toggleElementLock = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, locked: !el.locked } : el
      )
    }));
  }, []);

  /**
   * @function resetLayout
   * @description Сбрасывает макет к значению по умолчанию
   * @returns {void}
   */
  const resetLayout = useCallback(() => {
    setConfig({
      elements: DEFAULT_ELEMENTS,
      gridSize: 5,
      snapToGrid: true,
      showGrid: true,
      lockElements: false,
      previewMode: false,
    });
  }, []);

  return {
    config,
    updateConfig,
    moveElement,
    resizeElement,
    toggleElementVisibility,
    toggleElementLock,
    resetLayout,
  };
};