/**
 * @fileoverview Компонент переключателя статуса пользователя
 * @description Позволяет включать/выключать активность пользователя
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента UserStatusToggle
 */
interface UserStatusToggleProps {
  /** Данные пользователя */
  selectedUser: UserBotData;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
}

/**
 * Компонент переключателя статуса
 * @param props - Пропсы компонента
 * @returns JSX компонент переключателя
 */
export function UserStatusToggle({
  selectedUser,
  handleUserStatusToggle,
}: UserStatusToggleProps): React.JSX.Element {
  return (
    <div>
      <Label className="text-sm font-medium">Статус пользователя</Label>
      <div className="mt-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={Boolean(selectedUser.isActive)}
            onCheckedChange={() => handleUserStatusToggle(selectedUser, 'isActive')}
          />
          <Label>Активен</Label>
          <span className="text-xs text-muted-foreground ml-2">
            (пользователь может взаимодействовать с ботом)
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Вы можете деактивировать пользователя, если нужно временно ограничить его доступ к боту.
        </p>
      </div>
    </div>
  );
}
