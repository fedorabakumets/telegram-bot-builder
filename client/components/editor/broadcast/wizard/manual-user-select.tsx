/**
 * @fileoverview Компонент ручного выбора пользователей для рассылки
 * @module client/components/editor/broadcast/wizard/manual-user-select
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени или username"
      />

      <div className="flex items-center gap-2 py-1">
        <Checkbox
          id="select-all"
          checked={allFilteredSelected}
          onCheckedChange={handleToggleAll}
        />
        <Label htmlFor="select-all" className="cursor-pointer text-sm">
          Все ({filteredUsers.length})
        </Label>
      </div>

      <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
        {filteredUsers.map((user) => (
          <div key={user.userId} className="flex items-center gap-2">
            <Checkbox
              id={`user-${user.userId}`}
              checked={selectedUserIds.includes(user.userId)}
              onCheckedChange={(checked) => handleToggleUser(user.userId, !!checked)}
            />
            <Label htmlFor={`user-${user.userId}`} className="cursor-pointer text-sm truncate">
              {user.firstName ?? ''} {user.lastName ?? ''}
              {user.userName && <span className="text-muted-foreground ml-1">@{user.userName}</span>}
            </Label>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-2">Пользователи не найдены</div>
        )}
      </div>
    </div>
  );
}
