/** @fileoverview Выбор текущего или сохранённого запуска выбранного бота. */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TerminalInfo } from '../bot/contexts/ActiveTerminalsContext';
import { useTerminalLaunchHistory } from './use-terminal-launch-history';

interface TerminalLaunchSelectorProps {
  /** Активный терминал, определяющий бота и выбранный запуск. */
  terminal: TerminalInfo;
  /** Открывает текущий вывод бота. */
  onCurrent: () => void;
  /** Открывает логи по идентификатору запуска. */
  onHistory: (launchId: number, startedAt: string | null) => void;
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Форматирует сохранённый запуск для селектора.
 * @param id - Идентификатор запуска.
 * @param startedAt - Время старта из истории.
 * @returns Дата и идентификатор либо только идентификатор.
 */
function getLaunchLabel(id: number, startedAt: string | null) {
  const date = startedAt ? new Date(startedAt) : null;
  return date && Number.isFinite(date.getTime())
    ? `${dateFormatter.format(date)} · #${id}`
    : `Запуск #${id}`;
}

/**
 * Переключает вывод между текущим и сохранёнными запусками одного бота.
 * @param props - Выбранный терминал и действия открытия логов.
 * @returns Селектор запусков.
 */
export function TerminalLaunchSelector({ terminal, onCurrent, onHistory }: TerminalLaunchSelectorProps) {
  const { history, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useTerminalLaunchHistory(terminal.tokenId);
  const selectedId = terminal.tabType === 'history' ? terminal.launchId : undefined;
  const selectedInHistory = history.some(launch => launch.id === selectedId);

  /**
   * Открывает выбранный запуск или выполняет действие списка.
   * @param value - Идентификатор запуска или ключ действия.
   */
  function selectLaunch(value: string) {
    if (value === 'current') return onCurrent();
    if (value === 'retry') {
      void refetch();
      return;
    }
    if (value === 'more') {
      void fetchNextPage();
      return;
    }
    const launch = history.find(entry => String(entry.id) === value);
    if (launch) onHistory(launch.id, launch.startedAt);
  }

  return (
    <Select value={selectedId === undefined ? 'current' : String(selectedId)} onValueChange={selectLaunch}>
      {/** Длинная дата запуска сокращается только в закрытом селекторе. */}
      <SelectTrigger aria-label="Запуск" className="h-8 w-max min-w-0 max-w-full text-sm [&>span]:min-w-0 [&>span]:truncate [&>svg]:shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" collisionPadding={12} className="max-w-[calc(100vw-24px)]">
        {/* У остановленного бота показываются сохранённые логи последнего запуска. */}
        <SelectItem value="current">{terminal.isRunning ? 'Текущий запуск' : 'Последний запуск'}</SelectItem>
        {selectedId !== undefined && !selectedInHistory && (
          <SelectItem value={String(selectedId)}>{getLaunchLabel(selectedId, terminal.launchStartedAt ?? null)}</SelectItem>
        )}
        {history.map(launch => (
          <SelectItem key={launch.id} value={String(launch.id)}>
            {getLaunchLabel(launch.id, launch.startedAt)}
          </SelectItem>
        ))}
        {isLoading && <SelectItem value="loading" disabled>Загрузка истории…</SelectItem>}
        {isError && <SelectItem value="retry">Повторить загрузку истории</SelectItem>}
        {hasNextPage && (
          <SelectItem value="more" disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Загрузка…' : 'Показать более ранние запуски'}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
