/**
 * @fileoverview Инлайн-форма dev-входа по Telegram ID
 * @module components/editor/auth/AuthDevForm
 */

import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { queryClient } from '@/queryClient';
import { invalidateAuthQueries } from '@/utils/invalidate-auth-queries';

/**
 * Форма входа по Telegram ID для dev-режима.
 * Отправляет POST /api/auth/dev-login и логинит пользователя без popup.
 *
 * @returns JSX элемент формы
 */
export function AuthDevForm() {
  const [telegramId, setTelegramId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        const user = data.user;
        // Сохраняем в localStorage и оповещаем все экземпляры хука
        localStorage.setItem('telegramUser', JSON.stringify(user));
        invalidateAuthQueries(queryClient);
        window.dispatchEvent(new CustomEvent('telegram-auth-change', { detail: { user } }));
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
      <p className="text-xs text-amber-500 text-center">
        ⚠️ Dev-режим: введите ваш Telegram ID
      </p>
      <Input
        type="number"
        placeholder="Ваш Telegram ID"
        value={telegramId}
        onChange={e => setTelegramId(e.target.value)}
        disabled={isLoading}
        className="text-center"
      />
      <Button
        type="submit"
        disabled={isLoading}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
        Войти
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Узнать ID:{' '}
        <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline">
          @userinfobot
        </a>
      </p>
    </form>
  );
}
