/** @fileoverview Поля строки бота с честными состояниями применения и безопасной ссылкой. */
import { Link } from 'wouter';
import type { WorkerBotRuntimeRow } from '@shared/worker-bot-runtime';
import { workerBotActivity, workerBotActivityClass, workerBotMode } from './worker-bot-presentation';
/** Свойства отдельного набора полей. */
interface Props {
  /** Безопасная строка административного снимка. */
  bot: WorkerBotRuntimeRow;
}
/** Показывает имя бота и проект с переходом в административный редактор. */
export function WorkerBotIdentity({ bot }: Props) {
  return <div className="min-w-0">
    <Link href={`/admin/projects/${bot.projectId}?tab=bot&bot=${bot.tokenId}`} className="block truncate rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={bot.botName}>
      {bot.botName || `Бот #${bot.tokenId}`}
    </Link>
    <p className="mt-1 truncate text-xs text-muted-foreground" title={bot.projectName}>{bot.projectName} · #{bot.tokenId}</p>
    {bot.botUsername ? <p className="mt-1 truncate text-xs text-muted-foreground">@{bot.botUsername.replace(/^@/, '')}</p> : null}
  </div>;
}
/** Различает выбор бота, общее значение и значение по умолчанию. */
export function WorkerBotSelectedMode({ bot }: Props) {
  const source = bot.source === 'bot' ? 'Выбран у бота' : bot.source === 'server' ? 'Общая настройка' : 'По умолчанию';
  return <div><p>{workerBotMode(bot.effectiveMode)}</p><p className="mt-1 text-xs text-muted-foreground">{source} · {bot.launchMode === 'webhook' ? 'Webhook' : 'Polling'}</p>
    {bot.configurationError ? <p className="mt-1 text-xs text-amber-200">{bot.configurationError}</p> : null}
    {!bot.configurationError && !bot.transportCompatible ? <p className="mt-1 text-xs text-amber-200">Режим несовместим с транспортом</p> : null}
  </div>;
}
/** Показывает подтверждённый режим отдельно от сохранённого выбора. */
export function WorkerBotActualMode({ bot }: Props) {
  return <div><p className={bot.actualMode === null ? 'text-muted-foreground' : ''}>{workerBotMode(bot.actualMode)}</p>
    {bot.workerKey !== null ? <p className="mt-1 text-xs text-muted-foreground">Группа {bot.workerKey}</p> : null}
  </div>;
}
/** Отображает активность сценария, не выдавая неизвестное состояние за сон. */
export function WorkerBotActivity({ bot }: Props) {
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs ${workerBotActivityClass(bot.activity)}`}>{workerBotActivity(bot.activity)}</span>;
}
/** Объясняет необходимость перезапуска без запуска действий из строки. */
export function WorkerBotApplication({ bot }: Props) {
  if (bot.configurationError) return <span className="text-amber-200">Исправьте настройку</span>;
  if (bot.restartRequired === true) return <span className="text-amber-200">Нужен перезапуск</span>;
  if (bot.restartRequired === null) return <span className="text-muted-foreground">Нет подтверждения</span>;
  return <span className="text-muted-foreground">{bot.activity === 'stopped' ? 'При следующем запуске' : 'Перезапуск не нужен'}</span>;
}
