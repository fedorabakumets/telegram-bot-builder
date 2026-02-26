/**
 * @fileoverview Компонент статистики сообщений пользователя
 * @description Отображает количество сообщений и кнопку диалога
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity, MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserBotData } from '@shared/schema';

/**
 * @interface StatisticsProps
 * @description Свойства компонента статистики
 */
interface StatisticsProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Общее количество сообщений */
  total: number;
  /** Количество сообщений от пользователя */
  userSent: number;
  /** Количество сообщений от бота */
  botSent: number;
  /** Функция открытия диалога */
  onOpenDialog?: (user: UserBotData) => void;
}

/**
 * Компонент статистики
 * @param {StatisticsProps} props - Свойства компонента
 * @returns {JSX.Element} Секция со статистикой
 */
export function Statistics({ user, total, userSent, botSent, onOpenDialog }: StatisticsProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
          <Label className="text-xs sm:text-sm font-semibold truncate">Статистика</Label>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pl-5 sm:pl-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 break-all">
              {total}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Всего</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 break-all">
              {userSent}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">От юзера</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 break-all">
              {botSent}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">От бота</div>
          </div>
        </div>
        {onOpenDialog && (
          <div className="pl-5 sm:pl-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDialog(user)}
              className="w-full text-xs sm:text-sm"
              data-testid="button-open-dialog-from-details"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Открыть историю диалога</span>
              <span className="sm:hidden">Диалог</span>
            </Button>
          </div>
        )}
      </div>

      <Separator />
    </>
  );
}
