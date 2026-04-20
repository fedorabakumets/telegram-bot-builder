/**
 * @fileoverview Блок выбора режима запуска бота и будущих webhook-настроек
 * @module components/editor/bot/card/BotLaunchSettings
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, KeyRound, Link2, Rocket, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/utils';

/** Режим запуска бота */
type LaunchMode = 'polling' | 'webhook';

/** Свойства блока выбора режима запуска */
interface BotLaunchSettingsProps {
  /** ID токена, нужен для генерации локального webhook-path */
  tokenId: number;
  /** Дополнительный CSS-класс */
  className?: string;
}

/**
 * Формирует пример URL вебхука для будущего подключения.
 * @param baseUrl - Базовый адрес сервера
 * @param path - Путь webhook
 * @returns Составленный URL или пустую строку
 */
function buildWebhookPreview(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPath = path.trim().replace(/^\/+/, '');
  if (!normalizedBase && !normalizedPath) return '';
  if (!normalizedBase) return `/${normalizedPath}`;
  if (!normalizedPath) return normalizedBase;
  return `${normalizedBase}/${normalizedPath}`;
}

/**
 * Блок выбора режима запуска бота и будущих webhook-настроек.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotLaunchSettings({ tokenId, className }: BotLaunchSettingsProps) {
  const [launchMode, setLaunchMode] = useState<LaunchMode>('polling');
  const [baseUrl, setBaseUrl] = useState('https://example.com');
  const [webhookPath, setWebhookPath] = useState(`/api/webhooks/telegram/${tokenId}`);
  const [secretToken, setSecretToken] = useState('');
  const webhookPreview = buildWebhookPreview(baseUrl, webhookPath);

  return (
    <div className={cn('space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Режим запуска</h3>
          </div>
          <p className="text-xs text-muted-foreground">Пока настройка живет только в интерфейсе.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <Badge variant="outline" className="text-[11px]">UI only</Badge>
          <Badge variant="secondary" className="text-[11px]">Скоро</Badge>
        </div>
      </div>

      <RadioGroup value={launchMode} onValueChange={(value) => setLaunchMode(value as LaunchMode)} className="grid gap-2 sm:grid-cols-2">
        {[
          { value: 'polling' as const, title: 'Polling', description: 'Обычный запуск через polling.', icon: Globe },
          { value: 'webhook' as const, title: 'Webhook', description: 'Будущий запуск через входящий webhook.', icon: Link2 },
        ].map(({ value, title, description, icon: Icon }) => (
          <div
            key={value}
            className={cn('flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors', launchMode === value ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-background/60')}
            onClick={() => setLaunchMode(value)}
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

      {launchMode === 'webhook' && (
        <div className="space-y-3 rounded-md border border-dashed border-border/70 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Поля ниже пока не отправляются в backend и нужны для будущей схемы.</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`webhook-base-url-${tokenId}`}>Базовый URL</Label>
              <Input id={`webhook-base-url-${tokenId}`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://example.com" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`webhook-path-${tokenId}`}>Webhook path</Label>
              <Input id={`webhook-path-${tokenId}`} value={webhookPath} onChange={(e) => setWebhookPath(e.target.value)} placeholder="/api/webhooks/telegram/123" className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`webhook-secret-${tokenId}`}>Secret token</Label>
            <Input id={`webhook-secret-${tokenId}`} value={secretToken} onChange={(e) => setSecretToken(e.target.value)} placeholder="Локальный placeholder для будущей защиты" className="h-9 text-xs" />
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Webhook URL</span>
            </div>
            <p className="mt-1 break-all">{webhookPreview || 'Будет собран из базового URL и path'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
