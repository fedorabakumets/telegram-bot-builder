/**
 * @fileoverview Компонент фильтра пользователей для вкладки ответов
 * @description Выпадающий список для выбора пользователя
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ResponsesUserFilterProps } from '../types';

/**
 * Компонент фильтра пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент фильтра
 */
export function ResponsesUserFilter({
  users = [],
  selectedUser,
  onSelectUser,
  formatUserName,
}: ResponsesUserFilterProps): React.JSX.Element {
  const usersArray = Array.isArray(users) ? users : [];

  return (
    <Select
      value={selectedUser?.id.toString() || 'all'}
      onValueChange={(value) => {
        if (value === 'all') {
          onSelectUser(null);
        } else {
          const user = usersArray.find((u) => u.id.toString() === value);
          onSelectUser(user || null);
        }
      }}
    >
      <SelectTrigger id="user-filter" aria-label="Пользователь для просмотра ответов" className="h-10 w-full min-w-0 rounded-lg bg-background text-sm [&>span]:truncate">
        <SelectValue placeholder="Все пользователи" />
      </SelectTrigger>
      <SelectContent className="users-portal">
        <SelectItem value="all">Все пользователи</SelectItem>
        {usersArray.map((user) => (
          <SelectItem key={user.id} value={user.id.toString()}>
            {formatUserName(user)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
