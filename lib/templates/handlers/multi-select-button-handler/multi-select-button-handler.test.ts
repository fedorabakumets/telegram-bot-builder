/**
 * @fileoverview Тесты для шаблона multi-select button обработчика
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.test
 */

import { describe, it, expect } from 'vitest';
import { generateMultiSelectButtonHandler } from './multi-select-button-handler.renderer';
import {
  validParamsBasic,
  validParamsWithoutDone,
  validParamsSkipData,
  validParamsMetroSelection,
  validParamsNoInputVariable,
  invalidParamsMissingCallbackData,
  invalidParamsWrongButtonType,
  expectedOutputBasic,
} from './multi-select-button-handler.fixture';
import { multiSelectButtonHandlerParamsSchema } from './multi-select-button-handler.schema';

describe('generateMultiSelectButtonHandler', () => {
  describe('Валидные данные', () => {
    it('должен генерировать обработчик с done кнопкой', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('@dp.callback_query');
      expect(result).toContain('done_abc123');
      expect(result).toContain('handle_callback_ms_abc123_btn456');
      expect(result).toContain('callback_query.answer()');
      expect(result).toContain('user_id = callback_query.from_user.id');
    });

    it('должен генерировать логику сохранения выбранных значений в БД', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('selected_options = user_data.get(user_id, {}).get("multi_select_');
      expect(result).toContain('await update_user_data_in_db');
      expect(result).toContain('user_interests');
    });

    it('должен генерировать очистку состояния после done', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('user_data[user_id].pop("multi_select_');
      expect(result).toContain('user_data[user_id].pop("multi_select_node"');
    });

    it('должен генерировать переход к следующему узлу', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('next_node_id = "next_node"');
      expect(result).toContain('await handle_callback_');
    });

    it('должен генерировать специальную логику для metro_selection', () => {
      const result = generateMultiSelectButtonHandler(validParamsMetroSelection);

      expect(result).toContain('saved_metro_selection');
      expect(result).toContain('show_metro_keyboard = True');
      expect(result).toContain('🚇 Сохранили метро выбор');
    });

    it('должен генерировать обработчик без done кнопки', () => {
      const result = generateMultiSelectButtonHandler(validParamsWithoutDone);

      expect(result).toContain('@dp.callback_query');
      expect(result).not.toContain('done_');
      expect(result).toContain('button_text =');
    });
  });

  describe('Логика сохранения переменных', () => {
    it('должен сохранять переменную из узла при наличии inputVariable', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('await update_user_data_in_db(user_id, "user_choice"');
      expect(result).toContain('waiting_for_input');
    });

    it('должен сохранять кнопку как есть при отсутствии inputVariable', () => {
      const result = generateMultiSelectButtonHandler(validParamsNoInputVariable);

      expect(result).toContain('timestamp = get_moscow_time()');
      expect(result).toContain('response_data = button_text');
    });

    it('должен пропускать сохранение при skipDataCollection=true', () => {
      const result = generateMultiSelectButtonHandler(validParamsSkipData);

      expect(result).toContain('skipDataCollection=true');
      expect(result).toContain('skipDataCollectionTransition');
      expect(result).not.toContain('await update_user_data_in_db(user_id, "skip_var"');
    });
  });

  describe('Callback data генерация', () => {
    it('должен использовать правильный формат callback_data', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('c.data == "ms_abc123_btn456"');
      expect(result).toContain('c.data.startswith("ms_abc123_btn456_btn_")');
    });

    it('должен использовать безопасное имя функции', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);

      expect(result).toContain('handle_callback_ms_abc123_btn456');
    });
  });

  describe('Невалидные данные', () => {
    it('должен выбрасывать ошибку при отсутствии callbackData', () => {
      expect(() =>
        multiSelectButtonHandlerParamsSchema.parse(invalidParamsMissingCallbackData)
      ).toThrow();
    });

    it('должен выбрасывать ошибку при неправильном типе button', () => {
      expect(() =>
        multiSelectButtonHandlerParamsSchema.parse(invalidParamsWrongButtonType)
      ).toThrow();
    });
  });

  describe('Валидация схемы', () => {
    it('должна принимать валидные параметры', () => {
      const result = multiSelectButtonHandlerParamsSchema.safeParse(validParamsBasic);
      expect(result.success).toBe(true);
    });

    it('должна принимать параметры без targetNode', () => {
      const params = { ...validParamsWithoutDone, targetNode: undefined };
      const result = multiSelectButtonHandlerParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('должна принимать параметры с custom indent', () => {
      const params = { ...validParamsBasic, indentLevel: '        ' };
      const result = multiSelectButtonHandlerParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });

  describe('Отступы', () => {
    it('должен использовать отступ по умолчанию', () => {
      const result = generateMultiSelectButtonHandler(validParamsBasic);
      const lines = result.split('\n');
      expect(lines[0]).toMatch(/^    @dp/);
    });

    it('должен использовать custom indent', () => {
      const params = { ...validParamsBasic, indentLevel: '        ' };
      const result = generateMultiSelectButtonHandler(params);
      const lines = result.split('\n');
      expect(lines[0]).toMatch(/^        @dp/);
    });
  });

  describe('Производительность', () => {
    it('должен быстро генерировать код для одного узла', () => {
      const start = performance.now();
      generateMultiSelectButtonHandler(validParamsBasic);
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });

    it('должен быстро генерировать код для множества узлов', () => {
      const params: any = {
        ...validParamsBasic,
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `node_${i}`,
          type: 'message',
          data: {},
        })),
      };

      const start = performance.now();
      generateMultiSelectButtonHandler(params);
      const end = performance.now();
      expect(end - start).toBeLessThan(500);
    });
  });
});
