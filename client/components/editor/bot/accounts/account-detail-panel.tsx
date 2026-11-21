/** @fileoverview Панель настроек Telegram-аккаунта проекта. */
import { useId, useState } from 'react';
import { apiRequest } from '@/queryClient';
import { UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/utils/utils';
import { AccountMockProxy } from './account-mock-proxy';
import { AccountSessionImport } from './account-session-import';
import { AccountProfileDetails } from './account-profile-details';
import { AccountLiveProxy } from './account-live-proxy';
import { AccountLiveSession } from './account-live-session';
import type { ProjectTelegramAccount } from '@shared/project-telegram-accounts';
import type { MockAccountBot, MockAccountProxy, MockSessionKind, MockTelegramAccount } from './mock-account-types';

/** Данные профиля для текущей открытой карточки. */
export interface LiveProfile {
  /** Идентификатор пользователя Telegram. */
  id?: string;
  /** Полный номер аккаунта. */
  phone?: string | null;
  /** Имя из Telegram. */
  firstName?: string | null;
  /** Фамилия из Telegram. */
  lastName?: string | null;
  /** Имя пользователя из Telegram. */
  username?: string | null;
  /** Аватар JPEG в Base64. */
  avatar?: string | null;
}

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
  /** Рабочая карточка проекта, если включено реальное подключение. */
  liveAccount?: ProjectTelegramAccount | null;
  /** Пользователь может менять настройки. */
  canManage?: boolean;
  /** Бежит запись изменений привязок. */
  busy?: boolean;
  /** Путь API рабочей карточки. */
  url?: string;
  /** Перечитывает данные после успешного изменения. */
  onSaved?: () => void;
  /** Актуальный профиль, общий с плиткой на холсте. */
  profile?: LiveProfile;
  /** Передаёт обновлённый профиль рабочей области. */
  onProfileLoaded: (profile: LiveProfile) => void;
}

/**
 * Показывает фотографию аккаунта, привязки ботов, сессию и прокси.
 * @param props - Аккаунт и его доступные действия.
 * @returns Содержимое боковой или нижней панели.
 */
export function AccountDetailPanel({
  account, bots, onToggleBot, onSessionImport, onProxyChange, onClose, compact,
  liveAccount, canManage = true, busy, url, onSaved, profile, onProfileLoaded,
}: AccountDetailPanelProps) {
  const fieldId = useId();
  const headingId = useId();
  const connected = account.status === 'connected';
  const bindingDisabled = !canManage || busy || (!!liveAccount && !connected);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const phone = profile ? profile.phone || 'Номер не указан' : account.maskedPhone;
  const profileName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : liveAccount?.telegramName;
  const heading = profileName?.trim() || account.name;
  const username = profile ? profile.username : liveAccount?.telegramUsername;
  const telegramId = profile?.id ?? liveAccount?.telegramUserId;

  /** Загружает актуальные данные для показа в открытой панели. */
  async function fetchProfile() {
    if (!url || profileLoading) return;
    setProfileLoading(true);
    setProfileError('');
    try {
      onProfileLoaded(await apiRequest('POST', `${url}/profile`, {}));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось получить профиль');
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col" aria-labelledby={compact ? undefined : headingId}>
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
        <Avatar className="mt-0.5 size-9 shrink-0 rounded-lg border border-border">
          <AvatarImage src={profile ? profile.avatar ? `data:image/jpeg;base64,${profile.avatar}` : undefined : account.avatarUrl} alt="" className="object-cover" />
          <AvatarFallback className="rounded-lg text-muted-foreground">
            <UserRound className="size-4" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {compact
            ? <SheetTitle className="truncate text-left text-sm" title={heading}>{heading}</SheetTitle>
            : <h2 id={headingId} className="truncate text-sm font-semibold" title={heading}>{heading}</h2>}
          {compact
            ? <SheetDescription className="truncate text-left text-xs">{phone}</SheetDescription>
            : <p className="truncate text-xs text-muted-foreground">{phone}</p>}
          {liveAccount && connected && canManage && url && (
            <Button type="button" variant="outline" size="sm" className="mt-2" disabled={profileLoading}
              onClick={() => void fetchProfile()}>
              {profileLoading ? 'Загружаем профиль…' : profile ? 'Обновить профиль' : 'Показать профиль Telegram'}
            </Button>
          )}
          {profileError && <p role="alert" className="mt-1 text-xs text-destructive">{profileError}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span role="status" className={cn('flex items-center gap-1.5', connected ? 'text-emerald-500' : 'text-muted-foreground')}>
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {liveAccount ? connected ? 'Сессия подтверждена' : liveAccount.sessionKind ? 'Ожидает проверки' : 'Без сессии'
                : connected ? 'Подключён' : 'Отключён'}
            </span>
            {!liveAccount && <span className="text-muted-foreground">Демонстрационный режим</span>}
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0"
          onClick={onClose} aria-label="Закрыть настройки аккаунта" title="Закрыть настройки аккаунта">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        {liveAccount ? (username || telegramId) && (
          <section aria-label="Данные аккаунта" className="space-y-2">
            <h3 className="text-sm font-semibold">Данные аккаунта</h3>
            <div className="rounded-lg border border-border p-3 text-sm">
              {username && <p className="break-words text-muted-foreground">@{username.replace(/^@/, '')}</p>}
              {telegramId && <p className="break-all text-muted-foreground">Telegram ID <span className="select-all">{telegramId}</span></p>}
            </div>
          </section>
        ) : <AccountProfileDetails account={account} />}
        <fieldset className="min-w-0" disabled={bindingDisabled}>
          <legend className="mb-2 text-sm font-semibold">Привязанные боты</legend>
          {bots.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-muted-foreground">{liveAccount && !connected ? 'Сначала подключите Telegram-аккаунт.'
                : 'Выбор бота переносит сюда его привязку, если у него уже есть аккаунт.'}</p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {bots.map((bot) => {
                  const id = `${fieldId}-${bot.id}`;
                  return (
                    <li key={bot.id} className="flex items-center gap-2 px-3 py-2 focus-within:bg-muted/30 hover:bg-muted/30">
                      <Checkbox id={id} className="shrink-0" checked={account.botIds.includes(bot.id)} disabled={bindingDisabled}
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
        {liveAccount ? canManage && url && onSaved && (
          connected ? (
            <p className="text-xs text-muted-foreground">Сессия подтверждена. Изменение сессии и прокси уже подключённого аккаунта пока закрыто.</p>
          ) : (
            <>
              {!liveAccount.sessionKind && <AccountLiveProxy account={liveAccount} url={url} onSaved={onSaved} />}
              {liveAccount.sessionKind === 'legacy' ? (
                <p className="text-sm text-muted-foreground">
                  {connected ? 'Используется сохранённая сессия Telegram.'
                    : 'Сессия сохранена. Проверка доступна после подтверждения закрытия прежнего подключения Telethon.'}
                </p>
              ) : <AccountLiveSession url={url} onSaved={onSaved} pendingVerification={!!liveAccount.sessionKind} />}
            </>
          )
        ) : (
          <>
            <AccountSessionImport key={`session-${account.id}`} currentMethod={account.sessionKind ?? undefined} onImport={onSessionImport} />
            <AccountMockProxy key={`proxy-${account.id}`} proxy={account.proxy} onChange={onProxyChange} />
          </>
        )}
      </div>
    </section>
  );
}
