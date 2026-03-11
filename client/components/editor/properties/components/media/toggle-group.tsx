/**
 * @fileoverview Группа переключателей с заголовком и иконкой
 *
 * Переиспользуемый компонент для отображения группы переключателей
 * с общим заголовком, иконкой и описанием.
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { InputToggleConfig } from './media-input-config';

/** Пропсы компонента ToggleGroup */
interface ToggleGroupProps {
  /** Заголовок группы */
  title: string;
  /** Иконка группы (FontAwesome класс) */
  icon: string;
  /** Цвет заголовка (Tailwind классы) */
  colorClasses: { title: string; icon: string; };
  /** Конфигурации переключателей в группе */
  configs: InputToggleConfig[];
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Дополнительное описание группы (опционально) */
  description?: string;
}

/**
 * Компонент группы переключателей
 *
 * @param {ToggleGroupProps} props - Пропсы компонента
 * @returns {JSX.Element} Группа переключателей с заголовком
 */
export function ToggleGroup({
  title,
  icon,
  colorClasses,
  configs,
  selectedNode,
  onNodeUpdate,
  description,
}: ToggleGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <i className={`fas ${icon} text-sm ${colorClasses.icon}`}></i>
        <Label className={`text-sm font-semibold ${colorClasses.title}`}>
          {title}
        </Label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {configs.map((config: InputToggleConfig) => (
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
      {description && (
        <p className="text-xs text-muted-foreground">
          <i className="fas fa-info-circle mr-1"></i>
          {description}
        </p>
      )}
    </div>
  );
}
