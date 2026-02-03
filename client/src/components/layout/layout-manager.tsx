import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  RotateCcw, 
  Layout, 
  Sidebar, 
  Navigation, 
  Maximize,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export interface LayoutConfig {
  headerPosition: 'top' | 'bottom' | 'left' | 'right';
  sidebarPosition: 'left' | 'right';
  propertiesPosition: 'right' | 'left';
  canvasFullscreen: boolean;
  compactMode: boolean;
  showGrid: boolean;
  panelSizes: {
    sidebar: number;
    properties: number;
    canvas: number;
  };
}

const DEFAULT_LAYOUT: LayoutConfig = {
  headerPosition: 'top',
  sidebarPosition: 'left',
  propertiesPosition: 'right',
  canvasFullscreen: false,
  compactMode: false,
  showGrid: true,
  panelSizes: {
    sidebar: 20,
    properties: 25,
    canvas: 55
  }
};

interface LayoutManagerProps {
  config: LayoutConfig;
  onConfigChange: (config: LayoutConfig) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LayoutManager({ config, onConfigChange, onApply, onReset }: LayoutManagerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleConfigUpdate = (key: keyof LayoutConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  };

  const handlePanelSizeUpdate = (panel: keyof LayoutConfig['panelSizes'], value: number) => {
    const newSizes = { ...config.panelSizes, [panel]: value };
    // Нормализуем размеры чтобы они составляли 100%
    const total = Object.values(newSizes).reduce((sum, size) => sum + size, 0);
    const normalizedSizes = Object.fromEntries(
      Object.entries(newSizes).map(([key, size]) => [key, Math.round((size / total) * 100)])
    ) as LayoutConfig['panelSizes'];
    
    handleConfigUpdate('panelSizes', normalizedSizes);
  };

  const presets = [
    {
      name: 'Классический',
      description: 'Стандартное расположение',
      config: DEFAULT_LAYOUT
    },
    {
      name: 'Компактный',
      description: 'Сжатый интерфейс',
      config: {
        ...DEFAULT_LAYOUT,
        compactMode: true,
        panelSizes: { sidebar: 15, properties: 20, canvas: 65 }
      }
    },
    {
      name: 'Фокус на холсте',
      description: 'Максимум места для холста',
      config: {
        ...DEFAULT_LAYOUT,
        headerPosition: 'bottom' as const,
        panelSizes: { sidebar: 12, properties: 15, canvas: 73 }
      }
    },
    {
      name: 'Левосторонний',
      description: 'Все панели слева',
      config: {
        ...DEFAULT_LAYOUT,
        sidebarPosition: 'left' as const,
        propertiesPosition: 'left' as const,
        panelSizes: { sidebar: 25, properties: 25, canvas: 50 }
      }
    },
    {
      name: 'Правосторонний',
      description: 'Все панели справа',
      config: {
        ...DEFAULT_LAYOUT,
        sidebarPosition: 'right' as const,
        propertiesPosition: 'right' as const,
        panelSizes: { sidebar: 25, properties: 25, canvas: 50 }
      }
    }
  ];

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-200"
      >
        <Layout className="h-4 w-4 mr-2" />
        Настройки макета
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Настройки макета интерфейса
              </CardTitle>
              <CardDescription>
                Настройте расположение элементов интерфейса под свои потребности
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Быстрые пресеты */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Быстрые пресеты</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((preset, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onConfigChange(preset.config)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{preset.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {preset.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Детальные настройки */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Позиция шапки */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Позиция шапки
              </Label>
              <Select 
                value={config.headerPosition} 
                onValueChange={(value) => handleConfigUpdate('headerPosition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Сверху
                    </div>
                  </SelectItem>
                  <SelectItem value="bottom">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Снизу
                    </div>
                  </SelectItem>
                  <SelectItem value="left">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Слева
                    </div>
                  </SelectItem>
                  <SelectItem value="right">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Справа
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Позиция боковой панели */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sidebar className="h-4 w-4" />
                Боковая панель (компоненты)
              </Label>
              <Select 
                value={config.sidebarPosition} 
                onValueChange={(value) => handleConfigUpdate('sidebarPosition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Слева
                    </div>
                  </SelectItem>
                  <SelectItem value="right">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Справа
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Позиция панели свойств */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Панель свойств
              </Label>
              <Select 
                value={config.propertiesPosition} 
                onValueChange={(value) => handleConfigUpdate('propertiesPosition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Слева
                    </div>
                  </SelectItem>
                  <SelectItem value="right">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Справа
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Дополнительные настройки */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Дополнительно</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact" className="text-sm">Компактный режим</Label>
                  <Switch
                    id="compact"
                    checked={config.compactMode}
                    onCheckedChange={(checked) => handleConfigUpdate('compactMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="fullscreen" className="text-sm">Полноэкранный холст</Label>
                  <Switch
                    id="fullscreen"
                    checked={config.canvasFullscreen}
                    onCheckedChange={(checked) => handleConfigUpdate('canvasFullscreen', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid" className="text-sm">Показать сетку</Label>
                  <Switch
                    id="grid"
                    checked={config.showGrid}
                    onCheckedChange={(checked) => handleConfigUpdate('showGrid', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Размеры панелей */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Размеры панелей (%)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Боковая панель</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={config.panelSizes.sidebar}
                    onChange={(e) => handlePanelSizeUpdate('sidebar', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-xs">
                    {config.panelSizes.sidebar}%
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Холст</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="30"
                    max="80"
                    value={config.panelSizes.canvas}
                    onChange={(e) => handlePanelSizeUpdate('canvas', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-xs">
                    {config.panelSizes.canvas}%
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Панель свойств</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="15"
                    max="40"
                    value={config.panelSizes.properties}
                    onChange={(e) => handlePanelSizeUpdate('properties', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-xs">
                    {config.panelSizes.properties}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Кнопки действий */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Сброс
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Maximize className="h-4 w-4 mr-2" />
                {previewMode ? 'Скрыть превью' : 'Превью'}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsVisible(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  onApply();
                  setIsVisible(false);
                }}
              >
                Применить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Хук для управления настройками макета
export function useLayoutManager() {
  const [config, setConfig] = useState<LayoutConfig>(() => {
    const saved = localStorage.getItem('telegram-bot-builder-layout');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });

  const saveConfig = (newConfig: LayoutConfig) => {
    setConfig(newConfig);
    localStorage.setItem('telegram-bot-builder-layout', JSON.stringify(newConfig));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_LAYOUT);
    localStorage.removeItem('telegram-bot-builder-layout');
  };

  const applyConfig = () => {
    // Дополнительная логика применения настроек
    console.log('Applying layout config:', config);
  };

  return {
    config,
    updateConfig: saveConfig,
    resetConfig,
    applyConfig
  };
}