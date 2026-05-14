/**
 * @fileoverview Компонент выбора групп для рассылки
 * @module client/components/editor/broadcast/wizard/group-select
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Radio, Inbox } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

/**
 * Данные группы из API
 */
interface GroupData {
  /** Уникальный идентификатор записи */
  id: number;
  /** Telegram chat_id группы */
  groupId: string;
  /** Название группы */
  name: string;
  /** Тип чата: group, supergroup, channel */
  chatType: string;
  /** Количество участников */
  memberCount: number | null;
}

/**
 * Пропсы компонента GroupSelect
 */
interface GroupSelectProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Массив выбранных groupId (Telegram chat_id) */
  selectedGroupIds: string[];
  /** Колбэк изменения выбранных групп */
  onChangeGroupIds: (groupIds: string[]) => void;
}

/** Маппинг типа чата на отображаемое название */
const chatTypeLabels: Record<string, string> = {
  group: 'Группа',
  supergroup: 'Супергруппа',
  channel: 'Канал',
};

/**
 * Компонент списка групп с чекбоксами для выбора целевых групп рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент списка групп
 */
export function GroupSelect({ projectId, selectedGroupIds, onChangeGroupIds }: GroupSelectProps) {
  const { data: groups = [], isLoading } = useQuery<GroupData[]>({
    queryKey: ['broadcast-groups', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/groups`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  /** Фильтруем только группы с groupId */
  const availableGroups = groups.filter((g) => !!g.groupId);

  /** При первой загрузке — выбираем все группы */
  useEffect(() => {
    if (availableGroups.length > 0 && selectedGroupIds.length === 0) {
      onChangeGroupIds(availableGroups.map((g) => g.groupId));
    }
  }, [availableGroups.length]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-2">Загрузка групп...</div>;
  }

  if (availableGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <Inbox className="w-8 h-8 opacity-40" />
        <span className="text-sm">Нет доступных групп</span>
      </div>
    );
  }

  const allSelected = availableGroups.every((g) => selectedGroupIds.includes(g.groupId));

  /** Переключение чекбокса «Все группы» */
  const handleToggleAll = (checked: boolean) => {
    onChangeGroupIds(checked ? availableGroups.map((g) => g.groupId) : []);
  };

  /** Переключение одной группы */
  const handleToggleGroup = (groupId: string, checked: boolean) => {
    if (checked) {
      onChangeGroupIds([...selectedGroupIds, groupId]);
    } else {
      onChangeGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-1 border-b pb-2">
        <Checkbox id="select-all-groups" checked={allSelected} onCheckedChange={handleToggleAll} />
        <Label htmlFor="select-all-groups" className="cursor-pointer text-sm font-semibold">
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
              key={group.groupId}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border p-2 transition-colors',
                'hover:bg-accent/40',
                isSelected && 'border-violet-300/50 bg-violet-500/5',
              )}
            >
              <Checkbox
                id={`group-${group.groupId}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleToggleGroup(group.groupId, !!checked)}
              />
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <Label htmlFor={`group-${group.groupId}`} className="cursor-pointer text-sm truncate flex-1">
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
