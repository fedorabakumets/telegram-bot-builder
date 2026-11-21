/** @fileoverview Выбор Telegram-аккаунта в настройках бота. */
import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AccountLiveSession } from './account-live-session';
import { DemoAccountPhoneForm } from './demo-account-phone-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { useProjectTelegramAccounts } from './use-project-telegram-accounts';

/** Аккаунты и привязки открытого проекта доступны обеим панелям. */
export const BotDemoAccountContext = createContext<ReturnType<typeof useProjectTelegramAccounts> | null>(null);

/** Свойства поля выбора аккаунта. */
interface BotDemoAccountSettingProps {
  /** Идентификатор бота в проекте. */
  tokenId: number;
  /** Существующие настройки для ботов вне демонстрационного проекта. */
  fallback?: ReactNode;
}

/**
 * Позволяет выбрать аккаунт, уже добавленный во вкладке «Аккаунты».
 * @param props - Идентификатор бота из открытых настроек.
 * @returns Поле выбора для ботов, доступных в проекте.
 */
export function BotDemoAccountSetting({ tokenId, fallback }: BotDemoAccountSettingProps) {
  const model = useContext(BotDemoAccountContext);
  const field = useId();
  const [adding, setAdding] = useState(false);
  /** Карточка нового аккаунта для входа прямо в настройках бота. */
  const draftKey = ['telegram-login', model?.actorId, model?.projectId, tokenId].join(':');
  const [newAccountId, updateAccountId] = useState<number | null>(() => Number(sessionStorage.getItem(draftKey)) || null);
  /** Сохраняет открытую форму при переключении вкладок и возвращении к боту. */
  function setNewAccountId(id: number | null) {
    if (id) sessionStorage.setItem(draftKey, String(id));
    else sessionStorage.removeItem(draftKey);
    updateAccountId(id);
  }
  const botId = `project-bot-${tokenId}`;
  /** При отключённых общих аккаунтах авторизованный пользователь входит через настройки конкретного бота. */
  if (model?.demo && model.actorId != null) return <>{fallback}</>;
  if (!model?.bots.some(bot => bot.id === botId)) return <>{fallback}</>;
  if (model.pending) return <div className="px-3.5 py-3 text-xs text-muted-foreground" role="status">Загрузка Telegram-аккаунтов…</div>;
  if (model.error) return <div className="px-3.5 py-3 text-xs text-muted-foreground" role="alert">Не удалось загрузить Telegram-аккаунты</div>;
  const accountId = model.accounts.find(account => account.botIds.includes(botId))?.id;

  return (
    <div className="flex items-start gap-3 px-3.5 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
        <UserRound className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <Label htmlFor={field} className="block text-sm font-medium text-foreground">Telegram-аккаунт</Label>
        <p id={`${field}-hint`} className="mt-0.5 text-xs text-muted-foreground">
          {model.demo ? 'Выберите аккаунт проекта или добавьте по номеру. Демо-режим.'
            : 'Выберите аккаунт проекта. Или подключите новый по номеру.'}
        </p>
        <Select disabled={!model.canManage || model.busy} value={accountId ?? 'none'} onValueChange={id => model.changeBotAccount(botId, id === 'none' ? null : id)}>
          <SelectTrigger id={field} aria-describedby={`${field}-hint`} className="mt-2.5 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без привязки</SelectItem>
            {model.accounts.map(account => <SelectItem key={account.id} value={account.id}
              disabled={!model.demo && account.status !== 'connected'}>{account.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {!model.demo && model.canManage && (newAccountId ? (
          <AccountLiveSession url={model.path + '/' + newAccountId} onSaved={async verified => {
            await model.refreshAccounts();
            if (!verified) return;
            const result = await model.write('PUT', '/' + newAccountId + '/bots', { botIds: [tokenId] });
            if (result) setNewAccountId(null);
          }} />
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={model.busy} className="mt-2" onClick={async () => {
            const account = await model.write('POST', '', { name: 'Аккаунт ' + (model.accounts.length + 1) });
            if (account) setNewAccountId(account.id);
          }}>Добавить аккаунт</Button>
        ))}
        {model.demo && (adding ? (
          <DemoAccountPhoneForm onCancel={() => setAdding(false)} onConnect={phone => {
            model.connectPhoneAccount(botId, phone);
            setAdding(false);
          }} />
        ) : (
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setAdding(true)}>
            Добавить по номеру
          </Button>
        ))}
      </div>
    </div>
  );
}
