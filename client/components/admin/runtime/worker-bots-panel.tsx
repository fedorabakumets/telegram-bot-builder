/** @fileoverview Административный список режимов ботов с поиском и серверными страницами. */
import { RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { WorkerBotFilters } from './worker-bot-filters';
import { WorkerBotTable } from './worker-bot-table';
import { useWorkerBots } from './use-worker-bots';

/** Показывает индивидуальные настройки рядом с фактическим состоянием исполнителя. */
export function WorkerBotsPanel() {
  const bots = useWorkerBots();
  const data = bots.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const stale = data?.sampledAt ? Date.now() - Date.parse(data.sampledAt) > 30_000 : false;
  return <section aria-labelledby="worker-bots-heading" className="min-w-0 space-y-4 rounded-lg border border-neutral-800 bg-[#09090b] p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2"><h2 id="worker-bots-heading" className="text-lg font-semibold">Режимы ботов</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">Собственный выбор бота, режим следующего запуска и фактическая работа. Изменить режим можно в настройках бота.</p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={bots.isFetching} onClick={() => void bots.refetch()}><RefreshCw aria-hidden="true" className="size-4" />{bots.isFetching ? 'Обновляем…' : 'Обновить список'}</Button>
    </div>
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <Checkbox style={{ width: 22, height: 22, border: '2px solid #d4d4d8', borderRadius: 4, backgroundColor: bots.activity === 'all' ? '#2563eb' : '#27272a', color: '#ffffff' }} checked={bots.activity === 'all'} onCheckedChange={checked => bots.changeActivity(checked === true ? 'all' : 'enabled')} className="size-5 border-neutral-500 dark:border-neutral-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-500 dark:hover:scale-100 dark:hover:shadow-none" />
      Показать остановленных ботов
    </label>
    <details open className="group space-y-4">
      <summary className="cursor-pointer rounded-md py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Список ботов{data ? ` · ${data.total}` : ''}</summary>
    <WorkerBotFilters search={bots.search} mode={bots.mode} onSearch={bots.changeSearch} onMode={bots.changeMode} />
    <p className="text-xs text-muted-foreground">Автообновление каждые 10 секунд в открытой вкладке{data?.sampledAt ? ` · Снимок ${new Date(data.sampledAt).toLocaleTimeString('ru-RU')}` : ''}</p>
    {bots.isError ? <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">Не удалось обновить список. {data ? 'Показаны предыдущие данные.' : 'Нажмите «Обновить список», чтобы повторить.'}</p> : null}
    {data && (!data.runtimeAvailable || stale) ? <p role="status" className="rounded-md border border-amber-700/40 p-3 text-sm text-amber-200">{stale ? 'Снимок исполнителя старше 30 секунд.' : 'Свежие данные исполнителя недоступны.'} Сохранённые настройки показаны; фактический режим может быть неизвестен.</p> : null}
    {bots.isPending ? <div role="status" aria-label="Загрузка списка ботов" className="space-y-3">{[0, 1, 2].map(key => <div key={key} className="h-16 rounded-md bg-muted/40" />)}</div> : null}
    {data?.rows.length ? <WorkerBotTable bots={data.rows} /> : data ? <div className="rounded-md border border-dashed border-neutral-800 px-4 py-8 text-center"><p className="text-sm font-medium">{bots.search || bots.mode !== 'all' ? 'По этим условиям ботов нет' : bots.activity === 'all' ? 'Боты ещё не подключены' : 'Нет включённых ботов'}</p><p className="mt-2 text-xs text-muted-foreground">{bots.search || bots.mode !== 'all' ? 'Измените поиск или выберите все режимы.' : 'После подключения боты появятся здесь автоматически.'}</p></div> : null}
    {data ? <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <span aria-live="polite">{bots.searching ? 'Ожидаем ввод…' : `Найдено: ${data.total}`} · Страница {data.page} из {pages}</span>
      <div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={bots.page <= 1 || bots.isFetching || bots.searching} onClick={() => bots.setPage(value => value - 1)}>Назад</Button><Button type="button" variant="outline" size="sm" disabled={bots.page >= pages || bots.isFetching || bots.searching} onClick={() => bots.setPage(value => value + 1)}>Далее</Button></div>
    </div> : null}
    </details>
  </section>;
}
