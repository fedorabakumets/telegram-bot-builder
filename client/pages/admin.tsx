/**
 * @fileoverview Точка входа React-панели управления
 * @module pages/admin
 */

import { Route, Switch } from 'wouter';
import { AdminLayout } from '@/components/admin/admin-layout';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminOverview } from '@/components/admin/pages/admin-overview';
import { AdminSettingsPage } from '@/components/admin/pages/admin-settings';
import { AdminDocsPage } from '@/components/admin/pages/admin-docs';
import { AdminDocsViewerPage } from '@/components/admin/pages/admin-docs-viewer';
import { AdminMaintenancePage } from '@/components/admin/pages/admin-maintenance';
import { AdminSchemaPage } from '@/components/admin/pages/admin-schema';
import { AdminApiDocsPage } from '@/components/admin/pages/admin-api-docs';
import { AdminHealthPage } from '@/components/admin/pages/admin-health';
import { AdminOpenapiPage } from '@/components/admin/pages/admin-openapi';
import { AdminLiveDbPage } from '@/components/admin/pages/admin-live-db';
import { AdminUsersPage } from '@/components/admin/pages/admin-users';
import { AdminUserDetailPage } from '@/components/admin/pages/admin-user-detail';
import { AdminNodeTypesPage } from '@/components/admin/pages/admin-node-types';
import type { ComponentType } from 'react';

/**
 * Оборачивает страницу в стандартную или полноэкранную оболочку
 * @param Page - Компонент страницы
 * @param fullBleed - Без отступов, на всю высоту
 * @returns Компонент с оболочкой
 */
function adminRoute(Page: ComponentType, fullBleed = false) {
  return function AdminRoutedPage() {
    return (
      <AdminPageShell fullBleed={fullBleed}>
        <Page />
      </AdminPageShell>
    );
  };
}

/**
 * React-панель управления с боковым меню
 * @returns JSX элемент панели
 */
export default function AdminPanel() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/settings" component={adminRoute(AdminSettingsPage)} />
        <Route path="/admin/docs/:viewer" component={adminRoute(AdminDocsViewerPage, true)} />
        <Route path="/admin/docs" component={adminRoute(AdminDocsPage)} />
        <Route path="/admin/schema/:tableName" component={adminRoute(AdminSchemaPage, true)} />
        <Route path="/admin/schema" component={adminRoute(AdminSchemaPage, true)} />
        <Route path="/admin/api-docs/:slug" component={adminRoute(AdminApiDocsPage, true)} />
        <Route path="/admin/api-docs" component={adminRoute(AdminApiDocsPage, true)} />
        <Route path="/admin/health" component={adminRoute(AdminHealthPage)} />
        <Route path="/admin/openapi" component={adminRoute(AdminOpenapiPage)} />
        <Route path="/admin/live-db" component={adminRoute(AdminLiveDbPage)} />
        <Route path="/admin/users/:id" component={adminRoute(AdminUserDetailPage)} />
        <Route path="/admin/users" component={adminRoute(AdminUsersPage)} />
        <Route path="/admin/node-types" component={adminRoute(AdminNodeTypesPage)} />
        <Route path="/admin/maintenance" component={adminRoute(AdminMaintenancePage)} />
        <Route path="/admin" component={adminRoute(AdminOverview)} />
      </Switch>
    </AdminLayout>
  );
}

