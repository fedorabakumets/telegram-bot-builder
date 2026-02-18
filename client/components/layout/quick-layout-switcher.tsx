import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Layout,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Grid,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

/**
 * @interface QuickLayoutPreset
 * @description Описывает пресет быстрого макета
 * @property {string} id - Уникальный идентификатор пресета
 * @property {string} name - Название пресета
 * @property {string} description - Описание пресета
 * @property {React.ReactNode} icon - Иконка пресета
 * @property {Object} config - Конфигурация макета
 * @property {'top' | 'bottom' | 'left' | 'right'} config.headerPosition - Позиция заголовка
 * @property {'left' | 'right'} config.sidebarPosition - Позиция боковой панели
 * @property {'right' | 'left'} config.propertiesPosition - Позиция панели свойств
 * @property {number} config.headerSize - Размер заголовка
 * @property {number} config.sidebarSize - Размер боковой панели
 * @property {number} config.propertiesSize - Размер панели свойств
 * @property {React.ReactNode} preview - Предварительный просмотр макета
 */
export interface QuickLayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: {
    headerPosition: 'top' | 'bottom' | 'left' | 'right';
    sidebarPosition: 'left' | 'right';
    propertiesPosition: 'right' | 'left';
    headerSize: number;
    sidebarSize: number;
    propertiesSize: number;
  };
  preview: React.ReactNode;
}

/**
 * @constant LAYOUT_PRESETS
 * @description Массив пресетов быстрого макета
 * @type {QuickLayoutPreset[]}
 */
const LAYOUT_PRESETS: QuickLayoutPreset[] = [
  {
    id: 'default',
    name: 'Стандартный',
    description: 'Заголовок сверху, боковая панель слева, свойства справа',
    icon: <Monitor className="w-5 h-5" />,
    config: {
      headerPosition: 'top',
      sidebarPosition: 'left',
      propertiesPosition: 'right',
      headerSize: 60,
      sidebarSize: 280,
      propertiesSize: 320
    },
    preview: (
      <div className="w-full h-20 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="h-3 bg-blue-200 dark:bg-blue-800"></div>
        <div className="flex h-17">
          <div className="w-1/4 bg-green-200 dark:bg-green-800"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-1/4 bg-orange-200 dark:bg-orange-800"></div>
        </div>
      </div>
    )
  },
  {
    id: 'header-bottom',
    name: 'Заголовок снизу',
    description: 'Необычный макет с заголовком внизу экрана',
    icon: <ArrowDown className="w-5 h-5" />,
    config: {
      headerPosition: 'bottom',
      sidebarPosition: 'left',
      propertiesPosition: 'right',
      headerSize: 60,
      sidebarSize: 280,
      propertiesSize: 320
    },
    preview: (
      <div className="w-full h-20 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="flex h-17">
          <div className="w-1/4 bg-green-200 dark:bg-green-800"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-1/4 bg-orange-200 dark:bg-orange-800"></div>
        </div>
        <div className="h-3 bg-blue-200 dark:bg-blue-800"></div>
      </div>
    )
  },
  {
    id: 'sidebar-right',
    name: 'Боковая панель справа',
    description: 'Боковая панель справа, свойства слева',
    icon: <ArrowRight className="w-5 h-5" />,
    config: {
      headerPosition: 'top',
      sidebarPosition: 'right',
      propertiesPosition: 'left',
      headerSize: 60,
      sidebarSize: 280,
      propertiesSize: 320
    },
    preview: (
      <div className="w-full h-20 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="h-3 bg-blue-200 dark:bg-blue-800"></div>
        <div className="flex h-17">
          <div className="w-1/4 bg-orange-200 dark:bg-orange-800"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-1/4 bg-green-200 dark:bg-green-800"></div>
        </div>
      </div>
    )
  },
  {
    id: 'header-left',
    name: 'Заголовок слева',
    description: 'Вертикальный заголовок слева, компактный макет',
    icon: <ArrowLeft className="w-5 h-5" />,
    config: {
      headerPosition: 'left',
      sidebarPosition: 'right',
      propertiesPosition: 'right',
      headerSize: 200,
      sidebarSize: 280,
      propertiesSize: 320
    },
    preview: (
      <div className="w-full h-20 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="flex h-full">
          <div className="w-1/5 bg-blue-200 dark:bg-blue-800"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-1/4 bg-green-200 dark:bg-green-800"></div>
          <div className="w-1/4 bg-orange-200 dark:bg-orange-800"></div>
        </div>
      </div>
    )
  },
  {
    id: 'compact',
    name: 'Компактный',
    description: 'Минимальные размеры для больших экранов',
    icon: <Tablet className="w-5 h-5" />,
    config: {
      headerPosition: 'top',
      sidebarPosition: 'left',
      propertiesPosition: 'right',
      headerSize: 48,
      sidebarSize: 240,
      propertiesSize: 260
    },
    preview: (
      <div className="w-full h-20 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="h-2 bg-blue-200 dark:bg-blue-800"></div>
        <div className="flex h-18">
          <div className="w-1/5 bg-green-200 dark:bg-green-800"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-1/5 bg-orange-200 dark:bg-orange-800"></div>
        </div>
      </div>
    )
  },
  {
    id: 'mobile',
    name: 'Мобильный',
    description: 'Оптимизированный для мобильных устройств',
    icon: <Smartphone className="w-5 h-5" />,
    config: {
      headerPosition: 'top',
      sidebarPosition: 'left',
      propertiesPosition: 'right',
      headerSize: 56,
      sidebarSize: 200,
      propertiesSize: 200
    },
    preview: (
      <div className="w-full h-20 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
        <div className="h-3 bg-blue-200 dark:bg-blue-800"></div>
        <div className="flex h-17">
          <div className="w-1/6 bg-green-200 dark:bg-green-800"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-1/6 bg-orange-200 dark:bg-orange-800"></div>
        </div>
      </div>
    )
  }
];

