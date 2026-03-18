/**
 * @fileoverview Renderer для шаблона hideAfterClick
 * @module templates/hide-after-click/hide-after-click.renderer
 */

import { Node, Button } from '@shared/schema';
import { renderPartialTemplate } from '../template-renderer';
import type { HideAfterClickParams } from './hide-after-click.params';

function extractButtons(node: Node): Button[] {
  if (!node.data?.buttons || !Array.isArray(node.data.buttons)) return [];
  return node.data.buttons.filter((b: Button) => b.hideAfterClick === true);
}

/**
 * Генерирует код обработки hideAfterClick для каждой кнопки
 */
export function generateHideAfterClickHandler(node: Node): string {
  const buttons = extractButtons(node);
  if (buttons.length === 0) return '';
  const params: HideAfterClickParams = { buttons };
  return renderPartialTemplate('hide-after-click/hide-after-click.py.jinja2', params);
}

/**
 * Генерирует middleware-проверку hideAfterClick в callback-обработчике
 */
export function generateHideAfterClickMiddleware(node: Node): string {
  const buttons = extractButtons(node);
  if (buttons.length === 0) return '';
  const buttonIds = buttons.map((b: Button) => b.id).filter(Boolean) as string[];
  return renderPartialTemplate('hide-after-click/hide-after-click.middleware.py.jinja2', {
    buttons,
    buttonIds,
  });
}
