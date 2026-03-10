/**
 * @fileoverview Бейдж "Скоро обновление"
 *
 * Компонент отображает индикатор предстоящего обновления функционала.
 * Используется в заголовках секций, которые находятся в разработке.
 */

/** Пропсы компонента */
interface ComingSoonBadgeProps {
  /** Текст подсказки при наведении */
  tooltip?: string;
  /** Текст бейджа (по умолчанию "Скоро обновление") */
  label?: string;
}

/**
 * Компонент бейджа "Скоро обновление"
 *
 * @param {ComingSoonBadgeProps} props - Пропсы компонента
 * @returns {JSX.Element} Бейдж предстоящего обновления
 */
export function ComingSoonBadge({
  tooltip = "Скоро эта секция изменится",
  label = "Скоро обновление"
}: ComingSoonBadgeProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
      title={tooltip}
    >
      <i className="fas fa-clock text-xs"></i>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
