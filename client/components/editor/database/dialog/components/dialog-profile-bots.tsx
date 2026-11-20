/** @fileoverview Секция ботов с сохранённой личной перепиской в общем профиле человека. */
import { Bot, RefreshCw } from 'lucide-react';
import { statusAppearance } from '@shared/status-appearance';
import { useDialogProfileBots } from '../hooks/use-dialog-profile-bots';

/** Параметры секции общего профиля. */
interface Props {
  /** Проект, доступный пользователю. */ projectId: number;
  /** Telegram ID собеседника. */ userId: string | number;
}

/**
 * Показывает всех ботов человека, сохраняя отдельные статусы и счётчики каждого.
 * @param props - Проект и пользователь без активного фильтра бота
 * @returns Секция сохранённых личных переписок
 */
export function DialogProfileBots({ projectId, userId }: Props) {
  const query = useDialogProfileBots(projectId, userId);
  const bots = query.data?.botMemberships ?? [];
  return <section className="space-y-3 border-t px-5 py-4 text-sm" aria-label="Боты пользователя">
    <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Bot className="h-4 w-4" aria-hidden />Боты пользователя{query.data ? ` · ${bots.length}` : ''}
    </h3>
    {query.isLoading && <p className="text-xs text-muted-foreground">Загрузка ботов…</p>}
    {query.isError && <div role="alert" className="space-y-2 text-xs text-muted-foreground">
      <p>Не удалось загрузить ботов пользователя.</p>
      <button type="button" className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 hover:bg-accent"
        onClick={() => { void query.refetch(); }}><RefreshCw className="h-3.5 w-3.5" />Повторить</button>
    </div>}
    {query.data && !bots.length && <p className="text-xs text-muted-foreground">Сохранённых личных переписок с ботами нет.</p>}
    <ul className="space-y-2">{bots.map(bot => <li key={bot.tokenId} className="space-y-1.5 rounded-lg border p-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0"><p className="break-words font-medium">{bot.name}</p>
          {bot.username && <p className="break-all text-xs text-muted-foreground">@{bot.username.replace(/^@/, '')}</p>}
        </div><span className="shrink-0 text-xs text-muted-foreground">#{bot.tokenId}</span>
      </div>
      <p className="text-xs" style={statusAppearance(bot.status)}>{bot.status}</p>
      {bot.botAvailability && <p className="text-xs" style={statusAppearance(bot.botAvailability)}>{bot.botAvailability}</p>}
      <p className="text-xs text-muted-foreground">Сообщений: {bot.incomingMessageCount.toLocaleString('ru-RU')} · Нажатий: {bot.buttonClickCount.toLocaleString('ru-RU')}</p>
    </li>)}</ul>
  </section>;
}
