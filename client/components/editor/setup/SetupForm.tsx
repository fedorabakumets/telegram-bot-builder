/**
 * @fileoverview Форма первоначальной настройки Telegram-интеграции
 *
 * В dev-режиме отображает кнопку "Пропустить" для обхода обязательной настройки.
 *
 * @module components/editor/setup/SetupForm
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSetupMutation, type SetupPayload } from './hooks/use-setup';

/** true если приложение запущено в dev-режиме (Vite) */
const isDev = import.meta.env.DEV;

/**
 * Свойства компонента SetupForm
 */
interface SetupFormProps {
  /** Колбэк, вызываемый после успешного сохранения настроек */
  onSuccess: () => void;
}

/**
 * Форма настройки Telegram-интеграции.
 * Содержит поля для Client ID, Client Secret, Bot Username и Bot Token.
 * При успехе вызывает onSuccess, при ошибке показывает toast.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент формы настройки
 */
export function SetupForm({ onSuccess }: SetupFormProps) {
  const { toast } = useToast();
  const mutation = useSetupMutation();

  const [form, setForm] = useState<SetupPayload>({
    telegramClientId: '',
    telegramClientSecret: '',
    telegramBotUsername: '',
    telegramBotToken: '',
  });

  /** Обновляет поле формы по имени */
  const handleChange = (field: keyof SetupPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  /** Обрабатывает отправку формы */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SetupPayload = { ...form };
    if (!payload.telegramBotToken) delete payload.telegramBotToken;

    mutation.mutate(payload, {
      onSuccess: () => onSuccess(),
      onError: (err) =>
        toast({
          title: 'Ошибка сохранения',
          description: err.message || 'Не удалось сохранить настройки',
          variant: 'destructive',
        }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="clientId">Telegram Client ID</Label>
        <Input
          id="clientId"
          type="text"
          placeholder="123456789"
          value={form.telegramClientId}
          onChange={handleChange('telegramClientId')}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientSecret">Telegram Client Secret</Label>
        <Input
          id="clientSecret"
          type="password"
          placeholder="••••••••••••••••"
          value={form.telegramClientSecret}
          onChange={handleChange('telegramClientSecret')}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="botUsername">Bot Username</Label>
        <Input
          id="botUsername"
          type="text"
          placeholder="mybotname (без @)"
          value={form.telegramBotUsername}
          onChange={handleChange('telegramBotUsername')}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="botToken">Bot Token</Label>
        <Input
          id="botToken"
          type="password"
          placeholder="Опционально — для Mini App"
          value={form.telegramBotToken}
          onChange={handleChange('telegramBotToken')}
        />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить и продолжить
      </Button>
      {isDev && (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground text-xs"
          onClick={onSuccess}
        >
          Пропустить (только для разработки)
        </Button>
      )}
    </form>
  );
}
