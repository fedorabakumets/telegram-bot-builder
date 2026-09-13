/**
 * @fileoverview Пункты бокового меню панели управления
 * @module components/admin/sidebar/nav-items
 */

import {
  LayoutDashboard,
  Settings,
  Wrench,
  BookOpen,
  Database,
  FileText,
  HeartPulse,
  Braces,
  Users,
  Blocks,
} from 'lucide-react';

/** Внутренний раздел панели */
export interface AdminNavItem {
  /** Путь относительно /admin */
  href: string;
  /** Подпись в меню */
  label: string;
  /** Иконка пункта */
  icon: React.ComponentType<{ className?: string }>;
}

/** Разделы внутри React-панели */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/', label: 'Сводка', icon: LayoutDashboard },
  { href: '/users', label: 'Аккаунты', icon: Users },
  { href: '/settings', label: 'Настройки', icon: Settings },
  { href: '/node-types', label: 'Типы блоков', icon: Blocks },
  { href: '/docs', label: 'Документация API', icon: BookOpen },
  { href: '/maintenance', label: 'Обслуживание', icon: Wrench },
];

/** Документация и служебные страницы внутри панели */
export const ADMIN_DOC_NAV_ITEMS: AdminNavItem[] = [
  { href: '/live-db', label: 'База данных (живая)', icon: Database },
  { href: '/schema', label: 'Схема базы данных', icon: Database },
  { href: '/api-docs', label: 'Справочник API', icon: FileText },
  { href: '/health', label: 'Проверка работы', icon: HeartPulse },
  { href: '/openapi', label: 'OpenAPI JSON', icon: Braces },
];

/**
 * Возвращает пункты документации с учётом окружения разработки.
 * @returns Список пунктов для бокового меню
 */
export function getAdminDocNavItems(): AdminNavItem[] {
  return ADMIN_DOC_NAV_ITEMS.filter(
    (item) => item.href !== '/live-db' || import.meta.env.DEV,
  );
}

/**
 * Проверяет, активен ли пункт меню для текущего URL.
 * @param location - Текущий путь
 * @param href - Путь пункта относительно /admin
 * @returns true, если раздел активен
 */
export function isAdminNavItemActive(location: string, href: string): boolean {
  const path = href === '/' ? '/admin' : `/admin${href}`;

  if (href === '/docs') {
    return location === '/admin/docs' || location.startsWith('/admin/docs/');
  }
  if (href === '/schema') {
    return location === '/admin/schema' || location.startsWith('/admin/schema/');
  }
  if (href === '/api-docs') {
    return location === '/admin/api-docs' || location.startsWith('/admin/api-docs/');
  }
  if (href === '/users') {
    return location === '/admin/users' || location.startsWith('/admin/users/');
  }
  if (href === '/node-types') {
    return location === '/admin/node-types' || location.startsWith('/admin/node-types/');
  }

  return location === path || location === `${path}/`;
}

