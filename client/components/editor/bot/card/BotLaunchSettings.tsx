/**
 * @fileoverview Блок выбора режима запуска бота (polling / webhook) с сохранением в БД
 * @module components/editor/bot/card/BotLaunchSettings
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, KeyRound, Link2, Rocket, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/utils';
import { buildWebhookPreview } from './bot-launch-helpers';
import type { LaunchMode, BotLaunchSettingsProps } from './bot-launch-helpers';
import { useBotLaunchSettings } from './use-bot-launch-settings';
import { WebhookSecretReveal } from './WebhookSecretReveal';

/** Блок выбора режима запуска бота с сохранением в БД */
export function BotLaunchSettings({
  tokenId,
  projectId,
  launchMode,
  webhookBaseUrl,
  webhookSecretToken,
  hasWebhookSecret,
  className,
  onPendingChange,
}: BotLaunchSettingsProps) {
  const { localMode, localBaseUrl, localSecret, inheritedBaseUrl, effectiveBaseUrl,
    handleModeChange, handleBaseUrlChange, handleSecretChange } = useBotLaunchSettings({
      tokenId, projectId, launchMode, webhookBaseUrl, webhookSecretToken, onPendingChange,
    });
  const webhookPreview = buildWebhookPreview(effectiveBaseUrl, projectId, tokenId);

  return (
    <div className={cn('@container space-y-3 px-3.5 py-3', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          <Rocket className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">Режим запуска</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Polling или webhook</p>
        </div>
      </div>

      <div className="pl-10 space-y-3">
        <RadioGroup
          value={localMode}
          onValueChange={(v) => handleModeChange(v as LaunchMode)}
          className="grid gap-2 sm:grid-cols-2"
        >
          {([
            { value: 'polling' as const, title: 'Polling', description: 'Long-polling', icon: Globe },
            { value: 'webhook' as const, title: 'Webhook', description: 'Входящий webhook', icon: Link2 },
          ] as const).map(({ value, title, description, icon: Icon }) => (
            <div
              key={value}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
                localMode === value
                  ? 'border-border bg-muted/40'
                  : 'border-border/50 hover:bg-muted/20',
              )}
              onClick={() => handleModeChange(value)}
            >
              <RadioGroupItem value={value} id={`launch-mode-${value}-${tokenId}`} className="mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{title}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        {localMode === 'webhook' && (
          <div className="space-y-3 rounded-md border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Применится при следующем запуске</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`webhook-base-url-${tokenId}`} className="text-xs">Базовый URL</Label>
              <Input
                id={`webhook-base-url-${tokenId}`}
                value={localBaseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                placeholder={inheritedBaseUrl || 'https://example.com'}
                className="h-8 text-xs"
              />
              <p className="text-xs text-muted-foreground">{localBaseUrl.trim()
                ? 'Собственный адрес бота. Очистите поле, чтобы использовать адрес сервера.'
                : inheritedBaseUrl ? `Адрес сервера: ${inheritedBaseUrl}` : 'Публичный адрес API не настроен. Укажите HTTPS-адрес.'}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`webhook-secret-${tokenId}`} className="text-xs">Защитный токен</Label>
              <Input
                id={`webhook-secret-${tokenId}`}
                value={localSecret}
                onChange={(e) => handleSecretChange(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder={hasWebhookSecret ? '•••••••• — токен сохранён' : 'Создаётся автоматически при запуске'}
                className="h-8 text-xs"
              />
              <p className="text-xs text-muted-foreground">{hasWebhookSecret
                ? 'Защита настроена. Оставьте поле пустым, чтобы сохранить токен; введите новый для замены.'
                : 'Токен защиты будет создан автоматически при сохранении webhook или запуске бота. Вводить его вручную не требуется.'}</p>
              <WebhookSecretReveal key={`${projectId}_${tokenId}`} projectId={projectId} tokenId={tokenId}
                available={hasWebhookSecret === true} />
            </div>
            <div className="rounded-md bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Webhook URL
              </div>
              <p className="mt-1 break-all font-mono text-[11px]">{webhookPreview}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
