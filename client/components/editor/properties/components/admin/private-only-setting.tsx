/**
 * @fileoverview Компонент настройки ограничения только для приватных чатов
 * 
 * Блок управления настройкой isPrivateOnly для узлов бота.
 * Позволяет ограничить работу команды только личными сообщениями.
 * 
 * @module PrivateOnlySetting
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента настройки приватных чатов
 */
interface PrivateOnlySettingProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки ограничения только для приватных чатов
 * 
 * Отображает переключатель с информацией о том, что функция
 * временно не работает.
 * 
 * @param {PrivateOnlySettingProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент настройки приватных чатов
 */
export function PrivateOnlySetting({ selectedNode, onNodeUpdate }: PrivateOnlySettingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-warning-50/60 to-orange-50/40 dark:from-warning-950/30 dark:to-orange-950/20 border border-warning-200/40 dark:border-warning-700/40 hover:border-warning-300/60 dark:hover:border-warning-600/60 hover:shadow-sm transition-all duration-200">
      <div className="flex-1 min-w-0">
        <Label className="text-xs sm:text-sm font-semibold text-warning-700 dark:text-warning-300 flex items-center gap-1.5">
          <i className="fas fa-lock text-xs sm:text-sm"></i>
          <span className="truncate hidden xs:inline">Только приватные чаты</span>
          <span className="truncate inline xs:hidden">Приватные чаты</span>
        </Label>
        <div className="text-xs text-warning-600 dark:text-warning-400 mt-0.5">Работает только в личных сообщениях</div>
        <div className="flex items-center gap-1 mt-1">
          <i className="fas fa-exclamation-triangle text-amber-500 text-xs"></i>
          <span className="text-xs text-amber-600 dark:text-amber-400">Временно не работает</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Switch
          checked={selectedNode.data.isPrivateOnly ?? false}
          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { isPrivateOnly: checked })}
        />
      </div>
    </div>
  );
}
