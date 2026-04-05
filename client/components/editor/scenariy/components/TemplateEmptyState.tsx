/**
 * @fileoverview Компонент пустого состояния — отображается когда сценарии не найдены
 * @module client/components/editor/scenariy/components/TemplateEmptyState
 */

/**
 * Компонент пустого состояния для списка сценариев
 * @returns JSX элемент с сообщением об отсутствии сценариев
 */
export function TemplateEmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Сценарии не найдены</p>
    </div>
  );
}
