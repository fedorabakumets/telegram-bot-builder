/**
 * @fileoverview Шапка панели файлового хранилища (`FileStorageHeader`).
 * Общая для страницы и модалки: иконка + заголовок «Файлы», селектор проекта,
 * селектор бота, кнопка «Обновить» (принудительный refetch списка), краткое
 * описание назначения страницы и кнопка-ссылка на документацию (новая вкладка).
 * Переиспуёт существующие ProjectSelector / BotTokenSelector и TabHeader,
 * иконки — только смысловые из lucide-react (Req 1.3, 14.1, 14.2, 14.3, 13.2).
 * @module components/editor/files/panel/file-storage-header
 */

import { BotToken } from '@shared/schema';
import { FolderOpen, RefreshCw, BookOpen } from 'lucide-react';
import { TabHeader } from '@/components/ui/tab-header';
import { Button } from '@/components/ui/button';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { StorageManagerButton } from './storage/storage-manager-button';
import type { PanelMode } from './panel-types';

/** URL документации по интерфейсу файлового хранилища */
const DOCS_URL = 'https://fedorabakumets.github.io/wikinest/interface/files';

/** Пропсы шапки файлового хранилища */
export interface FileStorageHeaderProps {
  /** Режим панели: страница или модалка */
  mode: PanelMode;
  /** ID проекта */
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
  projectId: _projectId,
  tokens,
  selectedTokenId,
  onSelectToken,
  allProjects,
  onProjectChange,
  onRefresh,
}: FileStorageHeaderProps): React.JSX.Element {
  return (
    <div className="shrink-0" data-testid="file-storage-header">
      <TabHeader
        icon={<FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Файлы"
        actions={
          <div className="flex items-center gap-1">
            <StorageManagerButton />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              asChild
            >
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
        }
      >
        {allProjects.length > 1 && (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={_projectId}
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
      </TabHeader>

      {/* Краткое описание назначения страницы (Req 14.3); компактнее в модалке */}
      {mode === 'page' && (
        <p className="px-4 sm:px-6 py-2 text-xs text-muted-foreground border-b">
          Единое хранилище медиафайлов проекта: загрузка, фильтрация по категориям и
          хранилищам, привязка file_id к ботам и прикрепление файлов к нодам.
        </p>
      )}
    </div>
  );
}
