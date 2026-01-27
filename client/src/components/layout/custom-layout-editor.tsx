import React, { useState, useCallback, useMemo, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Layout, 
  Move, 
  RotateCcw, 
  Settings, 
  Grid,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Navigation,
  Sidebar,
  Monitor,
  Sliders,
  Eye,
  EyeOff,
  GripVertical,
  Maximize2,
  Minimize2,
  Save,
  Undo2
} from 'lucide-react';

export interface LayoutElement {
  id: string;
  type: 'header' | 'sidebar' | 'canvas' | 'properties';
  name: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  size: number; // Размер в процентах
  visible: boolean;
  order: number; // Порядок отображения
  content: React.ReactNode;
}

export interface CustomLayoutConfig {
  elements: LayoutElement[];
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  compactMode: boolean;
  lastModified: Date;
}

interface CustomLayoutEditorProps {
  children: React.ReactNode;
  headerContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  canvasContent: React.ReactNode;
  propertiesContent: React.ReactNode;
  onLayoutChange?: (config: CustomLayoutConfig) => void;
}

const DEFAULT_LAYOUT: CustomLayoutConfig = {
  elements: [
    {
      id: 'header',
      type: 'header',
      name: 'Шапка',
      position: 'top',
      size: 8,
      visible: true,
      order: 1,
      content: null
    },
    {
      id: 'sidebar',
      type: 'sidebar',
      name: 'Боковая панель',
      position: 'left',
      size: 20,
      visible: true,
      order: 2,
      content: null
    },
    {
      id: 'canvas',
      type: 'canvas',
      name: 'Холст',
      position: 'center',
      size: 55,
      visible: true,
      order: 3,
      content: null
    },
    {
      id: 'properties',
      type: 'properties',
      name: 'Свойства',
      position: 'right',
      size: 25,
      visible: true,
      order: 4,
      content: null
    }
  ],
  gridSize: 10,
  snapToGrid: true,
  showGrid: false,
  compactMode: false,
  lastModified: new Date()
};

const DRAG_TYPE = 'layout-element';
const DROP_ZONES = ['top', 'bottom', 'left', 'right', 'center'] as const;

