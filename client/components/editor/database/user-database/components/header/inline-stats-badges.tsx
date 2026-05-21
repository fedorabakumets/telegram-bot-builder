/**
 * @fileoverview Компактные инлайн-бейджи статистики для хедера БД
 * @description Отображает ключевые метрики в одну строку: 👥 всего · ⭐ premium · 💬 сообщения · 📊 среднее
 */

import { Users, Star, MessageCircle, BarChart2 } from 'lucide-react';

/**
 * Пропсы компонента InlineStatsBadges
 */
interface InlineStatsBadgesProps {
  /** Объект статистики пользователей */
  stats: {
    totalUsers?: number;
    premiumUsers?: number;
    totalInteractions?: number;
    avgInteractionsPerUser?: number;
  };
}

/**
 * Форматирует число для компактного отображения
 * @param value - Числовое значение
 * @returns Отформатированная строка
 */
function formatCompact(value?: number): string {
  if (value === undefined || value === null) return '0';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

/**
 * Компактные инлайн-бейджи статистики для отображения в хедере
 * @param props - Пропсы компонента
 * @returns JSX элемент с бейджами
 */
export function InlineStatsBadges({ stats }: InlineStatsBadgesProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {/* Всего пользователей */}
      <span className="inline-flex items-center gap-0.5" title="Всего пользователей">
        <Users className="w-3 h-3" />
        <span className="tabular-nums">{formatCompact(stats.totalUsers)}</span>
      </span>

      <span className="text-border/60 text-[10px]">·</span>

      {/* Premium пользователи */}
      <span className="inline-flex items-center gap-0.5" title="Premium пользователи">
        <Star className="w-3 h-3" />
        <span className="tabular-nums">{formatCompact(stats.premiumUsers)}</span>
      </span>

      <span className="text-border/60 text-[10px]">·</span>

      {/* Всего сообщений */}
      <span className="inline-flex items-center gap-0.5" title="Всего сообщений">
        <MessageCircle className="w-3 h-3" />
        <span className="tabular-nums">{formatCompact(stats.totalInteractions)}</span>
      </span>

      <span className="text-border/60 text-[10px]">·</span>

      {/* Среднее на пользователя */}
      <span className="inline-flex items-center gap-0.5" title="Среднее сообщений на пользователя">
        <BarChart2 className="w-3 h-3" />
        <span className="tabular-nums">{formatCompact(stats.avgInteractionsPerUser)}</span>
      </span>
    </div>
  );
}
