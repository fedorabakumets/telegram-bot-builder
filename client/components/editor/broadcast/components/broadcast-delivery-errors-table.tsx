/**
 * @fileoverview Компактный список ошибок доставки с поиском
 * @module client/components/editor/broadcast/components/broadcast-delivery-errors-table
 */

import { Ban, CircleAlert, Search, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDeliveryErrorReason } from '../utils/format-delivery-error-reason';
import type { BroadcastResult } from '../types';

/**
 * Пропсы списка ошибок доставки
 */
interface BroadcastDeliveryErrorsTableProps {
  /** Отфильтрованные результаты */
  results: BroadcastResult[];
  /** Строка поиска */
  search: string;
  /** Обработчик изменения поиска */
  onSearchChange: (value: string) => void;
  /** Компактный режим */
  compact?: boolean;
}

/**
 * Иконка и цвет строки по статусу ошибки
 * @param status - Статус результата рассылки
 * @returns Иконка и классы цвета
 */
function statusVisual(status: string) {
  if (status === 'blocked') {
    return { Icon: Ban, className: 'text-amber-600 dark:text-amber-400' };
  }
  if (status === 'not_found') {
    return { Icon: UserX, className: 'text-slate-500 dark:text-slate-300' };
  }
  return { Icon: CircleAlert, className: 'text-rose-500 dark:text-rose-400' };
}

/**
 * Поиск и плотный список: иконка, User ID, причина
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BroadcastDeliveryErrorsTable({
  results,
  search,
  onSearchChange,
  compact = false,
}: BroadcastDeliveryErrorsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      <div className="border-b border-border/60 p-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск"
            className="h-7 pl-7 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      {results.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">Ничего не найдено</p>
      ) : (
        <div className={`grid grid-cols-2 ${compact ? 'max-h-44 overflow-y-auto' : 'max-h-80 overflow-y-auto'}`}>
          {results.map((r) => {
            const { Icon, className } = statusVisual(r.status);
            return (
              <div
                key={r.id}
                className="flex min-w-0 items-start gap-1.5 border-b border-border/40 px-2 py-1.5 odd:border-r"
              >
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${className}`} />
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs tabular-nums text-muted-foreground">
                    {r.userId}
                  </span>
                  <span className="block truncate text-xs text-foreground">
                    {formatDeliveryErrorReason(r.status, r.errorMessage)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
