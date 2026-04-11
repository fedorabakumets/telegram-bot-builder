/**
 * @fileoverview Определение компонента клавиатуры
 * Отдельная нода для настройки inline/reply кнопок.
 * @module components/editor/sidebar/massive/messages/keyboard
 */

import { ComponentDefinition } from '@shared/schema';
import { normalizeDynamicButtonsConfig } from '@/components/editor/properties/utils/dynamic-buttons';

/** Клавиатура как отдельный узел редактора */
export const keyboardMessage: ComponentDefinition = {
  id: 'keyboard-message',
  name: 'Клавиатура',
  description: 'Отдельная нода для кнопок и раскладок',
  icon: 'fas fa-keyboard',
  color: 'bg-amber-100 text-amber-600',
  type: 'keyboard',
  defaultData: {
    keyboardType: 'inline',
    buttons: [
      { id: 'btn-default-1', text: 'Кнопка 1', action: 'goto', target: '' },
      { id: 'btn-default-2', text: 'Кнопка 2', action: 'goto', target: '' },
    ],
    enableDynamicButtons: false,
    dynamicButtons: normalizeDynamicButtonsConfig({
      sourceVariable: '',
      arrayPath: '',
      textTemplate: '{name}',
      callbackTemplate: 'project_{id}',
      styleMode: 'none',
      styleField: '',
      styleTemplate: '',
      columns: 2,
    }),
    allowMultipleSelection: false,
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true
  }
};
