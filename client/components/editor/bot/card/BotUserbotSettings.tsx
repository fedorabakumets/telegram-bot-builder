/**
 * @fileoverview Настройки Telethon userbot — включение, API ID, API Hash, Session String
 * @module BotUserbotSettings
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bot, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/** Пропсы компонента настроек юзербота */
interface BotUserbotSettingsProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Включён ли юзербот (1 — да, 0/null — нет) */
  userbotEnabled: number | null;
  /** API ID */
  userbotApiId: string | null;
  /** API Hash */
  userbotApiHash: string | null;
  /** Session string */
  userbotSessionString: string | null;
  /** Колбэк для pending */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Сохраняет настройки юзербота на сервере
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param data - Данные для сохранения
 */
async function updateUserbotSettings(
  projectId: number,
  tokenId: number,
  data: { userbotEnabled: number; userbotApiId: string | null; userbotApiHash: string | null; userbotSessionString: string | null },
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/userbot`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Ошибка сохранения настроек юзербота');
}

/**
 * Секция настроек Telethon userbot
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotUserbotSettings({
  projectId,
  tokenId,
  userbotEnabled,
  userbotApiId,
  userbotApiHash,
  userbotSessionString,
  onPendingChange,
}: BotUserbotSettingsProps) {
  const [enabled, setEnabled] = useState(userbotEnabled === 1);
  const [apiId, setApiId] = useState(userbotApiId ?? '');
  const [apiHash, setApiHash] = useState(userbotApiHash ?? '');
  const [sessionString, setSessionString] = useState(userbotSessionString ?? '');
  const [showHash, setShowHash] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /** Мутация сохранения настроек */
  const mutation = useMutation({
    mutationFn: () =>
      updateUserbotSettings(projectId, tokenId, {
        userbotEnabled: enabled ? 1 : 0,
        userbotApiId: apiId || null,
        userbotApiHash: apiHash || null,
        userbotSessionString: sessionString || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Настройки юзербота сохранены', description: 'Перезапустите бота для применения' });
    },
    onError: () => {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки юзербота', variant: 'destructive' });
    },
  });

  /** Обработчик переключения */
  function handleToggle(checked: boolean) {
    setEnabled(checked);
    if (onPendingChange) {
      onPendingChange('USERBOT_ENABLED', checked ? 'true' : 'false');
    }
  }

  /** Сохранение по blur */
  function handleSave() {
    if (onPendingChange) {
      onPendingChange('USERBOT_API_ID', apiId);
      onPendingChange('USERBOT_API_HASH', apiHash);
      onPendingChange('USERBOT_SESSION_STRING', sessionString);
    } else {
      mutation.mutate();
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 p-2.5 sm:p-3 rounded-lg border transition-all sm:col-span-2 ${
        enabled
          ? 'bg-violet-500/8 border-violet-500/30 dark:bg-violet-500/10 dark:border-violet-500/40'
          : 'bg-muted/40 border-border/50'
      }`}
    >
      {/* Заголовок + переключатель */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Bot
          className={`w-4 h-4 flex-shrink-0 ${
            enabled ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'
          }`}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={`userbot-toggle-${tokenId}`}
            className={`text-xs sm:text-sm font-semibold cursor-pointer block ${
              enabled ? 'text-violet-700 dark:text-violet-300' : 'text-muted-foreground'
            }`}
          >
            Telethon Userbot
          </Label>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {enabled
              ? 'Юзербот работает параллельно с основным ботом'
              : 'Подключить аккаунт пользователя через Telethon'}
          </p>
        </div>
        <Switch
          id={`userbot-toggle-${tokenId}`}
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={mutation.isPending}
        />
      </div>

      {/* Поля настроек (только когда включено) */}
      {enabled && (
        <div className="space-y-3 rounded-md border border-dashed border-violet-500/30 bg-background/70 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            <a
              href="https://my.telegram.org/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-violet-500 transition-colors"
            >
              Получить API ID и Hash на my.telegram.org
            </a>
          </div>

          {/* API ID */}
          <div className="space-y-1.5">
            <Label htmlFor={`userbot-api-id-${tokenId}`} className="text-xs">API ID</Label>
            <Input
              id={`userbot-api-id-${tokenId}`}
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
              onBlur={handleSave}
              placeholder="12345678"
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* API Hash */}
          <div className="space-y-1.5">
            <Label htmlFor={`userbot-api-hash-${tokenId}`} className="text-xs">API Hash</Label>
            <div className="relative">
              <Input
                id={`userbot-api-hash-${tokenId}`}
                type={showHash ? 'text' : 'password'}
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                onBlur={handleSave}
                placeholder="a1b2c3d4e5f6..."
                className="h-8 text-xs font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowHash(!showHash)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showHash ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Session String */}
          <div className="space-y-1.5">
            <Label htmlFor={`userbot-session-${tokenId}`} className="text-xs">Session String</Label>
            <div className="relative">
              <Input
                id={`userbot-session-${tokenId}`}
                type={showSession ? 'text' : 'password'}
                value={sessionString}
                onChange={(e) => setSessionString(e.target.value)}
                onBlur={handleSave}
                placeholder="1BVtsOH..."
                className="h-8 text-xs font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSession(!showSession)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSession ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Сгенерируйте через скрипт авторизации Telethon (StringSession)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
