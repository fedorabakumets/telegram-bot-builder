/**
 * @fileoverview Компонент секции 2ГИС
 * 
 * Блок управления настройками интеграции с 2ГИС:
 * ссылка и автоматическое извлечение координат.
 * 
 * @module GisMapSection
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractCoordinatesFromUrl, getLocationInfo, formatCoordinates } from '@/lib/map-utils';

/**
 * Пропсы компонента секции 2ГИС
 */
interface GisMapSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент секции 2ГИС
 * 
 * Позволяет указать ссылку на 2ГИС с автоматическим
 * извлечением координат и определением информации о месте.
 * 
 * @param {GisMapSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция 2ГИС
 */
export function GisMapSection({
  selectedNode,
  onNodeUpdate
}: GisMapSectionProps) {
  const { toast } = useToast();

  const handleUrlChange = (url: string) => {
    onNodeUpdate(selectedNode.id, { gisMapUrl: url });

    if (url) {
      const { coordinates, service } = extractCoordinatesFromUrl(url);
      if (coordinates) {
        const updates: any = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          mapService: service
        };

        onNodeUpdate(selectedNode.id, updates);

        getLocationInfo(coordinates.latitude, coordinates.longitude)
          .then(locationInfo => {
            if (locationInfo) {
              onNodeUpdate(selectedNode.id, {
                title: locationInfo.title || selectedNode.data.title || 'Местоположение',
                address: locationInfo.address || selectedNode.data.address,
                city: locationInfo.city || selectedNode.data.city,
                country: locationInfo.country || selectedNode.data.country
              });
              toast({
                title: "Координаты обновлены",
                description: `Из 2ГИС: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
              });
            }
          })
          .catch(console.error);
      }
    }
  };

  return (
    <div>
      <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
        <i className="fas fa-link mr-1"></i>
        Ссылка на 2ГИС
      </Label>
      <Input
        type="url"
        value={selectedNode.data.gisMapUrl || ''}
        onChange={(e) => handleUrlChange(e.target.value)}
        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
        placeholder="https://2gis.ru/..."
      />
      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
        Скопируйте ссылку из 2ГИС - координаты извлекутся автоматически
      </p>
      {selectedNode.data.gisMapUrl && selectedNode.data.latitude && selectedNode.data.longitude && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
          <i className="fas fa-check-circle mr-1"></i>
          Координаты: {formatCoordinates(selectedNode.data.latitude, selectedNode.data.longitude)}
        </div>
      )}
    </div>
  );
}
