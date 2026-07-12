/**
 * @fileoverview Верхняя панель вкладки «Файлы»: категории + квота в одной строке.
 * @module components/editor/files/panel/file-storage-toolbar
 */

import type { FileCategory } from '../hooks/project-files-query-params';
import { CategoryTabs } from './category-tabs';
import { StorageQuotaBar } from './storage-quota-bar';
import { FILE_STORAGE_TOOLBAR_CLASS } from './panel-styles';

/** Пропсы панели категорий и квоты */
export interface FileStorageToolbarProps {
  /** Текущая категория файлов */
  category: FileCategory;
  /** Смена категории */
  onCategoryChange: (category: FileCategory) => void;
  /** Занято байт */
  usedBytes: number;
  /** Лимит байт (null = безлимитно) */
  limitBytes: number | null;
  /** Загрузка квоты */
  quotaLoading?: boolean;
}

/**
 * Объединяет табы категорий и компактный индикатор квоты.
 * @param props - Категория, квота и колбэки
 * @returns JSX верхней панели
 */
export function FileStorageToolbar({
  category,
  onCategoryChange,
  usedBytes,
  limitBytes,
  quotaLoading,
}: FileStorageToolbarProps): React.JSX.Element {
  return (
    <div className={FILE_STORAGE_TOOLBAR_CLASS} data-testid="file-storage-toolbar">
      <CategoryTabs category={category} onCategoryChange={onCategoryChange} embedded />
      <StorageQuotaBar
        usedBytes={usedBytes}
        limitBytes={limitBytes}
        isLoading={quotaLoading}
        compact
      />
    </div>
  );
}
