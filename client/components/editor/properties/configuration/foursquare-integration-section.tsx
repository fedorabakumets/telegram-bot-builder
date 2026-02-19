/**
 * @fileoverview Компонент секции интеграции с Foursquare
 * 
 * Блок управления настройками интеграции с Foursquare:
 * ID места и тип места.
 * 
 * @module FoursquareIntegrationSection
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента секции Foursquare
 */
interface FoursquareIntegrationSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент секции интеграции с Foursquare
 * 
 * Позволяет указать:
 * - Foursquare ID места
 * - Тип места (category)
 * 
 * @param {FoursquareIntegrationSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция интеграции с Foursquare
 */
export function FoursquareIntegrationSection({
  selectedNode,
  onNodeUpdate
}: FoursquareIntegrationSectionProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10 border border-purple-200/30 dark:border-purple-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
          <i className="fas fa-map text-purple-600 dark:text-purple-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">Foursquare (опционально)</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
            <i className="fas fa-hashtag mr-1"></i>
            Foursquare ID
          </Label>
          <Input
            value={selectedNode.data.foursquareId || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { foursquareId: e.target.value })}
            className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
            placeholder="4b0588f1f964a52079c525e3"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
            <i className="fas fa-layer-group mr-1"></i>
            Тип места
          </Label>
          <Input
            value={selectedNode.data.foursquareType || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { foursquareType: e.target.value })}
            className="border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-200"
            placeholder="arts_entertainment/default"
          />
        </div>
      </div>

      <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
        Интеграция с Foursquare для дополнительной информации о месте
      </div>
    </div>
  );
}
