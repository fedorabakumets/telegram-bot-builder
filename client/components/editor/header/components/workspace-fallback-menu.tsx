/** @fileoverview Компактное меню навигации и действий редактора без боковой панели. */

import { Check, FolderOpen, LogIn, LogOut, Maximize, Menu, Minimize, RefreshCw, Save, Shield, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SIDEBAR_NAV_ITEMS } from '@/components/editor/app-sidebar/components/sidebar-nav';
import { useAppFullscreen } from '@/components/editor/app-sidebar/components/fullscreen-button';
import { useSetupBootstrap } from '@/components/editor/setup/hooks/use-setup';
import { isTelegramUser, type AppUser } from '@/types/telegram-user';
import { cn } from '@/utils/utils';
import type { HeaderTab } from '../types';

/** Свойства компактного меню рабочей области. */
interface WorkspaceFallbackMenuProps {
  /** Открытая вкладка проекта. */
  currentTab: HeaderTab;
  /** Переходит к выбранной вкладке проекта. */
  onTabChange: (tab: HeaderTab) => void;
  /** Открывает загрузку сценария. */
  onLoadTemplate?: () => void;
  /** Открывает сохранение сценария. */
  onSaveAsTemplate?: () => void;
  /** Пользователь, чья сессия загружена в общей шапке. */
  user: AppUser | null | undefined;
  /** Идёт ли проверка сессии. */
  isAuthLoading?: boolean;
  /** Открывает вход или смену аккаунта. */
  onLogin: () => void;
  /** Завершает текущую сессию. */
  onLogout: () => void;
  /** Дополнительные классы кнопки меню. */
  className?: string;
}

/**
 * Сохраняет доступ к разделам, действиям и аккаунту при скрытой боковой панели.
 * @param props - Активная вкладка и штатные действия редактора.
 * @returns Кнопка с компактным меню.
 */
export function WorkspaceFallbackMenu({
  currentTab, onTabChange, onLoadTemplate, onSaveAsTemplate, className,
  user, isAuthLoading, onLogin, onLogout,
}: WorkspaceFallbackMenuProps) {
  const { data } = useSetupBootstrap();
  const fullscreen = useAppFullscreen();
  const authenticated = user && isTelegramUser(user);
  const FullscreenIcon = fullscreen.active ? Minimize : Maximize;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn('shrink-0 gap-2', className)}>
          <Menu aria-hidden="true" />
          Меню
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" collisionPadding={8}
        className="w-60 max-w-[calc(100vw-1rem)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto">
        <DropdownMenuGroup aria-label="Разделы проекта">
          {[...SIDEBAR_NAV_ITEMS, { tab: 'agent' as const, label: 'Агент', icon: Sparkles }].map(({ tab, label, icon: Icon }) => (
            <DropdownMenuItem key={tab} aria-current={currentTab === tab ? 'page' : undefined}
              onSelect={() => onTabChange(tab)}>
              <Icon aria-hidden="true" /> {label}
              {currentTab === tab && <Check className="ml-auto" aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup aria-label="Действия редактора">
          {onLoadTemplate && <DropdownMenuItem onSelect={onLoadTemplate}><FolderOpen /> Загрузить сценарий</DropdownMenuItem>}
          {onSaveAsTemplate && <DropdownMenuItem onSelect={onSaveAsTemplate}><Save /> Сохранить сценарий</DropdownMenuItem>}
          {data?.adminEnabled && <DropdownMenuItem asChild><Link href="/admin"><Shield /> Админка</Link></DropdownMenuItem>}
          <DropdownMenuItem disabled={fullscreen.pending} onSelect={(event) => {
            event.preventDefault();
            void fullscreen.toggle();
          }}><FullscreenIcon /> {fullscreen.label}</DropdownMenuItem>
          {fullscreen.error && <p role="alert" className="px-2 py-1 text-xs text-destructive">{fullscreen.error}</p>}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup aria-label="Аккаунт">
          <DropdownMenuItem asChild><Link href="/profile"><UserRound /> Мой профиль</Link></DropdownMenuItem>
          {authenticated ? (
            <>
              <DropdownMenuItem onSelect={onLogin}><RefreshCw /> Сменить аккаунт</DropdownMenuItem>
              <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
                <LogOut /> Выйти
              </DropdownMenuItem>
            </>
          ) : <DropdownMenuItem disabled={isAuthLoading} onSelect={onLogin}>
            <LogIn /> Войти в Telegram
          </DropdownMenuItem>}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
