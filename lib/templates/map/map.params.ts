/**
 * @fileoverview Параметры для шаблона отправки геолокации
 * @module templates/map/map.params
 */

import type { Button } from '../../bot-generator/types/button-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика геолокации */
export interface MapTemplateParams {
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: string;

  // --- Контент ---
  /** Текст сообщения */
  messageText?: string;
  /** Режим форматирования */
  formatMode?: FormatMode;

  // --- Геолокация ---
  /** Широта */
  latitude?: number;
  /** Долгота */
  longitude?: number;
  /** Название места */
  locationTitle?: string;
  /** Адрес места */
  locationAddress?: string;
  /** Запросить геолокацию у пользователя */
  requestUserLocation?: boolean;
  /** Переменная для сохранения геолокации пользователя */
  locationVariable?: string;

  // --- Доступ ---
  /** Только приватные чаты */
  isPrivateOnly?: boolean;
  /** Только администраторы */
  adminOnly?: boolean;
  /** Требуется авторизация */
  requiresAuth?: boolean;
  /** База данных пользователей включена */
  userDatabaseEnabled?: boolean;

  // --- Клавиатура ---
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Кнопки */
  buttons?: Button[];
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard?: boolean;
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard?: boolean;

  // --- Автопереход ---
  /** Автопереход включен */
  enableAutoTransition?: boolean;
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
}
