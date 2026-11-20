/**
 * @fileoverview Компактный селектор бота с профилями либо переданной подтверждённой аудиторией
 * @description Число профилей включает наблюдавшихся групповых авторов и не означает подтверждённую аудиторию бота.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { BotToken } from '@shared/schema';
import { Bot } from 'lucide-react';
import { BotTokenOptionLabel } from './bot-token-option-label';
import { useProjectBotStatuses } from '@/components/editor/bot/hooks/use-project-bot-statuses';
import './bot-selector-responsive.css';
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
  /** Подсказка, когда выбор бота ещё не сделан. */
  emptySelectionLabel?: string;
  /** Подтверждённая аудитория; при передаче старые счётчики профилей не используются. */
  audienceCounts?: Map<number, number>;
  /** Ошибка первоначального получения чисел. */ countsError?: boolean;
  /** Повторяет загрузку счётчиков. */ onRetryCounts?: () => void;
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
  emptySelectionLabel,
  audienceCounts,
  countsError, onRetryCounts,
}: BotTokenSelectorProps): React.JSX.Element {
  const runtime = useProjectBotStatuses(projectId);
  /** Только подтверждённое отсутствие связи заменяет обычный статус. */
  const disconnected = new Set(runtime.data?.statuses.filter(status => status.status === 'unknown')
    .map(status => status.tokenId ?? status.instance?.tokenId));
  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const profileCounts = useTokenUserCounts(projectId, audienceCounts ? [] : tokenIds);
  const userCounts = audienceCounts ?? profileCounts;
  /** Не показывает промежуточный порядок и пустые числа при первом открытии. */
  const countsReady = tokens.every(token => userCounts.has(token.id));
  /** Общий итог считает уникальных людей, а не сумму пользователей отдельных ботов. */
  const totalUrl = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, null, { privateContactsOnly: 'true' });
  const { data: totalStats } = useQuery<{ /** Люди во всех ботах проекта без дублей. */ totalUsers: number }>({
    queryKey: [totalUrl, null], queryFn: () => apiRequest('GET', totalUrl),
    enabled: allowAll && projectId > 0, staleTime: 30_000,
  });
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

  /** Первый бот подставляется только в режимах без пустого выбора. */
  const fallbackId = sortedTokens[0]?.id ?? null;
  const selectValue =
    selectedTokenId != null
      ? String(selectedTokenId)
      : allowAll
        ? 'all'
        : !emptySelectionLabel && fallbackId != null
          ? String(fallbackId)
          : '';

  return (
    <div data-all-bots={selectValue === 'all' ? 'true' : undefined} className="flex min-w-0 max-w-full items-center gap-2">
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
        {/** ID и статус видны в раскрытом списке, а закрытое поле отдаёт это место имени бота. */}
        <SelectTrigger aria-label="Бот пользователей" className="bot-selector-trigger h-8 min-w-0 w-max max-w-full rounded-lg border-border bg-background text-sm [&>span]:min-w-0 [&>span]:flex-1 [&>span]:text-left [&_.bot-selector-id]:hidden">
          <SelectValue placeholder={emptySelectionLabel ?? "Бот"} />
        </SelectTrigger>
        <SelectContent className="users-portal max-w-[calc(100vw-24px)] [&_[role=option]>span:last-child]:w-full">
          {allowAll ? <SelectItem value="all"><span className="flex min-w-0 items-center justify-between gap-2">
            <span>Все боты</span><span className="shrink-0 tabular-nums">{totalStats?.totalUsers === undefined ? '—' : totalStats.totalUsers.toLocaleString('ru-RU')}</span>
          </span></SelectItem> : null}
          {!countsReady && <div role="status" className="px-3 py-2 text-sm text-muted-foreground">
            {countsError ? <button type="button" onClick={onRetryCounts}>Не удалось загрузить числа. Повторить</button> : 'Загрузка количества пользователей…'}
          </div>}
          {(countsReady ? sortedTokens : []).map((token) => {
            const count = userCounts.get(token.id);
            return (
              <SelectItem key={token.id} value={String(token.id)}>
                <BotTokenOptionLabel token={token} count={count} audience={Boolean(audienceCounts)} disconnected={disconnected.has(token.id)} />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
