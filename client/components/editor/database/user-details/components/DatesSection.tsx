/**
 * @fileoverview Компонент дат пользователя
 * @description Отображает даты регистрации, обновления и активности
 */

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserBotData } from '@shared/schema';

/**
 * @interface DatesSectionProps
 * @description Свойства компонента дат
 */
interface DatesSectionProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция форматирования даты */
  formatDate: (date: unknown) => string;
}

/**
 * Компонент дат пользователя
 * @param {DatesSectionProps} props - Свойства компонента
 * @returns {JSX.Element} Секция с датами
 */
export function DatesSection({ user, formatDate }: DatesSectionProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <Label className="text-xs sm:text-sm font-semibold">Даты</Label>
        </div>
        <div className="grid gap-1.5 sm:gap-2 pl-5 sm:pl-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
            <span className="text-muted-foreground whitespace-nowrap">Регистрация:</span>
            <span className="font-medium truncate">{formatDate(user.createdAt)}</span>
          </div>
          {user.updatedAt && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
              <span className="text-muted-foreground whitespace-nowrap">Обновление:</span>
              <span className="font-medium truncate">{formatDate(user.updatedAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
            <span className="text-muted-foreground whitespace-nowrap">Активность:</span>
            <span className="font-medium truncate">{formatDate(user.lastInteraction)}</span>
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
}
