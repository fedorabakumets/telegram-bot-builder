/**
 * @fileoverview Модальное окно с логами конкретного запуска бота
 * @module bot/card/LaunchLogsModal
 */

import Ansi from 'ansi-to-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLaunchLogs } from '../hooks/use-launch-logs';

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
  const { logs, isLoading } = useLaunchLogs(launchId ?? undefined);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            Логи запуска · {formatTitle(startedAt)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto rounded-md bg-black/90 p-3 font-mono text-xs min-h-[200px]">
          {isLoading && (
            <span className="text-muted-foreground">Загрузка логов...</span>
          )}
          {!isLoading && logs.length === 0 && (
            <span className="text-muted-foreground">Логи не сохранены</span>
          )}
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
