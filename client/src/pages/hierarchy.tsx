import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { HierarchicalDiagram } from '@/components/ui/hierarchical-diagram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Node, Connection, BotProject, BotData } from '@shared/schema';
import { ArrowLeft, Workflow, Download, Share2, AlertCircle, RefreshCw } from 'lucide-react';
import { analyzeLayoutStructure } from '@/utils/auto-hierarchy';

export default function Hierarchy() {
  const [, setLocation] = useLocation();
  const [layout, setLayout] = useState<'tree' | 'org-chart' | 'network'>('org-chart');
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Load all projects
  const { data: projects, isLoading, error } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
  });

  // Auto-select first project if available
  useEffect(() => {
    if (projects && projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Get current project data
  const currentProject = projects?.find(p => p.id === selectedProjectId);
  const botData = currentProject?.data as BotData;
  const nodes = botData?.nodes || [];
  const connections = botData?.connections || [];

  // Analyze structure only if we have nodes
  const structureAnalysis = nodes.length > 0 ? analyzeLayoutStructure(nodes, connections) : {
    depth: 0,
    branchingFactor: 0,
    hasCycles: false,
    complexity: 0,
    isolatedNodes: 0,
    connectedComponents: 0
  };

  // Calculate statistics
  const stats = {
    totalNodes: nodes.length,
    totalConnections: connections.length,
    connectedNodes: new Set([...connections.map(c => c.source), ...connections.map(c => c.target)]).size,
    isolatedNodes: nodes.length - new Set([...connections.map(c => c.source), ...connections.map(c => c.target)]).size,
    levels: structureAnalysis.depth,
    branches: structureAnalysis.branchingFactor,
    cycles: structureAnalysis.hasCycles
  };

  const handleExport = () => {
    if (!currentProject || !botData) return;
    
    const exportData = {
      project: currentProject.name,
      structure: {
        nodes: nodes.length,
        connections: connections.length,
        levels: structureAnalysis.depth
      },
      data: botData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}-hierarchy.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!currentProject) return;
    
    const shareUrl = `${window.location.origin}/hierarchy?project=${currentProject.id}`;
    navigator.clipboard.writeText(shareUrl);
    // Could add toast notification here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Загрузка проектов...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h2 className="text-lg font-semibold">Ошибка загрузки</h2>
            <p className="text-muted-foreground">Не удалось загрузить проекты</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Workflow className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-lg font-semibold">Нет проектов</h2>
            <p className="text-muted-foreground">Создайте первый проект для просмотра иерархии</p>
          </div>
          <Button onClick={() => setLocation('/')}>
            Создать проект
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Назад к редактору
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Workflow className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Иерархическая диаграмма</h1>
                  <p className="text-sm text-muted-foreground">
                    Визуализация структуры бота: {currentProject?.name || 'Проект не выбран'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Поделиться
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Экспорт
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Настройки</CardTitle>
                <CardDescription>
                  Управляйте отображением диаграммы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Selection */}
                {projects.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="project">Выберите проект</Label>
                    <Select 
                      value={selectedProjectId?.toString() || ''} 
                      onValueChange={(value) => setSelectedProjectId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите проект" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Layout Selection */}
                <div className="space-y-2">
                  <Label htmlFor="layout">Стиль макета</Label>
                  <Select value={layout} onValueChange={(value: any) => setLayout(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org-chart">Органиграмма</SelectItem>
                      <SelectItem value="tree">Дерево</SelectItem>
                      <SelectItem value="network">Сеть</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-labels"
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                  <Label htmlFor="show-labels">Показать подписи</Label>
                </div>

                {/* Statistics */}
                <div className="pt-4 space-y-3">
                  <Label className="text-sm font-medium">Статистика</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Узлов:</span>
                      <Badge variant="secondary">{stats.totalNodes}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Связей:</span>
                      <Badge variant="secondary">{stats.totalConnections}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Уровней:</span>
                      <Badge variant="outline">{stats.levels}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Веток:</span>
                      <Badge variant="outline">{stats.branches}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Связанных:</span>
                      <Badge variant={stats.connectedNodes > 0 ? "default" : "destructive"}>
                        {stats.connectedNodes}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Изолированных:</span>
                      <Badge variant={stats.isolatedNodes > 0 ? "destructive" : "default"}>
                        {stats.isolatedNodes}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Complexity Indicator */}
                  <div className="pt-2">
                    <Label className="text-xs font-medium text-muted-foreground">Сложность структуры</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            structureAnalysis.complexity < 0.3 ? 'bg-green-500' :
                            structureAnalysis.complexity < 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(structureAnalysis.complexity * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(structureAnalysis.complexity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Node Info */}
                {selectedNodeId && (
                  <div className="pt-4 space-y-2">
                    <Label className="text-sm font-medium">Выбранный узел</Label>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">
                        {nodes.find(n => n.id === selectedNodeId)?.data.title || 'Без названия'}
                      </div>
                      <div className="text-muted-foreground">
                        Тип: {nodes.find(n => n.id === selectedNodeId)?.type}
                      </div>
                      {nodes.find(n => n.id === selectedNodeId)?.data.description && (
                        <div className="text-muted-foreground text-xs">
                          {nodes.find(n => n.id === selectedNodeId)?.data.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Diagram Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Структура бота
                  {stats.cycles && (
                    <Badge variant="destructive" className="ml-2">
                      Циклы обнаружены
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Интерактивная иерархическая диаграмма структуры Telegram бота
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)]">
                {nodes.length > 0 ? (
                  <HierarchicalDiagram
                    nodes={nodes}
                    connections={connections}
                    layout={layout}
                    showLabels={showLabels}
                    selectedNodeId={selectedNodeId}
                    onNodeClick={setSelectedNodeId}
                    className="w-full h-full"
                    spacing={{
                      horizontal: 180,
                      vertical: 120
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Workflow className="h-16 w-16 mx-auto opacity-50" />
                      <h3 className="text-lg font-medium">Нет узлов для отображения</h3>
                      <p className="text-sm">
                        Добавьте компоненты в редакторе для создания диаграммы
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/')}
                        className="mt-4"
                      >
                        Перейти в редактор
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Information Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Реальные данные</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Диаграмма отображает актуальную структуру вашего бота с текущими узлами и связями
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Интерактивность</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Кликайте на узлы для детального просмотра, изменяйте стили отображения
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Анализ структуры</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Автоматический анализ сложности, обнаружение проблем и рекомендации
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}