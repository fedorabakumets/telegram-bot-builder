/**
 * @fileoverview Шапка панели файлового хранилища (`FileStorageHeader`).
 * На странице использует единый заголовок рабочих вкладок;
 * в модалке — компактный вариант без подзаголовка.
 * @module components/editor/files/panel/file-storage-header
 */

import { WorkspaceHeaderActionItems } from '@/components/ui/workspace-header-action-items';
import type { BotToken } from '@shared/schema';
import type { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';

import './files-header-adaptive.css';
import '@/components/editor/database/user-database/content/users-workspace.css';
import { useBotAudienceCounts } from '@/components/editor/database/user-database/components/header/use-bot-audience-counts';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';

import { FileStoragePageBar } from './file-storage-page-bar';
import { FileStorageHeaderActions } from './file-storage-header-actions';
import { HEADER_CONTAINER_MODAL_CLASS } from './panel-styles';
import type { PanelMode } from './panel-types';

/** Пропсы шапки файлового хранилища */
export interface FileStorageHeaderProps {
  /** Индикатор занятого места рядом с загрузкой. */
  quota?: ReactNode;
  /** Режим панели: страница или модалка */
  mode: PanelMode;
  /** ID текущего проекта */
  projectId: number;
  /** Токены проекта (для селектора бота и приоритезации file_id) */
  tokens: BotToken[];
  /** Выбранный токен бота */
  selectedTokenId: number | null;
  /** Смена токена */
  onSelectToken: (tokenId: number | null) => void;
  /** Список проектов для переключателя */
  allProjects: Array<{ id: number; name: string }>;
  /** Смена проекта */
  onProjectChange: (projectId: number) => void;
  /** Принудительное обновление списка файлов */
  onRefresh: () => void;
  /** Колбэк после загрузки файлов с диска (id успешных записей) */
  onUploaded?: (uploadedIds: number[]) => void;
  /** Обновляется ли список файлов. */
  isRefreshing?: boolean;
}

/**
 * Селекторы проекта и бота для шапки.
 * @param props - Проект, токены и колбэки выбора
 * @returns JSX селекторов или null
 */
function HeaderSelectors({
  projectId,
  tokens,
  selectedTokenId,
  onSelectToken,
  allProjects,
  onProjectChange,
}: Pick<
  FileStorageHeaderProps,
  'projectId' | 'tokens' | 'selectedTokenId' | 'onSelectToken' | 'allProjects' | 'onProjectChange'
>): React.JSX.Element | null {
  /** Подтверждённая аудитория общая для всех селекторов рабочих вкладок. */
  const audience = useBotAudienceCounts(projectId);
  if (allProjects.length <= 1 && tokens.length === 0) return null;

  return (
    <div role="group" aria-label="Проект и бот" className="files-scope-controls flex min-w-0 flex-wrap items-center gap-3">
      <WorkspaceHeaderActionItems kind="selectors" items={[
      { id: 'project', content: allProjects.length > 1 && (
        <ProjectSelector
          projects={allProjects}
          selectedProjectId={projectId}
          showBotCount={selectedTokenId == null}
          onSelect={onProjectChange}
        />
      ) },
      { id: 'bot', content: tokens.length > 0 && (
        <BotTokenSelector
          projectId={projectId}
          tokens={tokens}
          audienceCounts={audience.counts}
          countsError={audience.isError && !audience.data}
          onRetryCounts={() => { void audience.refetch(); }}
          selectedTokenId={selectedTokenId}
          onSelect={onSelectToken}
        />
      ) },
      ]} />
    </div>
  );
}

/**
 * Шапка панели файлового хранилища.
 * @param props - Свойства шапки (режим, проект, токены, колбэки)
 * @returns JSX элемент шапки
 */
export function FileStorageHeader(props: FileStorageHeaderProps): React.JSX.Element {
  const { mode, projectId, onRefresh, onUploaded } = props;
  const isModal = mode === 'modal';
  const actions = (
    <FileStorageHeaderActions
      projectId={projectId}
      onRefresh={onRefresh}
      onUploaded={onUploaded}
      showRefresh={isModal}
      showExtras={isModal}
      isRefreshing={props.isRefreshing}
    />
  );

  if (isModal) {
    return (
      <div className="shrink-0" data-testid="file-storage-header" data-mode="modal">
        <div className={HEADER_CONTAINER_MODAL_CLASS}>
          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold leading-none">Файлы</h2>
          </div>
          <HeaderSelectors {...props} />
          <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="files-page-header shrink-0"
      data-testid="file-storage-header"
      data-mode="page"
    >
      <FileStoragePageBar onRefresh={onRefresh} isRefreshing={props.isRefreshing}>
        <HeaderSelectors {...props} />
      </FileStoragePageBar>
      <div className="files-page-upload workspace-tab-frame">
        <div className="files-header-actions flex flex-wrap items-center gap-2">
          {actions}{props.quota}
        </div>
      </div>
    </div>
  );
}
