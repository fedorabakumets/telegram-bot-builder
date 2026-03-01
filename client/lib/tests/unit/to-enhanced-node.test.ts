/**
 * @fileoverview Unit-тесты для конвертации узлов в EnhancedNode
 * 
 * Модуль тестирует функции toEnhancedNode и toEnhancedNodes.
 * Проверяет конвертацию узлов из схемы в EnhancedNode.
 * 
 * @module tests/unit/to-enhanced-node.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toEnhancedNode, toEnhancedNodes } from '../../bot-generator/utils/to-enhanced-node';

/**
 * Тестирование функций конвертации узлов
 */
describe('toEnhancedNode', () => {
  /**
   * Тест: конвертация простого узла
   */
  it('должен конвертировать простой узел в EnhancedNode', () => {
    const node = {
      id: 'start_1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { text: 'Привет!' }
    };

    const enhanced = toEnhancedNode(node);

    assert.strictEqual(enhanced.id, 'start_1', 'id должен сохраниться');
    assert.strictEqual(enhanced.type, 'start', 'type должен сохраниться');
    assert.deepStrictEqual(enhanced.position, { x: 0, y: 0 }, 'position должен сохраниться');
    assert.strictEqual(enhanced.data.text, 'Привет!', 'data.text должен сохраниться');
  });

  /**
   * Тест: конвертация узла с кнопками
   */
  it('должен нормализовать кнопки узла', () => {
    const node = {
      id: 'menu_1',
      type: 'message',
      position: { x: 100, y: 100 },
      data: {
        text: 'Меню',
        buttons: [
          { id: 'btn1', text: 'Кнопка 1', action: 'goto', target: 'next_1' },
          { id: 'btn2', text: 'Кнопка 2', action: 'callback' }
        ]
      }
    };

    const enhanced = toEnhancedNode(node);

    assert.ok(Array.isArray(enhanced.data.buttons), 'buttons должен быть массивом');
    assert.strictEqual(enhanced.data.buttons?.length, 2, 'Должно быть 2 кнопки');
    assert.strictEqual(enhanced.data.buttons?.[0].buttonType, 'normal', 'buttonType должен быть normal по умолчанию');
    assert.strictEqual(enhanced.data.buttons?.[0].skipDataCollection, false, 'skipDataCollection должен быть false по умолчанию');
  });

  /**
   * Тест: конвертация узла без кнопок
   */
  it('должен возвращать пустой массив для кнопок если их нет', () => {
    const node = {
      id: 'info_1',
      type: 'message',
      position: { x: 200, y: 200 },
      data: { text: 'Инфо' }
    };

    const enhanced = toEnhancedNode(node);

    assert.deepStrictEqual(enhanced.data.buttons, [], 'buttons должен быть пустым массивом');
  });

  /**
   * Тест: конвертация узла с attachedMedia
   */
  it('должен добавлять attachedMedia по умолчанию', () => {
    const node = {
      id: 'media_1',
      type: 'message',
      position: { x: 300, y: 300 },
      data: { text: 'Медиа', attachedMedia: ['photo_url_1'] }
    };

    const enhanced = toEnhancedNode(node);

    assert.ok(Array.isArray(enhanced.data.attachedMedia), 'attachedMedia должен быть массивом');
    assert.strictEqual(enhanced.data.attachedMedia?.length, 1, 'attachedMedia должен содержать 1 элемент');
  });

  /**
   * Тест: конвертация узла без attachedMedia
   */
  it('должен возвращать пустой массив для attachedMedia если его нет', () => {
    const node = {
      id: 'text_1',
      type: 'message',
      position: { x: 400, y: 400 },
      data: { text: 'Текст' }
    };

    const enhanced = toEnhancedNode(node);

    assert.deepStrictEqual(enhanced.data.attachedMedia, [], 'attachedMedia должен быть пустым массивом');
  });

  /**
   * Тест: конвертация узла с null/undefined кнопками
   */
  it('должен обрабатывать null/undefined кнопки', () => {
    const nodeWithNull = {
      id: 'null_1',
      type: 'message',
      position: { x: 500, y: 500 },
      data: { text: 'Null', buttons: null }
    };

    const enhancedNull = toEnhancedNode(nodeWithNull as any);
    assert.deepStrictEqual(enhancedNull.data.buttons, [], 'null кнопки должны стать пустым массивом');

    const nodeWithUndefined = {
      id: 'undef_1',
      type: 'message',
      position: { x: 600, y: 600 },
      data: { text: 'Undefined' }
    };

    const enhancedUndef = toEnhancedNode(nodeWithUndefined);
    assert.deepStrictEqual(enhancedUndef.data.buttons, [], 'undefined кнопки должны стать пустым массивом');
  });
});

/**
 * Тестирование функции toEnhancedNodes
 */
describe('toEnhancedNodes', () => {
  /**
   * Тест: конвертация массива узлов
   */
  it('должен конвертировать массив узлов', () => {
    const nodes = [
      { id: 'start_1', type: 'start', position: { x: 0, y: 0 }, data: { text: 'Старт' } },
      { id: 'menu_1', type: 'message', position: { x: 100, y: 100 }, data: { text: 'Меню' } }
    ];

    const enhanced = toEnhancedNodes(nodes);

    assert.strictEqual(enhanced.length, 2, 'Должно быть 2 узла');
    assert.strictEqual(enhanced[0].id, 'start_1', 'Первый узел должен сохраниться');
    assert.strictEqual(enhanced[1].id, 'menu_1', 'Второй узел должен сохраниться');
  });

  /**
   * Тест: конвертация пустого массива
   */
  it('должен возвращать пустой массив для пустого входа', () => {
    const enhanced = toEnhancedNodes([]);
    assert.strictEqual(enhanced.length, 0, 'Должен вернуть пустой массив');
  });

  /**
   * Тест: конвертация null/undefined
   */
  it('должен обрабатывать null/undefined вход', () => {
    const enhancedNull = toEnhancedNodes(null as any);
    assert.strictEqual(enhancedNull.length, 0, 'null должен вернуть пустой массив');

    const enhancedUndef = toEnhancedNodes(undefined as any);
    assert.strictEqual(enhancedUndef.length, 0, 'undefined должен вернуть пустой массив');
  });
});
