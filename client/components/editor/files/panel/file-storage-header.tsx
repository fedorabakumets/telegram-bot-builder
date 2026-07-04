/**
 * @fileoverview Шапка панели файлового хранилища (`FileStorageHeader`).
 * Общая для страницы и модалки: иконка-круг с primary-градиентом
 * (`--gradient-primary-start/end`), заголовок «Файлы», селекторы проекта/бота,
 * кнопки «Хранилища», «Документация» и «Обновить» — единых размеров `h-8`.
 * Режим `modal` использует плотнее отступы и компактнее круг/заголовок, но
 * сохраняет ровно те же токены темы (Req 1.4, 13.1, 14.1, 14.3).
 * Иконки — только смысловые из `lucide-react`, без эмодзи (Req 13.2).
 * @module components/editor/files/panel/file-storage-header
 */

import type { BotToken } from '@shared/schema';
import { FolderOpen, RefreshCw, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';

import { StorageManagerButton } from './storage/storage-manager-button';
import {
  HEADER_ACTIONS_CLASS,
  HEADER_CONTAINER_CLASS,
  HEADER_CONTAINER_MODAL_CLASS,
  HEADER_DESCRIPTION_CLASS,
  HEADER_ICON_CIRCLE_CLASS,
  HEADER_ICON_CIRCLE_MODAL_CLASS,
  HEADER_ICON_CIRCLE_STYLE,
  HEADER_TITLE_CLASS,
  HEADER_TITLE_MODAL_CLASS,
} from './panel-styles';
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
 * Шапка панели файлового хранилища.
 * @param props - Свойства шапки (режим, проект, токены, колбэки)
 * @returns JSX элемент шапки
 */
export function FileStorageHeader({
  mode,
  projectId,
  tokens,
  selectedTokenId,
  onSelectToken,
  allProjects,
  onProjectChange,
  onRefresh,
}: FileStorageHeaderProps): React.JSX.Element {
  const isModal = mode === 'modal';
  return (
    <div className="shrink-0" data-testid="file-storage-header">
      <div className={isModal ? HEADER_CONTAINER_MODAL_CLASS : HEADER_CONTAINER_CLASS}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={isModal ? HEADER_ICON_CIRCLE_MODAL_CLASS : HEADER_ICON_CIRCLE_CLASS}
              style={HEADER_ICON_CIRCLE_STYLE}
              aria-hidden
            >
              <FolderOpen
                className={
                  isModal
                    ? 'h-3.5 w-3.5 text-primary-foreground'
                    : 'h-4 w-4 text-primary-foreground'
                }
              />
            </span>
            <h2 className={isModal ? HEADER_TITLE_MODAL_CLASS : HEADER_TITLE_CLASS}>
              Файлы
            </h2>
          </div>

          {(allProjects.length > 1 || tokens.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
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
            </div>
          )}

          <div className={HEADER_ACTIONS_CLASS}>
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
          </div>
        </div>
      </div>

      {/* Краткое описание показываем только на странице (модалка плотнее, Req 1.4) */}
      {!isModal && (
        <p className={HEADER_DESCRIPTION_CLASS}>
          Единое хранилище медиафайлов проекта: загрузка, фильтрация по категориям и
          хранилищам, привязка file_id к ботам и прикрепление файлов к нодам.
        </p>
      )}
    </div>
  );
}
