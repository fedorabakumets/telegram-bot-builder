/**
 * @fileoverview Кнопка перехода в панель /admin из сайдбара редактора
 * @module components/editor/app-sidebar/components/sidebar-admin-link
 */

import { Shield } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { useSetupBootstrap } from '@/components/editor/setup/hooks/use-setup';

/**
 * Пропсы ссылки на админку
 */
interface SidebarAdminLinkProps {
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
}

/**
 * Кнопка «Админка» — видна только если вход в /admin доступен.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function SidebarAdminLink({ isCollapsed }: SidebarAdminLinkProps) {
  const { data } = useSetupBootstrap();
  if (!data?.adminEnabled) return null;

  return (
    <Link href="/admin">
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-2 h-9 px-2 text-muted-foreground hover:bg-muted/60',
          isCollapsed && 'justify-center px-0',
        )}
        title="Админка"
        data-testid="button-open-admin"
      >
        <Shield className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span className="text-sm whitespace-nowrap">Админка</span>}
      </Button>
    </Link>
  );
}
