/**
 * @fileoverview Renderer для шаблона command-navigation
 * @module templates/command-navigation/command-navigation.renderer
 */

import type { CommandNavigationTemplateParams } from './command-navigation.params';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код навигации к узлу команды через fake_message.
 * Заменяет generateCommandNavigation() из bot-generator/transitions/generate-command-navigation.ts
 */
export function generateCommandNavigation(params: CommandNavigationTemplateParams): string {
  return renderPartialTemplate('command-navigation/command-navigation.py.jinja2', params);
}
