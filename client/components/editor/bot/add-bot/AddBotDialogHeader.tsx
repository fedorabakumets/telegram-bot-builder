/**
 * @fileoverview Заголовок диалога добавления бота
 *
 * Компонент отображает заголовок и описание диалога.
 *
 * @module AddBotDialogHeader
 */

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

/**
 * Заголовок диалога добавления бота
 */
export function AddBotDialogHeader() {
  return (
    <DialogHeader className="space-y-3 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <DialogTitle className="text-xl sm:text-2xl">Подключить бота</DialogTitle>
        </div>
      </div>
      <DialogDescription className="text-sm">
        Добавьте нового бота, используя токен от <span className="font-semibold text-foreground">@BotFather</span>
      </DialogDescription>
    </DialogHeader>
  );
}
