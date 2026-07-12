/**
 * @fileoverview Шапка панели файлового хранилища (`FileStorageHeader`).
 * На странице использует общий `TabHeader` (как «Пользователи» и «Рассылки»);
 * в модалке — компактный вариант без подзаголовка.
 * @module components/editor/files/panel/file-storage-header
 */

import type { BotToken } from '@shared/schema';
import { BookOpen, FolderOpen, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TabHeader } from '@/components/ui/tab-header';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';

import { StorageManagerButton } from './storage/storage-manager-button';
import { HEADER_CONTAINER_MODAL_CLASS, HEADER_SUBTITLE_CLASS } from './panel-styles';
import type { PanelMode } from './panel-types';

/** URL документации по интерфейсу файлового хранилища */
const DOCS_URL = 'https://fedorabakumets.github.io/wikinest/interface/files';

/** Пропсы шапки файлового хранилища */
export interface FileStorageHeaderProps {
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
}

/**
 * Кнопки действий шапки: хранилища, документация, обновление.
 * @param onRefresh - Колбэк обновления списка файлов
 * @returns JSX группы кнопок
 */
function HeaderActions({ onRefresh }: { onRefresh: () => void }): React.JSX.Element {
  return (
    <>
      <StorageManagerButton />
      <Button type="button" variant="outline" size="sm" className="h-8" asChild>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Документация по файловому хранилищу"
          data-testid="file-storage-docs-link"
        >
          <BookOpen className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Документация</span>
        </a>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={onRefresh}
        title="Обновить список файлов"
        data-testid="file-storage-refresh"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </>
  );
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
  if (allProjects.length <= 1 && tokens.length === 0) return null;

  return (
    <>
      {allProjects.length > 1 && (
        <ProjectSelector
          projects={allProjects}
          selectedProjectId={projectId}
          onSelect={onProjectChange}
        />
      )}
      {tokens.length > 0 && (
        <BotTokenSelector
          tokens={tokens}
          selectedTokenId={selectedTokenId}
          onSelect={onSelectToken}
        />
      )}
    </>
  );
}

/**
 * Шапка панели файлового хранилища.
 * @param props - Свойства шапки (режим, проект, токены, колбэки)
 * @returns JSX элемент шапки
 */
export function FileStorageHeader(props: FileStorageHeaderProps): React.JSX.Element {
  const { mode, onRefresh } = props;
  const isModal = mode === 'modal';

  if (isModal) {
    return (
      <div className="shrink-0" data-testid="file-storage-header" data-mode="modal">
        <div className={`${HEADER_CONTAINER_MODAL_CLASS} flex flex-wrap items-center gap-2`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold leading-none">Файлы</h2>
          </div>
          <HeaderSelectors {...props} />
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <HeaderActions onRefresh={onRefresh} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="shrink-0 border-b bg-gradient-to-r from-muted/40 via-muted/20 to-background"
      data-testid="file-storage-header"
      data-mode="page"
    >
      <TabHeader
        className="border-b-0 bg-transparent pb-1"
        icon={<FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Файлы"
        actions={<HeaderActions onRefresh={onRefresh} />}
      >
        <HeaderSelectors {...props} />
      </TabHeader>
      <p className={HEADER_SUBTITLE_CLASS}>
        Медиафайлы проекта — загрузка, фильтры по категориям и хранилищам, привязка к ботам и нодам.
      </p>
    </div>
  );
}
