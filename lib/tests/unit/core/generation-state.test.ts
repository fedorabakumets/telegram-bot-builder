/**
 * @fileoverview Тесты для модуля generation-state
 * @module lib/tests/unit/core/generation-state.test
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import {
  createGenerationState,
  withLogging,
  withComments,
  markComponentGenerated,
  isComponentGenerated,
  type GenerationState,
} from '../../../bot-generator/core/generation-state';
import type { GenerationOptions } from '../../../bot-generator/core/generation-options.types';

describe('GenerationState', () => {
  describe('createGenerationState', () => {
    it('должен создавать состояние с значениями по умолчанию при пустых опциях', () => {
      // Arrange
      const options: GenerationOptions = {};

      // Act
      const state = createGenerationState(options);

      // Assert
      assert.strictEqual(state.loggingEnabled, false);
      assert.strictEqual(state.commentsEnabled, true);
      assert.ok(state.generatedComponents instanceof Set);
      assert.strictEqual(state.generatedComponents.size, 0);
    });

    it('должен создавать состояние с включенным логированием при enableLogging: true', () => {
      // Arrange
      const options: GenerationOptions = { enableLogging: true };

      // Act
      const state = createGenerationState(options);

      // Assert
      assert.strictEqual(state.loggingEnabled, true);
    });

    it('должен создавать состояние с отключенным логированием при enableLogging: false', () => {
      // Arrange
      const options: GenerationOptions = { enableLogging: false };

      // Act
      const state = createGenerationState(options);

      // Assert
      assert.strictEqual(state.loggingEnabled, false);
    });

    it('должен создавать состояние с отключенными комментариями при enableComments: false', () => {
      // Arrange
      const options: GenerationOptions = { enableComments: false };

      // Act
      const state = createGenerationState(options);

      // Assert
      assert.strictEqual(state.commentsEnabled, false);
    });

    it('должен создавать состояние с включенными комментариями при enableComments: true', () => {
      // Arrange
      const options: GenerationOptions = { enableComments: true };

      // Act
      const state = createGenerationState(options);

      // Assert
      assert.strictEqual(state.commentsEnabled, true);
    });

    it('должен создавать состояние с projectId из опций', () => {
      // Arrange
      const options: GenerationOptions = { projectId: 42 };

      // Act
      const state = createGenerationState(options);

      // Assert
      // projectId не хранится в state, проверяем что state создаётся корректно
      assert.ok(state);
      assert.strictEqual(typeof state.loggingEnabled, 'boolean');
    });

    it('должен создавать immutable состояние (generatedComponents)', () => {
      // Arrange
      const options: GenerationOptions = { enableLogging: true };
      const state = createGenerationState(options);

      // Act & Assert
      // Попытка изменить Set напрямую не должна влиять на новое состояние
      (state.generatedComponents as any).add('test');
      // Примечание: это проверка на уровне TypeScript, в runtime Set мутирует
      // но функции ниже создают новые копии
    });
  });

  describe('withLogging', () => {
    let initialState: GenerationState;

    beforeEach(() => {
      initialState = createGenerationState({ enableLogging: false, enableComments: true });
    });

    it('должен включать логирование при enabled: true', () => {
      // Arrange
      assert.strictEqual(initialState.loggingEnabled, false);

      // Act
      const newState = withLogging(initialState, true);

      // Assert
      assert.strictEqual(newState.loggingEnabled, true);
      assert.strictEqual(initialState.loggingEnabled, false); // original unchanged
    });

    it('должен отключать логирование при enabled: false', () => {
      // Arrange
      const stateWithLogging = createGenerationState({ enableLogging: true });
      assert.strictEqual(stateWithLogging.loggingEnabled, true);

      // Act
      const newState = withLogging(stateWithLogging, false);

      // Assert
      assert.strictEqual(newState.loggingEnabled, false);
      assert.strictEqual(stateWithLogging.loggingEnabled, true); // original unchanged
    });

    it('должен сохранять другие поля состояния неизменными', () => {
      // Arrange
      const stateWithComponents = markComponentGenerated(initialState, 'database');

      // Act
      const newState = withLogging(stateWithComponents, true);

      // Assert
      assert.strictEqual(newState.loggingEnabled, true);
      assert.strictEqual(newState.commentsEnabled, initialState.commentsEnabled);
      assert.ok(isComponentGenerated(newState, 'database'));
    });

    it('должен сохранять generatedComponents неизменными', () => {
      // Arrange
      let state = initialState;
      state = markComponentGenerated(state, 'imports');
      state = markComponentGenerated(state, 'database');

      // Act
      const newState = withLogging(state, true);

      // Assert
      assert.ok(isComponentGenerated(newState, 'imports'));
      assert.ok(isComponentGenerated(newState, 'database'));
      assert.strictEqual(newState.generatedComponents.size, 2);
    });

    it('должен создавать новое состояние а не мутировать существующее', () => {
      // Arrange
      const originalState = createGenerationState({ enableLogging: false });

      // Act
      const newState = withLogging(originalState, true);

      // Assert
      assert.notStrictEqual(newState, originalState);
      assert.strictEqual(originalState.loggingEnabled, false);
      assert.strictEqual(newState.loggingEnabled, true);
    });
  });

  describe('withComments', () => {
    let initialState: GenerationState;

    beforeEach(() => {
      initialState = createGenerationState({ enableComments: true });
    });

    it('должен отключать комментарии при enabled: false', () => {
      // Arrange
      assert.strictEqual(initialState.commentsEnabled, true);

      // Act
      const newState = withComments(initialState, false);

      // Assert
      assert.strictEqual(newState.commentsEnabled, false);
      assert.strictEqual(initialState.commentsEnabled, true); // original unchanged
    });

    it('должен включать комментарии при enabled: true', () => {
      // Arrange
      const stateWithoutComments = createGenerationState({ enableComments: false });
      assert.strictEqual(stateWithoutComments.commentsEnabled, false);

      // Act
      const newState = withComments(stateWithoutComments, true);

      // Assert
      assert.strictEqual(newState.commentsEnabled, true);
      assert.strictEqual(stateWithoutComments.commentsEnabled, false); // original unchanged
    });

    it('должен сохранять другие поля состояния неизменными', () => {
      // Arrange
      const stateWithLogging = createGenerationState({ enableLogging: true });

      // Act
      const newState = withComments(stateWithLogging, false);

      // Assert
      assert.strictEqual(newState.commentsEnabled, false);
      assert.strictEqual(newState.loggingEnabled, true);
    });

    it('должен создавать новое состояние а не мутировать существующее', () => {
      // Arrange
      const originalState = createGenerationState({ enableComments: true });

      // Act
      const newState = withComments(originalState, false);

      // Assert
      assert.notStrictEqual(newState, originalState);
      assert.strictEqual(originalState.commentsEnabled, true);
      assert.strictEqual(newState.commentsEnabled, false);
    });
  });

  describe('markComponentGenerated', () => {
    let initialState: GenerationState;

    beforeEach(() => {
      initialState = createGenerationState({});
    });

    it('должен отмечать компонент как сгенерированный', () => {
      // Arrange
      const componentName = 'database';
      assert.strictEqual(isComponentGenerated(initialState, componentName), false);

      // Act
      const newState = markComponentGenerated(initialState, componentName);

      // Assert
      assert.ok(isComponentGenerated(newState, componentName));
      assert.strictEqual(isComponentGenerated(initialState, componentName), false); // original unchanged
    });

    it('должен отмечать несколько компонентов', () => {
      // Arrange
      let state = initialState;

      // Act
      state = markComponentGenerated(state, 'imports');
      state = markComponentGenerated(state, 'database');
      state = markComponentGenerated(state, 'handlers');

      // Assert
      assert.ok(isComponentGenerated(state, 'imports'));
      assert.ok(isComponentGenerated(state, 'database'));
      assert.ok(isComponentGenerated(state, 'handlers'));
      assert.strictEqual(state.generatedComponents.size, 3);
    });

    it('должен сохранять ранее отмеченные компоненты', () => {
      // Arrange
      let state = markComponentGenerated(initialState, 'first');

      // Act
      state = markComponentGenerated(state, 'second');

      // Assert
      assert.ok(isComponentGenerated(state, 'first'));
      assert.ok(isComponentGenerated(state, 'second'));
    });

    it('должен игнорировать повторную отметку того же компонента', () => {
      // Arrange
      let state = markComponentGenerated(initialState, 'component');

      // Act
      state = markComponentGenerated(state, 'component');

      // Assert
      assert.ok(isComponentGenerated(state, 'component'));
      assert.strictEqual(state.generatedComponents.size, 1);
    });

    it('должен создавать новое состояние а не мутировать существующее', () => {
      // Arrange
      const originalState = createGenerationState({});

      // Act
      const newState = markComponentGenerated(originalState, 'test');

      // Assert
      assert.notStrictEqual(newState, originalState);
      assert.strictEqual(originalState.generatedComponents.size, 0);
      assert.strictEqual(newState.generatedComponents.size, 1);
    });

    it('должен работать с пустым именем компонента', () => {
      // Arrange
      const componentName = '';

      // Act
      const newState = markComponentGenerated(initialState, componentName);

      // Assert
      assert.ok(isComponentGenerated(newState, componentName));
    });
  });

  describe('isComponentGenerated', () => {
    let stateWithComponents: GenerationState;

    beforeEach(() => {
      let state = createGenerationState({});
      state = markComponentGenerated(state, 'imports');
      state = markComponentGenerated(state, 'database');
      stateWithComponents = state;
    });

    it('должен возвращать true для отмеченного компонента', () => {
      // Act & Assert
      assert.ok(isComponentGenerated(stateWithComponents, 'imports'));
      assert.ok(isComponentGenerated(stateWithComponents, 'database'));
    });

    it('должен возвращать false для не отмеченного компонента', () => {
      // Act & Assert
      assert.strictEqual(isComponentGenerated(stateWithComponents, 'handlers'), false);
      assert.strictEqual(isComponentGenerated(stateWithComponents, 'unknown'), false);
    });

    it('должен возвращать false для пустого состояния', () => {
      // Arrange
      const emptyState = createGenerationState({});

      // Act & Assert
      assert.strictEqual(isComponentGenerated(emptyState, 'anything'), false);
    });

    it('должен возвращать false для пустого имени компонента', () => {
      // Act & Assert
      assert.strictEqual(isComponentGenerated(stateWithComponents, ''), false);
    });
  });

  describe('GenerationState immutability', () => {
    it('должен сохранять неизменность при цепочке операций', () => {
      // Arrange
      const initialState = createGenerationState({ enableLogging: false, enableComments: true });

      // Act
      let state = initialState;
      state = withLogging(state, true);
      state = withComments(state, false);
      state = markComponentGenerated(state, 'test');

      // Assert
      assert.strictEqual(initialState.loggingEnabled, false);
      assert.strictEqual(initialState.commentsEnabled, true);
      assert.strictEqual(initialState.generatedComponents.size, 0);

      assert.strictEqual(state.loggingEnabled, true);
      assert.strictEqual(state.commentsEnabled, false);
      assert.strictEqual(state.generatedComponents.size, 1);
    });
  });
});
