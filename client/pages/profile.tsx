/**
 * @fileoverview Профиль текущего пользователя в account-level области
 * @module pages/profile
 */

import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { CreditCard, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { AppSidebar } from '@/components/editor/app-sidebar';
import { ActiveSessionsCard } from '@/components/profile/active-sessions-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { useSidebarState } from '@/components/editor/app-sidebar/hooks/use-sidebar-state';
import { isTelegramUser } from '@/types/telegram-user';
import { apiRequest } from '@/queryClient';
import type { BotProject } from '@shared/schema';

/**
 * Форматирует дату профиля для пользовательского интерфейса
 * @param value - Дата или пустое значение
 * @returns Локализованная дата
 */
function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Показывает профиль пользователя и его проекты
 * @returns JSX элемент страницы профиля
 */
export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { isCollapsed: isSidebarCollapsed, toggleCollapsed } = useSidebarState();
  const { user, logout } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();
  const telegramUser = user && isTelegramUser(user) ? user : null;
  const { data: projects = [], isLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects/list', 'profile'],
    queryFn: () => apiRequest('GET', '/api/projects/list?archived=false'),
    enabled: Boolean(telegramUser),
  });
  const ownedProjects = projects.filter((project) => project.ownerId === Number(telegramUser.id));
  const memberProjects = projects.filter((project) => project.ownerId !== Number(telegramUser.id));

  if (!telegramUser) {
    return <div className="flex min-h-screen items-center justify-center"><Button onClick={handleTelegramLogin}>Войти через Telegram</Button></div>;
  }

  return (
    <div className="app-viewport flex min-h-screen bg-background">
      <AppSidebar
        projectName={projects[0]?.name || 'BotCraft Studio'}
        currentTab={undefined}
        onTabChange={(tab) => {
          if (projects[0]) setLocation(`/editor/${projects[0].id}?tab=${tab}`);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div><p className="mb-2 text-sm font-medium text-primary">Аккаунт</p><h1 className="text-3xl font-bold tracking-tight">Мой профиль</h1><p className="mt-2 text-muted-foreground">Личные данные, проекты и настройки аккаунта</p></div>
          <Card className="overflow-hidden border-border/70">
            <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-center text-xl font-semibold leading-[4rem] text-white ring-4 ring-primary/10">
                  {telegramUser.photoUrl ? <img src={telegramUser.photoUrl} alt="Профиль" className="h-full w-full object-cover" /> : telegramUser.firstName?.[0] || '?'}
                </div>
                <div><h2 className="text-xl font-semibold">{telegramUser.firstName} {telegramUser.lastName || ''}</h2><p className="text-sm text-muted-foreground">{telegramUser.username ? `@${telegramUser.username}` : 'Telegram-профиль'}</p><p className="mt-1 text-xs text-muted-foreground">ID: {telegramUser.id}</p></div>
              </div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={handleTelegramLogin}><RefreshCw className="mr-2 h-4 w-4" />Сменить аккаунт</Button><Button variant="ghost" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Выйти</Button></div>
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6"><Card className="border-border/70"><CardHeader><CardTitle>Проекты во владении</CardTitle></CardHeader><CardContent>{isLoading ? <p className="text-sm text-muted-foreground">Загрузка проектов...</p> : ownedProjects.length === 0 ? <p className="text-sm text-muted-foreground">Нет проектов.</p> : <div className="divide-y divide-border/60">{ownedProjects.map((project) => <div key={project.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-semibold">{project.name}</p><p className="text-sm text-muted-foreground">Создан {formatDate(project.createdAt)} · изменён {formatDate(project.updatedAt)}</p></div><Link href={`/editor/${project.id}`} className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline">Открыть <ExternalLink className="h-3.5 w-3.5" /></Link></div>)}</div>}</CardContent></Card><Card className="border-border/70"><CardHeader><CardTitle>Участник проектов</CardTitle></CardHeader><CardContent>{isLoading ? <p className="text-sm text-muted-foreground">Загрузка проектов...</p> : memberProjects.length === 0 ? <p className="text-sm text-muted-foreground">Нет проектов, где вы участник.</p> : <div className="divide-y divide-border/60">{memberProjects.map((project) => <div key={project.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-semibold">{project.name}</p><p className="text-sm text-muted-foreground">Создан {formatDate(project.createdAt)} · изменён {formatDate(project.updatedAt)}</p></div><Link href={`/editor/${project.id}`} className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline">Открыть <ExternalLink className="h-3.5 w-3.5" /></Link></div>)}</div>}</CardContent></Card></div>
            <div className="hidden"><Card className="border-border/70"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Тариф и лимиты</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div><p className="font-semibold">Free</p><p className="text-xs text-muted-foreground">Базовый доступ</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Активен</span></div><div className="mt-4 space-y-3">{['Проекты — 1 из 1', 'Пользователи — 0 из 100', 'Сообщения — 0 из 1 000'].map((item) => <div key={item}><div className="flex justify-between text-xs text-muted-foreground"><span>{item}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full w-1/12 rounded-full bg-primary" /></div></div>)}</div><Button variant="outline" className="mt-4 w-full" disabled>Сравнить тарифы</Button></CardContent></Card></div>
          </div>
          <ActiveSessionsCard />
        </div>
      </main>
    </div>
  );
}
