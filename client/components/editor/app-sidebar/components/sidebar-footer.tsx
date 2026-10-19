/**
 * @fileoverview Футер сайдбара: профиль пользователя и кнопка шапки
 */

import * as React from 'react';
import { CreditCard, LogOut, MessageCircle, PanelTop, RefreshCw, UserRound, Users, Workflow } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
 * Футер сайдбара с профилем пользователя
 * @param props - Свойства компонента
 * @returns JSX элемент с профилем и кнопкой шапки
 */
export function SidebarFooter({ isCollapsed, headerVisible, onToggleHeader }: SidebarFooterProps) {
  const [location] = useLocation();
  const { user, logout } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();
  const [isLimitsOpen, setIsLimitsOpen] = React.useState(false);

  const isAuthed = user && isTelegramUser(user);
  const isProfileActive = location === '/profile';

  return (
    <div className={cn('flex flex-col gap-2', isCollapsed && 'items-center')}>
      {onToggleHeader && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'hidden h-8 w-8 text-muted-foreground transition-colors',
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

      <Link
        href="/profile"
        title="Мой профиль"
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border border-transparent px-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
          isProfileActive && 'border-primary/20 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-blue-600 hover:text-white',
          isCollapsed ? 'w-9 justify-center px-0' : 'w-full',
        )}
      >
        <UserRound className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="text-sm">Мой профиль</span>}
      </Link>

      {isAuthed ? (
        <>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'group flex w-full items-center gap-2 rounded-lg border border-transparent p-1 text-left transition-colors hover:border-blue-500/20 hover:bg-blue-500/5',
                isCollapsed ? 'justify-center' : '',
              )}
              title="Профиль пользователя"
              aria-label="Открыть профиль пользователя"
            >
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {(user as { firstName?: string }).firstName?.[0] ?? '?'}
              </span>
              {(user as { photoUrl?: string | null }).photoUrl && (
                <img
                  src={(user as { photoUrl: string }).photoUrl}
                  alt={(user as { firstName?: string }).firstName || 'Профиль'}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background bg-emerald-500" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {user.firstName || 'Пользователь'}
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-wide text-blue-500">Free</span>
              </div>
            )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-64">
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{user.firstName?.[0] ?? '?'}</span>
                  {user.photoUrl && <img src={user.photoUrl} alt="Профиль" className="absolute inset-0 h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.firstName || 'Пользователь'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.username ? `@${user.username}` : 'Telegram-профиль'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Текущий план</span>
                <span className="text-xs font-semibold text-blue-500">Free</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hidden" onSelect={() => setIsLimitsOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Тариф и лимиты
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleTelegramLogin}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Сменить аккаунт
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
          {isCollapsed && (
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <span className="rounded px-1 py-0.5 text-[9px] font-semibold leading-none text-blue-500/80 ring-1 ring-blue-500/20">
                Free
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={handleTelegramLogin}
                title="Сменить аккаунт"
                aria-label="Сменить аккаунт"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Dialog open={isLimitsOpen} onOpenChange={setIsLimitsOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Тариф и лимиты</DialogTitle>
              <DialogDescription>Текущий план — Free. Здесь появятся реальные данные после подключения backend.</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div><p className="font-semibold">Free</p><p className="text-xs text-muted-foreground">Для знакомства с конструктором</p></div>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600">Активен</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Проекты', value: '1 / 1', icon: Workflow },
                  { label: 'Пользователи ботов', value: '0 / 100', icon: Users },
                  { label: 'Сообщения в месяц', value: '0 / 1 000', icon: MessageCircle },
                  { label: 'Хранилище', value: '0 / 100 МБ', icon: CreditCard },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-lg border bg-background p-3">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-xs">{label}</span></div>
                    <p className="text-sm font-semibold">{value}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/12 rounded-full bg-blue-500" /></div>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => setIsLimitsOpen(false)}>Сравнить тарифы</Button>
          </DialogContent>
          </Dialog>
        </>
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
