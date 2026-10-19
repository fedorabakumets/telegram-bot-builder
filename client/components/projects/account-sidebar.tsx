/**
 * @fileoverview Навигация аккаунта для страницы проектов
 * @module components/projects/account-sidebar
 */

import { Bot, FolderKanban, LayoutTemplate, Settings, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/editor/header/components/theme-toggle';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { isTelegramUser } from '@/types/telegram-user';
import { cn } from '@/utils/utils';

/** Свойства боковой навигации аккаунта */
export interface AccountSidebarProps {
  /** Активный раздел аккаунта */
  activeSection?: 'projects' | 'templates' | 'billing' | 'settings' | 'profile';
}

/**
 * Показывает глобальную навигацию аккаунта вне выбранного проекта
 * @param props - Свойства навигации
 * @returns JSX элемент
 */
export function AccountSidebar({ activeSection = 'projects' }: AccountSidebarProps) {
  const { user } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();
  const telegramUser = user && isTelegramUser(user) ? user : null;
  const items = [
    { id: 'projects' as const, label: 'Проекты', icon: FolderKanban, href: '/projects' },
    { id: 'templates' as const, label: 'Шаблоны', icon: LayoutTemplate, href: '/templates' },
    { id: 'billing' as const, label: 'Тариф и лимиты', icon: Sparkles, href: '/projects' },
    { id: 'settings' as const, label: 'Настройки', icon: Settings, href: '/projects' },
    { id: 'profile' as const, label: 'Мой профиль', icon: UserRound, href: '/profile' },
  ];

  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-border/60 bg-card/40 sm:w-[72px]">
      <Link href="/projects" className="flex h-16 items-center justify-center border-b border-border/60">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Bot className="h-5 w-5" />
        </span>
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-2 p-3" aria-label="Навигация аккаунта">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeSection;
          return (
            <Link key={item.id} href={item.href}>
              <span
                title={item.label}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-primary/10 text-primary shadow-sm',
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-3 border-t border-border/60 p-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleTelegramLogin}
          title={telegramUser?.firstName || 'Войти через Telegram'}
          className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-semibold text-white ring-2 ring-primary/20"
        >
          {telegramUser?.photoUrl ? (
            <img src={telegramUser.photoUrl} alt="Профиль" className="h-full w-full object-cover" />
          ) : (
            telegramUser?.firstName?.[0] || '?'
          )}
        </button>
      </div>
    </aside>
  );
}
