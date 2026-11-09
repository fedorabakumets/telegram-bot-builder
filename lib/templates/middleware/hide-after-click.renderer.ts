/**
 * @fileoverview Общая генерация скрытия inline-клавиатуры перед обработкой нажатия.
 */

import type { Node } from '@shared/schema';
import { renderPartialTemplate } from '../template-renderer';

/** Экранирует шаблон кнопки для сопоставления с уже отрисованным значением. */
function templatePattern(value: string): string {
  return value.split(/(\{[^{}]+\})/g).map(part =>
    /^\{[^{}]+\}$/.test(part) ? '[\\s\\S]*?' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('');
}

/** Генерирует middleware независимо от типа целевого узла и настроек БД. */
export function generateHideAfterClickMiddleware(nodes: Node[]): string {
  const rules = nodes.filter(node => node &&
    (node.type === 'keyboard' || node.data?.keyboardType === 'inline'))
    .flatMap(node => (node.data?.buttons || []).filter(button =>
      !['url', 'web_app', 'copy_text', 'pay'].includes(button.action))
      .map(button => {
        const callback = button.action === 'goto' || button.action === 'complete'
          ? button.customCallbackData || button.target || button.id || 'no_action'
          : button.id || button.target || 'btn';
        return {
          callbackPattern: templatePattern(callback),
          textPattern: templatePattern(button.text || ''),
          hide: button.hideAfterClick === true ? 1 : 0,
        };
      }));
  if (!rules.some(rule => rule.hide)) return '';
  return renderPartialTemplate('middleware/hide-after-click.py.jinja2', { rules });
}
