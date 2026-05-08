/**
 * @fileoverview Бейдж статуса рассылки
 * @module client/components/editor/broadcast/components/broadcast-status-badge
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/utils';

/**
 * Пропсы компонента BroadcastStatusBadge
 */
interface BroadcastStatusBadgeProps {
  /** Статус рассылки */
  status: string;
}

/** Конфигурация отображения статусов */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Ожидает',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  running: {
    label: 'Идёт...',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  stopped: {
    label: 'Остановлена',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  done: {
    label: 'Готово',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  failed: {
    label: 'Ошибка',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

/**
 * Бейдж отображения статуса рассылки с цветовой индикацией
 * @param props - Свойства компонента
 * @returns JSX элемент бейджа
 */
export function BroadcastStatusBadge({ status }: BroadcastStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className)}
    >
      {config.label}
    </Badge>
  );
}
