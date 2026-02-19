/**
 * @fileoverview Компонент секции картографических сервисов
 * 
 * Блок управления настройками картографических сервисов:
 * выбор сервиса, ссылки на карты, масштаб и опции отображения.
 * 
 * @module MapServicesSection
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { YandexMapSection } from './yandex-map-section';
import { GoogleMapSection } from './google-map-section';
import { GisMapSection } from './gis-map-section';

/**
 * Пропсы компонента секции картографических сервисов
 */
interface MapServicesSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент секции картографических сервисов
 * 
 * Позволяет настроить:
 * - Выбор картографического сервиса (Яндекс, Google, 2ГИС)
 * - Ссылки на карты с автоизвлечением координат
 * - Масштаб карты
 * - Опции отображения (маршрут, превью)
 * 
 * @param {MapServicesSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция картографических сервисов
 */
export function MapServicesSection({
  selectedNode,
  onNodeUpdate
}: MapServicesSectionProps) {
  return (
    <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10 border border-orange-200/30 dark:border-orange-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
          <i className="fas fa-route text-orange-600 dark:text-orange-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Картографические сервисы</Label>
      </div>

      <div className="space-y-4">
        {/* Map Service Selector */}
        <div>
          <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
            <i className="fas fa-layer-group mr-1"></i>
            Сервисы карт
          </Label>
          <select
            value={selectedNode.data.mapService || 'custom'}
            onChange={(e) => onNodeUpdate(selectedNode.id, { mapService: e.target.value as 'custom' | 'yandex' | 'google' | '2gis' })}
            className="w-full px-3 py-2 border border-orange-200 dark:border-orange-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:border-orange-500 focus:ring-orange-200"
          >
            <option value="custom">Пользовательские координаты</option>
            <option value="yandex">Яндекс Карты</option>
            <option value="google">Google Maps</option>
            <option value="2gis">2ГИС</option>
          </select>
        </div>

        {/* Map URL Sections */}
        {selectedNode.data.mapService === 'yandex' && (
          <YandexMapSection
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />
        )}

        {selectedNode.data.mapService === 'google' && (
          <GoogleMapSection
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />
        )}

        {selectedNode.data.mapService === '2gis' && (
          <GisMapSection
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />
        )}

        {/* Map Zoom and Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
              <i className="fas fa-search-plus mr-1"></i>
              Масштаб карты
            </Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={selectedNode.data.mapZoom || 15}
              onChange={(e) => onNodeUpdate(selectedNode.id, { mapZoom: parseInt(e.target.value) || 15 })}
              className="border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-200"
              placeholder="15"
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDirections"
                checked={selectedNode.data.showDirections || false}
                onChange={(e) => onNodeUpdate(selectedNode.id, { showDirections: e.target.checked })}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <Label htmlFor="showDirections" className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Показать маршрут
              </Label>
            </div>
          </div>
        </div>

        {/* Generate Map Preview */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="generateMapPreview"
            checked={selectedNode.data.generateMapPreview !== false}
            onChange={(e) => onNodeUpdate(selectedNode.id, { generateMapPreview: e.target.checked })}
            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <Label htmlFor="generateMapPreview" className="text-xs font-medium text-orange-700 dark:text-orange-300">
            Генерировать превью карты с кнопками сервисов
          </Label>
        </div>
      </div>
    </div>
  );
}
