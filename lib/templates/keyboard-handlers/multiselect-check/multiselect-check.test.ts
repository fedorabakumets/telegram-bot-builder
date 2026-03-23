/**
 * @fileoverview Тесты для шаблона multiselect-check
 * @module templates/multiselect-check/multiselect-check.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMultiSelectCheck, collectMultiSelectNodes } from './multiselect-check.renderer';
import {
  validParamsMinimal,
  validParamsWithMultiSelect,
  validParamsWithGoto,
  validParamsCustomIndent,
} from './multiselect-check.fixture';
import { multiSelectCheckParamsSchema } from './multiselect-check.schema';

describe('generateMultiSelectCheck()', () => {

  describe('проверка состояния', () => {
    it('генерирует проверку multi_select_node', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('"multi_select_node" in user_data[user_id]'));
    });

    it('читает node_id из user_data', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('node_id = user_data[user_id]["multi_select_node"]'));
    });

    it('логирует режим множественного выбора', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('Проверяем режим множественного выбора'));
    });
  });

  describe('кнопка Готово', () => {
    it('генерирует проверку кнопки Готово', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      // escape_python_string возвращает одинарные кавычки
      assert.ok(r.includes("'Готово'"));
    });

    it('сохраняет выбранные опции в БД', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('await save_user_data_to_db(user_id'));
      assert.ok(r.includes("'selected_items'"));
    });

    it('очищает состояние после завершения', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('user_data[user_id].pop(f"multi_select_{node_id}", None)'));
      assert.ok(r.includes('user_data[user_id].pop("multi_select_node", None)'));
    });

    it('переходит к следующему узлу', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('await message.answer(text'));
    });

    it('генерирует return после завершения', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('return'));
    });
  });

  describe('кнопки выбора (selection)', () => {
    it('генерирует проверку clean_user_input', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('clean_user_input = user_input.replace("✅ ", "").strip()'));
    });

    it('генерирует toggle логику', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('selected_list.remove('));
      assert.ok(r.includes('selected_list.append('));
    });

    it('генерирует обновление клавиатуры', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('builder = ReplyKeyboardBuilder()'));
      assert.ok(r.includes('builder.adjust(2)'));
    });

    it('генерирует замену переменных в тексте', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('replace_variables_in_text(text, all_user_vars, variable_filters)'));
    });
  });

  describe('goto кнопки', () => {
    it('генерирует обработку goto кнопок', () => {
      const r = generateMultiSelectCheck(validParamsWithGoto);
      assert.ok(r.includes("'Перейти'"));
    });

    it('очищает состояние перед goto переходом', () => {
      const r = generateMultiSelectCheck(validParamsWithGoto);
      assert.ok(r.includes('user_data[user_id].pop(f"multi_select_{node_id}", None)'));
    });

    it('генерирует fake_callback для goto', () => {
      const r = generateMultiSelectCheck(validParamsWithGoto);
      assert.ok(r.includes('id="multi_select_goto"'));
    });

    it('вызывает handle_callback для целевого узла', () => {
      const r = generateMultiSelectCheck(validParamsWithGoto);
      assert.ok(r.includes('await handle_callback_node_target(fake_callback)'));
    });
  });

  describe('пустые параметры', () => {
    it('работает без узлов', () => {
      const r = generateMultiSelectCheck(validParamsMinimal);
      assert.ok(r.includes('"multi_select_node" in user_data[user_id]'));
    });

    it('генерирует fallback комментарий', () => {
      const r = generateMultiSelectCheck(validParamsMinimal);
      assert.ok(r.includes('продолжаем стандартную обработку'));
    });
  });

  describe('отступы', () => {
    it('дефолтный отступ — 4 пробела', () => {
      const r = generateMultiSelectCheck(validParamsWithMultiSelect);
      assert.ok(r.includes('    # Проверяем, находится ли пользователь в режиме множественного выбора'));
    });

    it('кастомный отступ — 8 пробелов', () => {
      const r = generateMultiSelectCheck(validParamsCustomIndent);
      assert.ok(r.includes('        # Проверяем, находится ли пользователь в режиме множественного выбора'));
    });
  });
});

describe('multiSelectCheckParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(multiSelectCheckParamsSchema.safeParse(validParamsWithMultiSelect).success);
  });

  it('принимает пустые массивы', () => {
    assert.ok(multiSelectCheckParamsSchema.safeParse(validParamsMinimal).success);
  });

  it('отклоняет числовой indentLevel', () => {
    assert.ok(!multiSelectCheckParamsSchema.safeParse({ ...validParamsMinimal, indentLevel: 4 }).success);
  });
});

describe('collectMultiSelectNodes()', () => {
  it('собирает id и safeName', () => {
    const nodes = collectMultiSelectNodes([{ id: 'my-node', type: 'message', data: {} }]);
    assert.strictEqual(nodes[0].id, 'my-node');
    assert.strictEqual(nodes[0].safeName, 'my_node');
  });

  it('фильтрует null', () => {
    const nodes = collectMultiSelectNodes([null, { id: 'ok', type: 'message', data: {} }]);
    assert.strictEqual(nodes.length, 1);
  });
});

describe('Производительность', () => {
  it('generateMultiSelectCheck: быстрее 10ms', () => {
    const start = Date.now();
    generateMultiSelectCheck(validParamsWithMultiSelect);
    assert.ok(Date.now() - start < 10);
  });
});
