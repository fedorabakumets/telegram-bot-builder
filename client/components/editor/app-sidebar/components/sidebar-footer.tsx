/**
 * @fileoverview Футер сайдбара: переключатель темы и профиль пользователя
 */

import { LogOut, MessageCircle, PanelTop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/editor/header/components/theme-toggle';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { cn } from '@/utils/utils';
import { isTelegramUser } from '@/types/telegram-user';

/**
 * Пропсы компонента SidebarFooter
 */
interface SidebarFooterProps {
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
  /** Видима ли шапка */
  headerVisible?: boolean;
  /** Переключить видимость шапки */
  onToggleHeader?: () => void;
}

/**
 * Футер сайдбара с темой и авторизацией
 * @param props - Свойства компонента
 * @returns JSX элемент с переключателем темы и профилем
 */
export function SidebarFooter({ isCollapsed, headerVisible, onToggleHeader }: SidebarFooterProps) {
  const { user, logout } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();

  const isAuthed = user && isTelegramUser(user);

  return (
    <div className={cn('flex flex-col gap-2', isCollapsed && 'items-center')}>
      {onToggleHeader && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-muted-foreground transition-colors',
            headerVisible
              ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10'
              : 'hover:bg-muted/60'
          )}
          onClick={onToggleHeader}
          title={headerVisible ? 'Скрыть шапку' : 'Показать шапку'}
        >
          <PanelTop className="h-4 w-4" />
        </Button>
      )}
      <ThemeToggle />

      {isAuthed ? (
        <div className={cn('flex items-center gap-2', isCollapsed && 'justify-center')}>
          {/* Аватар пользователя */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">
              {(user as any).firstName?.[0] ?? '?'}
            </span>
          </div>
          {!isCollapsed && (
            <span className="text-sm text-foreground truncate flex-1">
              {(user as any).firstName}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2 h-9 px-2 text-muted-foreground hover:bg-muted/60',
            isCollapsed && 'justify-center px-0'
          )}
          onClick={handleTelegramLogin}
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Войти в Telegram</span>}
        </Button>
      )}
    </div>
  );
}
