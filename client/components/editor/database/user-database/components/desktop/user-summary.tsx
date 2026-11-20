/** @fileoverview Общие подписи источника, статуса и копируемые реквизиты пользователя. */
import { UserContactOrigin } from './user-contact-origin';
import { UNSAVED_USER_SOURCE, userSourceFallback } from '@shared/user-source-fallback';
import type { UserBotData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { NO_AVAILABLE_BOTS_LABEL } from '@shared/bot-availability-label';

/**
 * Отличает импортированный контакт от человека с подтверждённой личной перепиской.
 * @param user - Пользователь в текущей области ботов.
 * @returns Признак контакта, у которого ещё нет сохранённой переписки.
 */
export function isImportedContact(user: UserBotData): boolean {
  return Boolean(user.importedAt && !(user.hasPrivateMessages ?? Boolean(user.lastMessageAt)));
}

/**
 * Описывает известный источник без подмены отсутствующих данных прямым запуском.
 * @param user - Пользователь бота.
 * @returns Подпись наблюдаемого источника.
 */
export function userSource(user: UserBotData): string {
  if (user.acquisitionSource && !['Нет данных', UNSAVED_USER_SOURCE].includes(user.acquisitionSource)) return user.acquisitionSource;
  return userSourceFallback(user.deepLinkParam, user.referrerId);
}

/**
 * Показывает общий статус доступности ботов в текущей выборке.
 * @param user - Пользователь бота.
 * @returns Читаемый статус.
 */
export function userStatus(user: UserBotData): string {
  if (user.isDeleted) return 'Аккаунт удалён';
  const bots = user.botMemberships ?? [];
  if (bots.length > 0 && bots.every(bot => bot.botAvailability && bot.botAvailability !== 'Бот отключён'))
    return NO_AVAILABLE_BOTS_LABEL;
  if (isImportedContact(user)) return 'Не проверен';
  if (user.isBlocked) return 'Пользователь заблокировал бота';
  if (user.isBlocked == null) return 'Неизвестен';
  return user.isActive ? 'Активен' : 'Неактивен';
}

/**
 * Открывает диалог через имя или username и сохраняет копирование идентификатора.
 * @param props - Данные пользователя.
 * @returns Реквизиты пользователя.
 */
export function UserIdentity({ user, onOpenDialog }: {
  /** Пользователь бота. */ user: UserBotData;
  /** Открывает переписку вместо копирования username. */ onOpenDialog?: () => void;
}) {
  const { toast } = useToast();
  /** Копирует реквизит и сообщает результат без изменения выбора строки. */
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast({ title: 'Скопировано' }); }
    catch { toast({ title: 'Не удалось скопировать', variant: 'destructive' }); }
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Без имени';
  /** Проблемы ботов не меняют состояние человека и видны даже у свёрнутой группы. */
  const unavailableBots = user.botMemberships?.filter(bot => bot.botAvailability).length ?? 0;
  return <div className="min-w-0 space-y-1">
    {onOpenDialog ? <button type="button" className="users-copy-value block max-w-full truncate text-sm font-medium"
      title="Открыть диалог" aria-label={`Открыть диалог с ${name}`} onClick={onOpenDialog}>{name}</button>
      : <div className="truncate text-sm font-medium" title={name}>{name}</div>}
    {isImportedContact(user) && <p className="text-xs text-muted-foreground"
      title="Контакт импортирован; личная переписка с ботом пока не подтверждена">Импортирован</p>}
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {user.userName && <button type="button" className="users-copy-value" title={onOpenDialog ? 'Открыть диалог' : 'Скопировать username'}
        aria-label={onOpenDialog ? `Открыть диалог с @${user.userName}` : `Скопировать username @${user.userName}`}
        onClick={onOpenDialog ?? (() => copy(`@${user.userName}`))}>@{user.userName}</button>}
      <button type="button" className="users-copy-value tabular-nums" title="Скопировать Telegram ID"
        aria-label={`Скопировать Telegram ID ${user.userId}`} onClick={() => copy(user.userId)}>ID: {user.userId}</button>
    </div>
    <UserContactOrigin user={user} />
    {(user.botMemberships?.length ?? 0) > 1 && unavailableBots > 0 &&
      <p className="users-bot-availability">Недоступно ботов: {unavailableBots}</p>}
  </div>;
}
