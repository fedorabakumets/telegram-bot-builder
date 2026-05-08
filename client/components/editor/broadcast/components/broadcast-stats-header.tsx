/**
 * @fileoverview Карточки суммарной статистики рассылок
 * @module client/components/editor/broadcast/components/broadcast-stats-header
 */

import { Send, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/utils';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastStatsHeader
 */
interface BroadcastStatsHeaderProps {
  /** Список рассылок для подсчёта статистики */
  broadcasts: Broadcast[];
}

/**
 * Пропсы карточки одной метрики
 */
interface StatCardProps {
  /** Иконка из lucide-react */
  icon: React.ElementType;
  /** Подпись метрики */
  label: string;
  /** Значение метрики */
  value: number;
  /** Подсказка под значением */
  hint: string;
  /** CSS-классы для цветового акцента иконки */
  iconClass: string;
  /** CSS-классы для фона иконки */
  iconBg: string;
}

/**
 * Карточка одной метрики статистики с иконкой и hover-эффектом.
 * @param props - Свойства карточки
 * @returns JSX элемент карточки
 */
function StatCard({ icon: Icon, label, value, hint, iconClass, iconBg }: StatCardProps) {
  return (
    <Card className="flex-1 transition-shadow hover:shadow-md cursor-default">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight">
              {value.toLocaleString('ru-RU')}
            </div>
            <div className="text-sm font-medium mt-0.5">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
          </div>
          <div className={cn('rounded-lg p-2 mt-0.5', iconBg)}>
            <Icon className={cn('h-5 w-5', iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Шапка с суммарной статистикой по всем рассылкам: отправлено, доставлено, ошибок.
 * @param props - Свойства компонента
 * @returns JSX элемент с тремя карточками статистики
 */
export function BroadcastStatsHeader({ broadcasts }: BroadcastStatsHeaderProps) {
  const safeList = Array.isArray(broadcasts) ? broadcasts : [];
  const count = safeList.length;
  const totalSent = safeList.reduce((s, b) => s + (b.sentCount ?? 0), 0);
  const totalDelivered = safeList.reduce((s, b) => s + (b.deliveredCount ?? 0), 0);
  const totalFailed = safeList.reduce((s, b) => s + (b.failedCount ?? 0), 0);
  const hint = `из ${count} рассыл${count === 1 ? 'ки' : count < 5 ? 'ок' : 'ок'}`;

  return (
    <div className="flex gap-3">
      <StatCard
        icon={Send}
        label="Всего отправлено"
        value={totalSent}
        hint={hint}
        iconClass="text-blue-600"
        iconBg="bg-blue-50 dark:bg-blue-900/30"
      />
      <StatCard
        icon={CheckCircle2}
        label="Доставлено"
        value={totalDelivered}
        hint={hint}
        iconClass="text-green-600"
        iconBg="bg-green-50 dark:bg-green-900/30"
      />
      <StatCard
        icon={XCircle}
        label="Ошибок"
        value={totalFailed}
        hint={hint}
        iconClass="text-red-500"
        iconBg="bg-red-50 dark:bg-red-900/30"
      />
    </div>
  );
}
