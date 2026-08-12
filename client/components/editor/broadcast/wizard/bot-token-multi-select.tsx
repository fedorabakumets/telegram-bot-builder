/**
 * @fileoverview Выбор ботов проекта, от имени которых уйдёт рассылка
 * @module client/components/editor/broadcast/wizard/bot-token-multi-select
 */

import { Bot, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/utils';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { formatBotShortLabel, pluralizeBots } from '../utils/format-bot-label';
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
 * Рассылка уходит параллельно от всех отмеченных ботов.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент выбора ботов
 */
export function BotTokenMultiSelect({ projectId, selectedTokenIds, onChange, perBot }: BotTokenMultiSelectProps) {
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];
  const allSelected = tokens.length > 0 && selectedTokenIds.length === tokens.length;

  /** Количество получателей по боту для подписи чипа */
  const countByToken = new Map(perBot?.map((item) => [item.tokenId, item.count]));

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
            onClick={() => onChange(tokens.map((token) => token.id))}
            disabled={allSelected || tokens.length === 0}
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
          {tokens.map((token) => {
            const isSelected = selectedTokenIds.includes(token.id);
            const count = countByToken.get(token.id);
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => handleToggle(token.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
                  'hover:bg-accent/60 hover:shadow-sm',
                  isSelected
                    ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/15 to-violet-500/15 text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-3.5 w-3.5 items-center justify-center rounded border shrink-0',
                    isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-muted-foreground/40',
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="truncate max-w-[160px]">{formatBotShortLabel(token, token.id)}</span>
                {isSelected && count != null && (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {count.toLocaleString('ru-RU')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {selectedTokenIds.length === 0
          ? 'Выберите хотя бы одного бота'
          : `Выбрано: ${selectedTokenIds.length} ${pluralizeBots(selectedTokenIds.length)} — сообщения уйдут параллельно`}
      </p>
    </div>
  );
}
