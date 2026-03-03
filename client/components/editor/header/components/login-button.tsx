/**
 * @fileoverview Кнопка входа
 * @description Кнопка для входа через Telegram
 */

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Свойства кнопки входа
 */
export interface LoginButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Кнопка входа через Telegram
 */
export function LoginButton({ onClick, className }: LoginButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className={`bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 ${className || ''}`}
      title="Войти через Telegram"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      <span>Вход</span>
    </Button>
  );
}
