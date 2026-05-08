/**
 * @fileoverview Список рассылок в виде карточек с прогресс-баром
 * @module client/components/editor/broadcast/components/broadcast-list
 */

import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { BroadcastStatusBadge } from './broadcast-status-badge';
import { cn } from '@/utils/utils';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastList
 */
interface BroadcastListProps {
  /** Список рассылок */
  broadcasts: Broadcast[];
  /** Обработчик выбора рассылки */
  onSelect: (broadcast: Broadcast) => void;
  /** Идентификатор выбранной рассылки */
  selectedId?: number | null;
}

/**
 * Форматирует дату в короткий локальный формат ru-RU.
 * @param date - Дата в виде строки, Date или null
 * @returns Отформатированная строка или прочерк
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Карточка одной рассылки с прогресс-баром и мини-статистикой.
 * @param props - Свойства карточки
 * @returns JSX элемент карточки рассылки
 */
function BroadcastCard({
  broadcast,
  isSelected,
  onSelect,
}: {
  /** Данные рассылки */
  broadcast: Broadcast;
  /** Флаг выбранного состояния */
  isSelected: boolean;
  /** Обработчик клика */
  onSelect: () => void;
}) {
  const total = broadcast.totalCount ?? 0;
  const delivered = broadcast.deliveredCount ?? 0;
  const failed = broadcast.failedCount ?? 0;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0',
        'hover:bg-muted/40',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium text-sm truncate">{broadcast.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <BroadcastStatusBadge status={broadcast.status} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(broadcast.createdAt)}
          </span>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="flex items-center gap-2 mb-2">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
      </div>

      {/* Мини-статистика */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {total.toLocaleString('ru-RU')}
        </span>
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          {delivered.toLocaleString('ru-RU')}
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <XCircle className="h-3 w-3" />
          {failed.toLocaleString('ru-RU')}
        </span>
      </div>
    </div>
  );
}

/**
 * Список рассылок в виде карточек. Показывает пустое состояние если рассылок нет.
 * @param props - Свойства компонента
 * @returns JSX элемент списка рассылок
 */
export function BroadcastList({ broadcasts, onSelect, selectedId }: BroadcastListProps) {
  const safeList = Array.isArray(broadcasts) ? broadcasts : [];

  if (safeList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="text-5xl mb-3">📭</span>
        <p className="text-sm font-medium">Рассылок пока нет</p>
        <p className="text-xs mt-1">Создайте первую рассылку с помощью кнопки выше</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {safeList.map((broadcast) => (
        <BroadcastCard
          key={broadcast.id}
          broadcast={broadcast}
          isSelected={selectedId === broadcast.id}
          onSelect={() => onSelect(broadcast)}
        />
      ))}
    </div>
  );
}
