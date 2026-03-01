/**
 * @fileoverview Компонент отображения ошибок валидации команды
 * 
 * Показывает список ошибок валидации команды.
 */

/** Пропсы компонента ошибок валидации */
interface CommandValidationErrorsProps {
  /** Список ошибок валидации */
  errors: string[];
}

/**
 * Компонент ошибок валидации команды
 * 
 * @param {CommandValidationErrorsProps} props - Пропсы компонента
 * @returns {JSX.Element} Список ошибок
 */
export function CommandValidationErrors({ errors }: CommandValidationErrorsProps) {
  return (
    <div className="mt-2 space-y-1 bg-red-50/60 dark:bg-red-950/20 rounded-lg p-2.5 sm:p-3 border border-red-200/50 dark:border-red-800/50">
      {errors.map((error, index) => (
        <div key={index} className="flex items-center text-xs sm:text-sm text-red-700 dark:text-red-400 gap-2">
          <i className="fas fa-exclamation-circle flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      ))}
    </div>
  );
}
