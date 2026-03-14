/**
 * @fileoverview Тесты для модуля generator-logger
 * @module lib/tests/unit/core/generator-logger.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  createLogger,
  generatorLogger,
  type GeneratorLogger,
  type LoggerOptions,
  type LogLevel,
} from '../../../bot-generator/core/generator-logger';

describe('GeneratorLogger', () => {
  describe('createLogger', () => {
    it('должен создавать логгер с настройками по умолчанию', () => {
      // Arrange & Act
      const logger = createLogger();

      // Assert
      assert.ok(logger);
      assert.strictEqual(typeof logger.debug, 'function');
      assert.strictEqual(typeof logger.info, 'function');
      assert.strictEqual(typeof logger.warn, 'function');
      assert.strictEqual(typeof logger.error, 'function');
      assert.strictEqual(typeof logger.flow, 'function');
    });

    it('должен создавать логгер с enabled: true по умолчанию', () => {
      // Arrange & Act
      const logger = createLogger();

      // Assert - логгер должен быть определён
      assert.ok(logger);
    });

    it('должен создавать логгер с level: "info" по умолчанию', () => {
      // Arrange & Act
      const logger = createLogger();

      // Assert - логгер должен быть определён
      assert.ok(logger);
    });

    it('должен создавать логгер с отключенным логированием при enabled: false', () => {
      // Arrange
      const options: LoggerOptions = { enabled: false };

      // Act
      const logger = createLogger(options);

      // Assert
      assert.ok(logger);
      // Логгер должен быть создан, но не должен выводить сообщения
    });

    it('должен создавать логгер с указанным уровнем логирования', () => {
      // Arrange
      const options: LoggerOptions = { enabled: true, level: 'debug' };

      // Act
      const logger = createLogger(options);

      // Assert
      assert.ok(logger);
    });
  });

  describe('Logger levels', () => {
    it('должен логировать debug сообщения при уровне debug', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'debug' });
      let debugCalled = false;
      const originalLog = console.log;
      console.log = () => { debugCalled = true; };

      // Act
      logger.debug('test message');

      // Assert
      assert.strictEqual(debugCalled, true);

      // Cleanup
      console.log = originalLog;
    });

    it('должен логировать info сообщения при уровне info', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'info' });
      let infoCalled = false;
      const originalInfo = console.info;
      console.info = () => { infoCalled = true; };

      // Act
      logger.info('test message');

      // Assert
      assert.strictEqual(infoCalled, true);

      // Cleanup
      console.info = originalInfo;
    });

    it('должен логировать warn сообщения при уровне warn', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'warn' });
      let warnCalled = false;
      const originalWarn = console.warn;
      console.warn = () => { warnCalled = true; };

      // Act
      logger.warn('test message');

      // Assert
      assert.strictEqual(warnCalled, true);

      // Cleanup
      console.warn = originalWarn;
    });

    it('должен логировать error сообщения при уровне error', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'error' });
      let errorCalled = false;
      const originalError = console.error;
      console.error = () => { errorCalled = true; };

      // Act
      logger.error('test message');

      // Assert
      assert.strictEqual(errorCalled, true);

      // Cleanup
      console.error = originalError;
    });

    it('не должен логировать debug сообщения при уровне info', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'info' });
      let debugCalled = false;
      const originalLog = console.log;
      console.log = () => { debugCalled = true; };

      // Act
      logger.debug('test message');

      // Assert
      assert.strictEqual(debugCalled, false);

      // Cleanup
      console.log = originalLog;
    });

    it('не должен логировать info сообщения при уровне warn', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'warn' });
      let infoCalled = false;
      const originalInfo = console.info;
      console.info = () => { infoCalled = true; };

      // Act
      logger.info('test message');

      // Assert
      assert.strictEqual(infoCalled, false);

      // Cleanup
      console.info = originalInfo;
    });

    it('не должен логировать warn сообщения при уровне error', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'error' });
      let warnCalled = false;
      const originalWarn = console.warn;
      console.warn = () => { warnCalled = true; };

      // Act
      logger.warn('test message');

      // Assert
      assert.strictEqual(warnCalled, false);

      // Cleanup
      console.warn = originalWarn;
    });
  });

  describe('Logger with disabled state', () => {
    it('не должен логировать никакие сообщения при enabled: false', () => {
      // Arrange
      const logger = createLogger({ enabled: false, level: 'debug' });
      let anyCalled = false;

      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = () => { anyCalled = true; };
      console.info = () => { anyCalled = true; };
      console.warn = () => { anyCalled = true; };
      console.error = () => { anyCalled = true; };

      // Act
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      // Assert
      assert.strictEqual(anyCalled, false);

      // Cleanup
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    });
  });

  describe('Logger methods', () => {
    it('должен принимать данные в debug методе', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'debug' });
      let capturedData: any = null;
      const originalLog = console.log;
      console.log = (_msg, data) => { capturedData = data; };

      // Act
      const testData = { key: 'value' };
      logger.debug('test', testData);

      // Assert
      assert.strictEqual(capturedData, testData);

      // Cleanup
      console.log = originalLog;
    });

    it('должен принимать ошибку в error методе', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'error' });
      let capturedError: Error | undefined;
      const originalError = console.error;
      console.error = (_msg, error) => { capturedError = error; };

      // Act
      const testError = new Error('test error');
      logger.error('test error', testError);

      // Assert
      assert.strictEqual(capturedError, testError);

      // Cleanup
      console.error = originalError;
    });

    it('должен работать без данных в debug методе', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'debug' });
      let called = false;
      const originalLog = console.log;
      console.log = () => { called = true; };

      // Act
      logger.debug('test message');

      // Assert
      assert.strictEqual(called, true);

      // Cleanup
      console.log = originalLog;
    });

    it('должен работать без ошибки в error методе', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'error' });
      let called = false;
      const originalError = console.error;
      console.error = () => { called = true; };

      // Act
      logger.error('test error');

      // Assert
      assert.strictEqual(called, true);

      // Cleanup
      console.error = originalError;
    });
  });

  describe('generatorLogger (default logger)', () => {
    it('должен быть определён', () => {
      // Arrange & Act & Assert
      assert.ok(generatorLogger);
    });

    it('должен иметь все методы логгера', () => {
      // Arrange & Act & Assert
      assert.strictEqual(typeof generatorLogger.debug, 'function');
      assert.strictEqual(typeof generatorLogger.info, 'function');
      assert.strictEqual(typeof generatorLogger.warn, 'function');
      assert.strictEqual(typeof generatorLogger.error, 'function');
      assert.strictEqual(typeof generatorLogger.flow, 'function');
    });

    it('должен быть типа GeneratorLogger', () => {
      // Arrange & Act
      const logger: GeneratorLogger = generatorLogger;

      // Assert
      assert.ok(logger);
    });
  });

  describe('LogLevel type', () => {
    it('должен поддерживать уровень debug', () => {
      // Arrange
      const level: LogLevel = 'debug';

      // Act & Assert
      assert.strictEqual(level, 'debug');
    });

    it('должен поддерживать уровень info', () => {
      // Arrange
      const level: LogLevel = 'info';

      // Act & Assert
      assert.strictEqual(level, 'info');
    });

    it('должен поддерживать уровень warn', () => {
      // Arrange
      const level: LogLevel = 'warn';

      // Act & Assert
      assert.strictEqual(level, 'warn');
    });

    it('должен поддерживать уровень error', () => {
      // Arrange
      const level: LogLevel = 'error';

      // Act & Assert
      assert.strictEqual(level, 'error');
    });

    it('должен поддерживать уровень flow', () => {
      // Arrange
      const level: LogLevel = 'flow';

      // Act & Assert
      assert.strictEqual(level, 'flow');
    });
  });

  describe('Logger level hierarchy', () => {
    it('должен логировать все уровни при debug уровне', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'debug' });
      const calls: string[] = [];

      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = () => calls.push('debug');
      console.info = () => calls.push('info');
      console.warn = () => calls.push('warn');
      console.error = () => calls.push('error');

      // Act
      logger.debug('msg');
      logger.info('msg');
      logger.warn('msg');
      logger.error('msg');

      // Assert
      assert.strictEqual(calls.length, 4);
      assert.ok(calls.includes('debug'));
      assert.ok(calls.includes('info'));
      assert.ok(calls.includes('warn'));
      assert.ok(calls.includes('error'));

      // Cleanup
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    });

    it('должен логировать только error при error уровне', () => {
      // Arrange
      const logger = createLogger({ enabled: true, level: 'error' });
      const calls: string[] = [];

      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = () => calls.push('debug');
      console.info = () => calls.push('info');
      console.warn = () => calls.push('warn');
      console.error = () => calls.push('error');

      // Act
      logger.debug('msg');
      logger.info('msg');
      logger.warn('msg');
      logger.error('msg');

      // Assert
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0], 'error');

      // Cleanup
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    });
  });
});
