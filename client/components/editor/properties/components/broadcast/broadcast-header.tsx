/**
 * @fileoverview Заголовок секции рассылки
 *
 * Компонент отображает заголовок и переключатель секции рассылки.
 */

/** Пропсы компонента */
interface BroadcastHeaderProps {
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
}

/**
 * Компонент заголовка секции рассылки
 *
 * @param {BroadcastHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок секции рассылки
 */
export function BroadcastHeader({
  isOpen,
  onToggle
}: BroadcastHeaderProps) {
  return (
    <div className="w-full">
      <div
        className="flex items-start gap-2.5 sm:gap-3 w-full hover:opacity-75 transition-opacity duration-200 group cursor-pointer"
        onClick={onToggle}
      >
        <button className="flex items-start gap-2.5 sm:gap-3 w-full" title="Свернуть">
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 flex items-center justify-center flex-shrink-0 pt-0.5">
            <i className="fas fa-broadcast-tower text-orange-600 dark:text-orange-400 text-sm sm:text-base"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-orange-900 dark:text-orange-100 text-left">
              📢 Рассылка
            </h3>
            <p className="text-xs sm:text-sm text-orange-700/70 dark:text-orange-300/70 mt-0.5 text-left">
              Настройка отправки сообщений всем пользователям
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} text-xs sm:text-sm text-orange-600 dark:text-orange-400 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
        </div>
      </div>
    </div>
  );
}
