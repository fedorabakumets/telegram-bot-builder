/**
 * @fileoverview Сводная страница панели управления
 * @module components/admin/pages/admin-overview
 */

import { Link } from 'wouter';
import { Settings, Wrench, BookOpen, Blocks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAdminSettings } from '../hooks/use-admin-settings';
import { getAdminDocNavItems } from '../sidebar/nav-items';
import { AdminVersionCard } from './admin-version-card';

/**
 * Сводка состояния платформы и быстрые переходы
 * @returns JSX элемент сводной страницы
 */
export function AdminOverview() {
  const { data: settings, isLoading } = useAdminSettings();
  const docLinks = getAdminDocNavItems();

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const loginLabel =
    settings.auth.loginMode === 'dev_login' ? 'Dev-login' : 'Telegram Login Widget';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Сводка</h1>
        <p className="text-muted-foreground mt-1">Состояние платформы и быстрые переходы</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 items-start">
        <AdminVersionCard />

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Способ входа</CardDescription>
            <CardTitle className="text-lg">{loginLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={settings.configured ? 'default' : 'secondary'}>
              {settings.configured ? 'Настроено' : 'Требует настройки'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Telegram OIDC</CardDescription>
            <CardTitle className="text-lg">
              {settings.providers.telegram.configured ? 'Готово' : 'Не заполнено'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Client ID: {settings.providers.telegram.clientId || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Настройки приложения
            </Button>
          </Link>
          <Link href="/admin/node-types">
            <Button variant="outline" className="gap-2">
              <Blocks className="h-4 w-4" />
              Типы блоков
            </Button>
          </Link>
          <Link href="/admin/maintenance">
            <Button variant="outline" className="gap-2">
              <Wrench className="h-4 w-4" />
              Обслуживание
            </Button>
          </Link>
          <Link href="/admin/docs">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Документация API
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Документация</CardTitle>
          <CardDescription>Схема БД, справочник API и служебные страницы</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {docLinks.map((link) => (
            <Link
              key={link.href}
              href={`/admin${link.href}`}
              className="text-sm text-primary hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
