import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Layout, 
  Settings, 
  RotateCcw, 
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Navigation,
  Sidebar,
  Monitor,
  Sliders,
  Grid,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

export interface SimpleLayoutElement {
  id: string;
  type: 'header' | 'sidebar' | 'canvas' | 'properties';
  name: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  size: number;
  visible: boolean;
}

export interface SimpleLayoutConfig {
  elements: SimpleLayoutElement[];
  compactMode: boolean;
  showGrid: boolean;
}

interface SimpleLayoutCustomizerProps {
  config: SimpleLayoutConfig;
  onConfigChange: (config: SimpleLayoutConfig) => void;
  children?: React.ReactNode;
}

const DEFAULT_CONFIG: SimpleLayoutConfig = {
  elements: [
    {
      id: 'header',
      type: 'header',
      name: 'Шапка',
      position: 'top',
      size: 8,
      visible: true
    },
    {
      id: 'sidebar',
      type: 'sidebar',
      name: 'Боковая панель',
      position: 'left',
      size: 20,
      visible: true
    },
    {
      id: 'canvas',
      type: 'canvas',
      name: 'Холст',
      position: 'center',
      size: 55,
      visible: true
    },
    {
      id: 'properties',
      type: 'properties',
      name: 'Свойства',
      position: 'right',
      size: 25,
      visible: true
    }
  ],
  compactMode: false,
  showGrid: true
};

