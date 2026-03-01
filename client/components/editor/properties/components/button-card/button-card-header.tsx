/**
 * @fileoverview Заголовок карточки кнопки
 * 
 * Отображает иконку, название и кнопку удаления.
 */

import { Button } from '@/components/ui/button';
import type { Button as ButtonType } from '@shared/schema';

/** Пропсы заголовка карточки кнопки */
interface ButtonCardHeaderProps {
  /** Тип кнопки */
  buttonType?: ButtonType['buttonType'];
  /** Флаг множественного выбора */
  allowMultipleSelection?: boolean;
  /** Функция удаления кнопки */
  onDelete: () => void;
}

/**
 * Компонент заголовка карточки кнопки
 * 
 * @param {ButtonCardHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок карточки
 */
export function ButtonCardHeader({
  buttonType,
  allowMultipleSelection,
  onDelete
}: ButtonCardHeaderProps) {
  return (
    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all">
          <i className="fas fa-rectangle-ad text-xs sm:text-sm text-blue-600 dark:text-blue-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
            Кнопка
          </div>
          {allowMultipleSelection && buttonType && (
            <ButtonCardTypeBadge buttonType={buttonType} />
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400 h-auto p-1.5 transition-colors duration-200 flex-shrink-0"
        title="Удалить кнопку"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </Button>
    </div>
  );
}

interface BadgeProps {
  buttonType: 'normal' | 'option' | 'complete';
}

/**
 * Бейдж типа кнопки
 */
function ButtonCardTypeBadge({ buttonType }: BadgeProps) {
  const getStyles = () => {
    switch (buttonType) {
      case 'option':
        return 'bg-gradient-to-r from-green-100/60 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border border-green-300/50 dark:border-green-700/40';
      case 'complete':
        return 'bg-gradient-to-r from-purple-100/60 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border border-purple-300/50 dark:border-purple-700/40';
      default:
        return 'bg-gradient-to-r from-blue-100/60 to-cyan-100/50 dark:from-blue-900/30 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-blue-700/40';
    }
  };

  const getIcon = () => {
    switch (buttonType) {
      case 'option':
        return <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>;
      case 'complete':
        return <div className="w-1.5 h-1.5 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>;
      default:
        return <div className="w-1.5 h-1.5 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>;
    }
  };

  const getLabel = () => {
    switch (buttonType) {
      case 'option': return 'Опция';
      case 'complete': return 'Завершение';
      default: return 'Обычная';
    }
  };

  return (
    <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-xs font-medium transition-all duration-200 ${getStyles()}`}>
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  );
}
