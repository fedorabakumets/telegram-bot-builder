/** @fileoverview Ровная карточка рейтинга с горизонтальными полосами и доступным раскрытием подробностей. */
import { useState } from 'react';
import type { ActivityLeader } from '@shared/analytics/activity-leaders';

/** Свойства одной карточки рейтинга. */
interface Props {
  /** Заголовок рейтинга. */
  title: string;
  /** Упорядоченные строки. */
  items: ActivityLeader[];
  /** Состояние загрузки. */
  loading: boolean;
  /** Ошибка запроса. */
  error: boolean;
}
/**
 * Показывает имя, число действий и раскрываемую методику каждого результата.
 * @param props - Заголовок, строки и состояние запроса.
 * @returns Карточка рейтинга.
 */
export function AnalyticsLeadersCard({ title, items, loading, error }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const maximum = Math.max(1, ...items.map(item => item.total));
  return <section className="analytics-card bg-background border rounded-2xl p-6 flex flex-col gap-4 min-w-0 h-full self-stretch">
    <div><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm text-muted-foreground">10 лидеров по числу действий</p></div>
    {loading || error || !items.length ? <div role="status" className="flex-1 min-h-48 flex items-center justify-center text-sm text-muted-foreground">
      {loading ? 'Загружаем рейтинг…' : error ? 'Не удалось загрузить рейтинг' : 'За выбранный период нет сохранённых действий'}
    </div> : <ol className="space-y-2 flex-1">
      {items.map((item, index) => <li key={item.id}>
        <button type="button" aria-expanded={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)}
          className="w-full rounded-lg p-3 text-left hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <span className="flex items-start gap-3 text-sm"><span className="text-muted-foreground tabular-nums w-4 shrink-0">{index + 1}</span>
            <span className="min-w-0 flex-1 break-words font-medium">{item.name}</span>
            <span className="font-semibold tabular-nums shrink-0">{item.total.toLocaleString('ru-RU')}</span></span>
          <span className="block mt-2 h-2 rounded-full bg-muted overflow-hidden"><span className="block h-full rounded-full bg-primary" style={{ width: `${item.total / maximum * 100}%` }} /></span>
        </button>
        {selected === item.id && <dl className="rounded-lg bg-muted/50 p-4 text-sm grid grid-cols-2 gap-3">
          <div><dt className="text-muted-foreground">Сообщения</dt><dd className="font-semibold tabular-nums">{item.messages.toLocaleString('ru-RU')}</dd></div>
          <div><dt className="text-muted-foreground">Нажатия кнопок</dt><dd className="font-semibold tabular-nums">{item.clicks.toLocaleString('ru-RU')}</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">Telegram ID</dt><dd className="break-all">{item.id}</dd></div>
          {item.username && <div className="col-span-2"><dt className="text-muted-foreground">Имя в Telegram</dt><dd>@{item.username}</dd></div>}
          <div className="col-span-2"><dt className="text-muted-foreground">Последнее действие</dt><dd>{new Date(item.last_activity).toLocaleString('ru-RU')}</dd></div>
        </dl>}
      </li>)}
    </ol>}
    <p className="text-sm text-muted-foreground">Сохранённые входящие сообщения и нажатия кнопок. Очистка истории уменьшает значения.</p>
  </section>;
}
