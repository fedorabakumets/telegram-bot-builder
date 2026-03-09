/**
 * @fileoverview Компонент заголовка диалога
 * @description Отображает заголовок и описание диалога с пользователем
 */

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента DialogHeader
 */
interface MessageDialogHeaderProps {
  /** Выбранный пользователь для диалога */
  selectedUser: UserBotData | null;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
}

/**
 * Компонент заголовка диалога
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка
 */
export function MessageDialogHeader({
  selectedUser,
  formatUserName,
}: MessageDialogHeaderProps): React.JSX.Element {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Диалог с пользователем
      </DialogTitle>
      <DialogDescription>
        {selectedUser && formatUserName(selectedUser)}
      </DialogDescription>
    </DialogHeader>
  );
}
