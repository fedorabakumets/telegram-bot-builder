/**
 * @fileoverview Параметры для шаблона клавиатуры
 * @module templates/keyboard/keyboard.params
 */

import type { Button } from '../../transitions/types/button-response-config-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Параметры для генерации клавиатуры */
export interface KeyboardTemplateParams {
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Кнопки */
  buttons?: Button[];
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard?: boolean;
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard?: boolean;
}
