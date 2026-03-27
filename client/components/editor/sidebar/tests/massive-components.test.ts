import { describe, it, expect } from 'vitest';
import { componentCategories } from '../constants';
import { saveAnswerNode } from '../massive/messages/save-answer';

describe('sidebar massive components', () => {
  it('contains the save-answer node in the input category', () => {
    const inputCategory = componentCategories.find((category) => category.title === 'Ввод');
    expect(inputCategory).toBeTruthy();
    expect(inputCategory?.components.some((component) => component.type === 'input')).toBe(true);
    expect(inputCategory?.components[0].name).toBe('Сохранить ответ в переменную');
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
