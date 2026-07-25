/**
 * @fileoverview Компактный inline-селектор токена бота
 * @description Сортирует ботов по убыванию числа пользователей (как терминал)
 */

import { useMemo } from 'react';
import { BotToken } from '@shared/schema';
import { Bot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  sortTokensByUserCountDesc,
  useTokenUserCounts,
} from './use-token-user-counts';

/**
 * Пропсы селектора токена бота
 */
interface BotTokenSelectorProps {
  /** ID проекта — нужен для статистики пользователей */
  projectId: number;
  /** Список токенов проекта */
  tokens: BotToken[];
  /** Идентификатор выбранного токена */
  selectedTokenId: number | null;
  /** Обработчик выбора токена */
  onSelect: (tokenId: number | null) => void;
}

/**
 * Формирует читаемую подпись токена
 * @param token - Данные токена бота
 * @returns Отображаемое имя токена
 */
function getTokenLabel(token: BotToken): string {
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botFirstName) return token.botFirstName;
  if (token.botUsername) return `@${token.botUsername}`;
  return token.name || `Бот #${token.id}`;
}

/**
 * Компактный inline-селектор бота: порядок по числу пользователей ↓
 * @param props - Пропсы компонента
 * @returns JSX элемент селектора или заглушка при отсутствии ботов
 */
export function BotTokenSelector({
  projectId,
  tokens,
  selectedTokenId,
  onSelect,
}: BotTokenSelectorProps): React.JSX.Element {
  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const userCounts = useTokenUserCounts(projectId, tokenIds);
  const sortedTokens = useMemo(
    () => sortTokensByUserCountDesc(tokens, userCounts),
    [tokens, userCounts],
  );

  if (tokens.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Bot className="w-3.5 h-3.5" />
        <span>Нет ботов</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Bot className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        value={selectedTokenId != null ? String(selectedTokenId) : 'all'}
        onValueChange={(value) => onSelect(value === 'all' ? null : Number(value))}
      >
        <SelectTrigger className="h-8 text-xs border-border/60 bg-background min-w-[120px]">
          <SelectValue placeholder="Бот" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все боты</SelectItem>
          {sortedTokens.map((token) => {
            const count = userCounts.get(token.id);
            const label =
              count !== undefined
                ? `${getTokenLabel(token)} · ${count}`
                : getTokenLabel(token);
            return (
              <SelectItem key={token.id} value={String(token.id)}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
