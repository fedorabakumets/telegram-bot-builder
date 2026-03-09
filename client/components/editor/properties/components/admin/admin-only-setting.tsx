/**
 * @fileoverview Компонент настройки ограничения доступа только для администраторов
 * 
 * Блок управления настройкой adminOnly для узлов бота.
 * Позволяет ограничить доступ к команде/сообщению только для
 * администраторов и владельца бота.
 * 
 * @module AdminOnlySetting
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента настройки админ-доступа
 */
interface AdminOnlySettingProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки ограничения доступа только для администраторов
 * 
 * Отображает переключатель с информацией о том, что функция
 * временно не работает.
 * 
 * @param {AdminOnlySettingProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент настройки админ-доступа
 */
export function AdminOnlySetting({ selectedNode, onNodeUpdate }: AdminOnlySettingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-destructive-50/60 to-red-50/40 dark:from-destructive-950/30 dark:to-red-950/20 border border-destructive-200/40 dark:border-destructive-700/40 hover:border-destructive-300/60 dark:hover:border-destructive-600/60 hover:shadow-sm transition-all duration-200">
      <div className="flex-1 min-w-0">
        <Label className="text-xs sm:text-sm font-semibold text-destructive-700 dark:text-destructive-300 flex items-center gap-1.5">
          <i className="fas fa-crown text-xs sm:text-sm"></i>
          Только администраторы
        </Label>
        <div className="text-xs text-destructive-600 dark:text-destructive-400 mt-0.5">Доступна только админам и владельцу</div>
        <div className="flex items-center gap-1 mt-1">
          <i className="fas fa-exclamation-triangle text-amber-500 text-xs"></i>
          <span className="text-xs text-amber-600 dark:text-amber-400">Временно не работает</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Switch
          checked={selectedNode.data.adminOnly ?? false}
          onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { adminOnly: checked })}
        />
      </div>
    </div>
  );
}
