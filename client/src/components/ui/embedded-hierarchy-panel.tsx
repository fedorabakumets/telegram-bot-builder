import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Node, Connection } from '@shared/schema';
import { 
  calculateAutoHierarchy,
  analyzeLayoutStructure 
} from '@/utils/auto-hierarchy';
import { Sparkles, Zap, Circle, GitBranch, Grid, Flower } from 'lucide-react';

interface EmbeddedHierarchyPanelProps {
  nodes: Node[];
  connections: Connection[];
  onApplyLayout: (nodes: Node[]) => void;
  onApplyLayoutWithConnections: (nodes: Node[], connections: Connection[]) => void;
}

export function EmbeddedHierarchyPanel({
  nodes,
  connections,
  onApplyLayout,
  onApplyLayoutWithConnections,
}: EmbeddedHierarchyPanelProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('hierarchical');
  const [spacing, setSpacing] = useState(200);
  const [centerNodes, setCenterNodes] = useState(true);
  const [preventOverlaps, setPreventOverlaps] = useState(true);

  // Анализ структуры
  const analysis = analyzeLayoutStructure(nodes, connections);
  
  const algorithms = [
    {
      id: 'auto',
      name: 'Автоматический',
      description: 'Умная компоновка на основе структуры',
      icon: Sparkles,
      color: 'text-blue-500',
      recommended: true
    },
    {
      id: 'hierarchical',
      name: 'Иерархический',
      description: 'Размещение по уровням сверху вниз',
      icon: GitBranch,
      color: 'text-purple-500',
      recommended: analysis.maxDepth > 2
    },
    {
      id: 'compact',
      name: 'Компактный',
      description: 'Минимальные расстояния между узлами',
      icon: Grid,
      color: 'text-green-500',
      recommended: nodes.length > 8
    },
    {
      id: 'spaced',
      name: 'Просторный',
      description: 'Увеличенные расстояния для лучшей читаемости',
      icon: Circle,
      color: 'text-yellow-500',
      recommended: nodes.length <= 5
    }
  ];

  const handleApplyAlgorithm = async (algorithmId: string) => {
    if (nodes.length === 0) return;

    const settings = {
      levelSpacing: algorithmId === 'compact' ? 150 : algorithmId === 'spaced' ? 300 : spacing,
      nodeSpacing: algorithmId === 'compact' ? 150 : algorithmId === 'spaced' ? 250 : 200,
      centerNodes,
      preventOverlaps,
      viewportWidth: 1200,
      viewportHeight: 800,
      viewportCenterX: 600,
      viewportCenterY: 400
    };

    const layoutedNodes = calculateAutoHierarchy(nodes, connections, settings);
    onApplyLayout(layoutedNodes);
  };

  const getRecommendedAlgorithm = () => {
    return algorithms.find(a => a.recommended) || algorithms[0];
  };

  const stats = {
    nodeCount: nodes.length,
    connectionCount: connections.length,
    complexity: Math.min(Math.round((nodes.length + connections.length * 2) / 5), 10),
    isolatedNodes: analysis.disconnectedNodes || 0,
    depth: analysis.maxDepth || 1
  };

  return (
    <div className="space-y-6 p-4">
      {/* Статистика */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Анализ структуры
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Узлов:</span>
                <Badge variant="outline">{stats.nodeCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Связей:</span>
                <Badge variant="outline">{stats.connectionCount}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Глубина:</span>
                <Badge variant="outline">{stats.depth}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Сложность:</span>
                <Badge 
                  variant={stats.complexity <= 3 ? "default" : stats.complexity <= 7 ? "secondary" : "destructive"}
                >
                  {stats.complexity}/10
                </Badge>
              </div>
            </div>
          </div>
          
          {stats.isolatedNodes > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <span className="text-sm font-medium">
                  ⚠️ Найдено {stats.isolatedNodes} изолированных узлов
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="algorithms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="algorithms">Алгоритмы</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="algorithms" className="space-y-4">
          {/* Рекомендованный алгоритм */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-blue-500">⭐</span>
                Рекомендованный алгоритм
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const recommended = getRecommendedAlgorithm();
                const Icon = recommended.icon;
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${recommended.color}`} />
                      <div>
                        <div className="font-medium">{recommended.name}</div>
                        <div className="text-sm text-muted-foreground">{recommended.description}</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleApplyAlgorithm(recommended.id)}
                      disabled={nodes.length === 0}
                      className="ml-4"
                    >
                      Применить
                    </Button>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Все алгоритмы */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Все алгоритмы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {algorithms.map((algorithm) => {
                const Icon = algorithm.icon;
                return (
                  <div key={algorithm.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${algorithm.color}`} />
                      <div>
                        <div className="font-medium text-sm">{algorithm.name}</div>
                        <div className="text-xs text-muted-foreground">{algorithm.description}</div>
                      </div>
                      {algorithm.recommended && (
                        <Badge variant="secondary" className="text-xs">Рекомендуемый</Badge>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApplyAlgorithm(algorithm.id)}
                      disabled={nodes.length === 0}
                    >
                      Применить
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Настройки компоновки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spacing">Расстояние между узлами: {spacing}px</Label>
                <input
                  id="spacing"
                  type="range"
                  min="100"
                  max="400"
                  step="25"
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="center-nodes"
                  checked={centerNodes}
                  onCheckedChange={setCenterNodes}
                />
                <Label htmlFor="center-nodes">Центрировать узлы</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="prevent-overlaps"
                  checked={preventOverlaps}
                  onCheckedChange={setPreventOverlaps}
                />
                <Label htmlFor="prevent-overlaps">Предотвращать наложения</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}