/**
 * @fileoverview Компонент кнопки повторной отправки кода через SMS
 *
 * Предоставляет кнопку для запроса кода подтверждения через SMS
 * вместо уведомления в приложении Telegram.
 *
 * @module TelegramSmsResendButton
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Пропсы компонента кнопки SMS
 */
interface TelegramSmsResendButtonProps {
  /** Номер телефона */
  phoneNumber: string;
  /** Хеш текущего кода */
  phoneCodeHash: string;
  /** ID проекта */
  projectId?: number;
  /** Флаг активности кнопки */
  disabled?: boolean;
}

/**
 * Кнопка запроса кода через SMS
 *
 * @param {TelegramSmsResendButtonProps} props - Пропсы компонента
 * @returns {JSX.Element} Кнопка отправки SMS
 */
export function TelegramSmsResendButton({ 
  phoneNumber, 
  phoneCodeHash, 
  projectId,
  disabled = false 
}: TelegramSmsResendButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Отправка запроса на повторную отправку кода через SMS
   */
  const handleSmsResend = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/telegram-auth/resend-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          phoneCodeHash,
          projectId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'SMS отправлено',
          description: 'Код подтверждения отправлен через SMS',
        });
      } else {
        const errorMsg = data.error || response.statusText || 'Неизвестная ошибка';
        toast({
          title: 'Ошибка',
          description: errorMsg,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка сети',
        description: 'Проверьте подключение к интернету',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSmsResend}
      disabled={disabled || isLoading || !phoneCodeHash}
      className="w-full gap-2"
      size="sm"
    >
      <MessageSquare className="h-4 w-4" />
      {isLoading ? 'Отправляем...' : 'Получить код через SMS'}
    </Button>
  );
}
