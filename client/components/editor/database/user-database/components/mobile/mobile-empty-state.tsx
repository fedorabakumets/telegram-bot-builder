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
    <div className="text-center py-8">
      <div className="text-muted-foreground">
        {searchQuery ? 'Пользователи не найдены' : 'Пользователи еще не взаимодействовали с ботом'}
      </div>
    </div>
  );
}
