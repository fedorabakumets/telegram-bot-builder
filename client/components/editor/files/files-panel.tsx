/**
 * @fileoverview Главная панель вкладки "Файлы" — просмотр медиа-файлов проекта
 * @module components/editor/files/files-panel
 */

import { useState, useCallback } from 'react';
import { FolderOpen, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TabHeader } from '@/components/ui/tab-header';
import { Button } from '@/components/ui/button';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useProjectFiles } from './hooks/use-project-files';
import { FilesTable } from './components/files-table';
import { FilesToolbar } from './components/files-toolbar';
import type { FileSource, FileMediaType } from './hooks/use-project-files';

/** Пропсы панели файлов */
export interface FilesPanelProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный токен бота */
  selectedTokenId?: number | null;
  /** Обработчик выбора токена */
  onSelectToken: (tokenId: number | null) => void;
  /** Список проектов для переключателя */
  allProjects: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange: (projectId: number) => void;
}

/**
 * Панель управления файлами проекта
 * @param props - Свойства компонента
 * @returns JSX элемент панели файлов
 */
export function FilesPanel({ projectId, selectedTokenId, onSelectToken, allProjects, onProjectChange }: FilesPanelProps) {
  const queryClient = useQueryClient();
  const projectTokensInfo = useProjectTokens([projectId]);
  const tokens = projectTokensInfo[0]?.tokens ?? [];

  const [source, setSource] = useState<FileSource>('incoming');
  const [mediaType, setMediaType] = useState<FileMediaType | undefined>();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useProjectFiles({
    projectId, source, type: mediaType, tokenId: selectedTokenId, page,
  });

  const files = data?.files ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  /** Сброс страницы при смене фильтров */
  const handleSourceChange = useCallback((s: FileSource) => { setSource(s); setPage(1); setSelectedIds(new Set()); }, []);
  const handleTypeChange = useCallback((t: FileMediaType | undefined) => { setMediaType(t); setPage(1); }, []);

  /** Копирование file_id в буфер */
  const handleCopyFileId = useCallback((fileId: string) => {
    navigator.clipboard.writeText(fileId);
  }, []);

  /** Переключение выбора файла */
  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <TabHeader
        icon={<FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Файлы"
        actions={
          <button type="button" title="Обновить"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'files'] })}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      >
        {allProjects.length > 1 && (
          <ProjectSelector projects={allProjects} selectedProjectId={projectId} onSelect={onProjectChange} />
        )}
        {tokens.length > 0 && (
          <BotTokenSelector tokens={tokens} selectedTokenId={selectedTokenId ?? null} onSelect={onSelectToken} />
        )}
      </TabHeader>

      <FilesToolbar
        source={source} onSourceChange={handleSourceChange}
        mediaType={mediaType} onMediaTypeChange={handleTypeChange}
        total={total} isLoading={isLoading}
      />

      <FilesTable
        files={files} selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect} onCopyFileId={handleCopyFileId}
      />

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
          <span>{total} файлов • стр. {page}/{totalPages}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
