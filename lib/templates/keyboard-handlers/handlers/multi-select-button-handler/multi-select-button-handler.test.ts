/**
 * @fileoverview Тесты для шаблона multi-select button обработчика
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMultiSelectButtonHandler } from './multi-select-button-handler.renderer';
import {
  validParamsBasic,
  validParamsWithoutDone,
  validParamsSkipData,
  validParamsMetroSelection,
  validParamsNoInputVariable,
  invalidParamsMissingCallbackData,
  invalidParamsWrongButtonType,
} from './multi-select-button-handler.fixture';
import { multiSelectButtonHandlerParamsSchema } from './multi-select-button-handler.schema';

describe('generateMultiSelectButtonHandler', () => {
  describe('Валидные данные', () => {
    it('должен генерировать обработчик с done кнопкой', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('@dp.callback_query'));
      assert.ok(result.includes('done_abc123'));
      assert.ok(result.includes('handle_callback_ms_abc123_btn456'));
      assert.ok(result.includes('callback_query.answer()'));
      assert.ok(result.includes('user_id = callback_query.from_user.id'));
    });

    it('должен генерировать логику сохранения выбранных значений в БД', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('selected_options = user_data.get(user_id, {}).get("multi_select_'));
      assert.ok(result.includes('await update_user_data_in_db'));
      assert.ok(result.includes('user_interests'));
    });

    it('должен генерировать очистку состояния после done', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('user_data[user_id].pop("multi_select_'));
      assert.ok(result.includes('user_data[user_id].pop("multi_select_node"'));
    });

    it('должен генерировать переход к следующему узлу', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('next_node_id = "next_node"'));
      assert.ok(result.includes('await handle_callback_'));
    });

    it('должен генерировать специальную логику для metro_selection', () => {
      const result = generateMultiSelectButtonHandler(validParamsMetroSelection);
      assert.ok(result.includes('saved_metro_selection'));
      assert.ok(result.includes('show_metro_keyboard = True'));
      assert.ok(result.includes('🚇 Сохранили метро выбор'));
    });

    it('должен генерировать обработчик без done кнопки', () => {
      const result = generateMultiSelectButtonHandler(validParamsWithoutDone);
      assert.ok(result.includes('@dp.callback_query'));
      assert.ok(!result.includes('done_'));
      assert.ok(result.includes('button_text ='));
    });
  });

  describe('Логика сохранения переменных', () => {
    it('должен сохранять переменную из узла при наличии inputVariable', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('await update_user_data_in_db(user_id, "user_choice"'));
      assert.ok(result.includes('waiting_for_input'));
    });

    it('должен сохранять кнопку как есть при отсутствии inputVariable', () => {
      const result = generateMultiSelectButtonHandler(validParamsNoInputVariable);
      assert.ok(result.includes('timestamp = get_moscow_time()'));
      assert.ok(result.includes('response_data = button_text'));
    });

    it('должен пропускать сохранение при skipDataCollection=true', () => {
      const result = generateMultiSelectButtonHandler(validParamsSkipData);
      assert.ok(result.includes('skipDataCollection=true'));
      assert.ok(result.includes('skipDataCollectionTransition'));
      assert.ok(!result.includes('await update_user_data_in_db(user_id, "skip_var"'));
    });
  });

  describe('Callback data генерация', () => {
    it('должен использовать правильный формат callback_data', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('c.data == "ms_abc123_btn456"'));
      assert.ok(result.includes('c.data.startswith("ms_abc123_btn456_btn_")'));
    });

    it('должен использовать безопасное имя функции', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      assert.ok(result.includes('handle_callback_ms_abc123_btn456'));
    });
  });

  describe('Невалидные данные', () => {
    it('должен выбрасывать ошибку при отсутствии callbackData', () => {
      assert.throws(() => multiSelectButtonHandlerParamsSchema.parse(invalidParamsMissingCallbackData));
    });

    it('должен выбрасывать ошибку при неправильном типе button', () => {
      assert.throws(() => multiSelectButtonHandlerParamsSchema.parse(invalidParamsWrongButtonType));
    });
  });

  describe('Валидация схемы', () => {
    it('должна принимать валидные параметры', () => {
      const result = multiSelectButtonHandlerParamsSchema.safeParse(validParamsBasic);
      assert.ok(result.success);
    });

    it('должна принимать параметры без targetNode', () => {
      const params = { ...validParamsWithoutDone, targetNode: undefined };
      const result = multiSelectButtonHandlerParamsSchema.safeParse(params);
      assert.ok(result.success);
    });

    it('должна принимать параметры с custom indent', () => {
      const params = { ...validParamsBasic, indentLevel: '        ' };
      const result = multiSelectButtonHandlerParamsSchema.safeParse(params);
      assert.ok(result.success);
    });
  });

  describe('Отступы', () => {
    it('должен использовать отступ по умолчанию', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      const lines = result.split('\n');
      const firstNonEmpty = lines.find(l => l.trim().length > 0) || '';
      assert.ok(firstNonEmpty.startsWith('    @dp'), `Expected '    @dp', got: "${firstNonEmpty}"`);
    });

    it('должен использовать custom indent', () => {
      const params = { ...validParamsBasic, indentLevel: '        ' };
      const result = generateMultiSelectButtonHandler(params);
      const lines = result.split('\n');
      const firstNonEmpty = lines.find(l => l.trim().length > 0) || '';
      assert.ok(firstNonEmpty.startsWith('        @dp'), `Expected '        @dp', got: "${firstNonEmpty}"`);
    });
  });

  describe('Производительность', () => {
    it('должен быстро генерировать код для одного узла', () => {
      const start = performance.now();
      generateMultiSelectButtonHandler(validParamsBasic);
      const end = performance.now();
      assert.ok(end - start < 100, `Генерация заняла ${end - start}ms`);
    });

    it('должен быстро генерировать код для множества узлов', () => {
      const params: any = {
        ...validParamsBasic,
        nodes: Array.from({ length: 100 }, (_, i) => ({ id: `node_${i}`, type: 'message', data: {} })),
      };
      const start = performance.now();
      generateMultiSelectButtonHandler(params);
      const end = performance.now();
      assert.ok(end - start < 500, `Генерация заняла ${end - start}ms`);
    });
  });
});
