/**
 * @fileoverview Компонент истории запусков бота
 * @module bot/card/BotLaunchHistory
 */

import { History, Circle, X, FileText } from 'lucide-react';
import type { BotLaunchHistory as BotLaunchHistoryType } from '@shared/schema';
import { useLaunchHistory } from '../hooks/use-launch-history';
import { formatExecutionTime } from '../contexts/bot-control-utils';
import { useActiveTerminals } from '../contexts/ActiveTerminalsContext';

/** Пропсы компонента истории запусков */
interface BotLaunchHistoryProps {
  /** ID токена бота */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Имя бота */
  botName: string;
}

/**
 * Форматирует дату в короткий формат "09 апр, 04:02"
 * @param date - Дата для форматирования
 * @returns Отформатированная строка даты
 */
function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Вычисляет длительность запуска в секундах
 * @param startedAt - Время запуска
 * @param stoppedAt - Время остановки
 * @returns Длительность в секундах или null
 */
function getDuration(
  startedAt: Date | string | null,
  stoppedAt: Date | string | null
): number | null {
  if (!startedAt || !stoppedAt) return null;
  return Math.floor(
    (new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
}

/**
 * Иконка статуса запуска
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
function StatusIcon({ status }: { status: string }) {
  if (status === 'running')
    return <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500 flex-shrink-0" />;
  if (status === 'error')
    return <X className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />;
  return <Circle className="w-2.5 h-2.5 fill-gray-400 text-gray-400 flex-shrink-0" />;
}

/** Пропсы строки запуска */
interface LaunchRowProps {
  /** Запись истории запуска */
  record: BotLaunchHistoryType;
  /** Колбэк открытия логов */
  onShowLogs: (id: number, startedAt: Date | string | null) => void;
}

/**
 * Одна строка истории запуска с кнопкой просмотра логов
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
function LaunchRow({ record, onShowLogs }: LaunchRowProps) {
  const duration = getDuration(record.startedAt, record.stoppedAt);
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
      <StatusIcon status={record.status} />
      <span className="flex-1 min-w-0">
        <span className="text-foreground/80">{formatDate(record.startedAt)}</span>
        {duration !== null && (
          <span className="ml-1 text-muted-foreground/70">
            · {formatExecutionTime(duration)}
          </span>
        )}
        {record.errorMessage && (
          <span className="block truncate text-red-400/80 mt-0.5">
            {record.errorMessage}
          </span>
        )}
      </span>
      <button
        onClick={() => onShowLogs(record.id, record.startedAt)}
        className="flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        title="Показать логи"
      >
        <FileText className="w-3 h-3" />
      </button>
    </div>
  );
}

/**
 * Список последних запусков бота внутри карточки
 * @param props - Свойства компонента
 * @returns JSX элемент или null если история пустая
 */
export function BotLaunchHistory({ tokenId, projectId, botName }: BotLaunchHistoryProps) {
  const { history } = useLaunchHistory(tokenId);
  const { openHistoryTab } = useActiveTerminals();

  if (history.length === 0) return null;

  /**
   * Открывает вкладку с логами в терминальной панели
   * @param id - ID запуска
   * @param startedAt - Время запуска
   */
  const handleShowLogs = (id: number, startedAt: Date | string | null) => {
    openHistoryTab({
      projectId,
      tokenId,
      botName,
      launchId: id,
      launchStartedAt: startedAt ? String(startedAt) : null,
    });
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-lg border bg-muted/30 border-border/50 col-span-full">
      <div className="flex items-center gap-2 mb-1">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">История запусков</span>
      </div>
      {history.slice(0, 5).map((record) => (
        <LaunchRow key={record.id} record={record} onShowLogs={handleShowLogs} />
      ))}
    </div>
  );
}
