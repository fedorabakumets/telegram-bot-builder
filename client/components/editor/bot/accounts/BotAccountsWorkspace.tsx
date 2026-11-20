/** @fileoverview Собирает демонстрационный холст и настройки выбранного Telegram-аккаунта. */
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { BotAccountsCanvas } from './BotAccountsCanvas';
import { AccountDetailPanel } from './account-detail-panel';
import type { useMockTelegramAccounts } from './use-mock-telegram-accounts';

/** Данные и действия демонстрационного режима. */
interface BotAccountsWorkspaceProps {
  /** Модель аккаунтов выбранного проекта. */
  model: ReturnType<typeof useMockTelegramAccounts>;
}

/**
 * Открывает настройки аккаунта рядом с холстом или в панели на узком экране.
 * @param props - Локальная модель экрана.
 * @returns Холст аккаунтов и его панель настроек.
 */
export function BotAccountsWorkspace({ model }: BotAccountsWorkspaceProps) {
  const compact = useMediaQuery('(max-width: 767px)');
  const account = model.selectedAccount;
  /** Возвращает пользователя к холсту. */
  const close = () => model.selectAccount(null);
  const details = account && (
    <AccountDetailPanel key={account.id} account={account} bots={model.bots} compact={compact}
      onClose={close}
      onToggleBot={botId => model.toggleBot(account.id, botId)}
      onSessionImport={kind => model.importSession(account.id, kind)}
      onProxyChange={proxy => model.updateProxy(account.id, proxy)} />
  );

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden">
      <div className="min-w-0 flex-1">
        <BotAccountsCanvas accounts={model.accounts} bots={model.bots}
          selectedAccountId={account?.id ?? null} onSelectAccount={model.selectAccount} onImport={model.createAccount} />
      </div>
      {!compact && account && (
        <div className="w-[min(26rem,52%)] shrink-0 overflow-hidden border-l bg-background">
          {details}
        </div>
      )}
      {compact && (
        <Sheet open={!!account} onOpenChange={open => { if (!open) close(); }}>
          <SheetContent side="bottom" hideClose className="h-[min(85dvh,48rem)] gap-0 p-0">
            {details}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
