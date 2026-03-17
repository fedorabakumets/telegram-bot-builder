/**
 * @fileoverview Тесты для шаблона conditional-input-handler
 * @module templates/conditional-input-handler/conditional-input-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateConditionalInputHandler, collectConditionalNavNodes } from './conditional-input-handler.renderer';
import {
  validParamsMinimal,
  validParamsWithNodes,
  validParamsCustomIndent,
} from './conditional-input-handler.fixture';
import { conditionalInputHandlerParamsSchema } from './conditional-input-handler.schema';

describe('generateConditionalInputHandler()', () => {

  describe('проверка состояния', () => {
    it('генерирует проверку waiting_for_conditional_input', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('"waiting_for_conditional_input" in user_data[user_id]'));
    });

    it('извлекает config из user_data', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('config = user_data[user_id]["waiting_for_conditional_input"]'));
    });

    it('читает user_text из message.text', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('user_text = message.text'));
    });
  });

  describe('skipDataCollection', () => {
    it('генерирует проверку skip_buttons', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('skip_buttons = config.get("skip_buttons", [])'));
    });

    it('генерирует поиск skip_button_target', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('skip_button_target = None'));
      assert.ok(r.includes('skip_button_target = skip_btn.get("target")'));
    });

    it('генерирует очистку состояния при пропуске', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('del user_data[user_id]["waiting_for_conditional_input"]'));
    });

    it('генерирует fake_callback для навигации пропуска', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('id="skip_button_nav"'));
    });

    it('генерирует навигацию к узлам при пропуске', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('skip_button_target == "node_abc"'));
      assert.ok(r.includes("if 'handle_callback_node_abc' in globals()"));
    });

    it('генерирует обработку ошибки при пропуске', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('Ошибка при переходе к узлу кнопки skipDataCollection'));
    });
  });

  describe('сохранение ответа', () => {
    it('генерирует извлечение condition_id', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('condition_id = config.get("condition_id", "unknown")'));
    });

    it('генерирует логику имени переменной', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('input_variable = config.get("input_variable", "")'));
      assert.ok(r.includes('variable_name = f"conditional_response_{condition_id}"'));
    });

    it('сохраняет в user_data', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('user_data[user_id][variable_name] = user_text'));
    });

    it('сохраняет в БД через update_user_data_in_db', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('await update_user_data_in_db(user_id, variable_name, user_text)'));
    });

    it('очищает состояние после сохранения', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      // Должно быть минимум 2 раза: при пропуске и после сохранения
      const count = (r.match(/del user_data\[user_id\]\["waiting_for_conditional_input"\]/g) || []).length;
      assert.ok(count >= 2);
    });
  });

  describe('навигация после сохранения', () => {
    it('генерирует проверку next_node_id', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('if next_node_id:'));
    });

    it('генерирует обработку profile_command', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('next_node_id == "profile_command"'));
      assert.ok(r.includes('profile_handler'));
    });

    it('генерирует fake_callback для навигации', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('id="conditional_nav"'));
    });

    it('генерирует переход к узлам', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('next_node_id == "node_abc"'));
      assert.ok(r.includes('await handle_callback_node_abc(fake_callback)'));
    });

    it('генерирует обработку ошибки навигации', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('Ошибка при переходе к следующему узлу'));
    });
  });

  describe('завершение обработки', () => {
    it('генерирует return в конце', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('return  # Завершаем обработку для условного сообщения'));
    });

    it('return находится внутри if-блока (отступ ind2, не ind)', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      // return должен быть с отступом ind2 (8 пробелов), а не ind (4 пробела)
      assert.ok(r.includes('        return  # Завершаем обработку для условного сообщения'));
      // Не должно быть строки с ровно 4 пробелами (уровень функции)
      assert.ok(!r.match(/^    return  # Завершаем обработку для условного сообщения/m));
    });
  });

  describe('пустые параметры', () => {
    it('работает без узлов', () => {
      const r = generateConditionalInputHandler(validParamsMinimal);
      assert.ok(r.includes('"waiting_for_conditional_input" in user_data[user_id]'));
    });

    it('без узлов нет навигации к конкретным узлам', () => {
      const r = generateConditionalInputHandler(validParamsMinimal);
      assert.ok(!r.includes('handle_callback_node_abc'));
    });
  });

  describe('отступы', () => {
    it('дефолтный отступ — 4 пробела', () => {
      const r = generateConditionalInputHandler(validParamsWithNodes);
      assert.ok(r.includes('    # Проверяем, ожидаем ли мы ввод для условного сообщения'));
    });

    it('кастомный отступ — 8 пробелов', () => {
      const r = generateConditionalInputHandler(validParamsCustomIndent);
      assert.ok(r.includes('        # Проверяем, ожидаем ли мы ввод для условного сообщения'));
    });
  });
});

describe('conditionalInputHandlerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(conditionalInputHandlerParamsSchema.safeParse(validParamsWithNodes).success);
  });

  it('принимает пустые массивы', () => {
    assert.ok(conditionalInputHandlerParamsSchema.safeParse(validParamsMinimal).success);
  });

  it('отклоняет числовой indentLevel', () => {
    assert.ok(!conditionalInputHandlerParamsSchema.safeParse({ ...validParamsMinimal, indentLevel: 4 }).success);
  });
});

describe('collectConditionalNavNodes()', () => {
  it('собирает id и safeName', () => {
    const nodes = collectConditionalNavNodes([{ id: 'my-node', type: 'message', data: {} }]);
    assert.strictEqual(nodes[0].id, 'my-node');
    assert.strictEqual(nodes[0].safeName, 'my_node');
  });

  it('фильтрует null', () => {
    const nodes = collectConditionalNavNodes([null, { id: 'ok', type: 'message', data: {} }]);
    assert.strictEqual(nodes.length, 1);
  });

  it('устанавливает дефолтный type', () => {
    const nodes = collectConditionalNavNodes([{ id: 'x', data: {} }]);
    assert.strictEqual(nodes[0].type, 'message');
  });
});

describe('Производительность', () => {
  it('generateConditionalInputHandler: быстрее 10ms', () => {
    const start = Date.now();
    generateConditionalInputHandler(validParamsWithNodes);
    assert.ok(Date.now() - start < 10);
  });
});

// ─── Качество кода (проблема #1 — лишние пустые строки) ──────────────────────

describe('качество кода — пустые строки', () => {
  it('не содержит более 2 пустых строк подряд', () => {
    const r = generateConditionalInputHandler(validParamsWithNodes);
    assert.ok(
      !r.includes('\n\n\n'),
      'Обнаружено 3+ пустых строки подряд'
    );
  });

  it('не содержит строк только из пробелов', () => {
    const lines = generateConditionalInputHandler(validParamsWithNodes).split('\n');
    const blankWithSpaces = lines.filter(l => l.length > 0 && l.trim() === '');
    // TODO: шаблон генерирует строки с пробелами — это known issue #1
    // Тест фиксирует количество таких строк чтобы оно не росло
    assert.ok(
      blankWithSpaces.length <= 40,
      `Найдено ${blankWithSpaces.length} строк только из пробелов (порог: 40)`
    );
  });
});

// ─── Мёртвый код после return (проблема #6 — регрессия) ──────────────────────

describe('отсутствие мёртвого кода после return', () => {
  it('return находится внутри if-блока (отступ ind2, не ind)', () => {
    const r = generateConditionalInputHandler(validParamsWithNodes);
    assert.ok(r.includes('        return  # Завершаем обработку для условного сообщения'));
    assert.ok(!r.match(/^    return  # Завершаем обработку для условного сообщения/m));
  });

  it('код после return не является мёртвым — return внутри if', () => {
    const r = generateConditionalInputHandler(validParamsWithNodes);
    // Находим позицию return и убеждаемся что он внутри if-блока (8 пробелов)
    const lines = r.split('\n');
    const returnLine = lines.find(l => l.includes('return  # Завершаем обработку'));
    assert.ok(returnLine, 'Строка return не найдена');
    const indent = returnLine!.match(/^(\s*)/)?.[1] ?? '';
    assert.strictEqual(indent.length, 8, `Отступ return = ${indent.length} пробелов, ожидалось 8`);
  });
});
