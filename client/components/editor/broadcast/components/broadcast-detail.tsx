/**
 * @fileoverview Детальная панель выбранной рассылки с таблицей ошибок
 * @module client/components/editor/broadcast/components/broadcast-detail
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BroadcastStatusBadge } from './broadcast-status-badge';
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
 * Детальная панель рассылки: статистика, даты, кнопка стоп и таблица ошибок.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент детальной панели
 */
export function BroadcastDetail({ broadcast, projectId, onClose, refetch }: BroadcastDetailProps) {
  const { results, isLoading } = useBroadcastDetail(projectId, broadcast.id);
  const stopMutation = useStopBroadcast({ projectId, refetch });

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{broadcast.name}</h3>
        <div className="flex items-center gap-2">
          <BroadcastStatusBadge status={broadcast.status} />
          {broadcast.status === 'running' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => stopMutation.mutate(broadcast.id)}
              disabled={stopMutation.isPending}
            >
              Остановить
            </Button>
          )}
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2 text-sm text-center">
        <div className="border rounded p-2">
          <div className="font-bold">{broadcast.totalCount}</div>
          <div className="text-xs text-muted-foreground">Аудитория</div>
        </div>
        <div className="border rounded p-2">
          <div className="font-bold text-green-600">{broadcast.deliveredCount}</div>
          <div className="text-xs text-muted-foreground">Доставлено</div>
        </div>
        <div className="border rounded p-2">
          <div className="font-bold text-red-500">{broadcast.failedCount}</div>
          <div className="text-xs text-muted-foreground">Ошибок</div>
        </div>
      </div>

      {/* Даты */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>Создана: {fmt(broadcast.createdAt)}</p>
        {broadcast.finishedAt && <p>Завершена: {fmt(broadcast.finishedAt)}</p>}
      </div>

      {/* Таблица ошибок */}
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : results.length > 0 ? (
        <div className="border rounded overflow-hidden">
          <p className="text-xs font-medium px-3 py-2 bg-muted border-b">
            Ошибки ({results.length})
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Причина</TableHead>
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
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Ошибок нет</p>
      )}
    </div>
  );
}
