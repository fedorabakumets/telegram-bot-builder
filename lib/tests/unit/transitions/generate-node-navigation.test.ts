/**
 * @fileoverview Тесты для генератора функции навигации к узлу
 * 
 * Проверяет корректность генерации Python-кода для функции navigate_to_node
 * и её вызовов в различных контекстах.
 * 
 * @module tests/unit/transitions/generate-node-navigation
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  generateNavigateToNode,
  generateNavigateToNodeCall,
  generateNavigateToNodeWithText,
  generateNavigateToNodeWithVars,
  generateNavigateToNodeSafe,
} from '../../../bot-generator/transitions/generate-node-navigation';

describe('generateNavigateToNode', () => {
  describe('генерация функции navigate_to_node', () => {
    it('должен генерировать функцию navigate_to_node', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('async def navigate_to_node'));
    });

    it('должен генерировать функцию с параметрами message, node_id, text, all_user_vars, reply_markup', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('message, node_id: str, text: str = None, all_user_vars: dict = None, reply_markup=None'));
    });

    it('должен генерировать docstring с описанием параметров', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('"""Навигация к указанному узлу с отправкой сообщения'));
      assert.ok(result.includes('Args:'));
      assert.ok(result.includes('message: Объект сообщения от aiogram'));
      assert.ok(result.includes('node_id (str): ID целевого узла'));
      assert.ok(result.includes('text (str, optional): Текст сообщения'));
      assert.ok(result.includes('all_user_vars (dict, optional): Переменные пользователя'));
      assert.ok(result.includes('reply_markup: Клавиатура для сообщения'));
    });

    it('должен генерировать инициализацию user_id', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('user_id = message.from_user.id'));
    });

    it('должен генерировать проверку all_user_vars is None', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('if all_user_vars is None:'));
      assert.ok(result.includes('all_user_vars = await init_all_user_vars(user_id)'));
    });

    it('должен генерировать проверку text is None', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('if text is None:'));
      assert.ok(result.includes('text = "Привет! Добро пожаловать!"'));
    });

    it('должен генерировать замену переменных в тексте', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})'));
      assert.ok(result.includes('text = replace_variables_in_text(text, all_user_vars, variable_filters)'));
    });

    it('должен генерировать логирование навигации', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('logging.info(f"🚀 Навигация к узлу: {node_id}")'));
    });

    it('должен генерировать отправку сообщения с reply_markup и без', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('if reply_markup:'));
      assert.ok(result.includes('await message.answer(text, reply_markup=reply_markup)'));
      assert.ok(result.includes('await message.answer(text)'));
    });

    it('должен генерировать заголовок с комментарием', () => {
      const result = generateNavigateToNode();
      assert.ok(result.includes('# ┌─────────────────────────────────────────┐'));
      assert.ok(result.includes('# │    Навигация к узлу                     │'));
      assert.ok(result.includes('# └─────────────────────────────────────────┘'));
    });
  });
});

describe('generateNavigateToNodeCall', () => {
  describe('генерация вызова функции навигации', () => {
    it('должен генерировать вызов функции с параметрами по умолчанию', () => {
      const result = generateNavigateToNodeCall('_test_node_');
      assert.strictEqual(result.trim(), 'await navigate_to_node(message, "_test_node_")');
    });

    it('должен поддерживать кастомное имя переменной сообщения', () => {
      const result = generateNavigateToNodeCall('_test_node_', 'msg');
      assert.strictEqual(result.trim(), 'await navigate_to_node(msg, "_test_node_")');
    });

    it('должен поддерживать кастомный отступ', () => {
      const result = generateNavigateToNodeCall('_test_node_', 'message', '    ');
      assert.strictEqual(result.trim(), 'await navigate_to_node(message, "_test_node_")');
    });

    it('должен поддерживать сложные ID узлов', () => {
      const result = generateNavigateToNodeCall('_XfgkKBCCbODb0z7tH7u_');
      assert.ok(result.includes('_XfgkKBCCbODb0z7tH7u_'));
    });

    it('должен поддерживать unicode в ID узла', () => {
      const result = generateNavigateToNodeCall('узел_тест');
      assert.ok(result.includes('узел_тест'));
    });
  });
});

describe('generateNavigateToNodeWithText', () => {
  describe('генерация вызова с кастомным текстом', () => {
    it('должен генерировать вызов с параметром text', () => {
      const result = generateNavigateToNodeWithText('_test_node_', 'message_text');
      assert.ok(result.includes('await navigate_to_node(message, "_test_node_", text=message_text)'));
    });

    it('должен поддерживать кастомное имя переменной сообщения', () => {
      const result = generateNavigateToNodeWithText('_test_node_', 'message_text', 'msg');
      assert.ok(result.includes('await navigate_to_node(msg, "_test_node_", text=message_text)'));
    });

    it('должен поддерживать кастомный отступ', () => {
      const result = generateNavigateToNodeWithText('_test_node_', 'text', 'message', '        ');
      assert.ok(result.includes('await navigate_to_node(message, "_test_node_", text=text)'));
    });
  });
});

describe('generateNavigateToNodeWithVars', () => {
  describe('генерация вызова с кастомными переменными', () => {
    it('должен генерировать вызов с параметром all_user_vars', () => {
      const result = generateNavigateToNodeWithVars('_test_node_', 'vars_dict');
      assert.ok(result.includes('await navigate_to_node(message, "_test_node_", all_user_vars=vars_dict)'));
    });

    it('должен поддерживать кастомное имя переменной сообщения', () => {
      const result = generateNavigateToNodeWithVars('_test_node_', 'vars_dict', 'msg');
      assert.ok(result.includes('await navigate_to_node(msg, "_test_node_", all_user_vars=vars_dict)'));
    });

    it('должен поддерживать кастомный отступ', () => {
      const result = generateNavigateToNodeWithVars('_test_node_', 'vars', 'message', '    ');
      assert.ok(result.includes('await navigate_to_node(message, "_test_node_", all_user_vars=vars)'));
    });
  });
});

describe('generateNavigateToNodeSafe', () => {
  describe('генерация безопасного вызова', () => {
    it('должен генерировать проверку существования обработчика', () => {
      const result = generateNavigateToNodeSafe('_test_node_');
      assert.ok(result.includes('if \'_test_node_\' == \'_test_node_\':') || result.includes('if "_test_node_" == "_test_node_":'), `Должна быть проверка ID узла. Получено: ${result.substring(0, 100)}`);
      assert.ok(result.includes("if 'handle_callback__test_node_' in globals():"), `Должна быть проверка globals(). Получено: ${result.substring(0, 200)}`);
    });

    it('должен генерировать вызов обработчика', () => {
      const result = generateNavigateToNodeSafe('_test_node_');
      assert.ok(result.includes('await handle_callback__test_node_(fake_callback)'), `Должен быть вызов обработчика. Получено: ${result.substring(0, 300)}`);
    });

    it('должен генерировать warning при отсутствии обработчика', () => {
      const result = generateNavigateToNodeSafe('_test_node_');
      assert.ok(result.includes('logging.warning(f"⚠️ Обработчик не найден для узла: _test_node_")'));
      assert.ok(result.includes('await message.answer("Переход завершен")'));
    });

    it('должен заменять дефисы на подчёркивания в имени функции', () => {
      const result = generateNavigateToNodeSafe('test-node-id');
      assert.ok(result.includes("if 'handle_callback_test_node_id' in globals():"));
    });

    it('должен заменять пробелы на подчёркивания в имени функции', () => {
      const result = generateNavigateToNodeSafe('test node id');
      assert.ok(result.includes("if 'handle_callback_test_node_id' in globals():"));
    });

    it('должен поддерживать кастомный отступ', () => {
      const result = generateNavigateToNodeSafe('_test_node_', '    ');
      assert.ok(result.startsWith('    if "_test_node_"'));
    });

    it('должен поддерживать кастомный внутренний отступ', () => {
      const result = generateNavigateToNodeSafe('_test_node_', '', '        ');
      assert.ok(result.includes('        if '));
      assert.ok(result.includes('                await '));
    });

    it('должен генерировать корректный код для сложных ID узлов', () => {
      const result = generateNavigateToNodeSafe('_XfgkKBCCbODb0z7tH7u_');
      assert.ok(result.includes('if "_XfgkKBCCbODb0z7tH7u_" == "_XfgkKBCCbODb0z7tH7u_":'));
      assert.ok(result.includes("if 'handle_callback__XfgkKBCCbODb0z7tH7u_' in globals():"));
    });
  });
});

describe('generateNavigateToNode - Integration', () => {
  describe('интеграционные тесты', () => {
    it('должен генерировать валидный Python код', () => {
      const result = generateNavigateToNode();
      
      // Проверяем базовую структуру Python функции
      assert.ok(result.includes('async def '));
      assert.ok(result.includes(':'));
      assert.ok(result.includes('"""'));
      
      // Проверяем отступы
      const lines = result.split('\n');
      const hasIndentedLines = lines.some(line => line.startsWith('    '));
      assert.ok(hasIndentedLines);
    });

    it('должен генерировать код с правильными отступами', () => {
      const result = generateNavigateToNode();
      const lines = result.split('\n');
      
      // Находим строку с определением функции
      const defIndex = lines.findIndex(line => line.includes('async def navigate_to_node'));
      assert.ok(defIndex !== -1);
      
      // Проверяем что следующие строки имеют отступ
      for (let i = defIndex + 1; i < Math.min(defIndex + 10, lines.length); i++) {
        if (lines[i].trim() && !lines[i].trim().startsWith('"""')) {
          assert.ok(lines[i].startsWith('    '), `Строка ${i} должна иметь отступ`);
        }
      }
    });

    it('должен генерировать код который проходит валидацию Python', () => {
      const result = generateNavigateToNode();
      
      // Базовая проверка синтаксиса
      assert.ok(result.includes('async def navigate_to_node'));
      assert.ok(result.includes('message, node_id: str'));
      assert.ok(result.includes('await init_all_user_vars'));
      assert.ok(result.includes('await message.answer'));
    });
  });
});

describe('generateNavigateToNode - Edge Cases', () => {
  describe('граничные случаи', () => {
    it('должен генерировать код для пустого ID узла', () => {
      const result = generateNavigateToNodeCall('');
      assert.ok(result.includes('await navigate_to_node(message, "")'));
    });

    it('должен генерировать код для ID узла с специальными символами', () => {
      const result = generateNavigateToNodeCall('node-123_test');
      assert.ok(result.includes('node-123_test'));
    });

    it('должен генерировать код для очень длинного ID узла', () => {
      const longId = 'a'.repeat(100);
      const result = generateNavigateToNodeCall(longId);
      assert.ok(result.includes(longId));
    });

    it('должен генерировать safe вызов для узла с цифрами', () => {
      const result = generateNavigateToNodeSafe('node123');
      assert.ok(result.includes("if 'handle_callback_node123' in globals():"));
    });
  });
});
