/**
 * @fileoverview Компонент ручного выбора пользователей для рассылки
 * @module client/components/editor/broadcast/wizard/manual-user-select
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/utils';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import type { UserBotData } from '@shared/schema';

/**
 * Ответ сервера при загрузке пользователей
 */
interface UsersResponse {
  /** Список пользователей */
  users: UserBotData[];
  /** Общее количество */
  total: number;
  /** Есть ли ещё страницы */
  hasMore: boolean;
}

/**
 * Пропсы компонента ManualUserSelect
 */
interface ManualUserSelectProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота */
  tokenId?: number | null;
  /** Массив выбранных userId */
  selectedUserIds: string[];
  /** Колбэк изменения выбранных userId */
  onChangeUserIds: (userIds: string[]) => void;
}

/**
 * Компонент списка пользователей с чекбоксами для ручного выбора аудитории
 * @param props - Свойства компонента
 * @returns JSX элемент списка пользователей
 */
export function ManualUserSelect({ projectId, tokenId, selectedUserIds, onChangeUserIds }: ManualUserSelectProps) {
  const [search, setSearch] = useState('');

  const url = buildUsersApiUrl(`/api/projects/${projectId}/users`, tokenId, {
    limit: '1000',
    offset: '0',
  });

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['broadcast-manual-users', projectId, tokenId],
    queryFn: async () => {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const users = data?.users ?? [];

  /** При первой загрузке — выбираем всех пользователей */
  useEffect(() => {
    if (users.length > 0 && selectedUserIds.length === 0) {
      onChangeUserIds(users.map((u) => u.userId));
    }
  }, [users.length]);

  /** Фильтрация по поисковому запросу */
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      const username = (u.userName ?? '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [users, search]);

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.userId));

  /** Переключение чекбокса «Все» */
  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      const newIds = new Set(selectedUserIds);
      filteredUsers.forEach((u) => newIds.add(u.userId));
      onChangeUserIds(Array.from(newIds));
    } else {
      const removeSet = new Set(filteredUsers.map((u) => u.userId));
      onChangeUserIds(selectedUserIds.filter((id) => !removeSet.has(id)));
    }
  };

  /** Переключение одного пользователя */
  const handleToggleUser = (userId: string, checked: boolean) => {
    if (checked) {
      onChangeUserIds([...selectedUserIds, userId]);
    } else {
      onChangeUserIds(selectedUserIds.filter((id) => id !== userId));
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-2">Загрузка пользователей...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Поле поиска с иконкой */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или username"
          className="pl-8"
        />
      </div>

      {/* Чекбокс «Все» */}
      <div className="flex items-center gap-2 py-1.5 border-b pb-2">
        <Checkbox id="select-all" checked={allFilteredSelected} onCheckedChange={handleToggleAll} />
        <Label htmlFor="select-all" className="cursor-pointer text-sm font-semibold">
          Все ({filteredUsers.length})
        </Label>
      </div>

      {/* Список пользователей */}
      <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1">
        {filteredUsers.map((user) => {
          const initials = (user.firstName ?? '?')[0].toUpperCase();
          const isSelected = selectedUserIds.includes(user.userId);

          return (
            <div
              key={user.userId}
              className={cn(
                'flex items-center gap-2.5 rounded-lg p-1.5 transition-colors',
                'hover:bg-accent/40',
                isSelected && 'bg-blue-500/5',
              )}
            >
              <Checkbox
                id={`user-${user.userId}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleToggleUser(user.userId, !!checked)}
              />
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {initials}
              </div>
              <Label htmlFor={`user-${user.userId}`} className="cursor-pointer text-sm truncate flex-1">
                {user.firstName ?? ''} {user.lastName ?? ''}
                {user.userName && <span className="text-muted-foreground ml-1">@{user.userName}</span>}
              </Label>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">Пользователи не найдены</div>
        )}
      </div>
    </div>
  );
}
