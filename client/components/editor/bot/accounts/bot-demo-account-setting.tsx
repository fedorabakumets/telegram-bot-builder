/** @fileoverview Выбор демонстрационного Telegram-аккаунта в настройках бота. */
import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DemoAccountPhoneForm } from './demo-account-phone-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { useMockTelegramAccounts } from './use-mock-telegram-accounts';

/** Аккаунты и привязки открытого проекта доступны обеим панелям. */
export const BotDemoAccountContext = createContext<ReturnType<typeof useMockTelegramAccounts> | null>(null);

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
 * @returns Поле выбора для ботов, доступных в прототипе.
 */
export function BotDemoAccountSetting({ tokenId, fallback }: BotDemoAccountSettingProps) {
  const model = useContext(BotDemoAccountContext);
  const field = useId();
  const [adding, setAdding] = useState(false);
  const botId = `project-bot-${tokenId}`;
  if (!model?.bots.some(bot => bot.id === botId)) return <>{fallback}</>;
  const accountId = model.accounts.find(account => account.botIds.includes(botId))?.id;

  return (
    <div className="flex items-start gap-3 px-3.5 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
        <UserRound className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <Label htmlFor={field} className="block text-sm font-medium text-foreground">Telegram-аккаунт</Label>
        <p id={`${field}-hint`} className="mt-0.5 text-xs text-muted-foreground">Выберите аккаунт проекта или добавьте по номеру. Демо-режим.</p>
        <Select value={accountId ?? 'none'} onValueChange={id => model.changeBotAccount(botId, id === 'none' ? null : id)}>
          <SelectTrigger id={field} aria-describedby={`${field}-hint`} className="mt-2.5 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без привязки</SelectItem>
            {model.accounts.map(account => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {adding ? (
          <DemoAccountPhoneForm onCancel={() => setAdding(false)} onConnect={phone => {
            model.connectPhoneAccount(botId, phone);
            setAdding(false);
          }} />
        ) : (
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setAdding(true)}>
            Добавить по номеру
          </Button>
        )}
      </div>
    </div>
  );
}
