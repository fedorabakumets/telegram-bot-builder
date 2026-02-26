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
      <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 w-full">
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2">
          <Activity className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
          <Label className="text-xs xs:text-sm font-semibold truncate w-full">Статистика</Label>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 w-full">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 xs:p-2 sm:p-3 text-center min-w-0 w-full">
            <div className="text-base xs:text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 break-all">
              {total}
            </div>
            <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Всего</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5 xs:p-2 sm:p-3 text-center min-w-0 w-full">
            <div className="text-base xs:text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 break-all">
              {userSent}
            </div>
            <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground whitespace-nowrap">От юзера</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5 xs:p-2 sm:p-3 text-center min-w-0 w-full col-span-2 xs:col-span-1">
            <div className="text-base xs:text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 break-all">
              {botSent}
            </div>
            <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground whitespace-nowrap">От бота</div>
          </div>
        </div>
        {onOpenDialog && (
          <div className="pl-4 xs:pl-5 sm:pl-6 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDialog(user)}
              className="w-full text-xs xs:text-sm"
              data-testid="button-open-dialog-from-details"
            >
              <MessageSquare className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 mr-1.5 xs:mr-2 sm:mr-2 flex-shrink-0" />
              <span className="hidden xs:inline">Открыть историю диалога</span>
              <span className="xs:hidden">Диалог</span>
            </Button>
          </div>
        )}
      </div>

      <Separator />
    </>
  );
}
