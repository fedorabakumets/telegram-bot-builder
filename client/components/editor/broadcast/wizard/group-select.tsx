/**
 * @fileoverview Выбор групп для одного токена (GET …/groups?tokenId=)
 * @module client/components/editor/broadcast/wizard/group-select
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Radio, Inbox } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

/** Данные группы из API */
interface GroupData {
  /** ID записи (может быть отрицательным для «виртуальных» из messages) */
  id: number;
  /** Telegram chat_id */
  groupId: string;
  /** Название */
  name: string;
  /** Тип чата */
  chatType: string;
  /** Участники */
  memberCount: number | null;
}

/** Пропсы GroupSelect */
interface GroupSelectProps {
  /** ID проекта */
  projectId: number;
  /** ID токена бота — фильтр списка групп */
  tokenId: number;
  /** Выбранные Telegram chat_id */
  selectedGroupIds: string[];
  /** Колбэк изменения выбора */
  onChangeGroupIds: (groupIds: string[]) => void;
}

const chatTypeLabels: Record<string, string> = {
  group: 'Группа',
  supergroup: 'Супергруппа',
  channel: 'Канал',
};

/**
 * Список групп одного бота с чекбоксами
 * @param props - Свойства
 * @returns JSX
 */
export function GroupSelect({ projectId, tokenId, selectedGroupIds, onChangeGroupIds }: GroupSelectProps) {
  const { data: groups = [], isLoading } = useQuery<GroupData[]>({
    queryKey: ['broadcast-groups', projectId, tokenId],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/groups?tokenId=${tokenId}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!projectId && !!tokenId,
    staleTime: 30_000,
  });

  const availableGroups = groups.filter((g) => !!g.groupId);

  useEffect(() => {
    if (availableGroups.length > 0 && selectedGroupIds.length === 0) {
      onChangeGroupIds(availableGroups.map((g) => g.groupId));
    }
  }, [availableGroups.length, tokenId]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-2">Загрузка групп...</div>;
  }

  if (availableGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 text-muted-foreground">
        <Inbox className="w-7 h-7 opacity-40" />
        <span className="text-sm">Нет групп у этого бота</span>
      </div>
    );
  }

  const allSelected = availableGroups.every((g) => selectedGroupIds.includes(g.groupId));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-1 border-b pb-2">
        <Checkbox
          id={`select-all-groups-${tokenId}`}
          checked={allSelected}
          onCheckedChange={(checked) =>
            onChangeGroupIds(checked ? availableGroups.map((g) => g.groupId) : [])
          }
        />
        <Label htmlFor={`select-all-groups-${tokenId}`} className="cursor-pointer text-sm font-semibold">
          Все группы ({availableGroups.length})
        </Label>
      </div>

      <div className="max-h-36 overflow-y-auto space-y-1.5">
        {availableGroups.map((group) => {
          const isChannel = group.chatType === 'channel';
          const Icon = isChannel ? Radio : Users;
          const isSelected = selectedGroupIds.includes(group.groupId);

          return (
            <div
              key={`${tokenId}-${group.groupId}`}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border p-2 transition-colors',
                'hover:bg-accent/40',
                isSelected && 'border-violet-300/50 bg-violet-500/5',
              )}
            >
              <Checkbox
                id={`group-${tokenId}-${group.groupId}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) onChangeGroupIds([...selectedGroupIds, group.groupId]);
                  else onChangeGroupIds(selectedGroupIds.filter((id) => id !== group.groupId));
                }}
              />
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <Label
                htmlFor={`group-${tokenId}-${group.groupId}`}
                className="cursor-pointer text-sm truncate flex-1"
              >
                {group.name}
              </Label>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {chatTypeLabels[group.chatType] ?? group.chatType}
                {group.memberCount != null && ` · ${group.memberCount}`}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
