/**
 * @fileoverview Опции действий для кнопки
 *
 * Переиспользуемый компонент с иконками и подписями действий.
 */

/** Тип действия кнопки */
export type ButtonActionType = 'goto' | 'command' | 'url' | 'contact' | 'location' | 'selection' | 'default' | 'complete';

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
  command: { icon: 'fa-terminal', color: 'text-orange-600 dark:text-orange-400', label: 'Выполнить команду' },
  url: { icon: 'fa-link', color: 'text-blue-600 dark:text-blue-400', label: 'Открыть ссылку' },
  selection: { icon: 'fa-check-square', color: 'text-green-600 dark:text-green-400', label: 'Выбор опции' },
  complete: { icon: 'fa-flag-checkered', color: 'text-purple-600 dark:text-purple-400', label: 'Кнопка завершения' },
  contact: { icon: 'fa-address-card', color: 'text-pink-600 dark:text-pink-400', label: 'Контакт' },
  location: { icon: 'fa-map-marker-alt', color: 'text-red-600 dark:text-red-400', label: 'Геолокация' },
  default: { icon: 'fa-circle', color: 'text-gray-600 dark:text-gray-400', label: 'По умолчанию' }
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
