/**
 * @fileoverview Компонент выбора существующего токена бота
 *
 * Отображает список токенов из базы данных для привязки к новому проекту.
 * Показывает имя бота и маскированный токен.
 *
 * @module AddBotTokenSelect
 */

import { Label } from '@/components/ui/label';
import type { BotToken } from '@shared/schema';

/**
 * Свойства компонента выбора токена
 */
interface AddBotTokenSelectProps {
  /** Список доступных токенов */
  tokens: BotToken[];
  /** ID выбранного токена или null */
  selectedTokenId: number | null;
  /** Callback при выборе токена */
  onSelect: (tokenId: number | null) => void;
}

/**
 * Маскирует токен: показывает первые 10 символов + "..."
 */
function maskToken(token: string): string {
  return token.length > 10 ? `${token.slice(0, 10)}...` : token;
}

/**
 * Возвращает отображаемое имя бота из токена
 */
function getBotLabel(token: BotToken): string {
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botFirstName) return token.botFirstName;
  if (token.botUsername) return `@${token.botUsername}`;
  return token.name || `Бот #${token.id}`;
}

/**
 * Компонент выбора существующего токена из списка
 */
export function AddBotTokenSelect({ tokens, selectedTokenId, onSelect }: AddBotTokenSelectProps) {
  if (tokens.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base font-semibold">
        Выберите существующий токен
      </Label>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {tokens.map(token => {
          const isSelected = selectedTokenId === token.id;
          return (
            <button
              key={token.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : token.id)}
              className={[
                'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                  : 'border-border bg-muted/30 hover:bg-muted/60 text-foreground',
              ].join(' ')}
              data-testid={`token-option-${token.id}`}
            >
              <span className="font-medium">{getBotLabel(token)}</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                {maskToken(token.token)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
