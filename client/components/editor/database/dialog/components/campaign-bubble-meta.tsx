/**
 * @fileoverview Мета-строка пузыря рассылки: дата, прогресс и проблемы
 * @module editor/database/dialog/components/campaign-bubble-meta
 */

import { Bot, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { DeliveryProblemChips } from '@/components/editor/broadcast/components/delivery-problem-chips';
import { formatBroadcastDate, type StatusBadge } from '../utils/campaign-status-badge';
import { pluralizeBots } from '@/components/editor/broadcast/utils/format-bot-label';

/**
 * Пропсы мета-строки пузыря рассылки
 */
interface CampaignBubbleMetaProps {
  /** Дата создания */
  createdAt: Date | string | null | undefined;
  /** Число ботов — только для большой рассылки */
  botCount?: number;
  /** Идёт ли отправка */
  isLiveRunning: boolean;
  /** Доставлено / обработано */
  doneCount: number;
  /** Всего получателей */
  totalCount: number;
  /** Заблокировали бота */
  blockedCount?: number;
  /** Аккаунт удалён */
  deletedCount?: number;
  /** Прочие ошибки */
  failedCount?: number;
  /** Раскрыт ли список ботов / ошибок */
  expanded: boolean;
  /** Переключить раскрытие */
  onToggle: () => void;
  /** Бейдж статуса */
  badge: StatusBadge;
  /** Нельзя раскрыть (режим правки) */
  disabled?: boolean;
  /** Подсказка кнопки раскрытия */
  toggleTitle?: string;
}

/**
 * Дата, счётчики и статус рассылки одним аккуратным блоком
 * @param props - Свойства мета-строки
 * @returns JSX элемент
 */
export function CampaignBubbleMeta({
  createdAt,
  botCount,
  isLiveRunning,
  doneCount,
  totalCount,
  blockedCount = 0,
  deletedCount = 0,
  failedCount = 0,
  expanded,
  onToggle,
  badge,
  disabled = false,
  toggleTitle,
}: CampaignBubbleMetaProps) {
  return (
    <button
      type="button"
      className="w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
      onClick={onToggle}
      disabled={disabled}
      title={toggleTitle ?? (expanded ? 'Скрыть детали' : 'Показать детали')}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {formatBroadcastDate(createdAt)}
        </span>
        {botCount != null && (
          <span
            title={`${botCount} ${pluralizeBots(botCount)}`}
            className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300"
          >
            <Bot className="h-3 w-3" />
            {botCount} {pluralizeBots(botCount)}
          </span>
        )}
        <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
          {badge.label}
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
          {isLiveRunning
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <CheckCircle2 className="h-3 w-3" />}
          {doneCount}/{totalCount}
        </span>
        <DeliveryProblemChips blocked={blockedCount} deleted={deletedCount} failed={failedCount} />
      </span>
    </button>
  );
}
