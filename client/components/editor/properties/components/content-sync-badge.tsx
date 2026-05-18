/**
 * @fileoverview Индикатор синхронизации поля с таблицей _content
 * @module editor/properties/components/content-sync-badge
 */

/**
 * Бейдж синхронизации с таблицей контента
 * @returns JSX элемент индикатора
 */
export function ContentSyncBadge() {
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <span className="text-[10px] text-muted-foreground/60">
        🔗 Синхронизировано с таблицей контента
      </span>
    </div>
  );
}
