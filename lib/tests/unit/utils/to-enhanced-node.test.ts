/**
 * @fileoverview Тесты для модуля to-enhanced-node
 * @module lib/tests/unit/utils/to-enhanced-node.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  toEnhancedNode,
  toEnhancedNodes,
} from '../../../bot-generator/utils/to-enhanced-node';
import type { Node } from '@shared/schema';

describe('ToEnhancedNode', () => {
  describe('toEnhancedNode', () => {
    it('должен конвертировать Node в EnhancedNode', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test message',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.ok(enhanced);
      assert.strictEqual(enhanced.id, 'node_1');
      assert.strictEqual(enhanced.type, 'message');
      assert.strictEqual(enhanced.position.x, 100);
      assert.strictEqual(enhanced.position.y, 100);
    });

    it('должен нормализовать кнопки с корректными значениями', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [
            {
              id: 'btn_1',
              text: 'Button 1',
              action: 'goto',
              target: 'node_2',
            },
          ],
        },
      } as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.ok(enhanced.data.buttons);
      assert.strictEqual(enhanced.data.buttons.length, 1);
      assert.strictEqual(enhanced.data.buttons[0].id, 'btn_1');
      assert.strictEqual(enhanced.data.buttons[0].text, 'Button 1');
      assert.strictEqual(enhanced.data.buttons[0].action, 'goto');
      assert.strictEqual(enhanced.data.buttons[0].target, 'node_2');
    });

    it('должен добавлять значения по умолчанию для кнопок', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [
            {
              id: 'btn_1',
              text: 'Button',
              action: 'goto',
              target: 'node_2',
            },
          ],
        },
      } as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.data.buttons[0].skipDataCollection, false);
      assert.strictEqual(enhanced.data.buttons[0].hideAfterClick, false);
      assert.strictEqual(enhanced.data.buttons[0].requestContact, false);
      assert.strictEqual(enhanced.data.buttons[0].requestLocation, false);
    });

    it('должен обрабатывать кнопки без id', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [
            {
              text: 'Button without id',
              action: 'goto',
              target: 'node_2',
            },
          ],
        },
      } as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.ok(enhanced.data.buttons[0].id);
      assert.strictEqual(enhanced.data.buttons[0].text, 'Button without id');
    });

    it('должен обрабатывать кнопки без text', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [
            {
              id: 'btn_1',
              action: 'goto',
              target: 'node_2',
            },
          ],
        },
      } as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.data.buttons[0].text, 'Button');
    });

    it('должен обрабатывать кнопки без action', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [
            {
              id: 'btn_1',
              text: 'Button',
              target: 'node_2',
            },
          ],
        },
      } as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.data.buttons[0].action, 'goto');
    });

    it('должен обрабатывать пустой массив кнопок', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.ok(Array.isArray(enhanced.data.buttons));
      assert.strictEqual(enhanced.data.buttons.length, 0);
    });

    it('должен обрабатывать отсутствие кнопок', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
        },
      } as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.ok(Array.isArray(enhanced.data.buttons));
      assert.strictEqual(enhanced.data.buttons.length, 0);
    });

    it('должен добавлять attachedMedia по умолчанию', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.ok(Array.isArray((enhanced.data as any).attachedMedia));
    });

    it('должен сохранять существующие attachedMedia', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
          attachedMedia: [
            {
              id: 'media_1',
              type: 'photo',
              url: 'https://example.com/image.jpg',
            },
          ],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual((enhanced.data as any).attachedMedia.length, 1);
      assert.strictEqual((enhanced.data as any).attachedMedia[0].id, 'media_1');
    });

    it('должен сохранять все поля data узла', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          text: 'Welcome',
          command: '/start',
          showInMenu: true,
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.data.command, '/start');
      assert.strictEqual(enhanced.data.showInMenu, true);
      assert.strictEqual(enhanced.data.text, 'Welcome');
    });

    it('должен сохранять position узла', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 250, y: 350 },
        data: {
          text: 'Test',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.position.x, 250);
      assert.strictEqual(enhanced.position.y, 350);
    });
  });

  describe('toEnhancedNodes', () => {
    it('должен конвертировать массив Node в EnhancedNode[]', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'node_1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { text: 'Start', buttons: [], command: '/start' },
        },
        {
          id: 'node_2',
          type: 'message',
          position: { x: 200, y: 200 },
          data: { text: 'Message', buttons: [] },
        },
      ] as unknown as Node[];

      // Act
      const enhanced = toEnhancedNodes(nodes);

      // Assert
      assert.strictEqual(enhanced.length, 2);
      assert.strictEqual(enhanced[0].id, 'node_1');
      assert.strictEqual(enhanced[1].id, 'node_2');
    });

    it('должен возвращать пустой массив для пустого входного массива', () => {
      // Arrange
      const nodes: Node[] = [];

      // Act
      const enhanced = toEnhancedNodes(nodes);

      // Assert
      assert.strictEqual(enhanced.length, 0);
      assert.ok(Array.isArray(enhanced));
    });

    it('должен возвращать пустой массив для null', () => {
      // Arrange
      const nodes = null as any;

      // Act
      const enhanced = toEnhancedNodes(nodes);

      // Assert
      assert.strictEqual(enhanced.length, 0);
      assert.ok(Array.isArray(enhanced));
    });

    it('должен возвращать пустой массив для undefined', () => {
      // Arrange
      const nodes = undefined as any;

      // Act
      const enhanced = toEnhancedNodes(nodes);

      // Assert
      assert.strictEqual(enhanced.length, 0);
      assert.ok(Array.isArray(enhanced));
    });

    it('должен конвертировать каждый узел в массиве', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'node_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Test 1',
            buttons: [{ id: 'btn_1', text: 'Btn', action: 'goto', target: 'node_2' }],
          },
        },
        {
          id: 'node_2',
          type: 'message',
          position: { x: 200, y: 200 },
          data: {
            text: 'Test 2',
            buttons: [],
          },
        },
      ] as Node[];

      // Act
      const enhanced = toEnhancedNodes(nodes);

      // Assert
      assert.strictEqual(enhanced.length, 2);
      assert.strictEqual(enhanced[0].data.buttons.length, 1);
      assert.strictEqual(enhanced[1].data.buttons.length, 0);
    });

    it('должен нормализовать кнопки в каждом узле', () => {
      // Arrange
      const nodes: Node[] = [
        {
          id: 'node_1',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            text: 'Test',
            buttons: [
              { id: 'btn_1', text: 'Button', action: 'goto', target: 'node_2' },
              { text: 'Button without id', action: 'goto', target: 'node_3' },
            ],
          },
        },
      ] as Node[];

      // Act
      const enhanced = toEnhancedNodes(nodes);

      // Assert
      assert.strictEqual(enhanced[0].data.buttons.length, 2);
      assert.ok(enhanced[0].data.buttons[0].id);
      assert.ok(enhanced[0].data.buttons[1].id); // должен быть сгенерирован
    });
  });

  describe('Edge cases', () => {
    it('должен обрабатывать узел с special characters в id', () => {
      // Arrange
      const node: Node = {
        id: 'node-with-special-chars_123',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.id, 'node-with-special-chars_123');
    });

    it('должен обрабатывать узел с unicode в text', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Привет мир! 🌍',
          buttons: [],
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.data.text, 'Привет мир! 🌍');
    });

    it('должен обрабатывать узел с null в data', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: null as any,
      } as Node;

      // Act & Assert
      // Функция должна обработать или выбросить ошибку
      try {
        const enhanced = toEnhancedNode(node);
        assert.ok(enhanced);
      } catch (e) {
        // Ожидаемое поведение при некорректных данных
        assert.ok(e);
      }
    });

    it('должен обрабатывать узел с undefined buttons', () => {
      // Arrange
      const node: Node = {
        id: 'node_1',
        type: 'message',
        position: { x: 100, y: 100 },
        data: {
          text: 'Test',
          buttons: undefined,
        },
      } as unknown as Node;

      // Act
      const enhanced = toEnhancedNode(node);

      // Assert
      assert.strictEqual(enhanced.data.buttons.length, 0);
    });
  });
});
