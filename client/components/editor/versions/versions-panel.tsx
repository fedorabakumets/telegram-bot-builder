/**
 * @fileoverview Главная панель вкладки "История версий" проекта
 * @module editor/versions/versions-panel
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { History } from 'lucide-react';
import { WorkspaceTabActions } from '@/components/ui/workspace-tab-actions';
import { WorkspaceProjectScope, type WorkspaceProjectScopeProps } from '@/components/ui/workspace-project-scope';
import { Button } from '@/components/ui/button';
import { WorkspaceCollapsibleHeader } from '@/components/ui/workspace-collapsible-header';
import { WorkspaceTabHeading } from '@/components/ui/workspace-tab-heading';
import { useToast } from '@/hooks/use-toast';
import { useProjectVersions, useRestoreProjectVersion } from '@/hooks/use-project-versions';
import { VersionList } from './version-list';
import { CommitForm } from './commit-form';
import { VersionsPagination } from './versions-pagination';
import './versions-page.css';

/** Пропсы панели версий */
export interface VersionsPanelProps extends WorkspaceProjectScopeProps {
  /** ID проекта */
  projectId: number;
  /** Колбэк после успешного восстановления версии */
  onRestored?: () => void;
}

/**
 * Панель истории версий проекта с возможностью отката
 * @param props - Свойства компонента
 * @returns JSX элемент панели версий
 */
export function VersionsPanel({ projectId, onRestored, projects, onProjectChange }: VersionsPanelProps) {
  const { toast } = useToast();
  const { data: versions = [], isLoading, isError, isFetching, refetch } = useProjectVersions(projectId);
  const restoreMutation = useRestoreProjectVersion(projectId);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(versions.length / pageSize)));
  const offset = (currentPage - 1) * pageSize;
  useEffect(() => { setPage(1); }, [projectId]);
  /** Возвращает к началу списка после переключения страницы, сохраняя закреплённую навигацию. */
  const scrollToVersions = () => requestAnimationFrame(() => {
    const root = panel.current;
    const list = root?.querySelector('[aria-labelledby="saved-versions-heading"]');
    if (root && list) root.scrollTo({ top: root.scrollTop + list.getBoundingClientRect().top - root.getBoundingClientRect().top - 16, behavior: 'instant' });
  });

  /** Обработчик восстановления версии */
  const handleRestore = useCallback((versionId: number) => {
    setRestoringId(versionId);
    restoreMutation.mutate(versionId, {
      onSuccess: () => {
        // Сначала показываем уведомление — гарантированно, до обновления холста
        toast({
          title: 'Версия восстановлена',
          description: 'Проект откатан к выбранной версии. Изменения видны на холсте.',
        });
        // Обновление холста оборачиваем, чтобы возможная ошибка не «съела» фидбек
        try {
          onRestored?.();
        } catch (err) {
          console.error('[VersionsPanel] Ошибка обновления холста после отката:', err);
        }
      },
      onError: () => {
        toast({
          title: 'Ошибка восстановления',
          description: 'Не удалось восстановить версию проекта',
          variant: 'destructive',
        });
      },
      onSettled: () => {
        setRestoringId(null);
      },
    });
  }, [restoreMutation, onRestored, toast]);

  return (
    <div ref={panel} className="versions-page workspace-tab-frame h-full overflow-auto bg-background">
      <div className="versions-content workspace-tab-content space-y-6 pb-4">
        <WorkspaceCollapsibleHeader><div className="space-y-4"><WorkspaceTabHeading title="История версий" icon={<History />}
          description="Сохраняйте важные этапы и возвращайтесь к предыдущим версиям проекта."
          actions={<WorkspaceTabActions docsPath="interface/versions" section="История версий" onRefresh={() => void refetch()} isRefreshing={isFetching} />}
        />
        <WorkspaceProjectScope projectId={projectId} projects={projects} onProjectChange={onProjectChange} /></div></WorkspaceCollapsibleHeader>
        <CommitForm projectId={projectId} />
        <section className="space-y-3" aria-labelledby="saved-versions-heading" aria-busy={isFetching}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="saved-versions-heading" className="text-lg font-semibold">Сохранённые версии</h3>
            {!isLoading && !isError && <span className="text-xs text-muted-foreground">Всего: {versions.length}</span>}
          </div>
          {isError ? <div role="alert" className="versions-surface space-y-3 rounded-xl border p-4">
            <p className="text-sm text-destructive">Не удалось загрузить историю версий.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>Повторить загрузку</Button>
          </div> : <VersionList versions={versions.slice(offset, offset + pageSize)} totalVersions={versions.length} offset={offset} projectId={projectId} isLoading={isLoading} restoringId={restoringId} onRestore={handleRestore} />}
        </section>
        {!isLoading && !isError && versions.length > 0 && <VersionsPagination page={currentPage} pageSize={pageSize} total={versions.length}
          onPageChange={next => { setPage(next); scrollToVersions(); }}
          onPageSizeChange={size => { setPageSize(size); setPage(1); scrollToVersions(); }} />}
      </div>
    </div>
  );
}
