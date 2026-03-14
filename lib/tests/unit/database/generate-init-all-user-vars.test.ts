/**
 * @fileoverview Тесты для функции генерации init_all_user_vars
 * @module lib/tests/unit/database/generate-init-all-user-vars.test
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  generateInitAllUserVars,
  generateInitAllUserVarsCall,
  generateInitAllUserVarsSafe
} from '../../../bot-generator/database/generate-init-all-user-vars';

describe('generateInitAllUserVars', () => {
  describe('generateInitAllUserVars - генерация функции', () => {
    it('должна генерировать функцию init_all_user_vars', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('async def init_all_user_vars'), 'Должна быть async функция init_all_user_vars');
      assert.ok(result.includes('user_id: int'), 'Должен быть параметр user_id типа int');
      assert.ok(result.includes('-> dict'), 'Должен быть возвращаемый тип dict');
    });

    it('должна генерировать код загрузки из БД', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('get_user_from_db'), 'Должна быть функция get_user_from_db');
      assert.ok(result.includes('db_user_vars'), 'Должна быть переменная db_user_vars');
      assert.ok(result.includes('await get_user_from_db(user_id)'), 'Должен быть вызов get_user_from_db с user_id');
    });

    it('должна генерировать код проверки db_user_vars на dict', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('isinstance(db_user_vars, dict)'), 'Должна быть проверка на dict');
      assert.ok(result.includes('if not db_user_vars:'), 'Должна быть проверка на пустое значение');
    });

    it('должна генерировать код обновления all_user_vars', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('all_user_vars.update'), 'Должно быть обновление all_user_vars');
      assert.ok(result.includes('all_user_vars = {}'), 'Должна быть инициализация all_user_vars');
    });

    it('должна генерировать код загрузки из локального хранилища', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('local_user_vars'), 'Должна быть переменная local_user_vars');
      assert.ok(result.includes('user_data.get(user_id, {})'), 'Должно быть получение из user_data');
    });

    it('должна генерировать return all_user_vars', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('return all_user_vars'), 'Должен быть return all_user_vars');
    });

    it('должна генерировать docstring с описанием', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('"""Инициализирует all_user_vars из БД и локального хранилища'), 'Должен быть docstring');
      assert.ok(result.includes('Args:'), 'Должна быть секция Args');
      assert.ok(result.includes('Returns:'), 'Должна быть секция Returns');
    });

    it('должна генерировать заголовок с комментариями', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      assert.ok(result.includes('# ┌─────────────────────────────────────────┐'), 'Должен быть верхний разделитель');
      assert.ok(result.includes('# │    Инициализация all_user_vars          │'), 'Должен быть заголовок');
      assert.ok(result.includes('# └─────────────────────────────────────────┘'), 'Должен быть нижний разделитель');
    });
  });

  describe('generateInitAllUserVarsCall - генерация вызова', () => {
    it('должна генерировать вызов функции с параметрами по умолчанию', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsCall();

      // Assert
      assert.strictEqual(result, 'all_user_vars = await init_all_user_vars(user_id)', 'Должен быть вызов с параметрами по умолчанию');
    });

    it('должна поддерживать кастомное имя переменной user_id', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsCall('callback_query.from_user.id');

      // Assert
      assert.strictEqual(result, 'all_user_vars = await init_all_user_vars(callback_query.from_user.id)', 'Должен быть вызов с кастомным user_id');
    });

    it('должна поддерживать кастомное имя целевой переменной', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsCall('user_id', 'my_vars');

      // Assert
      assert.strictEqual(result, 'my_vars = await init_all_user_vars(user_id)', 'Должен быть вызов с кастомной целевой переменной');
    });

    it('должна поддерживать отступы', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsCall('user_id', 'all_user_vars', '        ');

      // Assert
      assert.strictEqual(result, '        all_user_vars = await init_all_user_vars(user_id)', 'Должны быть отступы');
    });
  });

  describe('generateInitAllUserVarsSafe - безопасная инициализация', () => {
    it('должна генерировать проверку locals()', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsSafe();

      // Assert
      assert.ok(result.includes("if 'all_user_vars' not in locals():"), 'Должна быть проверка locals()');
    });

    it('должна генерировать вызов init_all_user_vars внутри проверки', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsSafe();

      // Assert
      assert.ok(result.includes('all_user_vars = await init_all_user_vars'), 'Должен быть вызов init_all_user_vars');
    });

    it('должна поддерживать кастомный источник user_id', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsSafe('message.from_user.id');

      // Assert
      assert.ok(result.includes('init_all_user_vars(message.from_user.id)'), 'Должен быть кастомный источник user_id');
    });

    it('должна поддерживать отступы', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsSafe('user_id', '    ', '        ');

      // Assert
      assert.ok(result.includes('    if \'all_user_vars\' not in locals():'), 'Должен быть отступ для if');
      assert.ok(result.includes('        all_user_vars = await init_all_user_vars'), 'Должен быть отступ для вызова');
    });

    it('должна генерировать комментарий', () => {
      // Arrange & Act
      const result = generateInitAllUserVarsSafe();

      // Assert
      assert.ok(result.includes('# Инициализация all_user_vars если ещё не создан'), 'Должен быть комментарий');
    });
  });

  describe('Обратная совместимость', () => {
    it('должна поддерживать режим inline по умолчанию', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'inline', indent: '    ' });

      // Assert
      assert.ok(result.includes('all_user_vars = await init_all_user_vars'), 'Должен быть inline вызов');
    });

    it('должна генерировать пустой indent по умолчанию', () => {
      // Arrange & Act
      const result = generateInitAllUserVars({ mode: 'function' });

      // Assert
      const lines = result.split('\n');
      const firstLine = lines.find(line => line.trim().length > 0 && !line.includes('#'));
      assert.ok(firstLine && !firstLine.startsWith(' '), 'Первая строка не должна иметь отступов');
    });
  });
});
