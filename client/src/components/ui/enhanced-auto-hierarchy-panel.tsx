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

interface EnhancedAutoHierarchyPanelProps {
  nodes: Node[];
  connections: Connection[];
  onApplyLayout: (nodes: Node[]) => void;
  onPreviewLayout?: (nodes: Node[]) => void;
  onCancelPreview?: () => void;
}

export function EnhancedAutoHierarchyPanel({
  nodes,
  connections,
  onApplyLayout,
  onPreviewLayout,
  onCancelPreview
}: EnhancedAutoHierarchyPanelProps) {
  const [open, setOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [analysis, setAnalysis] = useState<LayoutAnalysis | null>(null);
  
  // Layout configuration state
  const [config, setConfig] = useState<LayoutConfig>({
    algorithm: 'hierarchical',
    levelSpacing: 300,
    nodeSpacing: 180,
    startX: 100,
    startY: 100,
    nodeWidth: 160,
    nodeHeight: 100,
    preventOverlaps: true,
    centerAlign: true,
    compactLayout: false,
    respectNodeTypes: true
  });

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
        <i className="fas fa-sitemap mr-2"></i>
        Автоиерархия
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <i className="fas fa-sitemap"></i>
          Автоиерархия
          {analysis && (
            <Badge variant="outline" className="ml-1">
              {analysis.totalNodes}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-sitemap text-blue-600 dark:text-blue-400"></i>
            Автоматическая иерархия элементов
            {getComplexityBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">Быстрые алгоритмы</TabsTrigger>
              <TabsTrigger value="advanced">Настройки</TabsTrigger>
              <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            </TabsList>

            {/* Quick Algorithms */}
            <TabsContent value="quick" className="space-y-4">
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
                        <CardTitle className="text-sm capitalize">
                          {algorithm === 'hierarchical' && '📊 Иерархический'}
                          {algorithm === 'force' && '⚡ Физический'}
                          {algorithm === 'circular' && '🔄 Круговой'}
                          {algorithm === 'tree' && '🌳 Древовидный'}
                          {algorithm === 'grid' && '⬜ Сетчатый'}
                          {algorithm === 'organic' && '🌿 Органический'}
                        </CardTitle>
                        {algorithm === analysis?.recommendedAlgorithm && (
                          <Badge variant="outline" className="text-xs">
                            Рекомендуется
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        {getAlgorithmDescription(algorithm)}
                      </CardDescription>
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
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

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Алгоритм размещения</Label>
                  <Select 
                    value={config.algorithm} 
                    onValueChange={(value: LayoutConfig['algorithm']) => 
                      setConfig(prev => ({ ...prev, algorithm: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hierarchical">Иерархический</SelectItem>
                      <SelectItem value="force">Физический</SelectItem>
                      <SelectItem value="circular">Круговой</SelectItem>
                      <SelectItem value="tree">Древовидный</SelectItem>
                      <SelectItem value="grid">Сетчатый</SelectItem>
                      <SelectItem value="organic">Органический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Расстояние между уровнями: {config.levelSpacing}px</Label>
                  <Slider
                    value={[config.levelSpacing]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, levelSpacing: value }))}
                    min={200}
                    max={500}
                    step={25}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Расстояние между узлами: {config.nodeSpacing}px</Label>
                  <Slider
                    value={[config.nodeSpacing]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, nodeSpacing: value }))}
                    min={120}
                    max={300}
                    step={20}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Размер узла: {config.nodeWidth}×{config.nodeHeight}px</Label>
                  <div className="flex gap-2">
                    <Slider
                      value={[config.nodeWidth]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, nodeWidth: value }))}
                      min={120}
                      max={240}
                      step={20}
                      className="flex-1"
                    />
                    <Slider
                      value={[config.nodeHeight]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, nodeHeight: value }))}
                      min={80}
                      max={140}
                      step={20}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prevent-overlaps">Предотвращать наложения</Label>
                  <Switch
                    id="prevent-overlaps"
                    checked={config.preventOverlaps}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, preventOverlaps: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="center-align">Центрировать</Label>
                  <Switch
                    id="center-align"
                    checked={config.centerAlign}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, centerAlign: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-layout">Компактная компоновка</Label>
                  <Switch
                    id="compact-layout"
                    checked={config.compactLayout}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, compactLayout: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="respect-types">Учитывать типы узлов</Label>
                  <Switch
                    id="respect-types"
                    checked={config.respectNodeTypes}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, respectNodeTypes: checked }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Предварительный просмотр</CardTitle>
                  <CardDescription>
                    Посмотрите как будет выглядеть компоновка перед применением
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={handlePreview} disabled={isPreviewMode}>
                      <i className="fas fa-eye mr-2"></i>
                      Показать предпросмотр
                    </Button>
                    {isPreviewMode && (
                      <Button variant="outline" onClick={handleCancelPreview}>
                        <i className="fas fa-times mr-2"></i>
                        Отменить
                      </Button>
                    )}
                  </div>
                  
                  {isPreviewMode && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <i className="fas fa-info-circle"></i>
                        <span className="text-sm">
                          Режим предпросмотра активен. Нажмите "Применить" для сохранения изменений.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleApply}>
                <i className="fas fa-check mr-2"></i>
                Применить
              </Button>
              <Button onClick={handleAnimatedApply}>
                <i className="fas fa-magic mr-2"></i>
                Применить с анимацией
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}