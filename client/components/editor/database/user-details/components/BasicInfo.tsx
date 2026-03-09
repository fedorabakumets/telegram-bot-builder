/**
 * @fileoverview Компонент основной информации о пользователе
 * @description Отображает имя, username и Telegram ID
 */

import React from 'react';
import { User, AtSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserBotData } from '@shared/schema';

/**
 * @interface BasicInfoProps
 * @description Свойства компонента основной информации
 */
interface BasicInfoProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент основной информации
 * @param {BasicInfoProps} props - Свойства компонента
 * @returns {JSX.Element} Секция с основной информацией
 */
export function BasicInfo({ user }: BasicInfoProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <Label className="text-xs sm:text-sm font-semibold">Основная информация</Label>
        </div>
        <div className="grid gap-2 sm:gap-3 pl-5 sm:pl-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-sm text-muted-foreground min-w-[70px] sm:min-w-[100px]">Имя:</span>
            <span className="text-xs sm:text-sm font-medium break-words">
              {user.firstName && typeof user.firstName === 'string' ? user.firstName : 'Не указано'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-sm text-muted-foreground min-w-[70px] sm:min-w-[100px]">Username:</span>
            <span className="text-xs sm:text-sm font-medium">
              {user.userName && typeof user.userName === 'string' ? (
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <AtSign className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {user.userName}
                </span>
              ) : 'Не указано'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-sm text-muted-foreground min-w-[70px] sm:min-w-[100px]">Telegram ID:</span>
            <span className="text-xs sm:text-sm font-mono bg-muted px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded break-all">
              {String(user.userId)}
            </span>
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
}
