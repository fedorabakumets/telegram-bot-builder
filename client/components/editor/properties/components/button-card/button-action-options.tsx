/**
 * @fileoverview Опции действий для кнопки
 *
 * Переиспользуемый компонент с иконками и подписями действий.
 */

/** Тип действия кнопки */
export type ButtonActionType = 'goto' | 'url' | 'selection' | 'complete';

/** Пропсы для рендеринга опции действия */
interface ButtonActionOptionProps {
  /** Тип действия */
  action: ButtonActionType;
}

/**
 * Конфигурация иконок и стилей для каждого типа действия
 */
const ACTION_CONFIG: Record<ButtonActionType, { icon: string; color: string; label: string }> = {
  goto: { icon: 'fa-right-long', color: 'text-teal-600 dark:text-teal-400', label: 'Перейти к экрану' },
  url: { icon: 'fa-link', color: 'text-blue-600 dark:text-blue-400', label: 'Открыть ссылку' },
  selection: { icon: 'fa-check-square', color: 'text-green-600 dark:text-green-400', label: 'Выбор опции' },
  complete: { icon: 'fa-flag-checkered', color: 'text-purple-600 dark:text-purple-400', label: 'Кнопка завершения' }
};

/**
 * Компонент опции действия кнопки
 *
 * @param {ButtonActionOptionProps} props - Пропсы компонента
 * @returns {JSX.Element} Опция действия с иконкой
 */
export function ButtonActionOption({ action }: ButtonActionOptionProps) {
  const config = ACTION_CONFIG[action];

  return (
    <div className="flex items-center gap-2">
      <i className={`fas ${config.icon} ${config.color} text-xs`}></i>
      <span>{config.label}</span>
    </div>
  );
}
