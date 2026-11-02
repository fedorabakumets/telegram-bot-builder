/** @fileoverview Сворачивание шапки рабочей вкладки в узкой панели. */
import { useState, type ReactNode } from 'react';
import './workspace-tab-layout.css';
/** Освобождает место, сохраняя возможность вернуть элементы шапки. @param props - Содержимое шапки. @returns Управляемая шапка. */
export function WorkspaceCollapsibleHeader({ children }: { /** Заголовок и элементы управления. */ children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="workspace-collapsible-header"><button type="button" className="workspace-header-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? 'Показать шапку' : 'Свернуть шапку'}</button><div className="workspace-header-content" hidden={collapsed}>{children}</div></div>;
}
