/**
 * @fileoverview Переключатель базы данных пользователей
 *
 * Компонент отображает и управляет настройкой базы данных для проекта.
 *
 * @module BotDatabaseToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database } from 'lucide-react';

interface BotDatabaseToggleProps {
  projectId: number;
  tokenId: number;
  userDatabaseEnabled: number | null;
  toggleDatabaseMutation: any;
}

/**
 * Переключатель базы данных пользователей
 */
export function BotDatabaseToggle({
  projectId,
  tokenId,
  userDatabaseEnabled,
  toggleDatabaseMutation
}: BotDatabaseToggleProps) {
  const isEnabled = userDatabaseEnabled === 1;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${
      isEnabled ? 'bg-green-500/8 border-green-500/30 dark:bg-green-500/10 dark:border-green-500/40' 
      : 'bg-red-500/8 border-red-500/30 dark:bg-red-500/10 dark:border-red-500/40'
    }`} data-testid="database-toggle-container-bot-card">
      <Database className={`w-4 h-4 flex-shrink-0 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
      <Label htmlFor={`db-toggle-bot-${tokenId}`} className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${
        isEnabled ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
      }`}>
        {isEnabled ? 'БД включена' : 'БД выключена'}
      </Label>
      <Switch
        id={`db-toggle-bot-${tokenId}`}
        data-testid="switch-database-toggle-bot-card"
        checked={isEnabled}
        onCheckedChange={(checked) => toggleDatabaseMutation.mutate({ projectId, enabled: checked })}
        disabled={toggleDatabaseMutation.isPending}
      />
    </div>
  );
}
