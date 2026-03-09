/**
 * @fileoverview Компонент настройки отображения команды в меню
 * 
 * Блок управления настройкой showInMenu для узлов бота.
 * Позволяет добавить команду в меню @BotFather.
 * 
 * @module ShowInMenuSetting
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента настройки отображения в меню
 */
interface ShowInMenuSettingProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки отображения команды в меню
 * 
 * Отображает переключатель для добавления команды в меню @BotFather.
 * 
 * @param {ShowInMenuSettingProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент настройки отображения в меню
 */
export function ShowInMenuSetting({ selectedNode, onNodeUpdate }: ShowInMenuSettingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-primary-50/60 to-cyan-50/40 dark:from-primary-950/30 dark:to-cyan-950/20 border border-primary-200/40 dark:border-primary-700/40 hover:border-primary-300/60 dark:hover:border-primary-600/60 hover:shadow-sm transition-all duration-200">
      <div className="flex-1 min-w-0">
        <Label className="text-xs sm:text-sm font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
          <i className="fas fa-list text-xs sm:text-sm"></i>
          Показать в меню
        </Label>
        <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">Добавить команду в меню @BotFather</div>
      </div>
      <div className="flex-shrink-0">
        <Switch
          checked={selectedNode.data.showInMenu ?? true}
          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { showInMenu: checked })}
        />
      </div>
    </div>
  );
}