/**
 * @interface QuickLayoutSwitcherProps
 * @description Свойства компонента быстрого переключения макета
 * @property {any} [currentConfig] - Текущая конфигурация макета
 * @property {(config: any) => void} onLayoutChange - Функция обратного вызова при изменении макета
 */
interface QuickLayoutSwitcherProps {
  currentConfig?: any;
  onLayoutChange: (config: any) => void;
}

/**
 * @function QuickLayoutSwitcher
 * @description Компонент быстрого переключения макета интерфейса
 * Позволяет пользователю выбирать из готовых пресетов макета
 * @param {QuickLayoutSwitcherProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент быстрого переключения макета
 */
const QuickLayoutSwitcher: React.FC<QuickLayoutSwitcherProps> = ({
  onLayoutChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');

  /**
   * @function handlePresetSelect
   * @description Обработчик выбора пресета макета
   * Обновляет состояние выбранного пресета и вызывает функцию обратного вызова с новой конфигурацией
   * @param {QuickLayoutPreset} preset - Выбранный пресет макета
   * @returns {void}
   */
  const handlePresetSelect = (preset: QuickLayoutPreset) => {
    setSelectedPreset(preset.id);

    // Преобразуем пресет в конфигурацию макета
    const layoutConfig = {
      headerPosition: preset.config.headerPosition,
      sidebarPosition: preset.config.sidebarPosition,
      propertiesPosition: preset.config.propertiesPosition,
      canvasFullscreen: false,
      compactMode: preset.id === 'compact' || preset.id === 'mobile',
      showGrid: true,
      panelSizes: {
        sidebar: preset.config.sidebarSize / 15, // Конвертируем в проценты
        properties: preset.config.propertiesSize / 15,
        canvas: 100 - (preset.config.sidebarSize / 15) - (preset.config.propertiesSize / 15)
      }
    };

    onLayoutChange(layoutConfig);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layout className="w-4 h-4" />
          Быстрая настройка
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5" />
            Быстрая настройка макета
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Выберите готовый макет для быстрой настройки интерфейса
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAYOUT_PRESETS.map((preset) => (
              <Card 
                key={preset.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPreset === preset.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handlePresetSelect(preset)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {preset.icon}
                      {preset.name}
                    </CardTitle>
                    {selectedPreset === preset.id && (
                      <Badge variant="default" className="text-xs">
                        Выбран
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {preset.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Предпросмотр:
                      </div>
                      {preset.preview}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Заголовок:</span>
                        <span className="capitalize">{preset.config.headerPosition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Боковая панель:</span>
                        <span className="capitalize">{preset.config.sidebarPosition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Свойства:</span>
                        <span className="capitalize">{preset.config.propertiesPosition}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Layout className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Совет по использованию
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Выберите макет и нажмите на него для применения. Вы можете в любое время вернуться к настройкам и выбрать другой вариант.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * @exports QuickLayoutSwitcher
 * @description Экспортирует компонент QuickLayoutSwitcher по умолчанию
 */
export default QuickLayoutSwitcher;