/** @fileoverview Адаптивный список режимов ботов: таблица на широком экране и карточки на узком. */
import type { WorkerBotRuntimeRow } from '@shared/worker-bot-runtime';
import { WorkerBotIdentity, WorkerBotSelectedMode, WorkerBotActualMode, WorkerBotActivity, WorkerBotApplication } from './worker-bot-row';
/** Свойства представления уже отфильтрованных строк. */
interface Props {
  /** Строки ботов текущей страницы без секретов. */
  bots: WorkerBotRuntimeRow[];
}
/** Показывает выбранные и фактические режимы, сохраняя читаемость на узкой рабочей области. */
export function WorkerBotTable({ bots }: Props) {
  return <>
    <div className="hidden overflow-x-auto rounded-md border border-border xl:block">
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">Режимы и состояния ботов</caption>
        <thead className="bg-muted/20 text-xs text-muted-foreground"><tr>
          <th scope="col" className="w-[24%] p-3 font-medium">Бот и проект</th>
          <th scope="col" className="w-[23%] p-3 font-medium">Выбранный режим</th>
          <th scope="col" className="w-[20%] p-3 font-medium">Работает сейчас</th>
          <th scope="col" className="w-[17%] p-3 font-medium">Сценарий</th>
          <th scope="col" className="w-[16%] p-3 font-medium">Применение</th>
        </tr></thead>
        <tbody className="divide-y divide-border">{bots.map(bot => <tr key={`${bot.projectId}:${bot.tokenId}`} className="align-top hover:bg-muted/10">
          <th scope="row" className="p-3 font-normal"><WorkerBotIdentity bot={bot} /></th>
          <td className="p-3"><WorkerBotSelectedMode bot={bot} /></td>
          <td className="p-3"><WorkerBotActualMode bot={bot} /></td>
          <td className="p-3"><WorkerBotActivity bot={bot} /></td>
          <td className="p-3 text-xs"><WorkerBotApplication bot={bot} /></td>
        </tr>)}</tbody>
      </table>
    </div>
    <ul aria-label="Режимы и состояния ботов" className="grid gap-3 xl:hidden">{bots.map(bot => <li key={`${bot.projectId}:${bot.tokenId}`} className="min-w-0 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3"><WorkerBotIdentity bot={bot} /><WorkerBotActivity bot={bot} /></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="mb-1 text-xs text-muted-foreground">Выбранный режим</dt><dd><WorkerBotSelectedMode bot={bot} /></dd></div>
        <div><dt className="mb-1 text-xs text-muted-foreground">Работает сейчас</dt><dd><WorkerBotActualMode bot={bot} /></dd></div>
        <div className="sm:col-span-2"><dt className="mb-1 text-xs text-muted-foreground">Применение</dt><dd className="text-xs"><WorkerBotApplication bot={bot} /></dd></div>
      </dl>
    </li>)}</ul>
  </>;
}
