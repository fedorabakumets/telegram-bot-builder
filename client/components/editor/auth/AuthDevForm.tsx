/**
 * @fileoverview Инлайн-форма dev-входа по Telegram ID
 * @module components/editor/auth/AuthDevForm
 */

import { useCallback, useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { TypewriterDialogue } from './TypewriterDialogue';
import { cn } from '@/utils/utils';

/** Документация: шаг 10 — Telegram Login / SKIP_AUTH */
const INSTALL_AUTH_DOCS =
  'https://fedorabakumets.github.io/telegram-bot-builder/docs/development/INSTALLATION#:~:text=%D0%A8%D0%B0%D0%B3%2010%3A%20%D0%9D%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0,NODE_ENV%3Ddevelopment';

/** Реплики проводника в dev-режиме */
const DEV_LINES = [
  { text: 'У вас тут включён dev-режим.' },
  { text: 'Не пугайтесь — просто введите свой Telegram ID ниже.' },
  {
    text: 'Нужен вход через виджет Telegram? SKIP_AUTH=false в .env — детали в',
    link: { href: INSTALL_AUTH_DOCS, label: 'руководстве по установке' },
  },
];

/**
 * Форма входа по Telegram ID для dev-режима.
 * Отправляет POST /api/auth/dev-login и синхронизирует клиентскую сессию.
 *
 * @returns JSX элемент формы
 */
export function AuthDevForm() {
  const [telegramId, setTelegramId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { toast } = useToast();
  const { acceptSession } = useTelegramAuth();

  const handleLineDone = useCallback((index: number) => {
    if (index === 0) setShowForm(true);
  }, []);

  const handleAllDone = useCallback(() => setShowHint(true), []);

  /**
   * Обрабатывает отправку формы — вызывает dev-login API
   * @param e - событие формы
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(telegramId, 10);
    if (!id) {
      toast({ title: 'Введите Telegram ID', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, firstName: 'Dev', username: `dev_${id}` }),
      });
      const data = await resp.json();
      if (data.success && data.user) {
        await acceptSession(data.user, Boolean(data.switched));
      } else {
        toast({ title: 'Ошибка входа', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка входа', description: 'Не удалось выполнить dev-login', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
        <TypewriterDialogue
          lines={DEV_LINES}
          startDelayMs={120}
          gapMs={380}
          speedMs={28}
          lineClassName="text-xs text-amber-600 dark:text-amber-400"
          onLineDone={handleLineDone}
          onAllDone={handleAllDone}
        />
      </div>

      <div
        className={cn(
          'space-y-3 transition-all duration-500',
          showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none h-0 overflow-hidden',
        )}
      >
        <Input
          type="number"
          placeholder="Ваш Telegram ID"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          disabled={isLoading || !showForm}
          className="text-center"
        />
        <Button
          type="submit"
          disabled={isLoading || !showForm}
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
          Войти
        </Button>
      </div>

      <p
        className={cn(
          'text-xs text-muted-foreground text-center transition-opacity duration-500',
          showHint ? 'opacity-100' : 'opacity-0',
        )}
      >
        Узнать ID:{' '}
        <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline">
          @userinfobot
        </a>
      </p>
    </form>
  );
}
