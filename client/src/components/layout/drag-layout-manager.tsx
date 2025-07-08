import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  GripVertical, 
  Move, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface DragLayoutElement {
  id: string;
  type: 'header' | 'sidebar' | 'canvas' | 'properties';
  title: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  size: number; // процент от общей площади
  visible: boolean;
  locked: boolean;
  content: React.ReactNode;
}

export interface DragLayoutConfig {
  elements: DragLayoutElement[];
  gridSnap: boolean;
  showGrid: boolean;
  compactMode: boolean;
}

const DRAG_TYPE = 'layout-element';
const DROP_ZONES = ['top', 'bottom', 'left', 'right', 'center'] as const;

interface DragLayoutManagerProps {
  headerContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  canvasContent: React.ReactNode;
  propertiesContent: React.ReactNode;
  onLayoutChange?: (config: DragLayoutConfig) => void;
  className?: string;
}

interface DraggableElementProps {
  element: DragLayoutElement;
  isPreview?: boolean;
  onMove?: (elementId: string, newPosition: string) => void;
  onToggleVisibility?: (elementId: string) => void;
  onToggleLock?: (elementId: string) => void;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ 
  element, 
  isPreview = false, 
  onMove, 
  onToggleVisibility, 
  onToggleLock 
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: element.id, type: element.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !element.locked && !isPreview,
  });

  const getPositionIcon = () => {
    switch (element.position) {
      case 'top': return <ArrowUp className="w-4 h-4" />;
      case 'bottom': return <ArrowDown className="w-4 h-4" />;
      case 'left': return <ArrowLeft className="w-4 h-4" />;
      case 'right': return <ArrowRight className="w-4 h-4" />;
      case 'center': return <Maximize2 className="w-4 h-4" />;
      default: return <Move className="w-4 h-4" />;
    }
  };

  const getElementColor = () => {
    switch (element.type) {
      case 'header': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
      case 'sidebar': return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700';
      case 'canvas': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700';
      case 'properties': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
      default: return 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700';
    }
  };

  if (isPreview) {
    return (
      <div className={`
        relative border-2 rounded-lg p-4 transition-all duration-200
        ${getElementColor()}
        ${!element.visible ? 'opacity-50' : ''}
        ${element.locked ? 'ring-2 ring-red-300' : ''}
      `}>
        {element.content}
      </div>
    );
  }

  return (
    <div
      ref={drag}
      className={`
        relative border-2 rounded-lg p-3 cursor-move transition-all duration-200
        ${getElementColor()}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${!element.visible ? 'opacity-50' : ''}
        ${element.locked ? 'cursor-not-allowed ring-2 ring-red-300' : 'hover:shadow-md'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm">{element.title}</span>
          {getPositionIcon()}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility?.(element.id)}
            className="h-6 w-6 p-0"
          >
            {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleLock?.(element.id)}
            className="h-6 w-6 p-0"
          >
            {element.locked ? <Settings className="w-3 h-3" /> : <Move className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      
      <Badge variant="secondary" className="text-xs">
        {element.position} • {element.size}%
      </Badge>
    </div>
  );
};

interface DropZoneProps {
  position: string;
  onDrop: (elementId: string, position: string) => void;
  isActive: boolean;
  children?: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ position, onDrop, isActive, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string; type: string }) => {
      onDrop(item.id, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getDropZoneClasses = () => {
    let classes = 'relative border-2 border-dashed transition-all duration-200 rounded-lg ';
    
    if (isActive) {
      classes += 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 ';
    } else {
      classes += 'border-gray-300 dark:border-gray-600 ';
    }
    
    if (isOver && canDrop) {
      classes += 'border-green-400 bg-green-50 dark:bg-green-900/10 scale-105 ';
    } else if (canDrop) {
      classes += 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 ';
    }
    
    return classes;
  };

  return (
    <div ref={drop} className={getDropZoneClasses()}>
      {children}
      {isOver && canDrop && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-lg">
          <div className="text-green-700 dark:text-green-300 font-medium">
            Отпустите для размещения
          </div>
        </div>
      )}
    </div>
  );
};

const DragLayoutManager: React.FC<DragLayoutManagerProps> = ({
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  onLayoutChange,
  className = ""
}) => {
  const [config, setConfig] = useState<DragLayoutConfig>({
    elements: [
      {
        id: 'header',
        type: 'header',
        title: 'Заголовок',
        position: 'top',
        size: 10,
        visible: true,
        locked: false,
        content: headerContent
      },
      {
        id: 'sidebar',
        type: 'sidebar',
        title: 'Боковая панель',
        position: 'left',
        size: 20,
        visible: true,
        locked: false,
        content: sidebarContent
      },
      {
        id: 'canvas',
        type: 'canvas',
        title: 'Холст',
        position: 'center',
        size: 50,
        visible: true,
        locked: false,
        content: canvasContent
      },
      {
        id: 'properties',
        type: 'properties',
        title: 'Свойства',
        position: 'right',
        size: 20,
        visible: true,
        locked: false,
        content: propertiesContent
      }
    ],
    gridSnap: true,
    showGrid: true,
    compactMode: false
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleElementMove = useCallback((elementId: string, newPosition: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId 
          ? { ...el, position: newPosition as any }
          : el
      )
    }));
  }, []);

  const handleToggleVisibility = useCallback((elementId: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId 
          ? { ...el, visible: !el.visible }
          : el
      )
    }));
  }, []);

  const handleToggleLock = useCallback((elementId: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId 
          ? { ...el, locked: !el.locked }
          : el
      )
    }));
  }, []);

  const handleConfigChange = useCallback((key: keyof DragLayoutConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig({
      elements: [
        {
          id: 'header',
          type: 'header',
          title: 'Заголовок',
          position: 'top',
          size: 10,
          visible: true,
          locked: false,
          content: headerContent
        },
        {
          id: 'sidebar',
          type: 'sidebar',
          title: 'Боковая панель',
          position: 'left',
          size: 20,
          visible: true,
          locked: false,
          content: sidebarContent
        },
        {
          id: 'canvas',
          type: 'canvas',
          title: 'Холст',
          position: 'center',
          size: 50,
          visible: true,
          locked: false,
          content: canvasContent
        },
        {
          id: 'properties',
          type: 'properties',
          title: 'Свойства',
          position: 'right',
          size: 20,
          visible: true,
          locked: false,
          content: propertiesContent
        }
      ],
      gridSnap: true,
      showGrid: true,
      compactMode: false
    });
  }, [headerContent, sidebarContent, canvasContent, propertiesContent]);

  const handleApply = useCallback(() => {
    onLayoutChange?.(config);
    setIsCustomizing(false);
  }, [config, onLayoutChange]);

  const renderCurrentLayout = () => {
    const visibleElements = config.elements.filter(el => el.visible);
    const topElements = visibleElements.filter(el => el.position === 'top');
    const bottomElements = visibleElements.filter(el => el.position === 'bottom');
    const leftElements = visibleElements.filter(el => el.position === 'left');
    const rightElements = visibleElements.filter(el => el.position === 'right');
    const centerElements = visibleElements.filter(el => el.position === 'center');

    return (
      <div className="h-full flex flex-col">
        {/* Верхняя область */}
        {topElements.length > 0 && (
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {topElements.map(element => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  isPreview={previewMode}
                  onMove={handleElementMove}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                />
              ))}
            </div>
          </div>
        )}

        {/* Основная область */}
        <div className="flex-1 flex">
          {/* Левая область */}
          {leftElements.length > 0 && (
            <div className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              <div className="flex flex-col h-full">
                {leftElements.map(element => (
                  <DraggableElement
                    key={element.id}
                    element={element}
                    isPreview={previewMode}
                    onMove={handleElementMove}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleLock={handleToggleLock}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Центральная область */}
          <div className="flex-1">
            {centerElements.map(element => (
              <DraggableElement
                key={element.id}
                element={element}
                isPreview={previewMode}
                onMove={handleElementMove}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
              />
            ))}
          </div>

          {/* Правая область */}
          {rightElements.length > 0 && (
            <div className="flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
              <div className="flex flex-col h-full">
                {rightElements.map(element => (
                  <DraggableElement
                    key={element.id}
                    element={element}
                    isPreview={previewMode}
                    onMove={handleElementMove}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleLock={handleToggleLock}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Нижняя область */}
        {bottomElements.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            <div className="flex">
              {bottomElements.map(element => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  isPreview={previewMode}
                  onMove={handleElementMove}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomizer = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Панель управления */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Настройки макета
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="grid-snap">Привязка к сетке</Label>
                <Switch
                  id="grid-snap"
                  checked={config.gridSnap}
                  onCheckedChange={(checked) => handleConfigChange('gridSnap', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-grid">Показать сетку</Label>
                <Switch
                  id="show-grid"
                  checked={config.showGrid}
                  onCheckedChange={(checked) => handleConfigChange('showGrid', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode">Компактный режим</Label>
                <Switch
                  id="compact-mode"
                  checked={config.compactMode}
                  onCheckedChange={(checked) => handleConfigChange('compactMode', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="preview-mode">Режим предпросмотра</Label>
                <Switch
                  id="preview-mode"
                  checked={previewMode}
                  onCheckedChange={setPreviewMode}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Элементы макета</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {config.elements.map(element => (
                  <DraggableElement
                    key={element.id}
                    element={element}
                    onMove={handleElementMove}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleLock={handleToggleLock}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Область предпросмотра и зоны размещения */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Предпросмотр макета</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 relative">
                {previewMode ? (
                  renderCurrentLayout()
                ) : (
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
                    {/* Зоны размещения */}
                    <div className="col-span-3">
                      <DropZone
                        position="top"
                        onDrop={handleElementMove}
                        isActive={config.elements.some(el => el.position === 'top')}
                      >
                        <div className="p-4 text-center text-sm text-gray-500">
                          Верхняя область
                        </div>
                      </DropZone>
                    </div>
                    
                    <DropZone
                      position="left"
                      onDrop={handleElementMove}
                      isActive={config.elements.some(el => el.position === 'left')}
                    >
                      <div className="p-4 text-center text-sm text-gray-500">
                        Левая
                      </div>
                    </DropZone>
                    
                    <DropZone
                      position="center"
                      onDrop={handleElementMove}
                      isActive={config.elements.some(el => el.position === 'center')}
                    >
                      <div className="p-4 text-center text-sm text-gray-500">
                        Центр
                      </div>
                    </DropZone>
                    
                    <DropZone
                      position="right"
                      onDrop={handleElementMove}
                      isActive={config.elements.some(el => el.position === 'right')}
                    >
                      <div className="p-4 text-center text-sm text-gray-500">
                        Правая
                      </div>
                    </DropZone>
                    
                    <div className="col-span-3">
                      <DropZone
                        position="bottom"
                        onDrop={handleElementMove}
                        isActive={config.elements.some(el => el.position === 'bottom')}
                      >
                        <div className="p-4 text-center text-sm text-gray-500">
                          Нижняя область
                        </div>
                      </DropZone>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={className}>
        {/* Кнопка для открытия настроек */}
        <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Layout className="w-4 h-4" />
              Настроить макет
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Настройка макета интерфейса</DialogTitle>
            </DialogHeader>
            
            {renderCustomizer()}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
              <Button onClick={handleApply}>
                Применить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Текущий макет */}
        {!isCustomizing && renderCurrentLayout()}
      </div>
    </DndProvider>
  );
};

export default DragLayoutManager;