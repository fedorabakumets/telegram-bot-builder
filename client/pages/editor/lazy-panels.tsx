/**
 * @fileoverview Ленивые вкладки редактора.
 * Чанк панели запрашивается только когда компонент впервые попадает в рендер,
 * а не вместе с холстом. Хуки (useCodeGenerator и остальные) сюда не входят:
 * их нельзя оборачивать в React.lazy.
 *
 * CodePanel грузится из файла компонента, а не из барреля
 * `code/panel/index.ts`: баррель реэкспортирует ещё и JsonApplyBar.
 * Сам JsonApplyBar рисует CodePanel, отдельной точки рендера в editor нет.
 * @module pages/editor/lazy-panels
 */

import { lazy } from 'react';

/**
 * Компактный индикатор загрузки чанка вкладки.
 * Занимает только область панели и не подменяет весь редактор.
 * @returns JSX-элемент индикатора
 */
export function LazyPanelFallback() {
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
      role="status"
    >
      <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
      <span>Загрузка…</span>
    </div>
  );
}

/** Область Monaco: код и JSON-вид холста */
export const CodeEditorArea = lazy(() =>
  import('@/components/editor/code/editor/CodeEditorArea').then((m) => ({ default: m.CodeEditorArea })),
);

/** Панель кода (формат, статистика, применение JSON) */
export const CodePanel = lazy(() =>
  import('@/components/editor/code/panel/CodePanel').then((m) => ({ default: m.CodePanel })),
);

/** Предпросмотр README */
export const ReadmePreview = lazy(() =>
  import('@/components/editor/code/readme/ReadmePreview').then((m) => ({ default: m.ReadmePreview })),
);

/** Панель переписки с пользователем */
export const DialogPanel = lazy(() =>
  import('@/components/editor/database/dialog/dialog-panel').then((m) => ({ default: m.DialogPanel })),
);

/** Вкладка диалогов */
export const DialogsTabContent = lazy(() =>
  import('@/components/editor/database/user-database/dialogs-tab/dialogs-tab-content').then((m) => ({
    default: m.DialogsTabContent,
  })),
);

/** База пользователей */
export const UserDatabasePanel = lazy(() =>
  import('@/components/editor/database/user-database/user-database-panel').then((m) => ({
    default: m.UserDatabasePanel,
  })),
);

/** Карточка пользователя */
export const UserDetailsPanel = lazy(() =>
  import('@/components/editor/database/user-details/user-details-panel').then((m) => ({
    default: m.UserDetailsPanel,
  })),
);

/** Рассылка */
export const BroadcastPanel = lazy(() =>
  import('@/components/editor/broadcast/broadcast-panel').then((m) => ({ default: m.BroadcastPanel })),
);

/** Аналитика */
export const AnalyticsPanel = lazy(() =>
  import('@/components/editor/analytics/analytics-panel').then((m) => ({ default: m.AnalyticsPanel })),
);

/** Таблицы */
export const TablesPanel = lazy(() =>
  import('@/components/editor/tables/tables-panel').then((m) => ({ default: m.TablesPanel })),
);

/** Файлы проекта */
export const FilesTabPage = lazy(() =>
  import('@/components/editor/files/containers/files-tab-page').then((m) => ({ default: m.FilesTabPage })),
);

/** История версий */
export const VersionsPanel = lazy(() =>
  import('@/components/editor/versions/versions-panel').then((m) => ({ default: m.VersionsPanel })),
);

/** Токены агента */
export const AgentTokensPanel = lazy(() =>
  import('@/components/editor/agent/AgentTokensPanel').then((m) => ({ default: m.AgentTokensPanel })),
);

/** Терминал */
export const TerminalPanel = lazy(() =>
  import('@/components/editor/terminal/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);
