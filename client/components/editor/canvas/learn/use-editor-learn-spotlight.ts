/**
 * @fileoverview Раскрывает раздел палитры и прокручивает к карточке шага
 * @module components/editor/canvas/learn/use-editor-learn-spotlight
 */

import { useEffect } from 'react';

/** Секции, в которых лежат триггер команды и текстовое сообщение */
const MESSAGE_SECTIONS = [
  'category-Telegram Bot API',
  'category-Telegram Bot API::Сообщения',
];

/**
 * Помечает последний блок нужного типа на холсте и прокручивает к нему
 * @param nodeType - Тип блока
 * @param target - Метка для рамки обучения
 */
function markLastNode(nodeType: string, target: string): void {
  document.querySelectorAll('[data-learn-target]').forEach((el) => el.removeAttribute('data-learn-target'));
  const nodes = document.querySelectorAll(`[data-node-type="${nodeType}"]`);
  const node = nodes[nodes.length - 1];
  if (!(node instanceof HTMLElement)) return;
  node.setAttribute('data-learn-target', target);
  node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/**
 * Открывает свёрнутую секцию палитры
 * @param testId - data-testid кнопки секции
 */
function openSection(testId: string): void {
  const button = document.querySelector(`[data-testid="${testId}"]`);
  if (button instanceof HTMLButtonElement && button.querySelector('svg.lucide-chevron-right')) {
    button.click();
  }
}

/**
 * Показывает карточку, на которую указывает шаг
 * @param spotlight - CSS-селектор карточки или пусто
 */
export function useEditorLearnSpotlight(spotlight?: string): void {
  useEffect(() => {
    if (!spotlight) return;
    const reveal = () => {
      const card = document.querySelector(spotlight);
      if (card) {
        card.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (spotlight.includes('component-command-trigger') || spotlight.includes('text-message')) {
        MESSAGE_SECTIONS.forEach(openSection);
      }
      if (spotlight.includes('data-learn-target="command-trigger"')) {
        markLastNode('command_trigger', 'command-trigger');
      }
    };
    reveal();
    const first = window.setTimeout(reveal, 80);
    const second = window.setTimeout(reveal, 240);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [spotlight]);
}
