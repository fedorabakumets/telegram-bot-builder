/** @fileoverview Собирает холст и настройки выбранного Telegram-аккаунта проекта. */
import { useEffect, useState, type ReactNode } from 'react';
import { apiRequest } from '@/queryClient';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { BotAccountsCanvas } from './BotAccountsCanvas';
import { AccountDetailPanel, type LiveProfile } from './account-detail-panel';
import { AccountMigrationPreview } from './account-migration-preview';
import type { useProjectTelegramAccounts } from './use-project-telegram-accounts';
import type { MockTelegramAccount } from './mock-account-types';

/** Данные и действия рабочей области аккаунтов. */
interface BotAccountsWorkspaceProps {
  /** Модель аккаунтов выбранного проекта. */
  model: ReturnType<typeof useProjectTelegramAccounts>;
  /** Рисует аккаунты на общем холсте ботов. */
  renderCanvas?: (cards: MockTelegramAccount[]) => ReactNode;
}

/**
 * Открывает настройки аккаунта рядом с холстом или в панели на узком экране.
 * @param props - Модель экрана.
 * @returns Холст аккаунтов и его панель настроек.
 */
export function BotAccountsWorkspace({ model, renderCanvas }: BotAccountsWorkspaceProps) {
  const compact = useMediaQuery('(max-width: 767px)');
  const account = model.selectedAccount;
  const liveAccount = model.selectedLiveAccount;
  /** Полный профиль доступен в памяти после явного запроса пользователя. */
  const [profiles, setProfiles] = useState<Record<string, LiveProfile>>({});
  const scope = `${model.actorId}:${model.projectId}:`;
  const connectedIds = model.accounts.filter(card => card.status === 'connected').map(card => card.id).join(',');
  const { path, demo, canManage } = model;
  useEffect(() => {
    if (demo || !canManage || !connectedIds) return;
    let cancelled = false;
    for (const id of connectedIds.split(',')) {
      void apiRequest('POST', `${path}/${id}/profile`, {}).then((profile: LiveProfile) => {
        if (!cancelled) setProfiles(previous => ({ ...previous, [scope + id]: previous[scope + id] ?? profile }));
      }).catch(() => {
        /** При недоступности Telegram плитка сохраняет данные из карточки проекта. */
      });
    }
    return () => { cancelled = true; };
  }, [demo, canManage, connectedIds, path, scope]);
  const cards = model.accounts.map(card => {
    const profile = profiles[scope + card.id];
    if (model.demo || !profile) return card;
    return {
      ...card,
      name: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || card.name,
      maskedPhone: profile.phone || card.maskedPhone,
      avatarUrl: profile.avatar ? `data:image/jpeg;base64,${profile.avatar}` : undefined,
      telegramUsername: profile.username,
      telegramId: profile.id,
    };
  }).sort((a, b) => Number(b.status === 'connected') - Number(a.status === 'connected'));
  /** Возвращает пользователя к холсту. */
  const close = () => model.selectAccount(null);
  const details = account && (
    <AccountDetailPanel key={account.id} account={account} bots={model.bots} compact={compact}
      liveAccount={liveAccount} canManage={model.canManage} busy={model.busy} url={`${model.path}/${account.id}`}
      profile={model.demo ? undefined : profiles[scope + account.id]}
      onProfileLoaded={profile => setProfiles(previous => ({ ...previous, [scope + account.id]: profile }))}
      onSaved={model.refreshAccounts}
      onClose={close}
      onToggleBot={botId => model.toggleBot(account.id, botId)}
      onSessionImport={kind => model.importSession(account.id, kind)}
      onProxyChange={proxy => model.updateProxy(account.id, proxy)} />
  );

  if (!renderCanvas && (model.pending || model.error || (!model.demo && !model.projectId))) {
    return (
      <div className="grid h-full place-content-center gap-3 p-4 text-center text-sm text-muted-foreground">
        <p role={model.error ? 'alert' : 'status'}>{model.error ? 'Не удалось загрузить аккаунты проекта'
          : model.projectId ? 'Загрузка аккаунтов…' : 'Выберите проект'}</p>
        {model.error && <Button variant="outline" onClick={() => void model.refreshAccounts()}>Повторить</Button>}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden">
      <div className="min-w-0 flex-1">
        {!renderCanvas && !model.demo && model.canManage && model.actorId != null && <div className="absolute left-3 top-3 z-10">
          <AccountMigrationPreview key={`${model.path}:${model.actorId}`} path={model.path} actorId={model.actorId}
            onChanged={() => void model.refreshAccounts()} />
        </div>}
        {renderCanvas ? renderCanvas(cards) : <BotAccountsCanvas accounts={cards} bots={model.bots}
          selectedAccountId={account?.id ?? null} onSelectAccount={model.selectAccount}
          onImport={model.canManage && !model.busy ? model.createAccount : undefined} />}
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
