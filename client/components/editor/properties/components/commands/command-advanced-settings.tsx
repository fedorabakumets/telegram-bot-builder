/**
 * @fileoverview Компонент расширенных настроек для команд
 * 
 * Содержит настройки отображения в меню, приватности
 * и ограничения доступа для администраторов.
 * 
 * @module CommandAdvancedSettings
 */

import { Node } from '@shared/schema';
import { SectionHeader } from '../layout/section-header';
import { ShowInMenuSetting } from '../admin/show-in-menu-setting';
import { PrivateOnlySetting } from '../admin/private-only-setting';
import { AdminOnlySetting } from '../admin/admin-only-setting';

/**
 * Пропсы компонента расширенных настроек команд
 */
interface CommandAdvancedSettingsProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Открыты ли базовые настройки */
  isOpen: boolean;
  /** Функция переключения состояния базовых настроек */
  onToggle: () => void;
}

/**
 * Компонент расширенных настроек для команд
 * 
 * Включает:
 * - Показать в меню @BotFather
 * - Только приватные чаты
 * - Только администраторы
 * 
 * @param {CommandAdvancedSettingsProps} props - Пропсы компонента
 * @returns {JSX.Element | null} Расширенные настройки команд
 */
export function CommandAdvancedSettings({
  selectedNode,
  onNodeUpdate,
  isOpen,
  onToggle
}: CommandAdvancedSettingsProps) {
  if (selectedNode.type !== 'start' && selectedNode.type !== 'command') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-cyan-50/40 to-blue-50/20 dark:from-cyan-950/30 dark:to-blue-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-cyan-200/40 dark:border-cyan-800/40 backdrop-blur-sm">
      <SectionHeader
        title="Расширенные настройки"
        description="Меню, приватность и права администратора"
        isOpen={isOpen}
        onToggle={onToggle}
        icon="gear"
        iconGradient="from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50"
        iconColor="text-cyan-600 dark:text-cyan-400"
        descriptionColor="text-cyan-700/70 dark:text-cyan-300/70"
      />

      {isOpen && (
        <div className="space-y-3 sm:space-y-4">
          <ShowInMenuSetting selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
          <PrivateOnlySetting selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
          <AdminOnlySetting selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
        </div>
      )}
    </div>
  );
}
