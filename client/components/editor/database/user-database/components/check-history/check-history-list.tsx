/** @fileoverview Компактный список прошлых запусков с областью, временем и итогами. */
import type { CheckHistoryEntry } from '@shared/check-history';
import { ChevronRight } from 'lucide-react';
/** Подписи состояний очереди, не смешанные со статусом бота. */
export const HISTORY_STATUS_LABELS = { pending: 'В очереди', running: 'Выполняется', cancelling: 'Останавливается', cancelled: 'Отменена', completed: 'Завершена', failed: 'Прервана' };
/** Отображает время в часовом поясе браузера. @param value - ISO-время. @returns Локальное время с датой. */
export function historyTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' });
}
/** Вычисляет длительность завершённого запуска без смешивания часовых поясов. @param start - Начало. @param finish - Завершение. @returns Длительность либо отсутствие значения. */
export function historyDuration(start: string | null, finish: string | null): string {
  if (!start || !finish) return '—';
  const seconds = Math.max(0, Math.round((Date.parse(finish) - Date.parse(start)) / 1000));
  return Number.isFinite(seconds) ? seconds < 60 ? `${seconds} с` : `${Math.floor(seconds / 60)} мин ${seconds % 60} с` : '—';
}
/** Выводит результаты запусков кнопками для раскрытия деталей. @param props - Запуски и выбор. @returns Список. */
export function CheckHistoryList({ items, onSelect }: {
  /** Карточки выбранного вида. */ items: CheckHistoryEntry[];
  /** Открытие сохранённых подробностей. */ onSelect: (id: string) => void;
}) {
  return <ul className="divide-y divide-border rounded-lg border border-border">{items.map(run => {
    const bot = run.scope.bots?.find(bot => bot.tokenId === run.scope.tokenId);
    /** Имя, username и ID различают ботов с одинаковыми названиями. */
    const username = run.scope.username || bot?.username;
    const scope = run.scope.mode === 'all_bots' ? 'Все боты' : `${run.scope.name || bot?.name || 'Бот'}${username ? ` (@${username.replace(/^@/, '')})` : ''} #${run.scope.tokenId}`;
    return <li key={run.id}><button type="button" className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => onSelect(run.id)}>
      <span className="min-w-0 flex-1 space-y-1"><span className="block font-medium">{historyTime(run.startedAt || run.createdAt)}</span>
        <span className="block text-xs text-muted-foreground">{scope} · {HISTORY_STATUS_LABELS[run.status]}{run.finishedAt ? ` · ${historyDuration(run.startedAt, run.finishedAt)}` : ''}</span>
        <span className="block text-xs text-muted-foreground">Проверено {run.summary.processed.toLocaleString('ru-RU')} из {run.summary.total.toLocaleString('ru-RU')}{run.kind === 'private-chats' ? ' пар бот–чат' : ' ботов'} · Ошибок: {run.summary.errors}</span>
      </span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button></li>;
  })}</ul>;
}
