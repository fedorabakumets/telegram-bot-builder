import React, { useState } from 'react';
import { Link } from 'wouter';
import { HierarchicalDiagram } from '@/components/ui/hierarchical-diagram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Node, Connection } from '@shared/schema';
import { ArrowLeft, Workflow, Download, Share2 } from 'lucide-react';

export default function HierarchyDemo() {
  const [layout, setLayout] = useState<'tree' | 'org-chart' | 'network'>('org-chart');
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Sample organizational data based on the image provided
  const sampleNodes: Node[] = [
    {
      id: '1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        title: 'Руководитель организации',
        description: 'Главный управляющий',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '2',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        title: 'Начальник департамента продаж',
        description: 'Отдел продаж',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '3',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        title: 'Начальник департамента обслуживания',
        description: 'Отдел обслуживания',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '4',
      type: 'keyboard',
      position: { x: 0, y: 0 },
      data: {
        title: 'Менеджер по продажам',
        description: 'Продажи A',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '5',
      type: 'keyboard',
      position: { x: 0, y: 0 },
      data: {
        title: 'Менеджер по продажам',
        description: 'Продажи B',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '6',
      type: 'condition',
      position: { x: 0, y: 0 },
      data: {
        title: 'Начальник колл-центра',
        description: 'Управление колл-центром',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '7',
      type: 'input',
      position: { x: 0, y: 0 },
      data: {
        title: 'Продавец',
        description: 'Продавец A',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '8',
      type: 'input',
      position: { x: 0, y: 0 },
      data: {
        title: 'Продавец',
        description: 'Продавец B',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '9',
      type: 'input',
      position: { x: 0, y: 0 },
      data: {
        title: 'Продавец',
        description: 'Продавец C',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '10',
      type: 'photo',
      position: { x: 0, y: 0 },
      data: {
        title: 'Оператор колл-центра',
        description: 'Оператор A',
        messageText: '',
        buttons: []
      }
    },
    {
      id: '11',
      type: 'photo',
      position: { x: 0, y: 0 },
      data: {
        title: 'Оператор колл-центра',
        description: 'Оператор B',
        messageText: '',
        buttons: []
      }
    }
  ];

  const sampleConnections: Connection[] = [
    { id: 'c1', source: '1', target: '2' },
    { id: 'c2', source: '1', target: '3' },
    { id: 'c3', source: '2', target: '4' },
    { id: 'c4', source: '2', target: '5' },
    { id: 'c5', source: '3', target: '6' },
    { id: 'c6', source: '4', target: '7' },
    { id: 'c7', source: '4', target: '8' },
    { id: 'c8', source: '5', target: '9' },
    { id: 'c9', source: '6', target: '10' },
    { id: 'c10', source: '6', target: '11' }
  ];

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
                  <p className="text-sm text-muted-foreground">Визуализация организационной структуры</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Поделиться
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-labels"
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                  <Label htmlFor="show-labels">Показать подписи</Label>
                </div>

                <div className="pt-4 space-y-2">
                  <Label className="text-sm font-medium">Статистика</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Всего узлов: {sampleNodes.length}</div>
                    <div>Связей: {sampleConnections.length}</div>
                    <div>Уровней: 4</div>
                  </div>
                </div>

                {selectedNodeId && (
                  <div className="pt-4 space-y-2">
                    <Label className="text-sm font-medium">Выбранный узел</Label>
                    <div className="text-sm text-muted-foreground">
                      {sampleNodes.find(n => n.id === selectedNodeId)?.data.title}
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
                  Организационная структура
                </CardTitle>
                <CardDescription>
                  Интерактивная иерархическая диаграмма с соединительными линиями
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)]">
                <HierarchicalDiagram
                  nodes={sampleNodes}
                  connections={sampleConnections}
                  layout={layout}
                  showLabels={showLabels}
                  selectedNodeId={selectedNodeId}
                  onNodeClick={setSelectedNodeId}
                  className="w-full h-full"
                  spacing={{
                    horizontal: 200,
                    vertical: 120
                  }}
                />
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
                <h3 className="font-semibold">Органиграмма</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Классическая иерархическая структура с четкими уровнями подчинения и соединительными линиями
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
                Кликайте на узлы для выбора, изменяйте стили отображения и настройки визуализации
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Адаптивность</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Автоматическое размещение узлов и оптимизация для различных размеров экрана
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}