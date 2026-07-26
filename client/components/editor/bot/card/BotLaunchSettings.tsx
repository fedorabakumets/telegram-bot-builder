/**
 * @fileoverview Блок выбора режима запуска бота (polling / webhook) с сохранением в БД
 * @module components/editor/bot/card/BotLaunchSettings
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, KeyRound, Link2, Rocket, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { updateLaunchSettings, buildWebhookPreview } from './bot-launch-helpers';
import type { LaunchMode, BotLaunchSettingsProps } from './bot-launch-helpers';

/** Блок выбора режима запуска бота с сохранением в БД */
export function BotLaunchSettings({
  tokenId,
  projectId,
  launchMode,
  webhookBaseUrl,
  webhookSecretToken,
  className,
  onPendingChange,
}: BotLaunchSettingsProps) {
  const [localMode, setLocalMode] = useState<LaunchMode>((launchMode as LaunchMode) ?? 'polling');
  const [localBaseUrl, setLocalBaseUrl] = useState(webhookBaseUrl ?? '');
  const [localSecret, setLocalSecret] = useState(webhookSecretToken ?? '');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Мутация сохранения настроек запуска */
  const mutation = useMutation({
    mutationFn: ({ mode, url, secret }: { mode: string; url: string | null; secret: string | null }) =>
      updateLaunchSettings(projectId, tokenId, mode, url, secret),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Перезапустите бота чтобы применить изменения' });
    },
  });

  /** Debounce-сохранение при изменении текстовых полей webhook (только без pending) */
  useEffect(() => {
    if (onPendingChange) return;
    if (localMode !== 'webhook') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutation.mutate({ mode: localMode, url: localBaseUrl || null, secret: localSecret || null });
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localBaseUrl, localSecret]);

  /** Обработчик смены режима — сохраняет немедленно или через pending */
  function handleModeChange(value: LaunchMode) {
    setLocalMode(value);
    if (onPendingChange) {
      onPendingChange('LAUNCH_MODE', value);
    } else {
      mutation.mutate({ mode: value, url: localBaseUrl || null, secret: localSecret || null });
    }
  }

  const webhookPreview = buildWebhookPreview(localBaseUrl, projectId, tokenId);

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
                onChange={(e) => {
                  setLocalBaseUrl(e.target.value);
                  if (onPendingChange) onPendingChange('WEBHOOK_BASE_URL', e.target.value);
                }}
                placeholder="https://example.com"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`webhook-secret-${tokenId}`} className="text-xs">Secret token</Label>
              <Input
                id={`webhook-secret-${tokenId}`}
                value={localSecret}
                onChange={(e) => {
                  setLocalSecret(e.target.value);
                  if (onPendingChange) onPendingChange('WEBHOOK_SECRET_TOKEN', e.target.value);
                }}
                placeholder="Секретный токен"
                className="h-8 text-xs"
              />
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
