/**
 * @fileoverview Компонент пустого состояния мобильного списка
 * @description Отображается когда пользователи не найдены или отсутствуют
 */

/**
 * Компонент пустого состояния для мобильного списка пользователей
 * @param searchQuery - Текущий поисковый запрос
 * @returns JSX компонент пустого состояния
 */
export function MobileEmptyState({ searchQuery }: { searchQuery: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm">
      <div className="text-muted-foreground">
        {searchQuery ? 'Пользователи не найдены' : 'В этом списке пока нет пользователей'}
      </div>
    </div>
  );
}
