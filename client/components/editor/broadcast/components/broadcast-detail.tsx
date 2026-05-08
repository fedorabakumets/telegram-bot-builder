/**
 * @fileoverview Детальная боковая панель выбранной рассылки
 * @module client/components/editor/broadcast/components/broadcast-detail
 */

import { X, Calendar, Clock, StopCircle, CheckCircle2, XCircle, Users, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BroadcastStatusBadge } from './broadcast-status-badge';
import { StatMini } from './broadcast-stat-mini';
import { useBroadcastDetail } from '../hooks/use-broadcast-detail';
import { useStopBroadcast } from '../hooks/use-stop-broadcast';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastDetail
 */
interface BroadcastDetailProps {
  /** Выбранная рассылка */
  broadcast: Broadcast;
  /** Идентификатор проекта */
  projectId: number;
  /** Обработчик закрытия панели */
  onClose: () => void;
  /** Колбэк обновления списка */
  refetch: () => void;
}

/**
 * Форматирует дату в локальный формат ru-RU.
 * @param date - Дата или null
 * @returns Отформатированная строка или прочерк
 */
function fmt(date: string | Date | null | undefined): string {
  return date ? new Date(date).toLocaleString('ru-RU') : '—';
}

/**
 * Детальная панель рассылки: статистика, даты, кнопка стоп и аккордеон ошибок.
 * @param props - Свойства компонента
 * @returns JSX элемент детальной панели
 */
export function BroadcastDetail({ broadcast, projectId, onClose, refetch }: BroadcastDetailProps) {
  const { results, isLoading } = useBroadcastDetail(projectId, broadcast.id);
  const stopMutation = useStopBroadcast({ projectId, refetch });

  const total = broadcast.totalCount ?? 0;
  const delivered = broadcast.deliveredCount ?? 0;
  const failed = broadcast.failedCount ?? 0;
  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <BroadcastStatusBadge status={broadcast.status} />
          <span className="font-semibold text-sm truncate">{broadcast.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {broadcast.status === 'running' && (
            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1"
              onClick={() => stopMutation.mutate(broadcast.id)} disabled={stopMutation.isPending}>
              <StopCircle className="h-3.5 w-3.5" />
              Остановить
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Карточки статистики */}
        <div className="grid grid-cols-2 gap-2">
          <StatMini icon={Users} label="Аудитория" value={total} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
          <StatMini icon={CheckCircle2} label="Доставлено" value={delivered} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
          <StatMini icon={XCircle} label="Ошибок" value={failed} color="text-red-500" bg="bg-red-50 dark:bg-red-900/20" />
          <StatMini icon={Percent} label="Успех" value={`${successRate}%`} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
        </div>

        <Separator />

        {/* Даты */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Создана: <span className="text-foreground">{fmt(broadcast.createdAt)}</span></span>
          </div>
          {broadcast.finishedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Завершена: <span className="text-foreground">{fmt(broadcast.finishedAt)}</span></span>
            </div>
          )}
        </div>

        <Separator />

        {/* Таблица ошибок в аккордеоне */}
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : results.length > 0 ? (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 w-full text-left">
              <XCircle className="h-4 w-4" />
              Ошибки доставки ({results.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">User ID</TableHead>
                    <TableHead className="text-xs">Причина</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.userId}</TableCell>
                      <TableCell className="text-xs text-red-500">{r.errorMessage ?? r.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Ошибок нет
          </p>
        )}
      </div>
    </div>
  );
}
