/**
 * @fileoverview Unit-тесты для генератора логгера
 * 
 * Модуль тестирует функции логирования из generator-logger.ts.
 * Проверяет создание логгера, уровни логирования и фильтрацию.
 * 
 * @module tests/unit/generator-logger.test
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createLogger, generatorLogger } from '../../bot-generator/core/generator-logger';

/**
 * Тестирование создания и работы логгера
 */
describe('GeneratorLogger', () => {
  let logs: string[] = [];
  let originalConsole: typeof console;

  /**
   * Сохраняем оригинальный console и перехватываем вывод
   */
  beforeEach(() => {
    logs = [];
    originalConsole = { ...console };
    console.log = (...args) => logs.push(args.join(' '));
    console.info = (...args) => logs.push(args.join(' '));
    console.warn = (...args) => logs.push(args.join(' '));
    console.error = (...args) => logs.push(args.join(' '));
    console.debug = (...args) => logs.push(args.join(' '));
  });

  /**
   * Восстанавливаем оригинальный console
   */
  afterEach(() => {
    console = originalConsole;
  });

  /**
   * Тест: создание логгера с правильными методами
   */
  it('должен создавать логгер с правильными методами', () => {
    const logger = createLogger({ enabled: true, level: 'debug' });
    
    assert.strictEqual(typeof logger.debug, 'function', 'debug должен быть функцией');
    assert.strictEqual(typeof logger.info, 'function', 'info должен быть функцией');
    assert.strictEqual(typeof logger.warn, 'function', 'warn должен быть функцией');
    assert.strictEqual(typeof logger.error, 'function', 'error должен быть функцией');
    assert.strictEqual(typeof logger.flow, 'function', 'flow должен быть функцией');
  });

  /**
   * Тест: фильтрация по уровню логирования - debug
   */
  it('должен фильтровать по уровню логирования - debug', () => {
    const logger = createLogger({ enabled: true, level: 'debug' });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');
    logger.flow('Flow message');
    
    assert.strictEqual(logs.length, 5, 'Все 5 уровней должны логироваться');
    assert.ok(logs[0].includes('Debug message'), 'debug сообщение должно быть залогировано');
  });

  /**
   * Тест: фильтрация по уровню логирования - info
   */
  it('должен фильтровать по уровню логирования - info', () => {
    const logger = createLogger({ enabled: true, level: 'info' });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');
    logger.flow('Flow message');
    
    assert.strictEqual(logs.length, 4, 'debug не должен логироваться на уровне info');
    assert.ok(!logs.some(log => log.includes('Debug message')), 'debug не должен логироваться');
  });

  /**
   * Тест: фильтрация по уровню логирования - warn
   */
  it('должен фильтровать по уровню логирования - warn', () => {
    const logger = createLogger({ enabled: true, level: 'warn' });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');
    logger.flow('Flow message');
    
    assert.strictEqual(logs.length, 2, 'Только warn и error должны логироваться');
  });

  /**
   * Тест: фильтрация по уровню логирования - error
   */
  it('должен фильтровать по уровню логирования - error', () => {
    const logger = createLogger({ enabled: true, level: 'error' });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');
    logger.flow('Flow message');
    
    assert.strictEqual(logs.length, 1, 'Только error должен логироваться');
  });

  /**
   * Тест: отключение логирования при enabled: false
   */
  it('должен быть отключён при enabled: false', () => {
    const logger = createLogger({ enabled: false, level: 'debug' });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');
    logger.flow('Flow message');
    
    assert.strictEqual(logs.length, 0, 'Ничего не должно логироваться при enabled: false');
  });

  /**
   * Тест: логгер по умолчанию должен быть включён
   */
  it('должен создавать логгер по умолчанию с правильными настройками', () => {
    assert.ok(generatorLogger, 'generatorLogger должен существовать');
    assert.strictEqual(typeof generatorLogger.debug, 'function', 'debug должен быть функцией');
    assert.strictEqual(typeof generatorLogger.info, 'function', 'info должен быть функцией');
  });

  /**
   * Тест: передача данных в логгер
   */
  it('должен поддерживать передачу данных в debug', () => {
    const logger = createLogger({ enabled: true, level: 'debug' });
    const testData = { key: 'value', number: 42 };
    
    logger.debug('Test message', testData);
    
    assert.ok(logs.length > 0, 'Сообщение должно быть залогировано');
    assert.ok(logs[0].includes('Test message'), 'Сообщение должно содержать текст');
  });

  /**
   * Тест: передача ошибки в error логгер
   */
  it('должен поддерживать передачу Error в error', () => {
    const logger = createLogger({ enabled: true, level: 'error' });
    const testError = new Error('Test error');
    
    logger.error('Error occurred', testError);
    
    assert.ok(logs.length > 0, 'Ошибка должна быть залогирована');
    assert.ok(logs[0].includes('Error occurred'), 'Сообщение должно содержать текст');
  });
});
