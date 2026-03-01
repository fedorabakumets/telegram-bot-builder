/**
 * @fileoverview Компонент переключателей типов ввода медиа
 * 
 * Сетка переключателей для настройки типов ввода пользователя:
 * - Текстовый ввод
 * - Ввод фото
 * - Ввод видео
 * - Ввод аудио
 * - Ввод документа
 * 
 * Используется в панели свойств узлов для настройки сбора пользовательского ввода.
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TOGGLE_CONFIGS, InputToggleConfig } from './media-input-config';

/**
 * Пропсы компонента MediaInputToggles
 */
interface MediaInputTogglesProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент сетки переключателей типов ввода медиа
 * 
 * Отображает переключатели для настройки типов ввода пользователя.
 * Каждый переключатель имеет иконку, заголовок, описание и switch.
 *
 * @param {MediaInputTogglesProps} props - Пропсы компонента
 * @returns {JSX.Element} Сетка переключателей типов ввода
 */
export function MediaInputToggles({ selectedNode, onNodeUpdate }: MediaInputTogglesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      {TOGGLE_CONFIGS.map((config: InputToggleConfig) => (
        <div
          key={config.type}
          className={`flex flex-col sm:flex-row sm:items-start sm:justify-between p-2.5 sm:p-3 rounded-lg bg-gradient-to-br ${config.colors.bg} border ${config.colors.border} ${config.colors.hoverBorder} hover:shadow-sm transition-all duration-200`}
        >
          <div className="flex-1 min-w-0">
            <Label className={`text-xs sm:text-sm font-semibold ${config.colors.text} flex items-center gap-1.5`}>
              <i className={`fas ${config.icon} text-xs sm:text-sm`}></i>
              {config.title}
            </Label>
            <div className={`text-xs ${config.colors.desc} ${config.colors.descDark} mt-1 line-clamp-2`}>
              {config.description}
            </div>
          </div>
          <div className="mt-2 sm:mt-0 sm:ml-2 flex-shrink-0">
            <Switch
              checked={selectedNode.data[config.type] ?? false}
              onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { [config.type]: checked })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
