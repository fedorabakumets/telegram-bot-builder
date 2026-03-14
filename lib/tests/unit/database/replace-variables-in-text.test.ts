/**
 * @fileoverview Тесты для функции замены переменных в тексте
 * @module lib/tests/unit/database/replace-variables-in-text.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { replace_variables_in_text } from '../../../bot-generator/database/replace_variables_in_text';
import { generateUniversalVariableReplacement } from '../../../bot-generator/database/generateUniversalVariableReplacement';
import { init_user_variables } from '../../../bot-generator/database/init_user_variables';

describe('ReplaceVariablesInText (Python Code Generator)', () => {
  describe('replace_variables_in_text - генерация кода', () => {
    it('должна генерировать код функции замены переменных', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      replace_variables_in_text(codeLines);
      
      // Assert
      assert.ok(codeLines.length > 0, 'Код должен быть сгенерирован');
      assert.ok(codeLines.some(line => line.includes('def replace_variables_in_text')), 'Должна быть функция replace_variables_in_text');
      assert.ok(codeLines.some(line => line.includes('placeholder = "{" + var_name + "}"')), 'Должна быть логика замены переменных');
    });

    it('должна генерировать код с обработкой dict переменных', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      replace_variables_in_text(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('isinstance(var_data, dict)')), 'Должна быть проверка на dict');
      assert.ok(codeLines.some(line => line.includes('var_data["value"]')), 'Должно быть извлечение значения из dict');
    });

    it('должна генерировать код с обработкой list переменных', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      replace_variables_in_text(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('isinstance(var_data, list)')), 'Должна быть проверка на list');
      assert.ok(codeLines.some(line => line.includes('join(str(item) for item in var_data)')), 'Должно быть объединение элементов списка');
    });

    it('должна генерировать код с поддержкой фильтров переменных', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      replace_variables_in_text(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('variable_filters')), 'Должна быть поддержка фильтров');
      assert.ok(codeLines.some(line => line.includes('re.search')), 'Должна быть поддержка regex для фильтров');
      assert.ok(codeLines.some(line => line.includes('|join:')), 'Должна быть поддержка фильтра join');
    });

    it('должна генерировать код с логированием', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      replace_variables_in_text(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('logging.debug')), 'Должно быть debug логирование');
      assert.ok(codeLines.some(line => line.includes('logging.info')), 'Должно быть info логирование');
    });

    it('должна генерировать код с обработкой null/undefined', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      replace_variables_in_text(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('if not text_content or not variables_dict')), 'Должна быть проверка на null/undefined');
      assert.ok(codeLines.some(line => line.includes('var_data is not None')), 'Должна быть проверка значения переменной');
    });
  });

  describe('generateUniversalVariableReplacement - генерация кода', () => {
    it('должна генерировать код инициализации all_user_vars', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      generateUniversalVariableReplacement(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('all_user_vars = {}')), 'Должна быть инициализация all_user_vars');
    });

    it('должна генерировать код получения переменных из БД', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      generateUniversalVariableReplacement(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('get_user_from_db')), 'Должна быть функция get_user_from_db');
      assert.ok(codeLines.some(line => line.includes('db_user_vars')), 'Должна быть переменная db_user_vars');
    });

    it('должна генерировать код обновления all_user_vars', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      generateUniversalVariableReplacement(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('all_user_vars.update')), 'Должно быть обновление all_user_vars');
    });

    it('должна генерировать код вызова replace_variables_in_text', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      generateUniversalVariableReplacement(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('replace_variables_in_text')), 'Должен быть вызов replace_variables_in_text');
    });

    it('должна поддерживать старый формат вызова (обратная совместимость)', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act - старый формат со строкой indentLevel
      generateUniversalVariableReplacement(codeLines, '    ');
      
      // Assert
      assert.ok(codeLines.length > 0, 'Код должен быть сгенерирован');
    });

    it('должна генерировать код с обработкой variableFilters из узла', () => {
      // Arrange
      const codeLines: string[] = [];
      const node = {
        data: {
          variableFilters: { 'myVar': '|join:", "' }
        }
      };
      
      // Act
      generateUniversalVariableReplacement(codeLines, { node });
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('_variable_filters')), 'Должны быть фильтры переменных');
    });
  });

  describe('init_user_variables - генерация кода', () => {
    it('должна генерировать код функции init_user_variables', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      init_user_variables(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('async def init_user_variables')), 'Должна быть async функция init_user_variables');
    });

    it('должна генерировать код инициализации user_data', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      init_user_variables(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('if user_id not in user_data')), 'Должна быть проверка инициализации user_data');
    });

    it('должна генерировать код загрузки переменных из БД', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      init_user_variables(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('await get_user_from_db')), 'Должна быть загрузка из БД');
    });

    it('должна генерировать код извлечения данных из Telegram API', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      init_user_variables(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('user_obj.username')), 'Должно быть извлечение username');
      assert.ok(codeLines.some(line => line.includes('user_obj.first_name')), 'Должно быть извлечение first_name');
      assert.ok(codeLines.some(line => line.includes('user_obj.last_name')), 'Должно быть извлечение last_name');
    });

    it('должна генерировать код определения user_name с приоритетом', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      init_user_variables(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('user_name = first_name or username or')), 'Должен быть приоритет имён');
    });

    it('должна генерировать код с логированием', () => {
      // Arrange
      const codeLines: string[] = [];
      
      // Act
      init_user_variables(codeLines);
      
      // Assert
      assert.ok(codeLines.some(line => line.includes('logging.info')), 'Должно быть логирование');
    });
  });
});
