/** @fileoverview Подробный результат проверки с отдельными причинами заморозки и отказа токена. */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { TelegramBotCheckItem, TelegramBotCheckResult } from '@shared/telegram-bot-check';
import type { BotToken } from '@shared/schema';
import { statusAppearance } from '@shared/status-appearance';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckHistoryContent } from '../components/check-history/check-history-content';
import { CheckScheduleSettings } from '../components/check-history/check-schedule-settings';
/** Понятные причины без секретов и сырых текстов исключений. */
const reasons: Record<NonNullable<TelegramBotCheckItem['reason']>, string> = {
  unauthorized: 'Недействительный токен', telegram_frozen: 'Бот заморожен Telegram',
  bot_deactivated: 'Бот заблокирован или деактивирован Telegram', timeout: 'Нет ответа Telegram после двух попыток по 15 секунд',
  network: 'Не удалось соединиться с Telegram', rate_limited: 'Telegram ограничил частоту запросов',
  telegram_error: 'Telegram вернул ошибку', invalid_response: 'Получен некорректный ответ Telegram',
  token_changed: 'Токен изменился во время проверки — повторите проверку',
  no_test_chat: 'Нет чата для проверки', chat_unavailable: 'Проверочный чат недоступен',
  error: 'Не удалось получить достоверный результат',
};
/**
 * Показывает сохраняемый до следующей проверки результат и список проблемных ботов.
 * @param props - Результат и управление открытием.
 * @returns Диалог с раздельными итогами и причинами каждого отказа.
 */
export function UsersBotCheckResult({ result, open, onOpenChange, pending = false, total, tokens, error, startedAt, finishedAt, projectId, tokenId = null, onStart, startDisabled }: {
  /** Последний результат текущей области. */ result: TelegramBotCheckResult | null;
  /** Открыт ли диалог. */ open: boolean;
  /** Изменение видимости. */ onOpenChange: (open: boolean) => void;
  /** Проверка ещё выполняется. */ pending?: boolean;
  /** Полное число ботов выбранной области. */ total?: number;
  /** Подписи ожидающих ботов. */ tokens?: BotToken[];
  /** Время старта сохранённой проверки. */ startedAt?: string;
  /** Время завершения сохранённой проверки. */ finishedAt?: string | null;
  /** Проект постоянной истории. */ projectId?: number;
  /** Область истории. */ tokenId?: number | null;
  /** Запускает проверку только по явному действию внутри окна. */ onStart?: () => void;
  /** Нельзя повторно запустить текущую задачу. */ startDisabled?: boolean;
  /** Безопасная ошибка запуска или соединения. */ error?: string;
}) {
  const snapshot = result ?? { items: [], available: 0, unavailable: 0, errors: 0 };
  const invalid = snapshot.items.filter(item => item.reason === 'unauthorized').length;
  const frozen = snapshot.items.filter(item => item.reason === 'telegram_frozen').length;
  const other = snapshot.items.filter(item => item.status === 'unavailable' && !['unauthorized', 'telegram_frozen'].includes(item.reason ?? '')).length;
  const expected = total ?? snapshot.items.length;
  /** Каждому боту сразу отведена строка; ожидание заменяется результатом без перемещения списка. */
  const rows = tokens?.length ? tokens.map(token => ({ tokenId: token.id, name: token.name, username: token.botUsername })) : snapshot.items;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="users-portal max-w-xl max-h-[80vh] gap-3 overflow-y-auto p-5">
      <DialogHeader><DialogTitle>{pending || !result ? 'Проверка ботов в Telegram' : 'Результат проверки ботов'}</DialogTitle>
        <DialogDescription>Проверяем токен и ограничения бота через команды Telegram. При сбое соединения повторяем запрос; ожидание — до 15 секунд на попытку. Сообщения пользователям не отправляются.</DialogDescription></DialogHeader>
      {/** Время отражает серверный запуск, а не момент открытия окна. */}
      {startedAt && <p className="text-xs text-muted-foreground">Начало: {new Date(startedAt).toLocaleString('ru-RU')}{finishedAt ? ` · Завершено: ${new Date(finishedAt).toLocaleString('ru-RU')}` : ''}</p>}
      {onStart && <Button type="button" variant="outline" size="sm" className="h-8 justify-self-start" disabled={startDisabled || pending} onClick={onStart}>{pending ? 'Проверка выполняется…' : 'Начать проверку'}</Button>}
      {result && <>
      <p role="status" className="text-sm">{!pending && snapshot.errors > 0 && snapshot.available + snapshot.unavailable === 0 ? 'Проверка не дала ответа. ' : ''}Проверено {snapshot.items.length} из {expected}</p>
      <Progress value={expected ? snapshot.items.length / expected * 100 : 0} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {/** Сводка и строки ботов используют общую палитру статусов без собственной раскраски. */}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {[[ 'Проверка пройдена', snapshot.available ], ['Заморожены Telegram', frozen],
          ['Недействительный токен', invalid], ['Другие блокировки Telegram', other], ['Не удалось проверить', snapshot.errors]]
          .map(([label, count]) => <div key={label} style={{ color: statusAppearance(String(label)).color }}><dt>{label}</dt><dd className="mt-1 font-medium">{count}</dd></div>)}
      </dl>
      <ul className="divide-y divide-border">
        {rows.map(bot => {
          const item = snapshot.items.find(item => item.tokenId === bot.tokenId);
          const label = !item ? pending ? 'Ожидает результата…' : 'Не завершено' : item.status === 'available' ? 'Проверка пройдена' : reasons[item.reason ?? 'error'];
          return <li key={bot.tokenId} className="py-3 text-sm">
            <p className="font-medium">{bot.username ? `@${bot.username}` : bot.name || `Бот №${bot.tokenId}`}</p>
            <p className="mt-1" style={{ color: statusAppearance(item?.status === 'error' ? 'Не удалось проверить' : label).color }}>{label}</p>
            {item?.method && item.status !== 'available' && <p className="mt-1 text-xs text-muted-foreground">Этап: {({ getMe: 'проверка токена', getMyCommands: 'чтение команд', setMyCommands: 'проверка сохранения команд' } as Record<string, string>)[item.method] || item.method}{item.errorCode ? ` · Код ${item.errorCode}` : ''}</p>}
          </li>;
        })}
      </ul>
      {snapshot.errors > 0 && <p className="text-xs text-muted-foreground">Сбой проверки не означает блокировку. Прежний статус бота сохранён — повторите проверку позже.</p>}
      </>}
      {/** Интервал сохраняется отдельно для проверки самих ботов. */}
      {projectId && <CheckScheduleSettings key={`${projectId}:${tokenId}`} projectId={projectId} tokenId={tokenId} kind="telegram-bots" enabled={open} />}
      {/** Прошлые запуски доступны в этом же окне без переключения диалогов. */}
      {projectId && <CheckHistoryContent projectId={projectId} tokenId={tokenId} kind="telegram-bots" enabled={open} />}
    </DialogContent>
  </Dialog>;
}
