/**
 * @fileoverview Компонент иконки пустого состояния
 * 
 * Отображает анимированную иконку с пульсирующим эффектом.
 */

/**
 * Компонент иконки пустого состояния
 * 
 * @returns {JSX.Element} Анимированная иконка
 */
export function EmptyStateIcon() {
  return (
    <div className="relative mx-auto mb-6 empty-state-icon">
      <div className="w-16 h-16 empty-state-icon-bg rounded-2xl flex items-center justify-center mx-auto">
        <i className="fas fa-mouse-pointer text-muted-foreground text-xl transition-all duration-300 hover:text-primary hover:scale-110"></i>
      </div>
      <div className="absolute inset-0 w-16 h-16 bg-primary/10 rounded-2xl pulse-primary"></div>
    </div>
  );
}
