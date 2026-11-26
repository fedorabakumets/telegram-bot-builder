/**
 * @fileoverview Модальное окно с логами конкретного запуска бота
 * @module bot/card/LaunchLogsModal
 */

import Ansi from 'ansi-to-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLaunchLogs } from '../hooks/use-launch-logs';
import { LaunchHistoryStatus } from '../../terminal/LaunchHistoryStatus';

/** Пропсы модального окна логов запуска */
interface LaunchLogsModalProps {
  /** ID запуска для загрузки логов */
  launchId: number | null;
  /** Дата и время запуска для заголовка */
  startedAt: Date | string | null;
  /** Флаг открытия модалки */
  isOpen: boolean;
  /** Колбэк закрытия модалки */
  onClose: () => void;
}

/**
 * Форматирует дату запуска для заголовка модалки
 * @param date - Дата запуска
 * @returns Отформатированная строка
 */
function formatTitle(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Модальное окно с логами конкретного запуска бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function LaunchLogsModal({ launchId, startedAt, isOpen, onClose }: LaunchLogsModalProps) {
  const { logs, isLoading, isError, isRefreshing, retry } = useLaunchLogs(launchId ?? undefined);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            Логи запуска · {formatTitle(startedAt)}
          </DialogTitle>
          <DialogDescription className="sr-only">Сохранённые строки выбранного запуска бота.</DialogDescription>
        </DialogHeader>
        <div aria-busy={isLoading || isRefreshing} className="flex flex-col flex-1 overflow-y-auto rounded-md bg-black/90 p-3 font-mono text-xs min-h-[200px]">
          {/* Один контракт состояний сохраняет строки при сбое и отличает ошибку от пустого ответа. */}
          <LaunchHistoryStatus isLoading={isLoading} isError={isError} isRefreshing={isRefreshing}
            hasLogs={logs.length > 0} textClassName="text-muted-foreground" onRetry={retry} />
          {logs.map((log) => (
            <div
              key={log.id}
              className={log.type === 'stderr' ? 'text-red-400' : 'text-green-100'}
            >
              <Ansi>{log.content}</Ansi>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
