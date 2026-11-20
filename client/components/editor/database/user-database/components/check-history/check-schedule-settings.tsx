/** @fileoverview Компактная настройка повторных проверок по интервалу и московскому времени первого запуска. */
import { useEffect, useState } from 'react';
import { Clock3, ChevronDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CheckHistoryKind } from '@shared/check-history';
import type { CheckSchedule, CheckScheduleUnit } from '@shared/check-schedule';
import { apiRequest } from '@/queryClient';
import { Button } from '@/components/ui/button';
/** Преобразует UTC во ввод даты по Москве без зависимости от часового пояса устройства. @param iso - Время UTC. @returns Локальная строка формы. */
function moscowInput(iso: string) { return new Date(Date.parse(iso) + 3 * 3_600_000).toISOString().slice(0,16); }
/** Безопасные подписи последней попытки запуска очереди. */
const outcomes: Record<string, string> = { starting: 'Запуск…', started: 'Проверка запущена', skipped_active: 'Пропущено: проверка уже выполняется', error: 'Не удалось запустить', unknown: 'Результат запуска не подтверждён', access_revoked: 'Отключено: нет доступа к проекту', bot_removed: 'Отключено: бот не найден' };
/** Настраивает расписание только по явному сохранению, не запуская проверку из формы. @param props - Проект, область и состояние окна. @returns Настройки. */
export function CheckScheduleSettings({ projectId, tokenId, kind, enabled = true }: {
  /** Проект расписания. */ projectId: number;
  /** Один бот либо все боты. */ tokenId: number | null;
  /** Вид проверок. */ kind: CheckHistoryKind;
  /** Загружать настройки только в открытом окне. */ enabled?: boolean;
}) {
  const client = useQueryClient(), [open, setOpen] = useState(false);
  const [active, setActive] = useState(false), [every, setEvery] = useState(1), [unit, setUnit] = useState<CheckScheduleUnit>('day');
  /** Новое расписание предлагает текущую минуту; сохранённое время остаётся без изменений. */
  const [first, setFirst] = useState(() => moscowInput(new Date().toISOString()));
  const query = new URLSearchParams({ kind }); if (tokenId !== null) query.set('tokenId',String(tokenId));
  const url = `/api/projects/${projectId}/check-schedule?${query}`;
  const key = ['check-schedule',projectId,tokenId,kind];
  const saved = useQuery<{ /** Настройки выбранной области. */ schedule: CheckSchedule | null }>({ queryKey: key, enabled,
    queryFn: () => apiRequest('GET',url), staleTime: 0 });
  useEffect(() => {
    const schedule = saved.data?.schedule;
    setActive(schedule?.enabled ?? false); setEvery(schedule?.every ?? 1); setUnit(schedule?.unit ?? 'day');
    setFirst(moscowInput(schedule?.firstAt ?? new Date().toISOString()));
  }, [saved.data]);
  const save = useMutation({
    mutationFn: () => apiRequest('PUT',url,{ enabled: active, every, unit, firstAt: new Date(`${first}:00+03:00`).toISOString() }),
    onSuccess: data => {
      client.setQueryData(key,data); setOpen(false);
      /** Немедленный запуск появляется в текущем прогрессе и истории без перезагрузки окна. */
      for (const name of ['check-history','telegram-bot-check-run','chat-access-check','chat-access-batch']) {
        void client.invalidateQueries({ queryKey: [name,projectId] });
      }
    },
  });
  const schedule = saved.data?.schedule;
  const invalid = !Number.isInteger(every) || every < 1 || every > 10080 || !first || !Number.isFinite(Date.parse(`${first}:00+03:00`));
  return <section className="space-y-2 text-sm" aria-label="Автоматическая проверка">
    {/** Полная подпись объясняет действие до раскрытия настроек, рядом видно текущее состояние. */}
    <Button type="button" variant="outline" size="sm" className="h-auto min-h-9 w-full justify-start gap-2 px-3 py-2 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
      <Clock3 className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 whitespace-normal">{schedule?.enabled ? 'Изменить автоматическую проверку' : 'Настроить автоматическую проверку'}</span>
      {schedule?.enabled && <span className="shrink-0 text-xs text-emerald-500">Включено</span>}<ChevronDown className={`h-3 w-3 shrink-0 ${open ? 'rotate-180' : ''}`} />
    </Button>
    {!open && !schedule?.enabled && <p className="text-xs text-muted-foreground">Повторять проверку автоматически — например, раз в 60 минут, 6 часов, день, неделю или месяц.</p>}
    {schedule?.enabled && !open && <p className="text-xs text-muted-foreground">Следующая проверка: {new Date(schedule.nextRunAt).toLocaleString('ru-RU',{ timeZone:'Europe/Moscow' })} · Москва</p>}
    {open && <div className="space-y-3 rounded-lg border border-border p-3">
      {saved.isError ? <p role="alert">Не удалось загрузить расписание. <button type="button" className="underline" onClick={() => { void saved.refetch(); }}>Повторить</button></p> : <>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-blue-500" checked={active} disabled={save.isPending || saved.isPending} onChange={event => setActive(event.target.checked)} />Проверять по расписанию</label>
        <div className="grid grid-cols-[auto_80px_1fr] items-center gap-2"><span>Каждые</span>
          <input aria-label="Интервал проверки" type="number" min={1} max={10080} className="h-9 min-w-0 rounded-md border border-border bg-background px-2" value={every} onChange={event => setEvery(Number(event.target.value))} />
          <select aria-label="Единица интервала" className="h-9 rounded-md border border-border bg-background px-2" value={unit} onChange={event => setUnit(event.target.value as CheckScheduleUnit)}>
            <option value="minute">мин.</option><option value="hour">ч.</option><option value="day">дн.</option><option value="week">нед.</option><option value="month">мес.</option>
          </select>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">Первый запуск · Москва<input aria-label="Первый запуск по Москве" type="datetime-local" className="h-9 min-w-0 rounded-md border border-border bg-background px-2 text-sm text-foreground" value={first} onChange={event => setFirst(event.target.value)} /></label>
        <p className="text-xs text-muted-foreground">Текущая минута — проверка начнётся сразу после сохранения включённого расписания.</p>
        <p className="text-xs text-muted-foreground">Работает при запущенном сервере, даже если окно закрыто. Результаты появятся в истории. Если проверка уже идёт, повторный запуск пропускается. Пропущенные интервалы не накапливаются.</p>
        {schedule?.lastOutcome && <p className="text-xs text-muted-foreground">{outcomes[schedule.lastOutcome] || 'Проверка прервана'}{schedule.lastRunAt ? ` · ${new Date(schedule.lastRunAt).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'})}` : ''}</p>}
        {save.isError && <p role="alert" className="text-xs text-destructive">Не удалось сохранить расписание. Проверьте поля и повторите попытку.</p>}
        <Button type="button" variant="outline" size="sm" disabled={save.isPending || saved.isPending || invalid} onClick={() => save.mutate()}>{save.isPending ? 'Сохранение…' : 'Сохранить расписание'}</Button>
      </>}
    </div>}
  </section>;
}
