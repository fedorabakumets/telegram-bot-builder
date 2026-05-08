/**
 * @fileoverview Цветной бейдж статуса рассылки с иконкой
 * @module client/components/editor/broadcast/components/broadcast-status-badge
 */

import { Clock, Loader2, CheckCircle2, StopCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

/**
 * Пропсы компонента BroadcastStatusBadge
 */
interface BroadcastStatusBadgeProps {
  /** Статус рассылки */
  status: string;
}

/** Конфигурация отображения статусов с иконками и цветами */
const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType; spin?: boolean }
> = {
  pending: {
    label: 'Ожидает',
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
    icon: Clock,
  },
  running: {
    label: 'Идёт...',
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300',
    icon: Loader2,
    spin: true,
  },
  done: {
    label: 'Готово',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300',
    icon: CheckCircle2,
  },
  stopped: {
    label: 'Остановлена',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300',
    icon: StopCircle,
  },
  failed: {
    label: 'Ошибка',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300',
    icon: XCircle,
  },
};

/** Конфигурация по умолчанию для неизвестных статусов */
const DEFAULT_CONFIG = {
  label: '',
  className: 'bg-gray-100 text-gray-600 border-gray-200',
  icon: Clock,
  spin: false,
};

/**
 * Цветной бейдж статуса рассылки с иконкой и анимацией для running.
 * @param props - Свойства компонента
 * @returns JSX элемент бейджа
 */
export function BroadcastStatusBadge({ status }: BroadcastStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { ...DEFAULT_CONFIG, label: status };
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5', config.className)}
    >
      <Icon className={cn('h-3 w-3', config.spin && 'animate-spin')} />
      {config.label}
    </Badge>
  );
}
