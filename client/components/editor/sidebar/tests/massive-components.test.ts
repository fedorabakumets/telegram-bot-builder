/**
 * @fileoverview Тесты состава палитры сайдбара
 * @module components/editor/sidebar/tests/massive-components.test
 */

import { describe, it, expect } from 'vitest';
import { componentCategories, flattenPaletteSubcategories } from '../constants';
import { saveAnswerNode } from '../massive/messages/save-answer';

describe('sidebar massive components', () => {
  it('содержит save-answer в подкатегории Сообщения у Telegram Bot API', () => {
    const botApi = componentCategories.find((c) => c.title === 'Telegram Bot API');
    expect(botApi).toBeTruthy();
    const messages = botApi?.subcategories.find((s) => s.title === 'Сообщения');
    expect(messages).toBeTruthy();
    expect(messages?.components.some((c) => c.type === 'input')).toBe(true);
  });

  it('имеет ровно три главные категории', () => {
    expect(componentCategories.map((c) => c.title)).toEqual([
      'Telegram Bot API',
      'Userbot Telegram API',
      'Остальное',
    ]);
  });

  it('юзербот-ноды лежат во второй главной категории', () => {
    const userbot = componentCategories.find((c) => c.title === 'Userbot Telegram API');
    const types = flattenPaletteSubcategories([userbot!]).flatMap((s) =>
      s.components.map((c) => c.type),
    );
    expect(types).toContain('userbot_message');
    expect(types).toContain('userbot_click_button');
  });

  it('defines save-answer node with input defaults', () => {
    expect(saveAnswerNode.type).toBe('input');
    expect(saveAnswerNode.name).toBe('Сохранить ответ в переменную');
    expect(saveAnswerNode.defaultData.inputType).toBe('any');
    expect(saveAnswerNode.defaultData.inputVariable).toBe('');
    expect(saveAnswerNode.defaultData.appendVariable).toBe(false);
    expect(saveAnswerNode.defaultData.saveToDatabase).toBe(false);
  });
});
