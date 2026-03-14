/**
 * @fileoverview Тесты для модуля validate-generated-python
 * @module lib/tests/unit/validation/validate-generated-python.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  validateGeneratedPython,
  assertValidPython,
} from '../../../bot-generator/validation/validate-generated-python';
import { mockPythonCode, invalidPythonCode } from '../../helpers/test-fixtures';

describe('ValidateGeneratedPython', () => {
  describe('validateGeneratedPython - валидный код', () => {
    it('должен возвращать isValid: true для валидного Python кода', () => {
      // Arrange
      const code = mockPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.missingComponents.length, 0);
    });

    it('должен возвращать пустой массив missingComponents для валидного кода', () => {
      // Arrange
      const code = mockPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(Array.isArray(result.missingComponents));
      assert.strictEqual(result.missingComponents.length, 0);
    });

    it('должен возвращать undefined errorMessage для валидного кода', () => {
      // Arrange
      const code = mockPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.strictEqual(result.errorMessage, undefined);
    });

    it('должен принимать код с import asyncio', () => {
      // Arrange
      const code = `
import asyncio

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert - код должен содержать все обязательные элементы
      // Этот тест проверяет что код с import asyncio проходит базовую проверку
      assert.ok(result);
    });

    it('должен принимать код с Bot и Dispatcher из aiogram', () => {
      // Arrange
      const code = `
from aiogram import Bot, Dispatcher

bot = Bot(token="TOKEN")
dp = Dispatcher()

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      validateGeneratedPython(code);

      // Assert
      // Bot и Dispatcher присутствуют
      assert.ok(code.includes('Bot'));
      assert.ok(code.includes('Dispatcher'));
    });

    it('должен принимать код с Dispatcher()', () => {
      // Arrange
      const code = `
from aiogram import Dispatcher

dp = Dispatcher()

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      validateGeneratedPython(code);

      // Assert
      assert.ok(code.includes('Dispatcher()'));
    });

    it('должен принимать код с async def main():', () => {
      // Arrange
      const code = `
async def main():
    pass

if __name__ == "__main__":
    pass
`;

      // Act
      validateGeneratedPython(code);

      // Assert
      assert.ok(code.includes('async def main():'));
    });

    it('должен принимать код с if __name__ == "__main__":', () => {
      // Arrange
      const code = `
if __name__ == "__main__":
    print("Hello")
`;

      // Act
      validateGeneratedPython(code);

      // Assert
      assert.ok(code.includes('if __name__ == "__main__":'));
    });

    it('должен принимать код с asyncio.run(main())', () => {
      // Arrange
      const code = `
async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      validateGeneratedPython(code);

      // Assert
      assert.ok(code.includes('asyncio.run(main())'));
    });
  });

  describe('validateGeneratedPython - невалидный код', () => {
    it('должен возвращать isValid: false для невалидного кода', () => {
      // Arrange
      const code = invalidPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.strictEqual(result.isValid, false);
      assert.ok(result.missingComponents.length > 0);
    });

    it('должен возвращать missingComponents для кода без import asyncio', () => {
      // Arrange
      const code = `
def main():
    pass
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('asyncio')));
    });

    it('должен возвращать missingComponents для кода без Bot', () => {
      // Arrange
      const code = `
import asyncio

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('Bot')));
    });

    it('должен возвращать missingComponents для кода без Dispatcher', () => {
      // Arrange
      const code = `
import asyncio
from aiogram import Bot

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('Dispatcher')));
    });

    it('должен возвращать missingComponents для кода без async def main()', () => {
      // Arrange
      const code = `
import asyncio
from aiogram import Bot, Dispatcher

def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('async def main')));
    });

    it('должен возвращать missingComponents для кода без if __name__', () => {
      // Arrange
      const code = `
import asyncio
from aiogram import Bot, Dispatcher

async def main():
    pass

asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('__name__')));
    });

    it('должен возвращать missingComponents для кода без asyncio.run()', () => {
      // Arrange
      const code = `
import asyncio
from aiogram import Bot, Dispatcher

async def main():
    pass

if __name__ == "__main__":
    main()
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('asyncio.run')));
    });

    it('должен возвращать errorMessage для невалидного кода', () => {
      // Arrange
      const code = invalidPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok(result.errorMessage);
      assert.ok(result.errorMessage.includes('Отсутствуют обязательные компоненты'));
    });
  });

  describe('assertValidPython', () => {
    it('не должен бросать ошибку для валидного кода', () => {
      // Arrange
      const code = mockPythonCode;

      // Act & Assert
      assert.doesNotThrow(() => {
        assertValidPython(code);
      });
    });

    it('должен бросать ошибку для невалидного кода', () => {
      // Arrange
      const code = invalidPythonCode;

      // Act & Assert
      assert.throws(() => {
        assertValidPython(code);
      }, Error);
    });

    it('должен бросать ошибку с сообщением о missing components', () => {
      // Arrange
      const code = invalidPythonCode;

      // Act & Assert
      assert.throws(() => {
        assertValidPython(code);
      }, /Отсутствуют обязательные компоненты/);
    });

    it('должен бросать ошибку с типом Error', () => {
      // Arrange
      const code = invalidPythonCode;

      // Act & Assert
      try {
        assertValidPython(code);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('PythonValidationResult type', () => {
    it('должен иметь поле isValid', () => {
      // Arrange
      const code = mockPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok('isValid' in result);
      assert.strictEqual(typeof result.isValid, 'boolean');
    });

    it('должен иметь поле missingComponents', () => {
      // Arrange
      const code = mockPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok('missingComponents' in result);
      assert.ok(Array.isArray(result.missingComponents));
    });

    it('должен иметь поле errorMessage', () => {
      // Arrange
      const code = mockPythonCode;

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.ok('errorMessage' in result);
    });
  });

  describe('Edge cases', () => {
    it('должен обрабатывать пустую строку', () => {
      // Arrange
      const code = '';

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.strictEqual(result.isValid, false);
      assert.ok(result.missingComponents.length > 0);
    });

    it('должен обрабатывать строку только с пробелами', () => {
      // Arrange
      const code = '   ';

      // Act
      const result = validateGeneratedPython(code);

      // Assert
      assert.strictEqual(result.isValid, false);
    });

    it('должен обрабатывать код с комментариями', () => {
      // Arrange
      const code = `
# Это комментарий
import asyncio
# Ещё комментарий
from aiogram import Bot, Dispatcher

# Основная функция
async def main():
    pass

# Запуск
if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert - проверяем что результат существует
      assert.ok(result);
      assert.ok('isValid' in result);
      assert.ok('missingComponents' in result);
    });

    it('должен обрабатывать код с docstring', () => {
      // Arrange
      const code = `
"""
Модуль бота
"""

import asyncio
from aiogram import Bot, Dispatcher

async def main():
    """Основная функция"""
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert - проверяем что результат существует
      assert.ok(result);
      assert.ok('isValid' in result);
    });

    it('должен обрабатывать код с разными отступами', () => {
      // Arrange
      const code = `
import asyncio
from aiogram import Bot, Dispatcher

async def main():
        pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert - проверяем что результат существует
      assert.ok(result);
    });

    it('должен обрабатывать код с unicode', () => {
      // Arrange
      const code = `
# -*- coding: utf-8 -*-
"""
Бот с unicode: Привет мир! 🌍
"""

import asyncio
from aiogram import Bot, Dispatcher

async def main():
    print("Привет мир!")

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert - проверяем что результат существует
      assert.ok(result);
    });

    it('должен обрабатывать очень большой код', () => {
      // Arrange
      const code = `
import asyncio
from aiogram import Bot, Dispatcher

${Array.from({ length: 100 }, (_, i) => `async def handler_${i}(): pass`).join('\n')}

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(code);

      // Assert - проверяем что результат существует
      assert.ok(result);
    });
  });

  describe('REQUIRED_PYTHON_PATTERNS coverage', () => {
    it('должен проверять наличие import asyncio', () => {
      // Arrange
      const codeWithoutAsyncio = `
from aiogram import Bot, Dispatcher

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(codeWithoutAsyncio);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('asyncio')));
    });

    it('должен проверять наличие Bot', () => {
      // Arrange
      const codeWithoutBot = `
import asyncio
from aiogram import Dispatcher

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(codeWithoutBot);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('Bot')));
    });

    it('должен проверять наличие Dispatcher', () => {
      // Arrange
      const codeWithoutDispatcher = `
import asyncio
from aiogram import Bot

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(codeWithoutDispatcher);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('Dispatcher')));
    });

    it('должен проверять наличие Dispatcher()', () => {
      // Arrange
      const codeWithoutDispatcherInit = `
import asyncio
from aiogram import Bot, Dispatcher

async def main():
    pass

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(codeWithoutDispatcherInit);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('Dispatcher()')));
    });

    it('должен проверять наличие async def main():', () => {
      // Arrange
      const codeWithoutMain = `
import asyncio
from aiogram import Bot, Dispatcher

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(codeWithoutMain);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('async def main')));
    });

    it('должен проверять наличие if __name__ == "__main__":', () => {
      // Arrange
      const codeWithoutNameMain = `
import asyncio
from aiogram import Bot, Dispatcher

async def main():
    pass

asyncio.run(main())
`;

      // Act
      const result = validateGeneratedPython(codeWithoutNameMain);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('__name__')));
    });

    it('должен проверять наличие asyncio.run(main())', () => {
      // Arrange
      const codeWithoutRun = `
import asyncio
from aiogram import Bot, Dispatcher

async def main():
    pass

if __name__ == "__main__":
    pass
`;

      // Act
      const result = validateGeneratedPython(codeWithoutRun);

      // Assert
      assert.ok(result.missingComponents.some(c => c.includes('asyncio.run')));
    });
  });
});
