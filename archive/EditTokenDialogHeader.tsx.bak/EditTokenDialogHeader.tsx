/**
 * @fileoverview Заголовок диалога редактирования токена
 *
 * Компонент отображает заголовок и описание диалога.
 *
 * @module EditTokenDialogHeader
 */

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit2 } from 'lucide-react';

/**
 * Заголовок диалога редактирования токена
 */
export function EditTokenDialogHeader() {
  return (
    <DialogHeader className="space-y-3 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 dark:from-purple-500/30 dark:to-pink-500/20 flex items-center justify-center flex-shrink-0">
          <Edit2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <DialogTitle className="text-xl sm:text-2xl">Редактировать токен</DialogTitle>
        </div>
      </div>
      <DialogDescription className="text-sm">
        Обновите параметры токена бота для лучшей организации
      </DialogDescription>
    </DialogHeader>
  );
}
