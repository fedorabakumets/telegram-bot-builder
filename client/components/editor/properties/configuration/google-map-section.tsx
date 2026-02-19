/**
 * @fileoverview Компонент секции Google Maps
 * 
 * Блок управления настройками интеграции с Google Maps:
 * ссылка и автоматическое извлечение координат.
 * 
 * @module GoogleMapSection
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractCoordinatesFromUrl, getLocationInfo, formatCoordinates } from '@/lib/map-utils';

/**
 * Пропсы компонента секции Google Maps
 */
interface GoogleMapSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент секции Google Maps
 * 
 * Позволяет указать ссылку на Google Maps с автоматическим
 * извлечением координат и определением информации о месте.
 * 
 * @param {GoogleMapSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция Google Maps
 */
export function GoogleMapSection({
  selectedNode,
  onNodeUpdate
}: GoogleMapSectionProps) {
  const { toast } = useToast();

  const handleUrlChange = (url: string) => {
    onNodeUpdate(selectedNode.id, { googleMapUrl: url });

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
                description: `Из Google Maps: ${locationInfo.city || 'город'}, ${locationInfo.country || 'страна'}`
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
        Ссылка на Google Maps
      </Label>
      <Input
        type="url"
        value={selectedNode.data.googleMapUrl || ''}
        onChange={(e) => handleUrlChange(e.target.value)}
        className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
        placeholder="https://maps.google.com/..."
      />
      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
        Скопируйте ссылку из Google Maps - координаты извлекутся автоматически
      </p>
      {selectedNode.data.googleMapUrl && selectedNode.data.latitude && selectedNode.data.longitude && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
          <i className="fas fa-check-circle mr-1"></i>
          Координаты: {formatCoordinates(selectedNode.data.latitude, selectedNode.data.longitude)}
        </div>
      )}
    </div>
  );
}
