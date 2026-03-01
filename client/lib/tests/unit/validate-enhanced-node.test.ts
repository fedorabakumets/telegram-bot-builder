/**
 * @fileoverview Unit-тесты для валидации узлов EnhancedNode
 * 
 * Модуль тестирует функции validateEnhancedNode и validateEnhancedNodes.
 * Проверяет валидацию обязательных полей и предупреждения.
 * 
 * @module tests/unit/validate-enhanced-node.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateEnhancedNode,
  validateEnhancedNodes
} from '../../bot-generator/validation/validate-enhanced-node';

/**
 * Тестирование функции validateEnhancedNode
 */
describe('validateEnhancedNode', () => {
  /**
   * Тест: валидный узел должен проходить валидацию
   */
  it('должен возвращать isValid=true для валидного узла', () => {
    const validNode = {
      id: 'start_1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { text: 'Привет!' }
    };

    const result = validateEnhancedNode(validNode);

    assert.strictEqual(result.isValid, true, 'Валидный узел должен пройти валидацию');
    assert.strictEqual(result.errors.length, 0, 'Не должно быть ошибок');
    assert.strictEqual(result.warnings.length, 0, 'Не должно быть предупреждений');
  });

  /**
   * Тест: узел без id должен возвращать ошибку
   */
  it('должен возвращать ошибку для узла без id', () => {
    const invalidNode = {
      id: '',
      type: 'start',
      position: { x: 0, y: 0 },
      data: { text: 'Привет!' }
    };

    const result = validateEnhancedNode(invalidNode);

    assert.strictEqual(result.isValid, false, 'Узел без id не должен пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('id')), 'Должна быть ошибка про id');
  });

  /**
   * Тест: узел без type должен возвращать ошибку
   */
  it('должен возвращать ошибку для узла без type', () => {
    const invalidNode = {
      id: 'start_1',
      type: '',
      position: { x: 0, y: 0 },
      data: { text: 'Привет!' }
    };

    const result = validateEnhancedNode(invalidNode);

    assert.strictEqual(result.isValid, false, 'Узел без type не должен пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('type')), 'Должна быть ошибка про type');
  });

  /**
   * Тест: узел без position должен возвращать предупреждение
   */
  it('должен возвращать предупреждение для узла без position', () => {
    const nodeWithoutPosition = {
      id: 'start_1',
      type: 'start',
      data: { text: 'Привет!' }
    };

    const result = validateEnhancedNode(nodeWithoutPosition as any);

    assert.strictEqual(result.isValid, true, 'Узел без position должен пройти валидацию');
    assert.ok(result.warnings.some(w => w.includes('position')), 'Должно быть предупреждение про position');
  });

  /**
   * Тест: узел с некорректным position должен возвращать ошибку
   */
  it('должен возвращать ошибку для узла с некорректным position', () => {
    const invalidPosition = {
      id: 'start_1',
      type: 'start',
      position: { x: 'invalid', y: 'invalid' },
      data: { text: 'Привет!' }
    };

    const result = validateEnhancedNode(invalidPosition as any);

    assert.strictEqual(result.isValid, false, 'Узел с некорректным position не должен пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('position')), 'Должна быть ошибка про position');
  });

  /**
   * Тест: узел без data должен возвращать ошибку
   */
  it('должен возвращать ошибку для узла без data', () => {
    const nodeWithoutData = {
      id: 'start_1',
      type: 'start',
      position: { x: 0, y: 0 }
    };

    const result = validateEnhancedNode(nodeWithoutData as any);

    assert.strictEqual(result.isValid, false, 'Узел без data не должен пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('data')), 'Должна быть ошибка про data');
  });

  /**
   * Тест: узел с кнопками без id должен возвращать ошибку
   */
  it('должен возвращать ошибку для кнопки без id', () => {
    const nodeWithInvalidButton = {
      id: 'menu_1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Меню',
        buttons: [{ id: '', text: 'Кнопка', action: 'goto' }]
      }
    };

    const result = validateEnhancedNode(nodeWithInvalidButton);

    assert.strictEqual(result.isValid, false, 'Кнопка без id не должна пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('Button') && e.includes('id')), 'Должна быть ошибка про id кнопки');
  });

  /**
   * Тест: узел с кнопками без text должен возвращать ошибку
   */
  it('должен возвращать ошибку для кнопки без text', () => {
    const nodeWithInvalidButton = {
      id: 'menu_1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Меню',
        buttons: [{ id: 'btn1', text: '', action: 'goto' }]
      }
    };

    const result = validateEnhancedNode(nodeWithInvalidButton);

    assert.strictEqual(result.isValid, false, 'Кнопка без text не должна пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('Button') && e.includes('text')), 'Должна быть ошибка про text кнопки');
  });

  /**
   * Тест: узел с кнопками без action должен возвращать ошибку
   */
  it('должен возвращать ошибку для кнопки без action', () => {
    const nodeWithInvalidButton = {
      id: 'menu_1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Меню',
        buttons: [{ id: 'btn1', text: 'Кнопка', action: '' }]
      }
    };

    const result = validateEnhancedNode(nodeWithInvalidButton);

    assert.strictEqual(result.isValid, false, 'Кнопка без action не должна пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('Button') && e.includes('action')), 'Должна быть ошибка про action кнопки');
  });

  /**
   * Тест: узел с enableAutoTransition но без autoTransitionTo должен возвращать ошибку
   */
  it('должен возвращать ошибку для автоперехода без цели', () => {
    const nodeWithAutoTransition = {
      id: 'auto_1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        text: 'Авто',
        enableAutoTransition: true,
        autoTransitionTo: ''
      }
    };

    const result = validateEnhancedNode(nodeWithAutoTransition);

    assert.strictEqual(result.isValid, false, 'Автопереход без цели не должен пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('autoTransition')), 'Должна быть ошибка про autoTransitionTo');
  });
});

/**
 * Тестирование функции validateEnhancedNodes
 */
describe('validateEnhancedNodes', () => {
  /**
   * Тест: валидный массив узлов должен проходить валидацию
   */
  it('должен возвращать isValid=true для валидного массива узлов', () => {
    const validNodes = [
      { id: 'start_1', type: 'start', position: { x: 0, y: 0 }, data: { text: 'Старт' } },
      { id: 'menu_1', type: 'message', position: { x: 100, y: 100 }, data: { text: 'Меню' } }
    ];

    const result = validateEnhancedNodes(validNodes);

    assert.strictEqual(result.isValid, true, 'Валидный массив должен пройти валидацию');
    assert.strictEqual(result.errors.length, 0, 'Не должно быть ошибок');
  });

  /**
   * Тест: массив с невалидным узлом должен возвращать ошибку
   */
  it('должен возвращать ошибку для массива с невалидным узлом', () => {
    const nodesWithInvalid = [
      { id: 'start_1', type: 'start', position: { x: 0, y: 0 }, data: { text: 'Старт' } },
      { id: '', type: 'message', position: { x: 100, y: 100 }, data: { text: 'Меню' } }
    ];

    const result = validateEnhancedNodes(nodesWithInvalid);

    assert.strictEqual(result.isValid, false, 'Массив с невалидным узлом не должен пройти валидацию');
    assert.ok(result.errors.some(e => e.includes('id')), 'Должна быть ошибка про id');
  });

  /**
   * Тест: пустой массив должен проходить валидацию
   */
  it('должен возвращать isValid=true для пустого массива', () => {
    const result = validateEnhancedNodes([]);

    assert.strictEqual(result.isValid, true, 'Пустой массив должен пройти валидацию');
    assert.strictEqual(result.errors.length, 0, 'Не должно быть ошибок');
  });

  /**
   * Тест: ошибки должны содержать индекс узла
   */
  it('должен содержать индекс узла в сообщении об ошибке', () => {
    const nodesWithInvalid = [
      { id: 'start_1', type: 'start', position: { x: 0, y: 0 }, data: { text: 'Старт' } },
      { id: '', type: '', position: { x: 100, y: 100 }, data: { text: 'Меню' } }
    ];

    const result = validateEnhancedNodes(nodesWithInvalid);

    assert.ok(result.errors.some(e => e.includes('1') || e.includes('Node')), 'Ошибка должна содержать индекс узла');
  });
});
