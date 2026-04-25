/**
 * @fileoverview Кнопка входа через Telegram для экрана авторизации
 * @module components/editor/auth/AuthTelegramButton
 */

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Свойства кнопки авторизации через Telegram
 */
export interface AuthTelegramButtonProps {
  /** Обработчик нажатия на кнопку */
  onClick: () => void;
  /** Флаг состояния загрузки — показывает спиннер вместо иконки */
  isLoading?: boolean;
}

/**
 * Кнопка "Войти через Telegram" для экрана авторизации.
 * Использует синий градиент в стиле хедера приложения.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки
 */
export function AuthTelegramButton({ onClick, isLoading }: AuthTelegramButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="lg"
      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : (
        <MessageCircle className="h-5 w-5 mr-2" />
      )}
      Войти через Telegram
    </Button>
  );
}
