/** @fileoverview Общая верхняя строка вкладки «Файлы», отдельно от загрузки и квоты. */
import type { ReactNode } from 'react';
import { FileImage, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceAdaptiveHeader } from '@/components/ui/workspace-adaptive-header';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { WorkspaceHeaderActionItems } from '@/components/ui/workspace-header-action-items';
import { FileStorageDocsLink } from './file-storage-docs-link';

/** Содержимое основной строки вкладки. */
interface FileStoragePageBarProps {
  /** Селекторы проекта и бота. */
  children: ReactNode;
  /** Обновляет список файлов выбранной области. */
  onRefresh: () => void;
  /** Выполняется обновление списка. */
  isRefreshing?: boolean;
}

/**
 * Показывает название вкладки и служебные действия в общем каркасе.
 * @param props - Селекторы и состояние обновления файлов.
 * @returns Основная строка шапки.
 */
export function FileStoragePageBar({ children, onRefresh, isRefreshing }: FileStoragePageBarProps) {
  return (
    <div className="workspace-tab-frame workspace-tab-bar @container border-b border-border/50">
      <WorkspaceAdaptiveHeader scopeSelector=".files-scope-controls">
        <WorkspaceTabHeading title="Файлы" icon={<FileImage />} actions={(
          <div className="workspace-tab-actions flex shrink-0 items-center gap-2">
            {/* Файлы сохраняют свои подписи и тестовые идентификаторы при перестановке. */}
            <WorkspaceHeaderActionItems items={[
              { id: 'docs', content: <FileStorageDocsLink /> },
              { id: 'refresh', content: <Button
              variant="ghost"
              size="icon"
              className="files-action h-8 w-8"
              onClick={() => { if (!isRefreshing) onRefresh(); }}
              aria-disabled={isRefreshing}
              aria-busy={isRefreshing}
              aria-label="Обновить список файлов"
              title="Обновить список файлов"
              data-testid="file-storage-refresh"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 motion-safe:animate-spin' : 'h-4 w-4'} aria-hidden="true" />
              <span>Обновить</span>
            </Button> },
            ]} />
          </div>
        )} />
        {children}
      </WorkspaceAdaptiveHeader>
    </div>
  );
}
