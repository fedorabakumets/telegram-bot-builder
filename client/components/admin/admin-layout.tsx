/**
 * @fileoverview Общий каркас страниц панели управления
 * @module components/admin/admin-layout
 */

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSupportSocket } from '@/components/support/hooks/use-support-socket';
import { useAdminStatus } from './hooks/use-admin-status';
import { ADMIN_SUPPORT_QUERY_KEY, AdminSupportSocketContext } from './hooks/use-admin-support';
import { AdminSidebar } from './sidebar/admin-sidebar';

/**
 * Пропсы компонента AdminLayout
 */
interface AdminLayoutProps {
  /** Содержимое текущей страницы */
  children: ReactNode;
}

/**
 * Каркас панели: боковое меню слева, содержимое справа
 * @param props - Свойства компонента
 * @returns JSX элемент каркаса
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { isLoading, data } = useAdminStatus();
  const socketConnected = useSupportSocket(
    '/admin/api/support/ws',
    ADMIN_SUPPORT_QUERY_KEY,
    Boolean(data?.authenticated),
  );

  if (isLoading || !data?.authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminSupportSocketContext.Provider value={socketConnected}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AdminSidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">{children}</main>
      </div>
    </AdminSupportSocketContext.Provider>
  );
}
