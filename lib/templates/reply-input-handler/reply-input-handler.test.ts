/**
 * @fileoverview Тесты для шаблона reply-input-handler
 * @module templates/reply-input-handler/reply-input-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateReplyInputHandler, collectGraphNodes, collectCommandNodes } from './reply-input-handler.renderer';
import {
  validParamsMinimal,
  validParamsWithNodes,
  validParamsWithUrl,
  validParamsCustomIndent,
} from './reply-input-handler.fixture';
import { replyInputHandlerParamsSchema } from './reply-input-handler.schema';

describe('generateReplyInputHandler()', () => {

  describe('button_response_config', () => {
    it('генерирует проверку button_response_config', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('"button_response_config" in user_data[user_id]'));
    });

    it('генерирует поиск selected_option', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('selected_option = None'));
      assert.ok(r.includes('for option in config.get("options", []):'));
    });

    it('генерирует структуру response_data', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('"type": "button_choice"'));
      assert.ok(r.includes('"value": selected_value'));
    });

    it('генерирует очистку button_response_config', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('del user_data[user_id]["button_response_config"]'));
    });

    it('генерирует обработку неверного выбора', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('Неверный выбор. Пожалуйста, выберите один из предложенных вариантов'));
    });
  });

  describe('URL-кнопки', () => {
    it('без URL: нет блока url action', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(!r.includes('option_action == "url"'));
    });

    it('с URL: генерирует блок url action', () => {
      const r = generateReplyInputHandler(validParamsWithUrl);
      assert.ok(r.includes('option_action == "url" and option_url'));
      assert.ok(r.includes('🔗 Открыть ссылку'));
    });
  });

  describe('команды', () => {
    it('генерирует fake_message для команд', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('fake_message = aiogram_types.SimpleNamespace'));
    });

    it('генерирует обработчики команд', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('command == "/start"'));
      assert.ok(r.includes('await start_handler(fake_message)'));
      assert.ok(r.includes('command == "/help"'));
    });
  });

  describe('goto-навигация', () => {
    it('генерирует переход к узлам', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('target_node_id == "node_abc"'));
      assert.ok(r.includes('handle_callback_node_abc'));
    });

    it('генерирует fallback к next_node_id', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('next_node_id = config.get("next_node_id")'));
    });
  });

  describe('pending_skip_buttons', () => {
    it('генерирует проверку pending_skip_buttons', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('"pending_skip_buttons" in user_data[user_id]'));
    });

    it('генерирует очистку медиа-ожиданий', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('del user_data[user_id]["pending_skip_buttons"]'));
      assert.ok(r.includes('waiting_config.get("type") in ["photo", "video", "audio", "document"]'));
    });
  });

  describe('skip_buttons в waiting_for_input', () => {
    it('генерирует проверку skip_buttons', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('skip_buttons = waiting_config.get("skip_buttons", [])'));
    });

    it('генерирует call_skip_target_handler', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('await call_skip_target_handler(fake_callback, skip_target)'));
    });
  });

  describe('сохранение ответа', () => {
    it('генерирует appendVariable логику', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('if appendVariable:'));
      assert.ok(r.includes('user_data[user_id][variable_name] = [response_data]'));
      assert.ok(r.includes('user_data[user_id][variable_name].append(response_data)'));
    });

    it('генерирует сохранение в БД', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('if save_to_database:'));
      assert.ok(r.includes('await update_user_data_in_db(user_id, variable_name'));
    });

    it('обновляет all_user_vars', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('all_user_vars[variable_name] = user_data[user_id][variable_name]'));
    });
  });

  describe('цикл автопереходов', () => {
    it('генерирует while next_node_id', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('while next_node_id:'));
      assert.ok(r.includes('next_node_id = None'));
    });

    it('генерирует навигацию к узлам в цикле', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('current_node_id == "node_abc"'));
    });
  });

  describe('call_skip_target_handler', () => {
    it('генерирует функцию call_skip_target_handler', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('async def call_skip_target_handler(fake_callback, skip_target):'));
      assert.ok(r.includes('handler_func_name in globals()'));
    });
  });

  describe('отступы', () => {
    it('дефолтный отступ — 4 пробела', () => {
      const r = generateReplyInputHandler(validParamsWithNodes);
      assert.ok(r.includes('    # Проверяем, ожидаем ли мы кнопочный ответ'));
    });

    it('кастомный отступ — 8 пробелов', () => {
      const r = generateReplyInputHandler(validParamsCustomIndent);
      assert.ok(r.includes('        # Проверяем, ожидаем ли мы кнопочный ответ'));
    });
  });

  describe('пустые параметры', () => {
    it('работает без узлов и команд', () => {
      const r = generateReplyInputHandler(validParamsMinimal);
      assert.ok(r.includes('"button_response_config" in user_data[user_id]'));
    });
  });
});

describe('replyInputHandlerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(replyInputHandlerParamsSchema.safeParse(validParamsWithNodes).success);
  });

  it('принимает пустые массивы', () => {
    assert.ok(replyInputHandlerParamsSchema.safeParse(validParamsMinimal).success);
  });

  it('отклоняет числовой indentLevel', () => {
    assert.ok(!replyInputHandlerParamsSchema.safeParse({ ...validParamsMinimal, indentLevel: 4 }).success);
  });
});

describe('collectGraphNodes()', () => {
  it('собирает id и safeName', () => {
    const nodes = collectGraphNodes([{ id: 'my-node', data: {} }]);
    assert.strictEqual(nodes[0].id, 'my-node');
    assert.strictEqual(nodes[0].safeName, 'my_node');
  });

  it('фильтрует null', () => {
    const nodes = collectGraphNodes([null, { id: 'ok', data: {} }]);
    assert.strictEqual(nodes.length, 1);
  });
});

describe('collectCommandNodes()', () => {
  it('собирает start и command узлы', () => {
    const cmds = collectCommandNodes([
      { id: 's1', type: 'start', data: { command: '/start' } },
      { id: 'c1', type: 'command', data: { command: '/help' } },
      { id: 'm1', type: 'message', data: {} },
    ]);
    assert.strictEqual(cmds.length, 2);
    assert.strictEqual(cmds[0].command, '/start');
  });

  it('фильтрует узлы без команды', () => {
    const cmds = collectCommandNodes([{ id: 'x', type: 'command', data: {} }]);
    assert.strictEqual(cmds.length, 0);
  });
});

describe('Производительность', () => {
  it('generateReplyInputHandler: быстрее 10ms', () => {
    const start = Date.now();
    generateReplyInputHandler(validParamsWithNodes);
    assert.ok(Date.now() - start < 10);
  });
});
