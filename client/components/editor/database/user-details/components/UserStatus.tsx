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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {user.isActive && Number(user.isActive) !== 0 ? (
            <UserCheck className="w-4 h-4 text-green-500" />
          ) : (
            <UserX className="w-4 h-4 text-red-500" />
          )}
          <Label className="text-sm font-semibold">Статус пользователя</Label>
        </div>
        <div className="pl-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Активен</Label>
              <p className="text-xs text-muted-foreground">
                Пользователь может взаимодействовать с ботом
              </p>
            </div>
            <Switch
              checked={Boolean(user.isActive)}
              onCheckedChange={() => onToggle('isActive')}
              data-testid="switch-user-active"
            />
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
}
