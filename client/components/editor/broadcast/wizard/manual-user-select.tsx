/**
 * @fileoverview Компонент ручного выбора пользователей для рассылки
 * @module client/components/editor/broadcast/wizard/manual-user-select
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/utils';
import { loadManualUsers } from './load-manual-users';
import { UserAvatar } from '@/components/editor/database/dialog/components/user-avatar';
import type { UserBotData } from '@shared/schema';

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
  /** Выбрать доступных пользователей при первом открытии. */
  initializeAll: boolean;
  /** Колбэк изменения выбранных userId */
  onChangeUserIds: (userIds: string[]) => void;
}

/**
 * Компонент списка пользователей с чекбоксами для ручного выбора аудитории
 * @param props - Свойства компонента
 * @returns JSX элемент списка пользователей
 */
export function ManualUserSelect({ projectId, tokenId, selectedUserIds, initializeAll, onChangeUserIds }: ManualUserSelectProps) {
  const [search, setSearch] = useState('');
  /** Однократная проверка сохранённого выбора после загрузки. */
  const initialized = useRef(false);

  const { data: users = [], isLoading, isError } = useQuery<UserBotData[]>({
    queryKey: ['broadcast-manual-users-complete', projectId, tokenId],
    queryFn: ({ signal }) => loadManualUsers(projectId, tokenId, signal),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  /** При первой загрузке исключаем недоступные аккаунты из выбора. */
  useEffect(() => {
    if (isLoading || isError || initialized.current) return;
    initialized.current = true;
    const available = users.filter((u) => !u.isBlocked && !u.isDeleted && !u.isBot);
    const allowed = new Set(available.map((u) => u.userId));
    const next = initializeAll ? available.map((u) => u.userId) : selectedUserIds.filter((id) => allowed.has(id));
    if (initializeAll || next.length !== selectedUserIds.length) onChangeUserIds(next);
  }, [users, isLoading, isError, initializeAll, selectedUserIds, onChangeUserIds]);

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

  /** Для массового выбора доступны только получатели без известных ограничений. */
  const availableFiltered = filteredUsers.filter((u) => !u.isBlocked && !u.isDeleted && !u.isBot);
  const allFilteredSelected = availableFiltered.length > 0 && availableFiltered.every((u) => selectedUserIds.includes(u.userId));

  /** Переключение чекбокса «Все» */
  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      const newIds = new Set(selectedUserIds);
      availableFiltered.forEach((u) => newIds.add(u.userId));
      onChangeUserIds(Array.from(newIds));
    } else {
      const removeSet = new Set(availableFiltered.map((u) => u.userId));
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

  if (isError) return <p role="alert" className="text-sm text-destructive">Не удалось загрузить список. Закройте мастер и попробуйте снова.</p>;

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
        <Checkbox id="select-all" checked={allFilteredSelected} disabled={availableFiltered.length === 0} onCheckedChange={handleToggleAll} />
        <Label htmlFor="select-all" className="cursor-pointer text-sm font-semibold">
          Все доступные ({availableFiltered.length.toLocaleString('ru-RU')})
        </Label>
      </div>

      {/* Список пользователей */}
      <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1">
        {filteredUsers.map((user) => {
          const unavailable = !!(user.isBlocked || user.isDeleted || user.isBot);
          const isSelected = !unavailable && selectedUserIds.includes(user.userId);

          return (
            <div
              key={user.userId}
              className={cn(
                'flex items-center gap-2.5 rounded-lg p-1.5 transition-colors',
                'hover:bg-accent/40',
                isSelected && 'bg-muted/40',
              )}
            >
              <Checkbox
                id={`user-${user.userId}`}
                checked={isSelected}
                disabled={unavailable}
                onCheckedChange={(checked) => handleToggleUser(user.userId, !!checked)}
              />
              <UserAvatar messageType="user" user={user} projectId={projectId} tokenId={tokenId} size={28} />
              <Label htmlFor={`user-${user.userId}`} className={cn('text-sm truncate flex-1', !unavailable && 'cursor-pointer')}>
                {user.firstName ?? ''} {user.lastName ?? ''}
                {user.userName && <span className="text-muted-foreground ml-1">@{user.userName}</span>}
              </Label>
              {unavailable && <span className="shrink-0 text-xs text-muted-foreground">{user.isDeleted ? 'Аккаунт удалён' : user.isBlocked ? 'Заблокировал бота' : 'Бот'}</span>}
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
