/**
 * @fileoverview Компонент выбора пользователя
 * @description Выпадающий список для переключения между пользователями
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserBotData } from '@shared/schema';

/**
 * @interface UserSelectProps
 * @description Свойства компонента выбора пользователя
 */
interface UserSelectProps {
  /** Текущий пользователь */
  user: UserBotData;
  /** Все пользователи */
  users: UserBotData[];
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция выбора пользователя */
  onSelectUser: (user: UserBotData) => void;
}

/**
 * Компонент выбора пользователя
 * @param {UserSelectProps} props - Свойства компонента
 * @returns {JSX.Element} Выпадающий список
 */
export function UserSelect({ user, users, formatUserName, onSelectUser }: UserSelectProps): React.JSX.Element {
  return (
    <Select
      value={user.userId.toString()}
      onValueChange={(value) => {
        const selectedUser = users.find((u) => u.userId.toString() === value);
        if (selectedUser) {
          onSelectUser(selectedUser);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {users.map((u) => (
          <SelectItem key={u.userId} value={u.userId.toString()}>
            {formatUserName(u)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
