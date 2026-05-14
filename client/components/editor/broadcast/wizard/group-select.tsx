/**
 * @fileoverview Компонент выбора групп для рассылки
 * @module client/components/editor/broadcast/wizard/group-select
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
    return <div className="text-sm text-muted-foreground py-2">Нет групп</div>;
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
      <div className="flex items-center gap-2 py-1">
        <Checkbox id="select-all-groups" checked={allSelected} onCheckedChange={handleToggleAll} />
        <Label htmlFor="select-all-groups" className="cursor-pointer text-sm">
          Все группы ({availableGroups.length})
        </Label>
      </div>

      <div className="max-h-36 overflow-y-auto border rounded p-2 space-y-1">
        {availableGroups.map((group) => (
          <div key={group.groupId} className="flex items-center gap-2">
            <Checkbox
              id={`group-${group.groupId}`}
              checked={selectedGroupIds.includes(group.groupId)}
              onCheckedChange={(checked) => handleToggleGroup(group.groupId, !!checked)}
            />
            <Label htmlFor={`group-${group.groupId}`} className="cursor-pointer text-sm truncate">
              {group.name}
              <span className="text-muted-foreground ml-1 text-xs">
                {chatTypeLabels[group.chatType] ?? group.chatType}
                {group.memberCount != null && ` · ${group.memberCount} уч.`}
              </span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
