/**
 * @fileoverview Компактный селектор бота с профилями либо переданной подтверждённой аудиторией
 * @description Число профилей включает наблюдавшихся групповых авторов и не означает подтверждённую аудиторию бота.
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
  /** ID проекта — нужен для количества сохранённых профилей */
  projectId: number;
  /** Список токенов проекта */
  tokens: BotToken[];
  /** Идентификатор выбранного токена (`null` = все боты, если allowAll) */
  selectedTokenId: number | null;
  /** Обработчик выбора токена */
  onSelect: (tokenId: number | null) => void;
  /**
   * Показывать пункт «Все боты».
   * В Диалогах выключать — там нужен конкретный бот для отправки/аватаров.
   */
  allowAll?: boolean;
  /** Подтверждённая аудитория; при передаче старые счётчики профилей не используются. */
  audienceCounts?: Map<number, number>;
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
 * Показывает ботов по убыванию числа сохранённых профилей, явно подписывая смысл счётчика.
 * @param props - Пропсы компонента
 * @returns JSX элемент селектора или заглушка при отсутствии ботов
 */
export function BotTokenSelector({
  projectId,
  tokens,
  selectedTokenId,
  onSelect,
  allowAll = true,
  audienceCounts,
}: BotTokenSelectorProps): React.JSX.Element {
  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const profileCounts = useTokenUserCounts(projectId, audienceCounts ? [] : tokenIds);
  const userCounts = audienceCounts ?? profileCounts;
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

  /** Без «Все боты» значение Select всегда конкретный id */
  const fallbackId = sortedTokens[0]?.id ?? null;
  const selectValue =
    selectedTokenId != null
      ? String(selectedTokenId)
      : allowAll
        ? 'all'
        : fallbackId != null
          ? String(fallbackId)
          : undefined;

  return (
    <div className="flex min-w-0 max-w-full items-center gap-2">
      <Bot className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select
        key={`${projectId}:${selectValue ?? 'none'}`}
        value={selectValue}
        onValueChange={(value) => {
          if (allowAll && value === 'all') {
            onSelect(null);
            return;
          }
          onSelect(Number(value));
        }}
      >
        <SelectTrigger aria-label="Бот пользователей" className="h-8 min-w-0 w-48 max-w-full rounded-lg border-border bg-background text-sm [&>span]:truncate">
          <SelectValue placeholder="Бот" />
        </SelectTrigger>
        <SelectContent className="users-portal max-w-[calc(100vw-24px)] [&_[role=option]]:whitespace-normal [&_[role=option]]:break-words">
          {allowAll ? <SelectItem value="all">Все боты</SelectItem> : null}
          {sortedTokens.map((token) => {
            const count = userCounts.get(token.id);
            const label =
              count !== undefined
                ? `${getTokenLabel(token)} · ${audienceCounts ? '' : 'профилей: '}${count.toLocaleString('ru-RU')}`
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
