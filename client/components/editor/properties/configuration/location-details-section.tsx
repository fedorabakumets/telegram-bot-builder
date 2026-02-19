/**
 * @fileoverview Компонент секции описания местоположения
 * 
 * Блок управления настройками описания места: название, адрес,
 * город и страна.
 * 
 * @module LocationDetailsSection
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента секции описания местоположения
 */
interface LocationDetailsSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент секции описания местоположения
 * 
 * Позволяет указать:
 * - Название места
 * - Адрес
 * - Город
 * - Страну
 * 
 * @param {LocationDetailsSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция описания местоположения
 */
export function LocationDetailsSection({
  selectedNode,
  onNodeUpdate
}: LocationDetailsSectionProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Описание местоположения</Label>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
            <i className="fas fa-tag mr-1"></i>
            Название места
          </Label>
          <Input
            value={selectedNode.data.title || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { title: e.target.value })}
            className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
            placeholder="Красная площадь"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
            <i className="fas fa-map-signs mr-1"></i>
            Адрес
          </Label>
          <Input
            value={selectedNode.data.address || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { address: e.target.value })}
            className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
            placeholder="Красная площадь, дом 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
              <i className="fas fa-city mr-1"></i>
              Город
            </Label>
            <Input
              value={selectedNode.data.city || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { city: e.target.value })}
              className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
              placeholder="Москва"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
              <i className="fas fa-flag mr-1"></i>
              Страна
            </Label>
            <Input
              value={selectedNode.data.country || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { country: e.target.value })}
              className="border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
              placeholder="Россия"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
