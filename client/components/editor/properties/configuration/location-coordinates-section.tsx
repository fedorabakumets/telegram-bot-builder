/**
 * @fileoverview Компонент секции координат местоположения
 * 
 * Блок управления настройками координат: широта и долгота
 * с автоматическим определением информации о месте.
 * 
 * @module LocationCoordinatesSection
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getLocationInfo } from '@/lib/map-utils';

/**
 * Пропсы компонента секции координат
 */
interface LocationCoordinatesSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент секции координат местоположения
 * 
 * Позволяет указать широту и долготу с автоматическим
 * получением информации о месте (город, страна, адрес).
 * 
 * @param {LocationCoordinatesSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция координат местоположения
 */
export function LocationCoordinatesSection({
  selectedNode,
  onNodeUpdate
}: LocationCoordinatesSectionProps) {
  const { toast } = useToast();

  const handleLatitudeChange = (value: string) => {
    const lat = parseFloat(value) || 0;
    onNodeUpdate(selectedNode.id, { latitude: lat });

    if (lat && selectedNode.data.longitude) {
      getLocationInfo(lat, selectedNode.data.longitude)
        .then(locationInfo => {
          if (locationInfo) {
            onNodeUpdate(selectedNode.id, {
              title: locationInfo.title || selectedNode.data.title || 'Местоположение',
              address: locationInfo.address || selectedNode.data.address,
              city: locationInfo.city || selectedNode.data.city,
              country: locationInfo.country || selectedNode.data.country
            });
            toast({
              title: "Информация обновлена",
              description: `Автоматически определены: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
            });
          }
        })
        .catch(console.error);
    }
  };

  const handleLongitudeChange = (value: string) => {
    const lng = parseFloat(value) || 0;
    onNodeUpdate(selectedNode.id, { longitude: lng });

    if (lng && selectedNode.data.latitude) {
      getLocationInfo(selectedNode.data.latitude, lng)
        .then(locationInfo => {
          if (locationInfo) {
            onNodeUpdate(selectedNode.id, {
              title: locationInfo.title || selectedNode.data.title || 'Местоположение',
              address: locationInfo.address || selectedNode.data.address,
              city: locationInfo.city || selectedNode.data.city,
              country: locationInfo.country || selectedNode.data.country
            });
            toast({
              title: "Информация обновлена",
              description: `Автоматически определены: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
            });
          }
        })
        .catch(console.error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10 border border-emerald-200/30 dark:border-emerald-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
          <i className="fas fa-map-marker-alt text-emerald-600 dark:text-emerald-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Координаты местоположения</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2 block">
            <i className="fas fa-globe mr-1"></i>
            Широта
          </Label>
          <Input
            type="number"
            step="any"
            value={selectedNode.data.latitude || ''}
            onChange={(e) => handleLatitudeChange(e.target.value)}
            className="border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-200"
            placeholder="55.7558"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2 block">
            <i className="fas fa-globe mr-1"></i>
            Долгота
          </Label>
          <Input
            type="number"
            step="any"
            value={selectedNode.data.longitude || ''}
            onChange={(e) => handleLongitudeChange(e.target.value)}
            className="border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-200"
            placeholder="37.6176"
          />
        </div>
      </div>

      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
        Основные координаты точки на карте (обязательно)
      </div>
    </div>
  );
}
