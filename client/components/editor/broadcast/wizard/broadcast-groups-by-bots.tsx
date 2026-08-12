/**
 * @fileoverview Секции выбора групп по каждому выбранному боту + предупреждение о дублях
 * @module client/components/editor/broadcast/wizard/broadcast-groups-by-bots
 */

import { Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { formatBotShortLabel } from '../utils/format-bot-label';
import { GroupSelect } from './group-select';

/** Пропсы секций групп */
interface BroadcastGroupsByBotsProps {
  /** ID проекта */
  projectId: number;
  /** Выбранные токены */
  tokenIds: number[];
  /** Выбранные группы: tokenId → chat_id[] */
  groupsByTokenId: Record<number, string[]>;
  /** Обновление map групп */
  onChange: (next: Record<number, string[]>) => void;
}

/**
 * Находит chat_id, отмеченные у двух и более ботов
 * @param groupsByTokenId - Карта выбора
 * @returns Список дублирующихся chat_id
 */
function findOverlappingGroupIds(groupsByTokenId: Record<number, string[]>): string[] {
  const counts = new Map<string, number>();
  for (const ids of Object.values(groupsByTokenId)) {
    for (const id of ids ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

/**
 * Блок «Также отправить в группы» с секциями по ботам
 * @param props - Свойства
 * @returns JSX
 */
export function BroadcastGroupsByBots({
  projectId,
  tokenIds,
  groupsByTokenId,
  onChange,
}: BroadcastGroupsByBotsProps) {
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];
  const overlap = findOverlappingGroupIds(groupsByTokenId);

  if (tokenIds.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Сначала выберите ботов</p>
    );
  }

  return (
    <div className="space-y-3">
      {tokenIds.map((tid) => {
        const token = tokens.find((t) => t.id === tid);
        const label = token ? formatBotShortLabel(token) : `Бот #${tid}`;
        return (
          <div key={tid} className="space-y-1.5 rounded-lg border border-border/50 p-2.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Группы {label}
            </Label>
            <GroupSelect
              projectId={projectId}
              tokenId={tid}
              selectedGroupIds={groupsByTokenId[tid] ?? []}
              onChangeGroupIds={(groupIds) =>
                onChange({ ...groupsByTokenId, [tid]: groupIds })
              }
            />
          </div>
        );
      })}
      {overlap.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {overlap.length} {overlap.length === 1 ? 'группа отмечена' : 'групп отмечено'} у нескольких
          ботов — в чат может прийти несколько копий сообщения
        </p>
      )}
    </div>
  );
}
