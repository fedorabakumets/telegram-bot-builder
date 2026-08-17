/**
 * @fileoverview Выбор ботов проекта, от имени которых уйдёт рассылка
 * @module client/components/editor/broadcast/wizard/bot-token-multi-select
 */

import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';
import { pluralizeBots } from '../utils/format-bot-label';
import { useStripInactiveTokenIds } from '../hooks/use-strip-inactive-token-ids';
import { BotTokenSelectChip } from './bot-token-select-chip';
import type { AudiencePerBot } from '../hooks/use-audience-preview';

/**
 * Пропсы компонента BotTokenMultiSelect
 */
interface BotTokenMultiSelectProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификаторы выбранных ботов */
  selectedTokenIds: number[];
  /** Обработчик изменения выбора ботов */
  onChange: (tokenIds: number[]) => void;
  /** Количество получателей по каждому боту (опционально) */
  perBot?: AudiencePerBot[];
}

/**
 * Список ботов проекта с множественным выбором.
 * Боты с недействительным токеном видны, но в рассылку не берутся.
 * @param props - Свойства компонента
 * @returns JSX элемент выбора ботов
 */
export function BotTokenMultiSelect({ projectId, selectedTokenIds, onChange, perBot }: BotTokenMultiSelectProps) {
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];
  const activeTokens = tokens.filter((token) => isTokenActiveForBroadcast(token.isActive));
  const allSelected = activeTokens.length > 0 && activeTokens.every((token) => selectedTokenIds.includes(token.id));
  const countByToken = new Map(perBot?.map((item) => [item.tokenId, item.count]));

  useStripInactiveTokenIds(tokens, selectedTokenIds, onChange);

  /** Переключает бота в списке выбранных */
  const handleToggle = (tokenId: number) => {
    const next = selectedTokenIds.includes(tokenId)
      ? selectedTokenIds.filter((id) => id !== tokenId)
      : [...selectedTokenIds, tokenId];
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/40 bg-gradient-to-r from-blue-500/5 to-violet-500/5 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-blue-500" />
          Отправить от ботов
        </Label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(activeTokens.map((token) => token.id))}
            disabled={allSelected || activeTokens.length === 0}
          >
            Выбрать все
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange([])}
            disabled={selectedTokenIds.length === 0}
          >
            Снять
          </Button>
        </div>
      </div>

      {tokens.length === 0 ? (
        <p className="text-xs text-muted-foreground">У проекта пока нет подключённых ботов</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((token) => (
            <BotTokenSelectChip
              key={token.id}
              token={token}
              selected={selectedTokenIds.includes(token.id)}
              count={countByToken.get(token.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {selectedTokenIds.length === 0
          ? activeTokens.length === 0 && tokens.length > 0
            ? 'Нет ботов с действительным токеном'
            : 'Выберите хотя бы одного бота'
          : `Выбрано: ${selectedTokenIds.length} ${pluralizeBots(selectedTokenIds.length)} — сообщения уйдут параллельно`}
      </p>
    </div>
  );
}
