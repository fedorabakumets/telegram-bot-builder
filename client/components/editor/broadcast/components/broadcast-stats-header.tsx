/**
 * @fileoverview Шапка со статистикой рассылок
 * @module client/components/editor/broadcast/components/broadcast-stats-header
 */

import { Card, CardContent } from '@/components/ui/card';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastStatsHeader
 */
interface BroadcastStatsHeaderProps {
  /** Список рассылок для подсчёта статистики */
  broadcasts: Broadcast[];
}

/**
 * Карточка одной метрики статистики
 * @param props - Свойства карточки
 * @returns JSX элемент карточки
 */
function StatCard({
  icon,
  label,
  value,
}: {
  /** Иконка-эмодзи */
  icon: string;
  /** Подпись метрики */
  label: string;
  /** Значение метрики */
  value: number;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="text-2xl font-bold">{value.toLocaleString('ru-RU')}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {icon} {label}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Шапка с суммарной статистикой по всем рассылкам: отправлено, доставлено, ошибок
 * @param props - Свойства компонента
 * @returns JSX элемент с тремя карточками статистики
 */
export function BroadcastStatsHeader({ broadcasts }: BroadcastStatsHeaderProps) {
  const totalSent = broadcasts.reduce((s, b) => s + (b.sentCount ?? 0), 0);
  const totalDelivered = broadcasts.reduce((s, b) => s + (b.deliveredCount ?? 0), 0);
  const totalFailed = broadcasts.reduce((s, b) => s + (b.failedCount ?? 0), 0);

  return (
    <div className="flex gap-3">
      <StatCard icon="📤" label="Всего отправлено" value={totalSent} />
      <StatCard icon="✅" label="Доставлено" value={totalDelivered} />
      <StatCard icon="❌" label="Ошибок" value={totalFailed} />
    </div>
  );
}
