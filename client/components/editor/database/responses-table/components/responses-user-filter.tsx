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
  users,
  selectedUser,
  onSelectUser,
  formatUserName,
}: ResponsesUserFilterProps): React.JSX.Element {
  return (
    <Select
      value={selectedUser?.id.toString() || 'all'}
      onValueChange={(value) => {
        if (value === 'all') {
          onSelectUser(null);
        } else {
          const user = users.find((u) => u.id.toString() === value);
          onSelectUser(user || null);
        }
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Все пользователи" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все пользователи</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id.toString()}>
            {formatUserName(user)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
