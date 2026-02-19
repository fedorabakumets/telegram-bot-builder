/**
 * @fileoverview Конфигурация действий для кнопок условных сообщений
 */

export type ConditionalButtonAction = 'goto' | 'url' | 'command' | 'selection';

export interface ConditionalActionOption {
  value: ConditionalButtonAction;
  label: string;
}

export const CONDITIONAL_BUTTON_ACTIONS: ConditionalActionOption[] = [
  { value: 'goto', label: 'Перейти к узлу' },
  { value: 'url', label: 'Открыть ссылку' },
  { value: 'command', label: 'Выполнить команду' },
  { value: 'selection', label: 'Выбор опции' }
];
