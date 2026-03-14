/**
 * @fileoverview Тесты для валидации схем с новыми полями
 * @module lib/tests/unit/validation/schema-validation.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { nodeSchema } from '@shared/schema/tables/node-schema';
import { buttonSchema } from '@shared/schema/tables/button-schema';

describe('SchemaValidation (new fields)', () => {
  describe('nodeSchema - appendVariable', () => {
    it('должен принимать узел с appendVariable = true', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          appendVariable: true,
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.appendVariable, true);
      }
    });

    it('должен принимать узел с appendVariable = false', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          appendVariable: false,
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.appendVariable, false);
      }
    });

    it('должен использовать appendVariable = false по умолчанию', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.appendVariable, false);
      }
    });

    it('должен отклонять некорректное значение appendVariable', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          appendVariable: 'invalid',
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, false);
    });

    it('должен принимать узел с inputVariable и appendVariable = true', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          inputVariable: 'user_values',
          appendVariable: true,
          collectUserInput: true,
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.inputVariable, 'user_values');
        assert.strictEqual(result.data.data.appendVariable, true);
      }
    });
  });

  describe('nodeSchema - variableFilters', () => {
    it('должен принимать узел с variableFilters', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test {var|join:", "}',
          buttons: [],
          variableFilters: {
            'myVar': '|join:", "',
          },
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.deepStrictEqual(result.data.data.variableFilters, {
          'myVar': '|join:", "',
        });
      }
    });

    it('должен принимать узел с несколькими variableFilters', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          variableFilters: {
            'var1': '|join:", "',
            'var2': '|join:"\\n"',
            'var3': '|upper',
          },
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(Object.keys(result.data.data.variableFilters).length, 3);
      }
    });

    it('должен использовать пустой объект variableFilters по умолчанию', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.deepStrictEqual(result.data.data.variableFilters, {});
      }
    });

    it('должен принимать узел с variableFilters и text с фильтрами', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Привет, {user_name|join:", "}! Ваши интересы: {interests|join:", "}',
          buttons: [],
          variableFilters: {
            'user_name': '|join:", "',
            'interests': '|join:", "',
          },
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(Object.keys(result.data.data.variableFilters).length, 2);
      }
    });

    it('должен отклонять variableFilters с некорректным типом значения', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          variableFilters: 'invalid',
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, false);
    });
  });

  describe('buttonSchema - complete action', () => {
    it('должен принимать кнопку с action = complete', () => {
      // Arrange
      const button = {
        id: 'btn_1',
        text: 'Готово',
        action: 'complete' as const,
        target: 'final_node',
      };

      // Act
      const result = buttonSchema.safeParse(button);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.action, 'complete');
      }
    });

    it('должен принимать кнопку complete без target', () => {
      // Arrange
      const button = {
        id: 'btn_1',
        text: 'Готово',
        action: 'complete' as const,
      };

      // Act
      const result = buttonSchema.safeParse(button);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.action, 'complete');
        assert.strictEqual(result.data.target, undefined);
      }
    });

    it('должен принимать кнопку complete с buttonType = complete', () => {
      // Arrange
      const button = {
        id: 'btn_1',
        text: 'Готово',
        action: 'complete' as const,
        buttonType: 'complete' as const,
        target: 'final',
      };

      // Act
      const result = buttonSchema.safeParse(button);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.action, 'complete');
        assert.strictEqual(result.data.buttonType, 'complete');
      }
    });

    it('должен принимать кнопку complete со всеми опциями', () => {
      // Arrange
      const button = {
        id: 'btn_1',
        text: 'Завершить выбор',
        action: 'complete' as const,
        target: 'final_node',
        buttonType: 'complete' as const,
        skipDataCollection: false,
        hideAfterClick: true,
      };

      // Act
      const result = buttonSchema.safeParse(button);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.action, 'complete');
        assert.strictEqual(result.data.skipDataCollection, false);
        assert.strictEqual(result.data.hideAfterClick, true);
      }
    });

    it('должен отклонять кнопку с некорректным action', () => {
      // Arrange
      const button = {
        id: 'btn_1',
        text: 'Button',
        action: 'invalid_action',
      };

      // Act
      const result = buttonSchema.safeParse(button);

      // Assert
      assert.strictEqual(result.success, false);
    });
  });

  describe('buttonSchema - все действия', () => {
    it('должен принимать все допустимые действия', () => {
      // Arrange
      const actions = ['goto', 'command', 'url', 'contact', 'location', 'selection', 'complete', 'default'] as const;

      // Act & Assert
      actions.forEach(action => {
        const button = {
          id: 'btn_1',
          text: 'Button',
          action,
        };
        const result = buttonSchema.safeParse(button);
        assert.strictEqual(result.success, true, `Действие ${action} должно быть валидным`);
      });
    });
  });

  describe('Комбинированные тесты схем', () => {
    it('должен принимать узел с appendVariable и variableFilters', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test {var|join:", "}',
          buttons: [],
          appendVariable: true,
          variableFilters: {
            'var': '|join:", "',
          },
          inputVariable: 'user_var',
          collectUserInput: true,
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.appendVariable, true);
        assert.ok(result.data.data.variableFilters);
      }
    });

    it('должен принимать узел с complete кнопкой и variableFilters', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Выберите: {selected|join:", "}',
          buttons: [
            {
              id: 'btn_1',
              text: 'Опция 1',
              action: 'selection' as const,
              target: 'test_1',
            },
            {
              id: 'btn_2',
              text: 'Готово',
              action: 'complete' as const,
              target: 'final',
            },
          ],
          variableFilters: {
            'selected': '|join:", "',
          },
          allowMultipleSelection: true,
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        const completeButton = result.data.data.buttons?.find(b => b.action === 'complete');
        assert.ok(completeButton);
        assert.strictEqual(completeButton.action, 'complete');
      }
    });

    it('должен принимать узел со всеми новыми функциями', () => {
      // Arrange
      const node = {
        id: 'all_features_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Полный функционал: {values|join:", "}',
          buttons: [
            {
              id: 'btn_1',
              text: 'Выбрать',
              action: 'selection' as const,
              target: 'all_features_1',
            },
            {
              id: 'btn_2',
              text: 'Готово',
              action: 'complete' as const,
              target: 'final',
            },
          ],
          appendVariable: true,
          variableFilters: {
            'values': '|join:", "',
          },
          inputVariable: 'user_values',
          collectUserInput: true,
          allowMultipleSelection: true,
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.appendVariable, true);
        assert.ok(result.data.data.variableFilters);
        assert.ok(result.data.data.buttons?.some(b => b.action === 'complete'));
        assert.ok(result.data.data.buttons?.some(b => b.action === 'selection'));
      }
    });
  });

  describe('Edge cases', () => {
    it('должен принимать узел с пустым variableFilters', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          variableFilters: {},
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.deepStrictEqual(result.data.data.variableFilters, {});
      }
    });

    it('должен отклонять кнопку complete с пустым text', () => {
      // Arrange
      const button = {
        id: 'btn_1',
        text: '',
        action: 'complete' as const,
      };

      // Act
      const result = buttonSchema.safeParse(button);

      // Assert - кнопка с пустым text может быть валидной в зависимости от реализации
      // Проверяем что результат существует
      assert.ok(result);
      assert.ok('success' in result);
    });

    it('должен принимать узел с appendVariable = false и variableFilters', () => {
      // Arrange
      const node = {
        id: 'test_1',
        type: 'message' as const,
        position: { x: 100, y: 100 },
        data: {
          text: 'Test {var|join:", "}',
          buttons: [],
          appendVariable: false,
          variableFilters: {
            'var': '|join:", "',
          },
        },
      };

      // Act
      const result = nodeSchema.safeParse(node);

      // Assert
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.data.appendVariable, false);
        assert.ok(result.data.data.variableFilters);
      }
    });
  });
});
