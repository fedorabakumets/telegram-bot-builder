/**
 * @fileoverview Константы цветов портов и типов соединений
 *
 * Единый источник истины для цветов портов выхода (OutputPort)
 * и линий соединений (ConnectionsLayer). Переиспользуется в обоих компонентах.
 *
 * @module port-colors
 */

/**
 * Тип порта выхода / тип соединения
 * - "trigger-next" - переход из узла command_trigger (жёлтый)
 * - "auto-transition" - автопереход (зелёный)
 * - "button-goto" - переход по кнопке goto (синий)
 * - "keyboard-link" - отдельная привязка keyboard к message (янтарный)
 * - "input-target" - переход после ввода пользователя (фиолетовый)
 */
export type PortType = 'trigger-next' | 'auto-transition' | 'button-goto' | 'keyboard-link' | 'input-target';

/**
 * Цвета портов по типу соединения
 *
 * Используется в OutputPort (цвет кружка) и ConnectionsLayer (цвет линии).
 */
export const PORT_COLORS: Record<PortType, string> = {
  /** Жёлтый - переход из command_trigger */
  'trigger-next': '#eab308',
  /** Зелёный - автопереход */
  'auto-transition': '#22c55e',
  /** Синий - переход по кнопке goto */
  'button-goto': '#3b82f6',
  /** Янтарный - привязка keyboard к message */
  'keyboard-link': '#f59e0b',
  /** Фиолетовый - переход после ввода пользователя */
  'input-target': '#a855f7',
};