// Компонент для перетаскиваемого элемента
const DraggableElement: React.FC<{
  element: LayoutElement;
  isPreview?: boolean;
  onMove?: (elementId: string, position: typeof DROP_ZONES[number]) => void;
}> = ({ element, isPreview = false, onMove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: element.id, type: element.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getIcon = () => {
    switch (element.type) {
      case 'header':
        return <Navigation className="w-4 h-4" />;
      case 'sidebar':
        return <Sidebar className="w-4 h-4" />;
      case 'canvas':
        return <Monitor className="w-4 h-4" />;
      case 'properties':
        return <Sliders className="w-4 h-4" />;
      default:
        return <Layout className="w-4 h-4" />;
    }
  };

  const getPositionIcon = () => {
    switch (element.position) {
      case 'top':
        return <ArrowUp className="w-3 h-3" />;
      case 'bottom':
        return <ArrowDown className="w-3 h-3" />;
      case 'left':
        return <ArrowLeft className="w-3 h-3" />;
      case 'right':
        return <ArrowRight className="w-3 h-3" />;
      case 'center':
        return <Grid className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (isPreview) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          {getIcon()}
          <p className="text-xs font-medium mt-1">{element.name}</p>
          <div className="flex items-center justify-center mt-1">
            {getPositionIcon()}
            <span className="text-xs ml-1">{element.size}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={drag}
      className={`
        p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move
        shadow-sm hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-3 scale-105' : ''}
        ${!element.visible ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          {getIcon()}
          <span className="text-sm font-medium">{element.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {getPositionIcon()}
          <Badge variant="secondary" className="text-xs">
            {element.size}%
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Компонент для зоны сброса
const DropZone: React.FC<{
  position: typeof DROP_ZONES[number];
  onDrop: (elementId: string, position: typeof DROP_ZONES[number]) => void;
  className?: string;
}> = ({ position, onDrop, className = '' }) => {
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

  const getPositionLabel = () => {
    switch (position) {
      case 'top':
        return 'Сверху';
      case 'bottom':
        return 'Снизу';
      case 'left':
        return 'Слева';
      case 'right':
        return 'Справа';
      case 'center':
        return 'Центр';
      default:
        return position;
    }
  };

  const getPositionIcon = () => {
    switch (position) {
      case 'top':
        return <ArrowUp className="w-4 h-4" />;
      case 'bottom':
        return <ArrowDown className="w-4 h-4" />;
      case 'left':
        return <ArrowLeft className="w-4 h-4" />;
      case 'right':
        return <ArrowRight className="w-4 h-4" />;
      case 'center':
        return <Grid className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={drop}
      className={`
        min-h-[60px] border-2 border-dashed rounded-lg transition-all duration-200
        flex items-center justify-center
        ${isOver && canDrop 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${className}
      `}
    >
      <div className="text-center">
        {getPositionIcon()}
        <p className="text-xs font-medium mt-1">{getPositionLabel()}</p>
      </div>
    </div>
  );
};

export const CustomLayoutEditor: React.FC<CustomLayoutEditorProps> = ({
  children,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  onLayoutChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<CustomLayoutConfig>(() => ({
    ...DEFAULT_LAYOUT,
    elements: DEFAULT_LAYOUT.elements.map(element => ({
      ...element,
      content: element.type === 'header' ? headerContent :
               element.type === 'sidebar' ? sidebarContent :
               element.type === 'canvas' ? canvasContent :
               element.type === 'properties' ? propertiesContent : null
    }))
  }));

  const [originalLayout, setOriginalLayout] = useState<CustomLayoutConfig>(currentLayout);

  const handleElementMove = useCallback((elementId: string, newPosition: typeof DROP_ZONES[number]) => {
    setCurrentLayout(prev => ({
      ...prev,
      elements: prev.elements.map(element => 
        element.id === elementId 
          ? { ...element, position: newPosition }
          : element
      ),
      lastModified: new Date()
    }));
  }, []);

  const handleElementResize = useCallback((elementId: string, newSize: number) => {
    setCurrentLayout(prev => ({
      ...prev,
      elements: prev.elements.map(element => 
        element.id === elementId 
          ? { ...element, size: newSize }
          : element
      ),
      lastModified: new Date()
    }));
  }, []);

  const handleElementVisibility = useCallback((elementId: string, visible: boolean) => {
    setCurrentLayout(prev => ({
      ...prev,
      elements: prev.elements.map(element => 
        element.id === elementId 
          ? { ...element, visible }
          : element
      ),
      lastModified: new Date()
    }));
  }, []);

  const handleApplyLayout = useCallback(() => {
    if (onLayoutChange) {
      onLayoutChange(currentLayout);
    }
    setOriginalLayout(currentLayout);
    setIsEditing(false);
  }, [currentLayout, onLayoutChange]);

  const handleCancelEdit = useCallback(() => {
    setCurrentLayout(originalLayout);
    setIsEditing(false);
  }, [originalLayout]);

  const handleResetLayout = useCallback(() => {
    const resetLayout = {
      ...DEFAULT_LAYOUT,
      elements: DEFAULT_LAYOUT.elements.map(element => ({
        ...element,
        content: element.type === 'header' ? headerContent :
                 element.type === 'sidebar' ? sidebarContent :
                 element.type === 'canvas' ? canvasContent :
                 element.type === 'properties' ? propertiesContent : null
      }))
    };
    setCurrentLayout(resetLayout);
  }, [headerContent, sidebarContent, canvasContent, propertiesContent]);

  // Генерация стилей для текущего макета
  const generateLayoutStyles = useMemo(() => {
    const visibleElements = currentLayout.elements.filter(el => el.visible);
    const headerEl = visibleElements.find(el => el.type === 'header');
    const sidebarEl = visibleElements.find(el => el.type === 'sidebar');
    const canvasEl = visibleElements.find(el => el.type === 'canvas');
    const propertiesEl = visibleElements.find(el => el.type === 'properties');

    // Создаем CSS Grid areas на основе позиций
    const gridAreas = {
      top: visibleElements.filter(el => el.position === 'top').map(el => el.id),
      left: visibleElements.filter(el => el.position === 'left').map(el => el.id),
      center: visibleElements.filter(el => el.position === 'center').map(el => el.id),
      right: visibleElements.filter(el => el.position === 'right').map(el => el.id),
      bottom: visibleElements.filter(el => el.position === 'bottom').map(el => el.id),
    };

    return {
      container: {
        display: 'grid',
        height: '100vh',
        gridTemplateAreas: `
          "${gridAreas.top.join(' ')}"
          "${gridAreas.left.join(' ')} ${gridAreas.center.join(' ')} ${gridAreas.right.join(' ')}"
          "${gridAreas.bottom.join(' ')}"
        `,
        gridTemplateRows: `${headerEl?.position === 'top' ? headerEl.size + '%' : 'auto'} 1fr ${headerEl?.position === 'bottom' ? headerEl.size + '%' : 'auto'}`,
        gridTemplateColumns: `${sidebarEl?.position === 'left' ? sidebarEl.size + '%' : 'auto'} 1fr ${propertiesEl?.position === 'right' ? propertiesEl.size + '%' : 'auto'}`,
      },
      elements: visibleElements.reduce((acc, el) => {
        acc[el.id] = {
          gridArea: el.id,
          minHeight: el.type === 'header' ? '60px' : '200px',
          overflow: 'hidden'
        };
        return acc;
      }, {} as Record<string, React.CSSProperties>)
    };
  }, [currentLayout]);

  const renderCurrentLayout = () => {
    if (isEditing) return children;

    const visibleElements = currentLayout.elements.filter(el => el.visible);
    
    return (
      <div style={generateLayoutStyles.container}>
        {visibleElements.map(element => (
          <div
            key={element.id}
            style={generateLayoutStyles.elements[element.id]}
            className="bg-background border border-border"
          >
            {element.content}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col">
        {/* Панель управления макетом */}
        <div className="flex-shrink-0 bg-background border-b border-border p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Layout className="w-4 h-4 mr-2" />
                {isEditing ? 'Режим редактирования' : 'Настроить макет'}
              </Button>
              
              {isEditing && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApplyLayout}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Применить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <Undo2 className="w-4 h-4 mr-2" />
                    Отменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetLayout}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Сбросить
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                Последнее изменение: {currentLayout.lastModified.toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="h-full flex">
              {/* Панель редактирования */}
              <div className="w-80 bg-background border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold mb-2">Редактор макета</h3>
                  <p className="text-sm text-muted-foreground">
                    Перетащите элементы в нужные позиции
                  </p>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  {/* Список элементов */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium">Элементы интерфейса</h4>
                    {currentLayout.elements.map(element => (
                      <div key={element.id} className="space-y-2">
                        <DraggableElement
                          element={element}
                          onMove={handleElementMove}
                        />
                        
                        {/* Настройки элемента */}
                        <div className="pl-4 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`visible-${element.id}`}
                              checked={element.visible}
                              onCheckedChange={(checked) => handleElementVisibility(element.id, checked)}
                            />
                            <Label htmlFor={`visible-${element.id}`} className="text-xs">
                              Видимый
                            </Label>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Размер: {element.size}%</Label>
                            <Slider
                              value={[element.size]}
                              onValueChange={(value) => handleElementResize(element.id, value[0])}
                              max={50}
                              min={10}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Зоны сброса */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Зоны размещения</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {DROP_ZONES.map(zone => (
                        <DropZone
                          key={zone}
                          position={zone}
                          onDrop={handleElementMove}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Предварительный просмотр */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
                <div className="h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg relative">
                  <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium">
                    Предварительный просмотр
                  </div>
                  <div className="h-full p-6 pt-10">
                    <div style={generateLayoutStyles.container}>
                      {currentLayout.elements.filter(el => el.visible).map(element => (
                        <div
                          key={element.id}
                          style={generateLayoutStyles.elements[element.id]}
                          className="border border-gray-200 dark:border-gray-700 rounded"
                        >
                          <DraggableElement element={element} isPreview />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            renderCurrentLayout()
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default CustomLayoutEditor;