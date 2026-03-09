/**
 * @fileoverview Компонент статуса пользователя
 * @description Отображает переключатель активности пользователя
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserCheck, UserX } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * @interface UserStatusProps
 * @description Свойства компонента статуса
 */
interface UserStatusProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция переключения статуса */
  onToggle: (field: 'isActive') => void;
}

/**
 * Компонент статуса пользователя
 * @param {UserStatusProps} props - Свойства компонента
 * @returns {JSX.Element} Секция со статусом
 */
export function UserStatus({ user, onToggle }: UserStatusProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user.isActive && Number(user.isActive) !== 0 ? (
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
          ) : (
            <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
          )}
          <Label className="text-xs sm:text-sm font-semibold">Статус пользователя</Label>
        </div>
        <div className="pl-5 sm:pl-6 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs sm:text-sm">Активен</Label>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Может взаимодействовать с ботом
              </p>
            </div>
            <Switch
              checked={Boolean(user.isActive)}
              onCheckedChange={() => onToggle('isActive')}
              data-testid="switch-user-active"
              className="h-5 w-9 sm:h-6 sm:w-11"
            />
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
}
