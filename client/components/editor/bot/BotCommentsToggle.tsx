/**
 * @fileoverview Переключатель генерации комментариев
 *
 * Компонент управляет настройкой генерации комментариев в коде бота.
 *
 * @module BotCommentsToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Code } from 'lucide-react';

interface BotCommentsToggleProps {
  commentsGenerationEnabled: boolean;
  handleToggleCommentsGeneration: (enabled: boolean) => void;
}

/**
 * Переключатель генерации комментариев
 */
export function BotCommentsToggle({
  commentsGenerationEnabled,
  handleToggleCommentsGeneration
}: BotCommentsToggleProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${
      commentsGenerationEnabled ? 'bg-blue-500/8 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/40' 
      : 'bg-gray-500/8 border-gray-500/30 dark:bg-gray-500/10 dark:border-gray-500/40'
    }`} data-testid="comments-generation-toggle-container-bot-card">
      <Code className={`w-4 h-4 flex-shrink-0 ${commentsGenerationEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
      <Label htmlFor="comments-generation-toggle" className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${
        commentsGenerationEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
      }`}>
        Генерация комментариев
      </Label>
      <Switch
        id="comments-generation-toggle"
        data-testid="switch-comments-generation-toggle"
        checked={commentsGenerationEnabled}
        onCheckedChange={handleToggleCommentsGeneration}
      />
    </div>
  );
}
