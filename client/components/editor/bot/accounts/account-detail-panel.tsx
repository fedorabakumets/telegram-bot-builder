/** @fileoverview Панель настроек демонстрационного Telegram-аккаунта. */
import { useId } from 'react';
import { UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/utils/utils';
import { AccountMockProxy } from './account-mock-proxy';
import { AccountSessionImport } from './account-session-import';
import { AccountProfileDetails } from './account-profile-details';
import type { MockAccountBot, MockAccountProxy, MockSessionKind, MockTelegramAccount } from './mock-account-types';

/** Настройки и действия панели аккаунта. */
interface AccountDetailPanelProps {
  /** Аккаунт, открытый для настройки. */
  account: MockTelegramAccount;
  /** Боты, доступные в текущем проекте. */
  bots: readonly MockAccountBot[];
  /** Устанавливает состояние привязки одного бота. */
  onToggleBot: (botId: string, selected: boolean) => void;
  /** Запоминает выбранный формат демонстрационной сессии. */
  onSessionImport: (kind: MockSessionKind) => void;
  /** Обновляет параметры демонстрационного прокси. */
  onProxyChange: (proxy: MockAccountProxy) => void;
  /** Закрывает панель. */
  onClose: () => void;
  /** Использует доступный заголовок модальной панели на узком экране. */
  compact?: boolean;
}

/**
 * Показывает фотографию аккаунта, привязки ботов, сессию и прокси.
 * @param props - Аккаунт и действия для локального прототипа.
 * @returns Содержимое боковой или нижней панели.
 */
export function AccountDetailPanel({
  account, bots, onToggleBot, onSessionImport, onProxyChange, onClose, compact,
}: AccountDetailPanelProps) {
  const fieldId = useId();
  const headingId = useId();
  const connected = account.status === 'connected';

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col" aria-labelledby={compact ? undefined : headingId}>
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
        <Avatar className="mt-0.5 size-9 shrink-0 rounded-lg border border-border">
          <AvatarImage src={account.avatarUrl} alt="" className="object-cover" />
          <AvatarFallback className="rounded-lg text-muted-foreground">
            <UserRound className="size-4" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {compact
            ? <SheetTitle className="truncate text-left text-sm" title={account.name}>{account.name}</SheetTitle>
            : <h2 id={headingId} className="truncate text-sm font-semibold" title={account.name}>{account.name}</h2>}
          {compact
            ? <SheetDescription className="truncate text-left text-xs">{account.maskedPhone}</SheetDescription>
            : <p className="truncate text-xs text-muted-foreground">{account.maskedPhone}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span role="status" className={cn('flex items-center gap-1.5', connected ? 'text-emerald-500' : 'text-muted-foreground')}>
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {connected ? 'Подключён' : 'Отключён'}
            </span>
            <span className="text-muted-foreground">Демонстрационный режим</span>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0"
          onClick={onClose} aria-label="Закрыть настройки аккаунта" title="Закрыть настройки аккаунта">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        <AccountProfileDetails account={account} />
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-semibold">Привязанные боты</legend>
          {bots.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-muted-foreground">Выбор бота переносит сюда его привязку, если у него уже есть аккаунт.</p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {bots.map((bot) => {
                  const id = `${fieldId}-${bot.id}`;
                  return (
                    <li key={bot.id} className="flex items-center gap-2 px-3 py-2 focus-within:bg-muted/30 hover:bg-muted/30">
                      <Checkbox id={id} className="shrink-0" checked={account.botIds.includes(bot.id)}
                        onCheckedChange={(checked) => onToggleBot(bot.id, checked === true)} />
                      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                        <span className="block truncate text-sm font-medium" title={bot.name}>{bot.name}</span>
                        {bot.username && (
                          <span className="block truncate text-xs text-muted-foreground">
                            @{bot.username.replace(/^@/, '')}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">В проекте пока нет доступных ботов.</p>
          )}
        </fieldset>
        <AccountSessionImport key={`session-${account.id}`} currentMethod={account.sessionKind ?? undefined} onImport={onSessionImport} />
        <AccountMockProxy key={`proxy-${account.id}`} proxy={account.proxy} onChange={onProxyChange} />
      </div>
    </section>
  );
}
