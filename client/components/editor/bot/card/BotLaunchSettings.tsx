/**
 * @fileoverview Блок выбора режима запуска бота (polling / webhook) с сохранением в БД
 * @module components/editor/bot/card/BotLaunchSettings
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BotLaunchModePicker } from './BotLaunchModePicker';
import { KeyRound, Rocket, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/utils';
import { buildWebhookPreview, effectiveLaunchMode } from './bot-launch-helpers';
import type { BotLaunchSettingsProps } from './bot-launch-helpers';
import { useBotLaunchSettings } from './use-bot-launch-settings';
import { WebhookSecretReveal } from './WebhookSecretReveal';

/** Блок выбора режима запуска бота с сохранением в БД */
export function BotLaunchSettings({
  tokenId,
  projectId,
  launchMode,
  projectLaunchMode,
  projectWebhookBaseUrl,
  addressDisabled,
  webhookBaseUrl,
  webhookSecretToken,
  hasWebhookSecret,
  className,
  onPendingChange,
}: BotLaunchSettingsProps) {
  const { localMode, localBaseUrl, localSecret, inheritedBaseUrl, serverBaseUrl, effectiveBaseUrl,
    handleModeChange, handleBaseUrlChange, handleSecretChange } = useBotLaunchSettings({
      tokenId, projectId, launchMode, webhookBaseUrl, projectWebhookBaseUrl, webhookSecretToken, onPendingChange,
    });
  const webhookPreview = buildWebhookPreview(effectiveBaseUrl, projectId, tokenId);
  const effectiveMode = effectiveLaunchMode(localMode, projectLaunchMode);
  const projectModeLabel = projectLaunchMode === 'webhook' ? 'Webhook' : 'Polling';

  return (
    <div className={cn('@container space-y-3 px-3.5 py-3', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          <Rocket className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">Режим запуска</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {effectiveMode === 'webhook' ? 'Webhook' : 'Polling'} · {localMode === 'inherit' ? 'из проекта' : 'задан для бота'}
          </p>
        </div>
      </div>

      <div className="pl-10 space-y-3">
        {/* Общий выбор транспорта проекта и бота. */}
        <BotLaunchModePicker value={localMode} onChange={handleModeChange} projectModeLabel={projectModeLabel} />

        {effectiveMode === 'webhook' && (
          <div className="space-y-3 rounded-md border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Применится при следующем запуске</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Базовый адрес webhook</p>
              <Select value={localBaseUrl === 'inherit' ? 'inherit' : 'own'} disabled={addressDisabled}
                onValueChange={(source) => handleBaseUrlChange(source === 'inherit' ? 'inherit' : '')}>
                <SelectTrigger className="min-h-8 w-full text-xs" aria-label="Источник базового адреса webhook"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Как в проекте</SelectItem>
                  <SelectItem value="own">Задать для бота</SelectItem>
                </SelectContent>
              </Select>
              {localBaseUrl === 'inherit' ? (
                <p className="break-all text-xs text-muted-foreground">
                  {inheritedBaseUrl ? `Базовый адрес: ${inheritedBaseUrl}` : 'Публичный адрес webhook не настроен.'}
                </p>
              ) : (
                <>
                  <Input
                    aria-label="Базовый адрес webhook для бота"
                    disabled={addressDisabled}
                    value={localBaseUrl}
                    onChange={(event) => handleBaseUrlChange(event.target.value)}
                    placeholder={serverBaseUrl || 'https://example.com'}
                    className="h-8 text-xs"
                  />
                  <p className="text-xs text-muted-foreground">Пустое поле использует адрес сервера.</p>
                </>
              )}
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