export const SimpleLayoutCustomizer: React.FC<SimpleLayoutCustomizerProps> = ({
  config,
  onConfigChange,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SimpleLayoutConfig>(config);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SimpleLayoutElement>) => {
    setTempConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId
          ? { ...element, ...updates }
          : element
      )
    }));
  }, []);

  const handleApply = useCallback(() => {
    onConfigChange(tempConfig);
    setIsOpen(false);
  }, [tempConfig, onConfigChange]);

  const handleCancel = useCallback(() => {
    setTempConfig(config);
    setIsOpen(false);
  }, [config]);

  const handleReset = useCallback(() => {
    setTempConfig(DEFAULT_CONFIG);
  }, []);

  const handleQuickToggle = useCallback((elementId: string) => {
    const newConfig = {
      ...config,
      elements: config.elements.map(element =>
        element.id === elementId
          ? { ...element, visible: !element.visible }
          : element
      )
    };
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const handleQuickMove = useCallback((elementId: string, position: SimpleLayoutElement['position']) => {
    const newConfig = {
      ...config,
      elements: config.elements.map(element =>
        element.id === elementId
          ? { ...element, position }
          : element
      )
    };
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const getIcon = (type: string) => {
    switch (type) {
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

  const getPositionIcon = (position: string) => {
    switch (position) {
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

  return (
    <div className="relative">
      {/* Быстрые кнопки управления */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {/* Быстрые переключатели */}
        <div className="flex items-center space-x-1 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1">
          {config.elements.map(element => (
            <Button
              key={element.id}
              variant={element.visible ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickToggle(element.id)}
              className="h-8 w-8 p-0"
              title={`${element.visible ? 'Скрыть' : 'Показать'} ${element.name}`}
            >
              {getIcon(element.type)}
            </Button>
          ))}
        </div>

        {/* Кнопка настроек */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Настройки макета
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Настройка макета интерфейса</DialogTitle>
            </DialogHeader>
            
            <div className="flex h-[600px] gap-4">
              {/* Панель настроек */}
              <div className="w-80 flex flex-col">
                <div className="flex-1 overflow-auto space-y-4">
                  {/* Элементы интерфейса */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Элементы интерфейса</h3>
                    {tempConfig.elements.map(element => (
                      <Card key={element.id} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getIcon(element.type)}
                              <span className="font-medium">{element.name}</span>
                            </div>
                            <Switch
                              checked={element.visible}
                              onCheckedChange={(checked) => 
                                handleElementUpdate(element.id, { visible: checked })
                              }
                            />
                          </div>
                          
                          {element.visible && (
                            <div className="space-y-2">
                              <div>
                                <Label className="text-sm">Позиция</Label>
                                <Select
                                  value={element.position}
                                  onValueChange={(value) => 
                                    handleElementUpdate(element.id, { position: value as any })
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="top">Сверху</SelectItem>
                                    <SelectItem value="bottom">Снизу</SelectItem>
                                    <SelectItem value="left">Слева</SelectItem>
                                    <SelectItem value="right">Справа</SelectItem>
                                    <SelectItem value="center">Центр</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label className="text-sm">Размер: {element.size}%</Label>
                                <Slider
                                  value={[element.size]}
                                  onValueChange={(value) => 
                                    handleElementUpdate(element.id, { size: value[0] })
                                  }
                                  max={80}
                                  min={5}
                                  step={5}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Общие настройки */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Общие настройки</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="compact"
                        checked={tempConfig.compactMode}
                        onCheckedChange={(checked) => 
                          setTempConfig(prev => ({ ...prev, compactMode: checked }))
                        }
                      />
                      <Label htmlFor="compact">Компактный режим</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="grid"
                        checked={tempConfig.showGrid}
                        onCheckedChange={(checked) => 
                          setTempConfig(prev => ({ ...prev, showGrid: checked }))
                        }
                      />
                      <Label htmlFor="grid">Показывать сетку</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Пресеты */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Быстрые пресеты</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const preset = {
                            ...tempConfig,
                            elements: tempConfig.elements.map(el => ({
                              ...el,
                              position: el.type === 'header' ? 'bottom' as const : el.position
                            }))
                          };
                          setTempConfig(preset);
                        }}
                      >
                        Шапка снизу
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const preset = {
                            ...tempConfig,
                            elements: tempConfig.elements.map(el => ({
                              ...el,
                              visible: el.type === 'canvas' || el.type === 'header'
                            }))
                          };
                          setTempConfig(preset);
                        }}
                      >
                        Минимальный
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Кнопки действий */}
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Сброс
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApply}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Применить
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Предварительный просмотр */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg relative">
                  <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium">
                    Предварительный просмотр
                  </div>
                  <div className="h-full p-6 pt-10">
                    <div className="h-full grid gap-2" style={{
                      gridTemplateAreas: `
                        "${tempConfig.elements.find(e => e.position === 'top' && e.visible)?.id || '.'}"
                        "${tempConfig.elements.find(e => e.position === 'left' && e.visible)?.id || '.'} ${tempConfig.elements.find(e => e.position === 'center' && e.visible)?.id || '.'} ${tempConfig.elements.find(e => e.position === 'right' && e.visible)?.id || '.'}"
                        "${tempConfig.elements.find(e => e.position === 'bottom' && e.visible)?.id || '.'}"
                      `,
                      gridTemplateRows: `${tempConfig.elements.find(e => e.position === 'top' && e.visible)?.size || 0}px 1fr ${tempConfig.elements.find(e => e.position === 'bottom' && e.visible)?.size || 0}px`,
                      gridTemplateColumns: `${tempConfig.elements.find(e => e.position === 'left' && e.visible)?.size || 0}px 1fr ${tempConfig.elements.find(e => e.position === 'right' && e.visible)?.size || 0}px`,
                    }}>
                      {tempConfig.elements.filter(e => e.visible).map(element => (
                        <div
                          key={element.id}
                          style={{ gridArea: element.id }}
                          className="border border-gray-200 dark:border-gray-700 rounded flex items-center justify-center bg-white dark:bg-gray-800"
                        >
                          <div className="text-center">
                            {getIcon(element.type)}
                            <p className="text-xs font-medium mt-1">{element.name}</p>
                            <div className="flex items-center justify-center mt-1">
                              {getPositionIcon(element.position)}
                              <span className="text-xs ml-1">{element.size}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Основной контент */}
      <div className="h-screen">
        {children}
      </div>
    </div>
  );
};

export default SimpleLayoutCustomizer;