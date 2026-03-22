/**
 * @fileoverview Индекс команд для конструктора бота
 * Экспортирует все определения команд-пресетов
 */
export type { CommandPreset } from './command-preset.types';
export { startCommand } from './start-command';
export { helpCommand } from './help-command';
export { settingsCommand } from './settings-command';
export { menuCommand } from './menu-command';
export { customCommand } from './custom-command';

import { startCommand } from './start-command';
import { helpCommand } from './help-command';
import { settingsCommand } from './settings-command';
import { menuCommand } from './menu-command';
import { customCommand } from './custom-command';

/** Все пресеты команд для отображения в сайдбаре */
export const allCommandPresets = [
  startCommand,
  helpCommand,
  settingsCommand,
  menuCommand,
  customCommand,
];
