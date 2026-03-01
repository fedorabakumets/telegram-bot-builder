/**
 * @fileoverview Unit-тесты для состояния генерации
 * 
 * Модуль тестирует функции управления состоянием генерации.
 * Проверяет создание состояния, обновление и проверку компонентов.
 * 
 * @module tests/unit/generation-state.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createGenerationState,
  withLogging,
  withComments,
  markComponentGenerated,
  isComponentGenerated
} from '../../bot-generator/core/generation-state';

/**
 * Тестирование функций состояния генерации
 */
describe('GenerationState', () => {
  /**
   * Тест: создание состояния с правильными значениями по умолчанию
   */
  it('должен создавать состояние с правильными значениями по умолчанию', () => {
    const state = createGenerationState({});
    
    assert.strictEqual(state.loggingEnabled, false, 'loggingEnabled должен быть false по умолчанию');
    assert.strictEqual(state.commentsEnabled, true, 'commentsEnabled должен быть true по умолчанию');
    assert.ok(state.generatedComponents instanceof Set, 'generatedComponents должен быть Set');
    assert.strictEqual(state.generatedComponents.size, 0, 'generatedComponents должен быть пустым');
  });

  /**
   * Тест: создание состояния с включенным логированием
   */
  it('должен создавать состояние с включенным логированием', () => {
    const state = createGenerationState({ enableLogging: true });
    
    assert.strictEqual(state.loggingEnabled, true, 'loggingEnabled должен быть true');
  });

  /**
   * Тест: создание состояния с отключенными комментариями
   */
  it('должен создавать состояние с отключенными комментариями', () => {
    const state = createGenerationState({ enableComments: false });
    
    assert.strictEqual(state.commentsEnabled, false, 'commentsEnabled должен быть false');
  });

  /**
   * Тест: обновление логирования через withLogging
   */
  it('должен обновлять логирование через withLogging', () => {
    const initialState = createGenerationState({});
    const newState = withLogging(initialState, true);
    
    assert.strictEqual(initialState.loggingEnabled, false, 'Исходное состояние не должно измениться');
    assert.strictEqual(newState.loggingEnabled, true, 'Новое состояние должно иметь включенное логирование');
    assert.strictEqual(newState.commentsEnabled, initialState.commentsEnabled, 'commentsEnabled не должен измениться');
  });

  /**
   * Тест: обновление комментариев через withComments
   */
  it('должен обновлять комментарии через withComments', () => {
    const initialState = createGenerationState({});
    const newState = withComments(initialState, false);
    
    assert.strictEqual(initialState.commentsEnabled, true, 'Исходное состояние не должно измениться');
    assert.strictEqual(newState.commentsEnabled, false, 'Новое состояние должно иметь отключенные комментарии');
    assert.strictEqual(newState.loggingEnabled, initialState.loggingEnabled, 'loggingEnabled не должен измениться');
  });

  /**
   * Тест: отметка сгенерированного компонента
   */
  it('должен отмечать сгенерированные компоненты', () => {
    const state = createGenerationState({});
    const newState = markComponentGenerated(state, 'database');
    
    assert.strictEqual(state.generatedComponents.size, 0, 'Исходное состояние не должно измениться');
    assert.strictEqual(newState.generatedComponents.size, 1, 'Новое состояние должно содержать 1 компонент');
    assert.ok(isComponentGenerated(newState, 'database'), 'database должен быть отмечен');
  });

  /**
   * Тест: проверка isComponentGenerated для несуществующего компонента
   */
  it('должен возвращать false для несуществующего компонента', () => {
    const state = createGenerationState({});
    
    assert.strictEqual(isComponentGenerated(state, 'nonexistent'), false, 'Несуществующий компонент должен вернуть false');
  });

  /**
   * Тест: проверка isComponentGenerated для существующего компонента
   */
  it('должен возвращать true для существующего компонента', () => {
    const state = createGenerationState({});
    const stateWithComponent = markComponentGenerated(state, 'imports');
    
    assert.strictEqual(isComponentGenerated(stateWithComponent, 'imports'), true, 'Существующий компонент должен вернуть true');
  });

  /**
   * Тест: множественная отметка компонентов
   */
  it('должен поддерживать множественную отметку компонентов', () => {
    const state = createGenerationState({});
    const state1 = markComponentGenerated(state, 'imports');
    const state2 = markComponentGenerated(state1, 'database');
    const state3 = markComponentGenerated(state2, 'handlers');
    
    assert.strictEqual(state3.generatedComponents.size, 3, 'Должно быть 3 отмеченных компонента');
    assert.ok(isComponentGenerated(state3, 'imports'), 'imports должен быть отмечен');
    assert.ok(isComponentGenerated(state3, 'database'), 'database должен быть отмечен');
    assert.ok(isComponentGenerated(state3, 'handlers'), 'handlers должен быть отмечен');
  });

  /**
   * Тест: immutability состояния
   */
  it('должен быть immutable', () => {
    const state = createGenerationState({});
    const newState = withLogging(state, true);
    
    // Проверяем что исходное состояние не изменилось
    assert.strictEqual(state.loggingEnabled, false);
    assert.strictEqual(newState.loggingEnabled, true);
    
    // Проверяем что generatedComponents это новый Set
    const stateWithComponent = markComponentGenerated(state, 'test');
    const newStateWithComponent = markComponentGenerated(newState, 'test');
    
    assert.notStrictEqual(stateWithComponent.generatedComponents, newStateWithComponent.generatedComponents);
  });
});
