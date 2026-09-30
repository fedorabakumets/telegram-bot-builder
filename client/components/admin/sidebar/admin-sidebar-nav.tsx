/**
 * @fileoverview Внутренняя навигация бокового меню панели управления
 * @module components/admin/sidebar/admin-sidebar-nav
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { ADMIN_NAV_ITEMS, isAdminNavItemActive } from './nav-items';
import { SupportNavBadge } from './support-nav-badge';

/**
 * Пропсы компонента AdminSidebarNav
 */
interface AdminSidebarNavProps {
  /** Свёрнуто ли боковое меню */
  isCollapsed?: boolean;
}

/**
 * Список внутренних разделов панели управления
 * @param props - Свойства компонента
 * @returns JSX элемент навигации
 */
export function AdminSidebarNav({ isCollapsed }: AdminSidebarNavProps) {
  const [location] = useLocation();

  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const path = href === '/' ? '/admin' : `/admin${href}`;
        const isActive = isAdminNavItemActive(location, href);

        return (
          <Link key={href} href={path}>
            <Button
              variant="ghost"
              className={cn(
                'relative w-full justify-start gap-2 h-9 px-2',
                isCollapsed && 'justify-center px-0',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                  : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
              {href === '/support' && <SupportNavBadge isCollapsed={isCollapsed} />}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
