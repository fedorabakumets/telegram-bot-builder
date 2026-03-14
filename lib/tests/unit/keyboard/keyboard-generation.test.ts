/**
 * @fileoverview Тесты для генерации клавиатур с новыми функциями
 * @module lib/tests/unit/keyboard/keyboard-generation.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { generateKeyboard } from '../../../bot-generator/Keyboard/generateKeyboard';
import { generateReplyKeyboardCode } from '../../../bot-generator/Keyboard/generateReplyKeyboardCode';
import { generateInlineKeyboardCode } from '../../../bot-generator/Keyboard/generateInlineKeyboardCode';
import { hasMultiSelectNodes } from '../../../bot-generator/Keyboard/hasMultiSelectNodes';
import { identifyNodesRequiringMultiSelectLogic } from '../../../bot-generator/Keyboard/identifyNodesRequiringMultiSelectLogic';
import type { Node } from '@shared/schema';

describe('KeyboardGeneration (new features)', () => {
  describe('generateKeyboard - complete action', () => {
    it('должен генерировать код для inline клавиатуры с complete кнопкой', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Выберите опции',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_complete',
              text: 'Готово',
              action: 'complete' as const,
              target: 'final',
            },
          ],
          allowMultipleSelection: true,
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1', 'final']);

      // Assert
      assert.ok(code);
      assert.ok(code.length > 0);
    });

    it('должен генерировать код для reply клавиатуры с complete кнопкой', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Выберите опции',
          keyboardType: 'reply',
          buttons: [
            {
              id: 'btn_1',
              text: 'Опция 1',
              action: 'selection',
              target: 'test_1',
            },
            {
              id: 'btn_complete',
              text: 'Завершить',
              action: 'complete',
              target: 'final',
            },
          ],
          allowMultipleSelection: true,
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1', 'final']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('ReplyKeyboardBuilder'));
      assert.ok(code.includes('Завершить'));
    });

    it('должен генерировать код с обработкой complete кнопки в множественном выборе', () => {
      // Arrange
      const node: Node = {
        id: 'multiselect_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Выберите интересы',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_1',
              text: 'Интерес 1',
              action: 'selection',
              target: 'multiselect_1',
            },
            {
              id: 'btn_2',
              text: 'Интерес 2',
              action: 'selection',
              target: 'multiselect_1',
            },
            {
              id: 'btn_done',
              text: 'Готово',
              action: 'complete',
              target: 'final_node',
            },
          ],
          allowMultipleSelection: true,
          multiSelectVariable: 'user_interests',
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['multiselect_1', 'final_node']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('multi_select'));
      assert.ok(code.includes('Готово'));
    });

    it('должен генерировать код с continueButtonText если нет complete кнопки', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Выберите опции',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_1',
              text: 'Опция 1',
              action: 'selection',
              target: 'test_1',
            },
          ],
          allowMultipleSelection: true,
          continueButtonText: 'Продолжить',
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1']);

      // Assert
      assert.ok(code);
    });
  });

  describe('generateKeyboard - variableFilters', () => {
    it('должен генерировать код с переменной для фильтров', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Привет, {user_name|join:", "}!',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_1',
              text: 'Кнопка',
              action: 'goto',
              target: 'next',
            },
          ],
          variableFilters: {
            'user_name': '|join:", "',
          },
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1', 'next']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('variable_filters') || code.includes('replace_variables'));
    });

    it('должен генерировать код с несколькими фильтрами переменных', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Информация: {tags|join:", "}, {values|join:"\\n"}',
          keyboardType: 'reply',
          buttons: [],
          variableFilters: {
            'tags': '|join:", "',
            'values': '|join:"\\n"',
          },
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1']);

      // Assert
      assert.ok(code);
    });
  });

  describe('generateKeyboard - appendVariable', () => {
    it('должен генерировать код для узла с appendVariable = true', () => {
      // Arrange
      const node: Node = {
        id: 'input_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Введите значение',
          keyboardType: 'none',
          buttons: [],
          collectUserInput: true,
          inputVariable: 'user_values',
          appendVariable: true,
          inputTargetNodeId: 'next_node',
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['input_1', 'next_node']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('waiting_for_input'));
    });

    it('должен генерировать код с waiting_state для appendVariable', () => {
      // Arrange
      const node: Node = {
        id: 'input_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Введите значение',
          collectUserInput: true,
          inputVariable: 'user_values',
          appendVariable: true,
          inputTargetNodeId: 'next',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['input_1', 'next']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('waiting_for_input') || code.includes('waiting_state'));
    });
  });

  describe('hasMultiSelectNodes', () => {
    it('должен возвращать true для узлов с selection кнопками', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'test_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Test',
            buttons: [
              {
                id: 'btn_1',
                text: 'Выбрать',
                action: 'selection',
                target: 'test_1',
              },
            ],
            allowMultipleSelection: true,
          },
        },
      ] as unknown as Node[];

      // Act
      const result = hasMultiSelectNodes(nodes);

      // Assert
      assert.strictEqual(result, true);
    });

    it('должен возвращать false для узлов без selection кнопок', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'test_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Test',
            buttons: [
              {
                id: 'btn_1',
                text: 'Кнопка',
                action: 'goto',
                target: 'next',
              },
            ],
          },
        },
      ] as unknown as Node[];

      // Act
      const result = hasMultiSelectNodes(nodes);

      // Assert
      assert.strictEqual(result, false);
    });

    it('должен возвращать false для пустого массива узлов', () => {
      // Arrange
      const nodes: Node[] = [];

      // Act
      const result = hasMultiSelectNodes(nodes);

      // Assert
      assert.strictEqual(result, false);
    });

    it('должен возвращать true для узлов с complete кнопкой', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'test_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Test',
            buttons: [
              {
                id: 'btn_complete',
                text: 'Готово',
                action: 'complete',
                target: 'final',
              },
            ],
            allowMultipleSelection: true,
          },
        },
      ] as unknown as Node[];

      // Act
      const result = hasMultiSelectNodes(nodes);

      // Assert
      assert.strictEqual(result, true);
    });
  });

  describe('identifyNodesRequiringMultiSelectLogic', () => {
    it('должен идентифицировать узлы с множественным выбором', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'multiselect_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Выберите опции',
            buttons: [
              {
                id: 'btn_1',
                text: 'Опция 1',
                action: 'selection',
                target: 'multiselect_1',
              },
              {
                id: 'btn_complete',
                text: 'Готово',
                action: 'complete',
                target: 'final',
              },
            ],
            allowMultipleSelection: true,
          },
        },
        {
          id: 'regular_1',
          type: 'message',
          position: { x: 200, y: 200 },
          data: {
            text: 'Regular',
            buttons: [],
          },
        },
      ] as unknown as Node[];

      // Act
      const result = identifyNodesRequiringMultiSelectLogic(nodes);

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'multiselect_1');
    });

    it('должен возвращать пустой массив если нет узлов с множественным выбором', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'regular_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Regular',
            buttons: [],
          },
        },
      ] as unknown as Node[];

      // Act
      const result = identifyNodesRequiringMultiSelectLogic(nodes);

      // Assert
      assert.strictEqual(result.length, 0);
    });

    it('должен идентифицировать несколько узлов с множественным выбором', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'multiselect_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Выберите опции 1',
            buttons: [
              {
                id: 'btn_1',
                text: 'Опция 1',
                action: 'selection',
                target: 'multiselect_1',
              },
              {
                id: 'btn_complete',
                text: 'Готово',
                action: 'complete',
                target: 'final',
              },
            ],
            allowMultipleSelection: true,
          },
        },
        {
          id: 'multiselect_2',
          type: 'message',
          position: { x: 200, y: 200 },
          data: {
            text: 'Выберите опции 2',
            buttons: [
              {
                id: 'btn_2',
                text: 'Опция 2',
                action: 'selection',
                target: 'multiselect_2',
              },
              {
                id: 'btn_complete_2',
                text: 'Готово',
                action: 'complete',
                target: 'final',
              },
            ],
            allowMultipleSelection: true,
          },
        },
      ] as unknown as Node[];

      // Act
      const result = identifyNodesRequiringMultiSelectLogic(nodes);

      // Assert
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(n => n.id === 'multiselect_1'));
      assert.ok(result.some(n => n.id === 'multiselect_2'));
    });
  });

  describe('generateReplyKeyboardCode', () => {
    it('должен генерировать код для reply клавиатуры', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'reply',
          buttons: [
            {
              id: 'btn_1',
              text: 'Кнопка 1',
              action: 'goto',
              target: 'next',
            },
            {
              id: 'btn_2',
              text: 'Кнопка 2',
              action: 'goto',
              target: 'next',
            },
          ],
        },
      } as unknown as Node;

      // Act
      const code = generateReplyKeyboardCode(node);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('ReplyKeyboardBuilder'));
      assert.ok(code.includes('Кнопка 1'));
      assert.ok(code.includes('Кнопка 2'));
    });

    it('должен генерировать код с resizeKeyboard и oneTimeKeyboard', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'reply',
          buttons: [
            {
              id: 'btn_1',
              text: 'Кнопка',
              action: 'goto',
              target: 'next',
            },
          ],
          resizeKeyboard: true,
          oneTimeKeyboard: true,
        },
      } as unknown as Node;

      // Act
      const code = generateReplyKeyboardCode(node);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('resize_keyboard'));
      assert.ok(code.includes('one_time_keyboard'));
    });
  });

  describe('generateInlineKeyboardCode', () => {
    it('должен генерировать код для inline клавиатуры', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_1',
              text: 'Кнопка 1',
              action: 'goto',
              target: 'next',
            },
            {
              id: 'btn_2',
              text: 'Кнопка 2',
              action: 'goto',
              target: 'next',
            },
          ],
        },
      } as unknown as Node;

      // Act
      const code = generateInlineKeyboardCode(node, ['test_1', 'next']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('InlineKeyboardBuilder'));
      assert.ok(code.includes('callback_data'));
    });

    it('должен генерировать код для inline кнопки с URL', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_url',
              text: 'Ссылка',
              action: 'url',
              url: 'https://example.com',
            },
          ],
        },
      } as unknown as Node;

      // Act
      const code = generateInlineKeyboardCode(node, ['test_1']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('InlineKeyboardButton'));
      assert.ok(code.includes('url='));
      assert.ok(code.includes('https://example.com'));
    });

    it('должен генерировать код для inline кнопки с complete action', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_complete',
              text: 'Готово',
              action: 'complete',
              target: 'final',
            },
          ],
          allowMultipleSelection: true,
        },
      } as unknown as Node;

      // Act
      const code = generateInlineKeyboardCode(node, ['test_1', 'final']);

      // Assert
      assert.ok(code);
      assert.ok(code.includes('callback_data'));
    });
  });

  describe('Edge cases', () => {
    it('должен обрабатывать узел без кнопок', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'none',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1']);

      // Assert
      assert.ok(code);
    });

    it('должен обрабатывать узел с пустым text', () => {
      // Arrange
      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: '',
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_1',
              text: 'Кнопка',
              action: 'goto',
              target: 'next',
            },
          ],
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1', 'next']);

      // Assert
      assert.ok(code);
    });

    it('должен обрабатывать узел с большим количеством кнопок', () => {
      // Arrange
      const buttons = Array.from({ length: 20 }, (_, i) => ({
        id: `btn_${i}`,
        text: `Кнопка ${i}`,
        action: 'goto' as const,
        target: 'next',
      }));

      const node: Node = {
        id: 'test_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          keyboardType: 'inline',
          buttons,
        },
      } as unknown as Node;

      // Act
      const code = generateKeyboard(node, ['test_1', 'next']);

      // Assert
      assert.ok(code);
      assert.ok(code.length > 100);
    });
  });
});
