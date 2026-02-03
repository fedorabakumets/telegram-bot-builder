import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

/**
 * @interface VisibilityControlsProps
 * @description Свойства компонента управления видимостью
 * @property {boolean} headerVisible - Видимость заголовка
 * @property {boolean} sidebarVisible - Видимость боковой панели
 * @property {boolean} canvasVisible - Видимость холста
 * @property {boolean} propertiesVisible - Видимость панели свойств
 * @property {() => void} onToggleHeader - Функция переключения видимости заголовка
 * @property {() => void} onToggleSidebar - Функция переключения видимости боковой панели
 * @property {() => void} onToggleCanvas - Функция переключения видимости холста
 * @property {() => void} onToggleProperties - Функция переключения видимости панели свойств
 */
interface VisibilityControlsProps {
  headerVisible: boolean;
  sidebarVisible: boolean;
  canvasVisible: boolean;
  propertiesVisible: boolean;
  onToggleHeader: () => void;
  onToggleSidebar: () => void;
  onToggleCanvas: () => void;
  onToggleProperties: () => void;
}

/**
 * @function VisibilityControls
 * @description Компонент управления видимостью элементов интерфейса
 * Отображает панель с кнопками для переключения видимости различных элементов интерфейса
 * @param {VisibilityControlsProps} props - Свойства компонента
 * @returns {JSX.Element | null} Компонент управления видимостью или null, если все элементы видимы
 */
export function VisibilityControls({
  headerVisible,
  sidebarVisible,
  canvasVisible,
  propertiesVisible,
  onToggleHeader,
  onToggleSidebar,
  onToggleCanvas,
  onToggleProperties,
}: VisibilityControlsProps) {
  // Определяем, нужно ли показать панель управления
  const shouldShowControls = !headerVisible || !sidebarVisible || !canvasVisible || !propertiesVisible;

  if (!shouldShowControls) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Показать панели:
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={headerVisible ? "default" : "outline"}
                size="sm"
                onClick={onToggleHeader}
                className="flex items-center gap-2 text-xs"
              >
                {headerVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                Шапка
              </Button>

              <Button
                variant={sidebarVisible ? "default" : "outline"}
                size="sm"
                onClick={onToggleSidebar}
                className="flex items-center gap-2 text-xs"
              >
                {sidebarVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                Боковая панель
              </Button>

              <Button
                variant={canvasVisible ? "default" : "outline"}
                size="sm"
                onClick={onToggleCanvas}
                className="flex items-center gap-2 text-xs"
              >
                {canvasVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                Холст
              </Button>

              <Button
                variant={propertiesVisible ? "default" : "outline"}
                size="sm"
                onClick={onToggleProperties}
                className="flex items-center gap-2 text-xs"
              >
                {propertiesVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                Свойства
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}