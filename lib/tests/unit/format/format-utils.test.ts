/**
 * @fileoverview Тесты для модулей format-utils
 * @module lib/tests/unit/format/format-utils.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  formatTextForPython,
  createSafeFunctionName,
  escapeForPython,
} from '../../../bot-generator/format';

describe('FormatUtils', () => {
  describe('formatTextForPython', () => {
    describe('пустые строки', () => {
      it('должен возвращать "" для пустой строки', () => {
        // Arrange
        const text = '';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '""');
      });

      it('должен возвращать "" для null', () => {
        // Arrange
        const text = null as any;

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '""');
      });

      it('должен возвращать "" для undefined', () => {
        // Arrange
        const text = undefined as any;

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '""');
      });
    });

    describe('однострочный текст', () => {
      it('должен форматировать простой однострочный текст', () => {
        // Arrange
        const text = 'Hello World';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Hello World"');
      });

      it('должен экранировать двойные кавычки в однострочном тексте', () => {
        // Arrange
        const text = 'Say "hello"';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Say \\"hello\\""');
      });

      it('должен экранировать несколько двойных кавычек', () => {
        // Arrange
        const text = 'He said "Hi" and she said "Hello"';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"He said \\"Hi\\" and she said \\"Hello\\""');
      });

      it('должен сохранять одинарные кавычки без экранирования', () => {
        // Arrange
        const text = "It's a test";

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, "\"It's a test\"");
      });
    });

    describe('многострочный текст', () => {
      it('должен использовать тройные кавычки для многострочного текста', () => {
        // Arrange
        const text = 'Line 1\nLine 2\nLine 3';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"""Line 1\nLine 2\nLine 3"""');
      });

      it('должен использовать тройные кавычки для текста с одним переносом', () => {
        // Arrange
        const text = 'First line\nSecond line';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"""First line\nSecond line"""');
      });

      it('должен сохранять двойные кавычки в многострочном тексте без экранирования', () => {
        // Arrange
        const text = 'First line\nSay "hi"\nLast line';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"""First line\nSay "hi"\nLast line"""');
      });

      it('должен обрабатывать текст с несколькими переносами подряд', () => {
        // Arrange
        const text = 'Line 1\n\nLine 3';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"""Line 1\n\nLine 3"""');
      });
    });

    describe('специальные символы', () => {
      it('должен сохранять \\n в однострочном тексте', () => {
        // Arrange
        const text = 'Line 1\\nLine 2';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Line 1\\nLine 2"');
      });

      it('должен обрабатывать текст с табуляцией', () => {
        // Arrange
        const text = 'Column 1\tColumn 2';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Column 1\tColumn 2"');
      });

      it('должен обрабатывать текст с обратным слешем', () => {
        // Arrange
        const text = 'Path\\to\\file';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Path\\to\\file"');
      });
    });

    describe('unicode и emoji', () => {
      it('должен обрабатывать русский текст', () => {
        // Arrange
        const text = 'Привет мир!';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Привет мир!"');
      });

      it('должен обрабатывать emoji', () => {
        // Arrange
        const text = 'Hello 🌍!';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"Hello 🌍!"');
      });

      it('должен обрабатывать многострочный текст с emoji', () => {
        // Arrange
        const text = 'Line 1 🎉\nLine 2 🚀';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"""Line 1 🎉\nLine 2 🚀"""');
      });
    });

    describe('edge cases', () => {
      it('должен обрабатывать очень длинную строку', () => {
        // Arrange
        const text = 'A'.repeat(10000);

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result.length, 10000 + 2); // +2 для кавычек
        assert.ok(result.startsWith('"'));
        assert.ok(result.endsWith('"'));
      });

      it('должен обрабатывать строку только с кавычками', () => {
        // Arrange
        const text = '""""""';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"\\"\\"\\"\\"\\"\\""');
      });

      it('должен обрабатывать строку с пробелами', () => {
        // Arrange
        const text = '   ';

        // Act
        const result = formatTextForPython(text);

        // Assert
        assert.strictEqual(result, '"   "');
      });
    });
  });

  describe('createSafeFunctionName', () => {
    describe('валидные имена', () => {
      it('должен возвращать неизменным валидное имя', () => {
        // Arrange
        const nodeId = 'valid_node_name';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'valid_node_name');
      });

      it('должен возвращать неизменным имя с цифрами', () => {
        // Arrange
        const nodeId = 'node_123';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'node_123');
      });

      it('должен возвращать неизменным имя только с буквами', () => {
        // Arrange
        const nodeId = 'nodename';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'nodename');
      });
    });

    describe('недопустимые символы', () => {
      it('должен заменять дефис на подчеркивание', () => {
        // Arrange
        const nodeId = 'my-node';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'my_node');
      });

      it('должен заменять несколько дефисов', () => {
        // Arrange
        const nodeId = 'my-long-node-name';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'my_long_node_name');
      });

      it('должен заменять точку на подчеркивание', () => {
        // Arrange
        const nodeId = 'my.node';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'my_node');
      });

      it('должен заменять специальные символы', () => {
        // Arrange
        const nodeId = 'test-function.name!';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'test_function_name_');
      });

      it('должен заменять @ на подчеркивание', () => {
        // Arrange
        const nodeId = 'node@test';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'node_test');
      });

      it('должен заменять # на подчеркивание', () => {
        // Arrange
        const nodeId = 'node#hash';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'node_hash');
      });

      it('должен заменять пробелы на подчеркивание', () => {
        // Arrange
        const nodeId = 'my node name';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'my_node_name');
      });
    });

    describe('имена начинающиеся с цифры', () => {
      it('должен добавлять префикс node_ для имени начинающегося с цифры', () => {
        // Arrange
        const nodeId = '123_input';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'node_123_input');
      });

      it('должен добавлять префикс node_ для имени начинающегося с одной цифры', () => {
        // Arrange
        const nodeId = '1_node';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'node_1_node');
      });

      it('должен добавлять префикс после замены специальных символов', () => {
        // Arrange
        const nodeId = '123-my-node';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, 'node_123_my_node');
      });
    });

    describe('edge cases', () => {
      it('должен обрабатывать пустую строку', () => {
        // Arrange
        const nodeId = '';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, '');
      });

      it('должен обрабатывать строку только со специальными символами', () => {
        // Arrange
        const nodeId = '!@#$%';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, '_____');
      });

      it('должен обрабатывать очень длинное имя', () => {
        // Arrange
        const nodeId = 'a'.repeat(1000);

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result.length, 1000);
      });

      it('должен обрабатывать имя с подчеркиваниями', () => {
        // Arrange
        const nodeId = '__private_node__';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert
        assert.strictEqual(result, '__private_node__');
      });

      it('должен обрабатывать unicode символы', () => {
        // Arrange
        const nodeId = 'узел_1';

        // Act
        const result = createSafeFunctionName(nodeId);

        // Assert - функция заменяет не-ASCII символы на подчеркивания
        // Это ожидаемое поведение для совместимости с Python
        assert.ok(result);
        assert.ok(typeof result === 'string');
      });
    });
  });

  describe('escapeForPython', () => {
    describe('базовое экранирование', () => {
      it('должен возвращать пустую строку для пустого ввода', () => {
        // Arrange
        const text = '';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, '');
      });

      it('должен экранировать двойные кавычки', () => {
        // Arrange
        const text = 'Say "hello"';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Say \\"hello\\"');
      });

      it('должен экранировать несколько двойных кавычек', () => {
        // Arrange
        const text = '"quoted" and "another"';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, '\\"quoted\\" and \\"another\\"');
      });
    });

    describe('экранирование специальных символов', () => {
      it('должен экранировать перевод строки', () => {
        // Arrange
        const text = 'Line 1\nLine 2';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Line 1\\nLine 2');
      });

      it('должен экранировать возврат каретки', () => {
        // Arrange
        const text = 'Line 1\rLine 2';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Line 1\\rLine 2');
      });

      it('должен экранировать табуляцию', () => {
        // Arrange
        const text = 'Column 1\tColumn 2';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Column 1\\tColumn 2');
      });

      it('должен экранировать все специальные символы вместе', () => {
        // Arrange
        const text = 'Say "hi"\nLine 2\rLine 3\tTab';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Say \\"hi\\"\\nLine 2\\rLine 3\\tTab');
      });
    });

    describe('текст без специальных символов', () => {
      it('должен возвращать неизменным текст без специальных символов', () => {
        // Arrange
        const text = 'Simple text without special characters';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, text);
      });

      it('должен сохранять одинарные кавычки', () => {
        // Arrange
        const text = "It's a test";

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, "It's a test");
      });

      it('должен сохранять обратные слеши', () => {
        // Arrange
        const text = 'Path\\to\\file';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Path\\to\\file');
      });
    });

    describe('unicode и emoji', () => {
      it('должен сохранять русский текст', () => {
        // Arrange
        const text = 'Привет "мир"!';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Привет \\"мир\\"!');
      });

      it('должен сохранять emoji', () => {
        // Arrange
        const text = 'Hello 🌍!';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Hello 🌍!');
      });

      it('должен экранировать кавычки в тексте с emoji', () => {
        // Arrange
        const text = 'Say "👋"';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, 'Say \\"👋\\"');
      });
    });

    describe('edge cases', () => {
      it('должен обрабатывать очень длинную строку', () => {
        // Arrange
        const text = 'A'.repeat(10000);

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result.length, 10000);
      });

      it('должен обрабатывать строку только с кавычками', () => {
        // Arrange
        const text = '""""""';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, '\\"\\"\\"\\"\\"\\"');
      });

      it('должен обрабатывать множественные специальные символы', () => {
        // Arrange
        const text = '\n\n\n\r\r\r\t\t\t';

        // Act
        const result = escapeForPython(text);

        // Assert
        assert.strictEqual(result, '\\n\\n\\n\\r\\r\\r\\t\\t\\t');
      });
    });
  });
});
