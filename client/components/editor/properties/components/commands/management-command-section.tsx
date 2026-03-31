/**
 * @fileoverview Секция команды для управляющих узлов
 * 
 * Компонент для настройки команды действий (ban, kick, pin и т.д.).
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Node } from '@shared/schema';

/** Пропсы компонента команды управления */
interface ManagementCommandSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент секции команды для управляющих узлов
 * 
 * @param {ManagementCommandSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция команды управления
 */
export function ManagementCommandSection({
  selectedNode,
  onNodeUpdate
}: ManagementCommandSectionProps) {
  const getPlaceholder = () => {
    const placeholders: Record<string, string> = {
      pin_message: '/pin_message',
      unpin_message: '/unpin_message',
      delete_message: '/delete_message',
      forward_message: '/forward_message',
      ban_user: '/ban_user',
      unban_user: '/unban_user',
      mute_user: '/mute_user',
      unmute_user: '/unmute_user',
      kick_user: '/kick_user',
      promote_user: '/promote_user',
      demote_user: '/demote_user',
      admin_rights: '/admin_rights'
    };
    return placeholders[selectedNode.type] || '/command';
  };

  return (
    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-red-50/40 to-orange-50/20 dark:from-red-950/30 dark:to-orange-900/20 rounded-xl p-3 sm:p-4 border border-red-200/40 dark:border-red-800/40 backdrop-blur-sm">
      <div className="space-y-2 sm:space-y-2.5">
        <Label className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
          <i className="fas fa-terminal text-red-600 dark:text-red-400 text-xs sm:text-sm"></i>
          Команда действия
        </Label>
        <Input
          value={selectedNode.data.command || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { command: e.target.value })}
          className="text-xs sm:text-sm border-red-200 dark:border-red-700 focus:border-red-500 focus:ring-red-200/50"
          placeholder={getPlaceholder()}
          data-testid="input-action-command"
        />
        <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-red-50/50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/40">
          <i className="fas fa-cog text-red-600 dark:text-red-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed">
            Основная команда для вызова этого действия
          </p>
        </div>
      </div>
    </div>
  );
}
