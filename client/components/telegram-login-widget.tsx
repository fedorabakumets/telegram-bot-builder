import { useToast } from '@/hooks/use-toast';
import { useTelegramAuth, type TelegramUser } from '@/hooks/use-telegram-auth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

/**
 * Интерфейс информации о боте Telegram
 * @interface BotInfo
 * @property {string} first_name - Имя бота
 * @property {string} [username] - Имя пользователя бота (опционально)
 * @property {string} [description] - Описание бота (опционально)
 * @property {string} [short_description] - Короткое описание бота (опционально)
 */
interface BotInfo {
  first_name: string;
  username?: string;
  description?: string;
  short_description?: string;
}

/**
 * Свойства компонента TelegramLoginWidget
 * @interface TelegramLoginWidgetProps
 * @property {BotInfo | null} [botInfo] - Информация о боте (опционально)
 * @property {Function} [onAuth] - Коллбэк, вызываемый при успешной аутентификации (в настоящее время не используется в компоненте)
 * @property {Function} [onLogout] - Коллбэк, вызываемый при выходе из системы
 */
interface TelegramLoginWidgetProps {
  botInfo?: BotInfo | null;
  onAuth?: (user: TelegramUser) => void;
  onLogout?: () => void;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

/**
 * Компонент виджета входа через Telegram
 *
 * Предоставляет возможность аутентификации через Telegram с помощью
 * встроенного виджета авторизации. Отображает либо кнопку входа,
 * либо информацию о текущем пользователе с возможностью выхода.
 *
 * @param {TelegramLoginWidgetProps} props - Свойства компонента
 * @returns {JSX.Element | null} Компонент виджета входа или null, если не указан username бота
 *
 * @example
 * ```tsx
 * <TelegramLoginWidget
 *   botInfo={{ first_name: 'MyBot', username: 'my_bot' }}
 *   onAuth={(user) => console.log('Авторизован:', user)}
 *   onLogout={() => console.log('Выполнен выход')}
 * />
 * ```
 */
export function TelegramLoginWidget({ botInfo, onLogout }: TelegramLoginWidgetProps) {
  const { toast } = useToast();
  const { user, logout, isLoading } = useTelegramAuth();

  // Используем username бота из env или botInfo
  let botUsername = (import.meta as any).env.VITE_TELEGRAM_BOT_USERNAME || botInfo?.username;

  // Удаляем @ в начале если есть
  if (botUsername && botUsername.startsWith('@')) {
    botUsername = botUsername.slice(1);
  }

  // Если нет username, не показываем виджет
  if (!botUsername) {
    return null;
  }

  /**
   * Обработчик выхода пользователя из системы
   *
   * Выполняет выход пользователя, вызывает коллбэк onLogout,
   * если он предоставлен, и показывает уведомление.
   */
  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
    toast({
      title: "Выход",
      description: "Вы вышли из системы",
    });
  };

  /**
   * Обработчик входа через Telegram
   *
   * Открывает окно для аутентификации через Telegram.
   */
  const handleTelegramLogin = () => {
    // Открываем окно со встроенным Telegram Login Widget
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open('/api/auth/login', 'telegram_login', `width=${width},height=${height},left=${left},top=${top}`);
  };

  // NOTE: Обработка авторизации через postMessage перенесена в App.tsx
  // Это единственное место обработки чтобы избежать конфликтов

  // Пока загружаем состояние авторизации
  if (isLoading) {
    return null;
  }

  // Если пользователь авторизован, показываем его профиль
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{user.firstName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 px-2"
          title="Выход"
          data-testid="button-logout-telegram"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // Если не авторизован, показываем кнопку входа
  return (
    <Button
      onClick={handleTelegramLogin}
      className="bg-[#0088cc] hover:bg-[#0077b3] text-white"
      data-testid="button-telegram-login"
    >
      Вход через Telegram
    </Button>
  );
}
