/**
 * @fileoverview Компонент текста пустого состояния
 * 
 * Отображает заголовок и описание.
 */

/**
 * Компонент текста пустого состояния
 * 
 * @returns {JSX.Element} Текст пустого состояния
 */
export function EmptyStateText() {
  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-sm font-medium text-foreground gradient-text">Выберите элемент</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Нажмите на любой элемент в редакторе, чтобы увидеть его настройки здесь
      </p>
    </div>
  );
}
