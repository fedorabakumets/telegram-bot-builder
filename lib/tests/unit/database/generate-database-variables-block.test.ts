/**
 * @fileoverview Тесты для генератора блока переменных из таблиц базы данных
 * 
 * Проверяет корректность генерации Python-кода для блока комментариев
 * о переменных из таблиц БД.
 * 
 * @module tests/unit/database/generate-database-variables-block.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  generateDatabaseVariablesBlock,
  generateDatabaseVariablesBlockCall,
  type DatabaseVariablesBlockOptions,
} from '../../../bot-generator/database/generate-database-variables-block';

describe('generateDatabaseVariablesBlock', () => {
  describe('генерация блока по умолчанию', () => {
    it('должен генерировать заголовок блока', () => {
      const result = generateDatabaseVariablesBlock();
      assert.ok(result.includes('# ┌─────────────────────────────────────────┐'));
      assert.ok(result.includes('# │    Переменные из таблиц базы данных     │'));
      assert.ok(result.includes('# └─────────────────────────────────────────┘'));
    });

    it('должен генерировать комментарии для таблиц по умолчанию', () => {
      const result = generateDatabaseVariablesBlock();
      assert.ok(result.includes('# Таблица: bot_users — не требуется'));
      assert.ok(result.includes('# Таблица: user_telegram_settings — не требуется'));
      assert.ok(result.includes('# Таблица: user_ids — не требуется'));
    });

    it('должен генерировать финальный комментарий', () => {
      const result = generateDatabaseVariablesBlock();
      assert.ok(result.includes('# Добавляем переменные базы данных в all_user_vars'));
      assert.ok(result.includes('logging.info(f"🔧 Переменные из БД добавлены в all_user_vars")'));
    });

    it('должен добавлять завершающую новую строку', () => {
      const result = generateDatabaseVariablesBlock();
      assert.ok(result.endsWith('\n'));
    });
  });

  describe('генерация блока с кастомными опциями', () => {
    it('должен использовать кастомные таблицы которые не требуются', () => {
      const options: DatabaseVariablesBlockOptions = {
        notRequiredTables: ['custom_table_1', 'custom_table_2'],
      };
      const result = generateDatabaseVariablesBlock(options);
      assert.ok(result.includes('# Таблица: custom_table_1 — не требуется'));
      assert.ok(result.includes('# Таблица: custom_table_2 — не требуется'));
      assert.ok(!result.includes('# Таблица: bot_users — не требуется'));
    });

    it('должен использовать кастомные таблицы которые будут загружены', () => {
      const options: DatabaseVariablesBlockOptions = {
        requiredTables: ['user_ids', 'custom_table'],
      };
      const result = generateDatabaseVariablesBlock(options);
      assert.ok(result.includes('# Загрузка из таблицы: user_ids'));
      assert.ok(result.includes('# Загрузка из таблицы: custom_table'));
    });

    it('должен использовать кастомный отступ', () => {
      const options: DatabaseVariablesBlockOptions = {
        indent: '    ',
      };
      const result = generateDatabaseVariablesBlock(options);
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) {
          assert.ok(line.startsWith('    ') || line === '', `Строка должна иметь отступ: ${line}`);
        }
      }
    });

    it('должен работать с пустыми массивами', () => {
      const options: DatabaseVariablesBlockOptions = {
        notRequiredTables: [],
        requiredTables: [],
      };
      const result = generateDatabaseVariablesBlock(options);
      assert.ok(result.includes('# ┌─────────────────────────────────────────┐'));
      assert.ok(!result.includes('— не требуется'));
      assert.ok(!result.includes('Загрузка из таблицы:'));
    });
  });

  describe('generateDatabaseVariablesBlockCall', () => {
    it('должен генерировать код с заголовком', () => {
      const result = generateDatabaseVariablesBlockCall();
      assert.ok(result.includes('# ┌─────────────────────────────────────────┐'));
      assert.ok(result.includes('# │    Переменные из таблиц базы данных     │'));
    });

    it('должен генерировать код с отступами', () => {
      const result = generateDatabaseVariablesBlockCall('    ');
      const lines = result.split('\n');
      const headerLine = lines.find(l => l.includes('Переменные из таблиц базы данных'));
      assert.ok(headerLine && headerLine.startsWith('    '));
    });

    it('должен генерировать тот же код что и generateDatabaseVariablesBlock', () => {
      const result1 = generateDatabaseVariablesBlock({ indent: '    ' });
      const result2 = generateDatabaseVariablesBlockCall('    ');
      assert.strictEqual(result1, result2);
    });
  });

  describe('интеграционные тесты', () => {
    it('должен генерировать код который можно вставить в Python функцию', () => {
      const blockCode = generateDatabaseVariablesBlock({ indent: '    ' });
      const fullFunction = `async def some_function():
    user_id = 123
    all_user_vars = {}
${blockCode}    return all_user_vars`;

      assert.ok(fullFunction.includes('async def some_function():'));
      assert.ok(fullFunction.includes('logging.info(f"🔧 Переменные из БД добавлены в all_user_vars")'));
    });

    it('должен генерировать код который можно использовать в if блоке', () => {
      const blockCode = generateDatabaseVariablesBlock({ indent: '        ' });
      const fullCode = `if condition:
        pass
${blockCode}    else:
        pass`;

      assert.ok(fullCode.includes('if condition:'));
      assert.ok(fullCode.includes('else:'));
    });

    it('должен генерировать код который можно использовать в try блоке', () => {
      const blockCode = generateDatabaseVariablesBlock({ indent: '        ' });
      const fullCode = `try:
        some_code()
${blockCode}except Exception as e:
        logging.error(e)`;

      assert.ok(fullCode.includes('try:'));
      assert.ok(fullCode.includes('except Exception as e:'));
    });
  });

  describe('проверка на распространённые ошибки Pylance', () => {
    const pylanceErrorPatterns = [
      { name: 'Операторы без перевода строки перед else', pattern: /\)\s*else:/ },
      { name: 'Операторы без перевода строки перед elif', pattern: /\)\s*elif\s+/ },
      { name: 'Операторы без перевода строки перед if', pattern: /\)\s*if\s+/ },
    ];

    for (const { name, pattern } of pylanceErrorPatterns) {
      it(`не должен содержать ошибку: ${name}`, () => {
        const result = generateDatabaseVariablesBlock();
        assert.ok(
          !pattern.test(result),
          `Не должно быть ошибки: ${name}`
        );
      });
    }

    it('не должен содержать незавершённые конструкции', () => {
      const result = generateDatabaseVariablesBlock();
      assert.ok(
        !result.match(/=\s*\n\s*(?:else|elif|if|for|while)/),
        'Не должно быть незавершённых присваиваний'
      );
    });

    it('не должен содержать несколько операторов на одной строке', () => {
      const result = generateDatabaseVariablesBlock();
      const lines = result.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) {
          continue;
        }
        // logging.info - это один оператор
        const loggingCount = (trimmed.match(/\blogging\.info\b/g) || []).length;
        assert.ok(
          loggingCount <= 1,
          `Не должно быть нескольких операторов logging.info на строке: ${trimmed}`
        );
      }
    });
  });
});
