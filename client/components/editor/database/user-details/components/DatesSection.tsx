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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Даты</Label>
        </div>
        <div className="grid gap-2 pl-6">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Регистрация:</span>
            <span className="font-medium">{formatDate(user.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Обновление:</span>
            <span className="font-medium">{formatDate(user.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Активность:</span>
            <span className="font-medium">{formatDate(user.lastInteraction)}</span>
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
}
