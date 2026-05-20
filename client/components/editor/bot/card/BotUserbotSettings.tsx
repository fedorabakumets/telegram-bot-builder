/**
 * @fileoverview Настройки Telethon userbot с пошаговой авторизацией
 * Шаги: ввод телефона → код → (2FA пароль) → готово
 * @module BotUserbotSettings
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/** Шаги авторизации */
type AuthStep = 'idle' | 'phone' | 'code' | '2fa' | 'done';

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
 * Сохраняет базовые настройки юзербота (вкл/выкл, api_id, api_hash)
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
 * Секция настроек Telethon userbot с пошаговой авторизацией
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
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<AuthStep>(userbotSessionString ? 'done' : 'idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /** Мутация сохранения базовых настроек */
  const saveMutation = useMutation({
    mutationFn: () =>
      updateUserbotSettings(projectId, tokenId, {
        userbotEnabled: enabled ? 1 : 0,
        userbotApiId: apiId || null,
        userbotApiHash: apiHash || null,
        userbotSessionString: userbotSessionString,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    },
  });

  /** Обработчик переключения */
  function handleToggle(checked: boolean) {
    setEnabled(checked);
    if (onPendingChange) {
      onPendingChange('USERBOT_ENABLED', checked ? 'true' : 'false');
    }
  }

  /** Шаг 1: отправка кода на телефон */
  async function handleSendCode() {
    if (!apiId || !apiHash || !phone) {
      setError('Заполните все поля');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/userbot/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId, apiHash, phone }),
      });
      const data = await res.json();

      if (data.ok) {
        setStep('code');
        toast({ title: 'Код отправлен', description: 'Проверьте Telegram или SMS' });
      } else {
        setError(data.message || 'Ошибка отправки кода');
      }
    } catch (e: any) {
      setError(e.message || 'Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  }

  /** Шаг 2: ввод кода */
  async function handleSignIn() {
    if (!code) {
      setError('Введите код');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/userbot/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (data.ok && data.session_string) {
        setStep('done');
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
        toast({ title: 'Авторизация успешна!', description: 'Session string сохранён' });
      } else if (data.ok && data.needs_2fa) {
        setStep('2fa');
      } else {
        setError(data.message || 'Неверный код');
      }
    } catch (e: any) {
      setError(e.message || 'Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  }

  /** Шаг 3: ввод 2FA пароля */
  async function handleSign2fa() {
    if (!password) {
      setError('Введите пароль');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/userbot/sign-in-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.ok && data.session_string) {
        setStep('done');
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
        toast({ title: 'Авторизация успешна!', description: 'Session string сохранён' });
      } else {
        setError(data.message || 'Неверный пароль');
      }
    } catch (e: any) {
      setError(e.message || 'Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  }

  /** Сброс авторизации для повторной */
  function handleReset() {
    setStep('idle');
    setCode('');
    setPassword('');
    setError('');
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
        />
      </div>

      {/* Контент при включении */}
      {enabled && (
        <div className="space-y-3 rounded-md border border-dashed border-violet-500/30 bg-background/70 p-3">
          {/* Ссылка на my.telegram.org */}
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

          {/* API ID + API Hash (всегда видны) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`ub-api-id-${tokenId}`} className="text-xs">API ID</Label>
              <Input
                id={`ub-api-id-${tokenId}`}
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                onBlur={() => saveMutation.mutate()}
                placeholder="12345678"
                className="h-8 text-xs font-mono"
                disabled={step === 'done'}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`ub-api-hash-${tokenId}`} className="text-xs">API Hash</Label>
              <Input
                id={`ub-api-hash-${tokenId}`}
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                onBlur={() => saveMutation.mutate()}
                placeholder="a1b2c3d4e5f6..."
                className="h-8 text-xs font-mono"
                disabled={step === 'done'}
              />
            </div>
          </div>

          {/* Шаг: ввод телефона */}
          {(step === 'idle' || step === 'phone') && (
            <div className="space-y-2">
              <Label htmlFor={`ub-phone-${tokenId}`} className="text-xs">Номер телефона</Label>
              <div className="flex gap-2">
                <Input
                  id={`ub-phone-${tokenId}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+79001234567"
                  className="h-8 text-xs font-mono flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleSendCode}
                  disabled={loading || !apiId || !apiHash || !phone}
                  className="h-8 text-xs"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Отправить код'}
                </Button>
              </div>
            </div>
          )}

          {/* Шаг: ввод кода */}
          {step === 'code' && (
            <div className="space-y-2">
              <Label htmlFor={`ub-code-${tokenId}`} className="text-xs">
                Код из Telegram / SMS
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`ub-code-${tokenId}`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="12345"
                  className="h-8 text-xs font-mono flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSignIn}
                  disabled={loading || !code}
                  className="h-8 text-xs"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Подтвердить'}
                </Button>
              </div>
            </div>
          )}

          {/* Шаг: ввод 2FA пароля */}
          {step === '2fa' && (
            <div className="space-y-2">
              <Label htmlFor={`ub-2fa-${tokenId}`} className="text-xs">
                Пароль двухфакторной аутентификации
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`ub-2fa-${tokenId}`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ваш 2FA пароль"
                  className="h-8 text-xs flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSign2fa}
                  disabled={loading || !password}
                  className="h-8 text-xs"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Войти'}
                </Button>
              </div>
            </div>
          )}

          {/* Шаг: авторизация завершена */}
          {step === 'done' && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Аккаунт авторизован
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 text-xs text-muted-foreground"
              >
                Переавторизовать
              </Button>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
