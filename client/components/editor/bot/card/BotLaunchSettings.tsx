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

/** Режим запуска бота */
type LaunchMode = 'polling' | 'webhook';

/** Свойства блока выбора режима запуска */
interface BotLaunchSettingsProps {
  /** ID токена */
  tokenId: number;
  /** ID проекта */
  projectId: number;
  /** Текущий режим запуска из БД */
  launchMode: string | null;
  /** Базовый URL для webhook из БД */
  webhookBaseUrl: string | null;
  /** Секретный токен webhook из БД */
  webhookSecretToken: string | null;
  /** Дополнительный CSS-класс */
  className?: string;
}

/**
 * Отправляет запрос на обновление настроек режима запуска
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param launchMode - Режим запуска
 * @param webhookBaseUrl - Базовый URL webhook
 * @param webhookSecretToken - Секретный токен webhook
 */
async function updateLaunchSettings(
  projectId: number,
  tokenId: number,
  launchMode: string,
  webhookBaseUrl: string | null,
  webhookSecretToken: string | null,
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/launch-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ launchMode, webhookBaseUrl, webhookSecretToken }),
  });
  if (!res.ok) throw new Error('Ошибка обновления настроек запуска');
}

/**
 * Формирует предпросмотр полного webhook URL
 * @param baseUrl - Базовый адрес сервера
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Составленный URL
 */
function buildWebhookPreview(baseUrl: string, projectId: number, tokenId: number): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  if (!normalized) return `/api/webhook/${projectId}/${tokenId}`;
  return `${normalized}/api/webhook/${projectId}/${tokenId}`;
}

/**
 * Блок выбора режима запуска бота с сохранением в БД
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotLaunchSettings({
  tokenId,
  projectId,
  launchMode,
  webhookBaseUrl,
  webhookSecretToken,
  className,
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

  /** Debounce-сохранение при изменении текстовых полей webhook */
  useEffect(() => {
    if (localMode !== 'webhook') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutation.mutate({
        mode: localMode,
        url: localBaseUrl || null,
        secret: localSecret || null,
      });
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localBaseUrl, localSecret]);

  /** Обработчик смены режима — сохраняет немедленно */
  function handleModeChange(value: LaunchMode) {
    setLocalMode(value);
    mutation.mutate({
      mode: value,
      url: localBaseUrl || null,
      secret: localSecret || null,
    });
  }

  const webhookPreview = buildWebhookPreview(localBaseUrl, projectId, tokenId);

  return (
    <div className={cn('space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4', className)}>
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Режим запуска</h3>
      </div>

      <RadioGroup
        value={localMode}
        onValueChange={(v) => handleModeChange(v as LaunchMode)}
        className="grid gap-2 sm:grid-cols-2"
      >
        {([
          { value: 'polling' as const, title: 'Polling', description: 'Стандартный режим через long-polling.', icon: Globe },
          { value: 'webhook' as const, title: 'Webhook', description: 'Запуск через входящий webhook.', icon: Link2 },
        ] as const).map(({ value, title, description, icon: Icon }) => (
          <div
            key={value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
              localMode === value ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-background/60',
            )}
            onClick={() => handleModeChange(value)}
          >
            <RadioGroupItem value={value} id={`launch-mode-${value}-${tokenId}`} className="mt-0.5" />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{title}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </RadioGroup>

      {localMode === 'webhook' && (
        <div className="space-y-3 rounded-md border border-dashed border-border/70 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Настройки сохраняются в БД и применяются при следующем запуске.</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`webhook-base-url-${tokenId}`}>Базовый URL</Label>
            <Input
              id={`webhook-base-url-${tokenId}`}
              value={localBaseUrl}
              onChange={(e) => setLocalBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`webhook-secret-${tokenId}`}>Secret token</Label>
            <Input
              id={`webhook-secret-${tokenId}`}
              value={localSecret}
              onChange={(e) => setLocalSecret(e.target.value)}
              placeholder="Секретный токен для верификации запросов"
              className="h-9 text-xs"
            />
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Webhook URL</span>
            </div>
            <p className="mt-1 break-all">{webhookPreview}</p>
          </div>
        </div>
      )}
    </div>
  );
}
