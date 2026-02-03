import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TelegramLoginWidget } from '@/components/telegram-login-widget';

/**
 * Свойства компонента LoginModal
 * @interface LoginModalProps
 * @property {boolean} open - Состояние открытия модального окна
 * @property {Function} onOpenChange - Коллбэк для изменения состояния открытия
 */
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Компонент модального окна для входа в систему через Telegram
 *
 * Предоставляет интерфейс для аутентификации пользователя через
 * Telegram с использованием компонента TelegramLoginWidget.
 * Автоматически закрывается при успешной авторизации.
 *
 * @param {LoginModalProps} props - Свойства компонента
 * @returns {JSX.Element} Модальное окно для входа в систему
 *
 * @example
 * ```tsx
 * <LoginModal open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */
export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  useEffect(() => {
    // Слушаем на успешную авторизацию через Telegram
    const handleAuthChange = () => {
      // Закрываем модал при успешной авторизации
      onOpenChange(false);
    };

    if (open) {
      window.addEventListener('telegram-auth-change', handleAuthChange);
      return () => {
        window.removeEventListener('telegram-auth-change', handleAuthChange);
      };
    }
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Вход в BotCraft Studio</DialogTitle>
          <DialogDescription>
            Используйте свой аккаунт Telegram для входа
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <TelegramLoginWidget />
        </div>
      </DialogContent>
    </Dialog>
  );
}
