/**
 * @fileoverview Опции типа кнопки
 *
 * Переиспользуемый компонент с иконками и подписями типов кнопок.
 */

import type { Button } from '@shared/schema';

/** Тип кнопки */
export type ButtonType = Button['buttonType'];

/** Пропсы для рендеринга опции типа кнопки */
interface ButtonTypeOptionProps {
  /** Тип кнопки */
  buttonType: ButtonType;
}

/**
 * Конфигурация иконок и стилей для каждого типа кнопки
 */
const TYPE_CONFIG: Record<NonNullable<ButtonType>, { color: string; label: string }> = {
  normal: { color: 'bg-blue-500', label: 'Обычная кнопка' },
  option: { color: 'bg-green-500', label: 'Опция для выбора' },
  complete: { color: 'bg-purple-500', label: 'Кнопка завершения' }
};

/**
 * Компонент опции типа кнопки
 *
 * @param {ButtonTypeOptionProps} props - Пропсы компонента
 * @returns {JSX.Element} Опция типа с иконкой
 */
export function ButtonTypeOption({ buttonType }: ButtonTypeOptionProps) {
  const config = TYPE_CONFIG[buttonType || 'normal'];

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', backgroundColor: 'currentColor' }}></div>
      <span>{config.label}</span>
    </div>
  );
}
