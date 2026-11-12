/** @fileoverview Компактные карточки групп без раскрытия токенов и внутреннего окружения. */
import type { WorkerRuntimeGroup } from '@shared/worker-runtime-group';
import { workerMemory } from './worker-monitor-format';
/** Свойства списка групп исполнителя. */
interface Props {
  /** Группы либо отсутствие достоверного снимка. */
  groups: WorkerRuntimeGroup[] | null | undefined;
}
/** Объясняет активность каждой группы на узких и широких экранах. */
export function WorkerGroupList({ groups }: Props) {
  return <div className="space-y-3">
    <h3 className="text-sm font-medium">Группы исполнения</h3>
    {groups == null ? <p className="text-sm text-muted-foreground">Сведения о группах пока недоступны.</p> : groups.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">Активных групп нет. Они появятся после включения ботов.</p> :
      <ul className="grid gap-3 lg:grid-cols-2">{groups.map(group => <li key={group.workerKey} className="min-w-0 rounded-md border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">Группа {group.workerKey}</span><span className="text-xs text-muted-foreground">{group.handlerMode === 'shared' ? 'Общий Python' : group.handlerMode === 'isolated' ? 'Отдельные процессы' : 'Режим не определён'}</span></div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-muted-foreground">Ботов</dt><dd className="mt-1 tabular-nums">{group.registeredBots}</dd></div>
          <div><dt className="text-muted-foreground">Python · RSS</dt><dd className="mt-1 tabular-nums">{workerMemory(group.pythonRssBytes === null ? null : group.pythonRssBytes / 1048576)}</dd></div>
          <div><dt className="text-muted-foreground">Process: активно / спит</dt><dd className="mt-1 tabular-nums">{group.activeHandlers ?? '—'} / {group.sleepingBots ?? '—'}</dd></div>
          <div><dt className="text-muted-foreground">Ожидает слот</dt><dd className="mt-1 tabular-nums">{group.waitingBots ?? '—'}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Постоянных ботов: {group.permanentBots ?? '—'}</p>
        <p className="mt-3 text-xs text-muted-foreground">{group.activeHandlerLimitKnown === true
          ? group.activeHandlerLimit === null ? 'Без фиксированного лимита загруженных сценариев' : `Лимит активных обработчиков: ${group.activeHandlerLimit}`
          : 'Лимит обработчиков не измерен'}</p>
        <p className="mt-3 text-xs text-muted-foreground">{group.hostAlive === true ? 'Обработчик process запущен' : group.hostAlive === false ? 'Обработчик process спит' : 'Состояние процесса не измерено'}{group.pendingBots > 0 ? ` · ожидают применения: ${group.pendingBots}` : ''}</p>
      </li>)}</ul>}
  </div>;
}
