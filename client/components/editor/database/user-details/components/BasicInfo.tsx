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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Основная информация</Label>
        </div>
        <div className="grid gap-3 pl-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[100px]">Имя:</span>
            <span className="text-sm font-medium">
              {user.firstName && typeof user.firstName === 'string' ? user.firstName : 'Не указано'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[100px]">Username:</span>
            <span className="text-sm font-medium">
              {user.userName && typeof user.userName === 'string' ? (
                <span className="flex items-center gap-1">
                  <AtSign className="w-3 h-3" />
                  {user.userName}
                </span>
              ) : 'Не указано'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[100px]">Telegram ID:</span>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {String(user.userId)}
            </span>
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
}
