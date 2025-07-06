import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Node, Connection } from '@shared/schema';
import { 
  analyzeLayoutStructure, 
  calculateAutoHierarchy, 
  animatedAdaptiveLayout, 
  createAdaptiveLayout,
  LayoutConfig,
  LayoutAnalysis
} from '@/utils/auto-hierarchy';

interface AutoHierarchySettingsProps {
  nodes: Node[];
  connections: Connection[];
  onApplyLayout: (nodes: Node[]) => void;
  onPreviewLayout?: (nodes: Node[]) => void;
  onCancelPreview?: () => void;
  zoom?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  viewportCenterX?: number;
  viewportCenterY?: number;
}

export function AutoHierarchySettings({
  nodes,
  connections,
  onApplyLayout,
  onPreviewLayout,
  onCancelPreview,
  zoom = 100,
  viewportWidth = 1200,
  viewportHeight = 800,
  viewportCenterX = 600,
  viewportCenterY = 400
}: AutoHierarchySettingsProps) {
  const [open, setOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [analysis, setAnalysis] = useState<LayoutAnalysis | null>(null);
  
  // Layout configuration state
  const [config, setConfig] = useState<LayoutConfig>({
    algorithm: 'hierarchical',
    levelSpacing: 320, // Увеличен для учета новых границ элементов
    nodeSpacing: 280, // Увеличенный отступ для предотвращения перекрытий
    startX: 120, // Увеличен стартовый отступ
    startY: 120, // Увеличен стартовый отступ
    nodeWidth: 160, // Стандартный размер узла
    nodeHeight: 100, // Стандартный размер узла
    preventOverlaps: true,
    centerAlign: true,
    compactLayout: false,
    respectNodeTypes: true,
    zoom,
    viewportWidth,
    viewportHeight,
    viewportCenterX,
    viewportCenterY
  });

  // Update config when viewport changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      zoom,
      viewportWidth,
      viewportHeight,
      viewportCenterX,
      viewportCenterY
    }));
  }, [zoom, viewportWidth, viewportHeight, viewportCenterX, viewportCenterY]);

  // Analyze structure when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const structureAnalysis = analyzeLayoutStructure(nodes, connections);
      setAnalysis(structureAnalysis);
      
      // Update recommended algorithm
      setConfig(prev => ({
        ...prev,
        algorithm: structureAnalysis.recommendedAlgorithm
      }));
    }
  }, [nodes, connections]);

  const handlePreview = useCallback(() => {
    if (!onPreviewLayout) return;
    
    const previewNodes = calculateAutoHierarchy(nodes, connections, config);
    onPreviewLayout(previewNodes);
    setIsPreviewMode(true);
  }, [nodes, connections, config, onPreviewLayout]);

  const handleCancelPreview = useCallback(() => {
    if (onCancelPreview) {
      onCancelPreview();
    }
    setIsPreviewMode(false);
  }, [onCancelPreview]);

  const handleApply = useCallback(() => {
    const layoutNodes = calculateAutoHierarchy(nodes, connections, config);
    onApplyLayout(layoutNodes);
    setIsPreviewMode(false);
    setOpen(false);
  }, [nodes, connections, config, onApplyLayout]);

  const handleAnimatedApply = useCallback(() => {
    animatedAdaptiveLayout(
      nodes,
      connections,
      onApplyLayout,
      1200,
      config
    );
    setIsPreviewMode(false);
    setOpen(false);
  }, [nodes, connections, config, onApplyLayout]);

  const handleQuickLayout = useCallback((algorithm: LayoutConfig['algorithm']) => {
    const quickConfig = { ...config, algorithm };
    const layoutNodes = calculateAutoHierarchy(nodes, connections, quickConfig);
    onApplyLayout(layoutNodes);
  }, [nodes, connections, config, onApplyLayout]);

  const getAlgorithmDescription = (algorithm: LayoutConfig['algorithm']) => {
    switch (algorithm) {
      case 'hierarchical':
        return 'Размещает узлы по уровням сверху вниз, идеально для последовательных процессов';
      case 'force':
        return 'Использует физические силы для естественного размещения, подходит для сложных связей';
      case 'circular':
        return 'Размещает узлы по кругу, хорошо для равнозначных элементов';
      case 'tree':
        return 'Создает древовидную структуру, оптимально для ветвящихся процессов';
      case 'grid':
        return 'Равномерная сетка, идеально для несвязанных элементов';
      case 'organic':
        return 'Естественное размещение с учетом типов узлов';
      default:
        return '';
    }
  };

  const getComplexityBadge = () => {
    if (!analysis) return null;
    
    let complexity = 'Простая';
    let variant: 'default' | 'secondary' | 'destructive' = 'default';
    
    if (analysis.totalNodes > 15 || analysis.maxDepth > 5 || analysis.avgBranchingFactor > 3) {
      complexity = 'Сложная';
      variant = 'destructive';
    } else if (analysis.totalNodes > 8 || analysis.maxDepth > 3 || analysis.avgBranchingFactor > 2) {
      complexity = 'Средняя';
      variant = 'secondary';
    }
    
    return <Badge variant={variant}>{complexity}</Badge>;
  };

  if (nodes.length === 0) {
    return (
      <Button disabled className="opacity-50" title="Нет узлов для размещения">
        <i className="fas fa-cog mr-2"></i>
        Настройки
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <i className="fas fa-cog"></i>
          Настройки
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-cog text-blue-600 dark:text-blue-400"></i>
            Настройки автоматической иерархии
            {getComplexityBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Viewport Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Информация о холсте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {zoom}%
                  </div>
                  <div className="text-muted-foreground">Масштаб</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {viewportWidth}
                  </div>
                  <div className="text-muted-foreground">Ширина</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {viewportHeight}
                  </div>
                  <div className="text-muted-foreground">Высота</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {nodes.length}
                  </div>
                  <div className="text-muted-foreground">Узлов</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Анализ структуры</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.totalNodes}
                    </div>
                    <div className="text-muted-foreground">Узлов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analysis.maxDepth}
                    </div>
                    <div className="text-muted-foreground">Уровней</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {analysis.avgBranchingFactor.toFixed(1)}
                    </div>
                    <div className="text-muted-foreground">Ветвления</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {analysis.disconnectedNodes.length}
                    </div>
                    <div className="text-muted-foreground">Изолир.</div>
                  </div>
                </div>
                
                {analysis.hasCircularReferences && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span className="text-sm font-medium">
                        Обнаружены циклические связи
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <i className="fas fa-lightbulb text-blue-500"></i>
                  <span>Рекомендуется: <strong>{config.algorithm}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="algorithms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="algorithms">Алгоритмы</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            </TabsList>

            {/* Algorithms Tab */}
            <TabsContent value="algorithms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['hierarchical', 'force', 'circular', 'tree', 'grid', 'organic'] as const).map((algorithm) => (
                  <Card 
                    key={algorithm}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      config.algorithm === algorithm ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, algorithm }))}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm capitalize">{algorithm}</CardTitle>
                        {config.algorithm === algorithm && (
                          <Badge variant="default">Выбран</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {getAlgorithmDescription(algorithm)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLayout(algorithm);
                        }}
                      >
                        Применить
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="level-spacing">Расстояние между уровнями: {config.levelSpacing}px</Label>
                    <Slider
                      id="level-spacing"
                      min={150}
                      max={500}
                      step={50}
                      value={[config.levelSpacing]}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, levelSpacing: value[0] }))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="node-spacing">Расстояние между узлами: {config.nodeSpacing}px</Label>
                    <Slider
                      id="node-spacing"
                      min={100}
                      max={400}
                      step={20}
                      value={[config.nodeSpacing]}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, nodeSpacing: value[0] }))}
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prevent-overlaps">Предотвращать наложения</Label>
                    <Switch
                      id="prevent-overlaps"
                      checked={config.preventOverlaps}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, preventOverlaps: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="center-align">Центрировать</Label>
                    <Switch
                      id="center-align"
                      checked={config.centerAlign}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, centerAlign: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-layout">Компактное размещение</Label>
                    <Switch
                      id="compact-layout"
                      checked={config.compactLayout}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, compactLayout: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="respect-node-types">Учитывать типы узлов</Label>
                    <Switch
                      id="respect-node-types"
                      checked={config.respectNodeTypes}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, respectNodeTypes: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-4">
                  <Button onClick={handlePreview} variant="outline">
                    <i className="fas fa-eye mr-2"></i>
                    Предпросмотр
                  </Button>
                  
                  {isPreviewMode && (
                    <Button onClick={handleCancelPreview} variant="outline">
                      <i className="fas fa-times mr-2"></i>
                      Отменить предпросмотр
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Предпросмотр покажет, как будут расположены узлы без применения изменений
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleApply}>
              <i className="fas fa-check mr-2"></i>
              Применить
            </Button>
            <Button onClick={handleAnimatedApply}>
              <i className="fas fa-magic mr-2"></i>
              Применить с анимацией
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}