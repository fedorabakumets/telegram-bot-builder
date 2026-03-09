/**
 * @fileoverview Конфигурация действий для кнопок ответов
 * @description Содержит типы действий и их конфигурацию.
 */

/** Тип действия кнопки */
export type ResponseAction = 'goto' | 'command' | 'url' | 'selection';

/** Опция действия */
export interface ActionOption {
  /** Значение действия */
  value: ResponseAction;
  /** Текст отображения */
  label: string;
  /** Иконка */
  icon: string;
  /** Цвет иконки */
  iconColor: string;
}

/** Доступные действия */
export const ACTION_OPTIONS: ActionOption[] = [
  {
    value: 'goto',
    label: 'Перейти к экрану',
    icon: 'fa-arrow-right',
    iconColor: 'text-blue-500'
  },
  {
    value: 'command',
    label: 'Выполнить команду',
    icon: 'fa-terminal',
    iconColor: 'text-purple-500'
  },
  {
    value: 'url',
    label: 'Открыть ссылку',
    icon: 'fa-external-link-alt',
    iconColor: 'text-green-500'
  },
  {
    value: 'selection',
    label: 'Выбор опции',
    icon: 'fa-check-square',
    iconColor: 'text-purple-500'
  }
];
