import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DraggableLayout, useDraggableLayout, LayoutElement } from './draggable-layout';
import { 
  Layout, 
  Move, 
  Settings, 
  Grid, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';

interface LayoutCustomizerProps {
  headerContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  canvasContent: React.ReactNode;
  propertiesContent: React.ReactNode;
  onLayoutChange?: (elements: LayoutElement[]) => void;
}

export const LayoutCustomizer: React.FC<LayoutCustomizerProps> = ({
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  onLayoutChange
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const {
    config,
    updateConfig,
    moveElement,
    resizeElement,
    toggleElementVisibility,
    toggleElementLock,
    resetLayout
  } = useDraggableLayout();

  // Создаем элементы с реальным контентом
  const elementsWithContent = config.elements.map(element => ({
    ...element,
    content: (() => {
      switch (element.type) {
        case 'header':
          return headerContent;
        case 'sidebar':
          return sidebarContent;
        case 'canvas':
          return canvasContent;
        case 'properties':
          return propertiesContent;
        default:
          return null;
      }
    })()
  }));

  const handleApplyLayout = useCallback(() => {
    if (onLayoutChange) {
      onLayoutChange(elementsWithContent);
    }
    setIsCustomizing(false);
  }, [elementsWithContent, onLayoutChange]);

  const handleToggleCustomizer = useCallback(() => {
    setIsCustomizing(!isCustomizing);
  }, [isCustomizing]);

  const visibleElements = elementsWithContent.filter(el => el.visible);
  const lockedElements = elementsWithContent.filter(el => el.locked);

  return (
    <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleToggleCustomizer}>
          <Move className="w-4 h-4 mr-2" />
          Настроить расположение
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Настройка расположения интерфейса
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="customize" className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customize">Настройка</TabsTrigger>
              <TabsTrigger value="elements">Элементы</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="customize" className="flex-1 m-0">
            <div className="h-[600px] flex flex-col">
              <DraggableLayout
                elements={elementsWithContent}
                config={config}
                onElementMove={moveElement}
                onElementResize={resizeElement}
                onElementToggleVisibility={toggleElementVisibility}
                onElementToggleLock={toggleElementLock}
                onConfigChange={updateConfig}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="elements" className="flex-1 m-0 p-6">
            <div className="space-y-6">
              {/* Статистика */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Всего элементов</p>
                        <p className="text-lg font-bold">{elementsWithContent.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Видимые</p>
                        <p className="text-lg font-bold">{visibleElements.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Заблокированные</p>
                        <p className="text-lg font-bold">{lockedElements.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Сетка</p>
                        <p className="text-lg font-bold">{config.gridSize}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Список элементов */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Управление элементами</h3>
                
                {elementsWithContent.map((element) => (
                  <Card key={element.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Layout className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">{element.type}</h4>
                            <p className="text-sm text-gray-500">
                              {Math.round(element.position.x)}%, {Math.round(element.position.y)}% • 
                              {Math.round(element.size.width)}×{Math.round(element.size.height)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={element.visible ? "default" : "secondary"}>
                            {element.visible ? "Видимый" : "Скрытый"}
                          </Badge>
                          <Badge variant={element.locked ? "destructive" : "outline"}>
                            {element.locked ? "Заблокирован" : "Разблокирован"}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleElementVisibility(element.id)}
                          >
                            {element.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleElementLock(element.id)}
                          >
                            {element.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Быстрые действия */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Быстрые действия</h3>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      elementsWithContent.forEach(el => {
                        toggleElementVisibility(el.id);
                      });
                    }}
                  >
                    {visibleElements.length === elementsWithContent.length ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Скрыть все
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Показать все
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      elementsWithContent.forEach(el => {
                        toggleElementLock(el.id);
                      });
                    }}
                  >
                    {lockedElements.length === elementsWithContent.length ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Разблокировать все
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Заблокировать все
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateConfig({ previewMode: !config.previewMode })}
                  >
                    {config.previewMode ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Режим редактирования
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Режим предпросмотра
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetLayout}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Сбросить
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Кнопки действий */}
        <div className="flex justify-between items-center p-6 pt-0 border-t">
          <div className="flex items-center gap-2">
            <Switch
              id="live-preview"
              checked={config.previewMode}
              onCheckedChange={(checked) => updateConfig({ previewMode: checked })}
            />
            <Label htmlFor="live-preview">Режим предпросмотра</Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCustomizing(false)}>
              Отмена
            </Button>
            <Button onClick={handleApplyLayout}>
              Применить расположение
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayoutCustomizer;