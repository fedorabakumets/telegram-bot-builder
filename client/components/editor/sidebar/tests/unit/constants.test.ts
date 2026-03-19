/**
 * @fileoverview Тесты для констант sidebar
 * @module tests/unit/constants.test
 */

/// <reference types="vitest/globals" />

import { componentCategories } from '../../constants';

describe('componentCategories', () => {
  it('должен быть массивом', () => {
    expect(Array.isArray(componentCategories)).toBe(true);
  });

  it('должен содержать более 0 категорий', () => {
    expect(componentCategories.length).toBeGreaterThan(0);
  });

  it('каждая категория должна иметь title и components', () => {
    componentCategories.forEach(category => {
      expect(category).toHaveProperty('title');
      expect(category).toHaveProperty('components');
      expect(Array.isArray(category.components)).toBe(true);
    });
  });

  it('должен содержать категорию "Сообщения"', () => {
    const messagesCategory = componentCategories.find(c => c.title === 'Сообщения');
    expect(messagesCategory).toBeDefined();
    expect(messagesCategory?.components.length).toBeGreaterThan(0);
  });

  it('должен содержать категорию "Команды"', () => {
    const commandsCategory = componentCategories.find(c => c.title === 'Команды');
    expect(commandsCategory).toBeDefined();
    expect(commandsCategory?.components.length).toBeGreaterThan(0);
  });

  it('должен содержать категорию "Рассылка"', () => {
    const broadcastCategory = componentCategories.find(c => c.title === 'Рассылка');
    expect(broadcastCategory).toBeDefined();
    expect(broadcastCategory?.components.length).toBeGreaterThan(0);
  });

  it('каждый компонент должен иметь id, name, description', () => {
    componentCategories.forEach(category => {
      category.components.forEach(component => {
        expect(component).toHaveProperty('id');
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('description');
      });
    });
  });
});
