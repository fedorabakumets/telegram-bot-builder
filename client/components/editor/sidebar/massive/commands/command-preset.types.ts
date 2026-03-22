/**
 * @fileoverview Типы для пресетов команд — комбинаций command_trigger + message
 * @module components/editor/sidebar/massive/commands/command-preset.types
 */

/** Пресет команды — создаёт command_trigger + message на холсте */
export interface CommandPreset {
  /** Уникальный ID пресета */
  id: string;
  /** Отображаемое имя в сайдбаре */
  name: string;
  /** Описание */
  description: string;
  /** Иконка */
  icon: string;
  /** Цвет */
  color: string;
  /** Маркер типа для обработчика дропа */
  type: 'command_preset';
  /** Данные для command_trigger узла */
  triggerData: {
    command: string;
    description?: string;
    showInMenu?: boolean;
    isPrivateOnly?: boolean;
  };
  /** Данные для message узла */
  messageData: {
    text: string;
    buttons?: Array<{ text: string; callbackData?: string }>;
  };
}
