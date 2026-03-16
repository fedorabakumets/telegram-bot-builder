/**
 * @fileoverview Тесты для шаблона multi-select done обработчика
 * @module templates/handlers/multi-select-done/multi-select-done.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMultiSelectDone } from './multi-select-done.renderer';
import {
  validParamsBasic,
  validParamsWithMultiSelectTarget,
  validParamsReplyKeyboard,
  validParamsNoTarget,
  validParamsMultipleNodes,
  validParamsEmpty,
  invalidParamsMissingNodes,
  invalidParamsWrongType,
} from './multi-select-done.fixture';
import { multiSelectDoneParamsSchema } from './multi-select-done.schema';

describe('multi-select-done.py.jinja2 шаблон', () => {
  describe('generateMultiSelectDone()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик для базового multi-select done', () => {
        const result = generateMultiSelectDone(validParamsBasic);

        assert.ok(result.includes('# Обработчик для кнопок завершения множественного выбора'));
        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('handle_multi_select_done'));
      });

      it('должен генерировать обработчик с целевым узлом множественного выбора', () => {
        const result = generateMultiSelectDone(validParamsWithMultiSelectTarget);

        assert.ok(result.includes('allowMultipleSelection: true'));
        assert.ok(result.includes('InlineKeyboardBuilder()'));
        assert.ok(result.includes('saved_selections'));
      });

      it('должен генерировать обработчик с reply клавиатурой', () => {
        const result = generateMultiSelectDone(validParamsReplyKeyboard);

        assert.ok(result.includes('ReplyKeyboardBuilder()'));
        assert.ok(result.includes('resize_keyboard='));
        assert.ok(result.includes('one_time_keyboard='));
      });

      it('должен генерировать обработчик без целевого узла', () => {
        const result = generateMultiSelectDone(validParamsNoTarget);

        assert.ok(result.includes('Целевой узел не найден'));
        assert.ok(result.includes('Переход завершен'));
      });

      it('должен генерировать обработчик для нескольких узлов', () => {
        const result = generateMultiSelectDone(validParamsMultipleNodes);

        assert.ok(result.includes('node_1'));
        assert.ok(result.includes('node_2'));
        assert.ok(result.includes('var_1'));
        assert.ok(result.includes('var_2'));
      });

      it('должен генерировать пустой вывод для пустого массива узлов', () => {
        const result = generateMultiSelectDone(validParamsEmpty);

        assert.strictEqual(result.trim(), '');
      });
    });

    describe('Сохранение в БД', () => {
      it('должен генерировать код сохранения выбранных опций', () => {
        const result = generateMultiSelectDone(validParamsBasic);

        assert.ok(result.includes('save_user_data_to_db'));
        assert.ok(result.includes('selected_options'));
        assert.ok(result.includes('selected_text'));
      });

      it('должен генерировать логирование сохранения', () => {
        const result = generateMultiSelectDone(validParamsBasic);

        assert.ok(result.includes('💾 ГЕНЕРАТОР DEBUG: Сохранили в БД'));
        assert.ok(result.includes('⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций'));
      });
    });

    describe('Переход к следующему узлу', () => {
      it('должен генерировать код перехода к целевому узлу', () => {
        const result = generateMultiSelectDone(validParamsBasic);

        assert.ok(result.includes('Переход к следующему узлу'));
        assert.ok(result.includes('next_node'));
      });

      it('должен генерировать инициализацию multi-select состояния', () => {
        const result = generateMultiSelectDone(validParamsWithMultiSelectTarget);

        assert.ok(result.includes('multi_select_node'));
        assert.ok(result.includes('multi_select_type'));
        assert.ok(result.includes('multi_select_variable'));
      });

      it('должен генерировать восстановление из БД', () => {
        const result = generateMultiSelectDone(validParamsWithMultiSelectTarget);

        assert.ok(result.includes('get_user_from_db'));
        assert.ok(result.includes('json.loads'));
        assert.ok(result.includes('saved_selections'));
      });
    });

    describe('Генерация клавиатуры', () => {
      it('должен генерировать inline клавиатуру с галочками', () => {
        const result = generateMultiSelectDone(validParamsWithMultiSelectTarget);

        assert.ok(result.includes('InlineKeyboardBuilder()'));
        assert.ok(result.includes("f\"{'✅ ' if '"));
        assert.ok(result.includes('callback_data='));
      });

      it('должен генерировать reply клавиатуру с галочками', () => {
        const result = generateMultiSelectDone(validParamsReplyKeyboard);

        assert.ok(result.includes('ReplyKeyboardBuilder()'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes("f\"{'✅ ' if '"));
      });

      it('должен генерировать кнопку "Готово"', () => {
        const result = generateMultiSelectDone(validParamsWithMultiSelectTarget);

        assert.ok(result.includes('Готово'));
        assert.ok(result.includes('done_'));
      });

      it('должен генерировать adjust() для раскладки', () => {
        const result = generateMultiSelectDone(validParamsWithMultiSelectTarget);

        assert.ok(result.includes('builder.adjust('));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с отсутствующим multiSelectNodes', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateMultiSelectDone(invalidParamsMissingNodes);
        });
      });

      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateMultiSelectDone(invalidParamsWrongType);
        });
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = multiSelectDoneParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен использовать indentLevel по умолчанию', () => {
        const result = multiSelectDoneParamsSchema.safeParse({
          multiSelectNodes: [],
          allNodes: [],
          allNodeIds: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.indentLevel, '');
        }
      });

      it('должен принимать targetNode как опциональное поле', () => {
        const result = multiSelectDoneParamsSchema.safeParse({
          multiSelectNodes: [
            {
              id: 'node_1',
              variableName: 'var_1',
            },
          ],
          allNodes: [],
          allNodeIds: ['node_1'],
        });

        assert.ok(result.success);
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMultiSelectDone(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 100 раз быстрее 50ms', () => {
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
          generateMultiSelectDone(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 50, `100 генераций заняли ${duration}ms (ожидалось < 50ms)`);
      });
    });
  });

  describe('multiSelectDoneParamsSchema', () => {
    describe('Структура схемы', () => {
      it('должен иметь 4 поля', () => {
        const shape = multiSelectDoneParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 4);
      });

      it('должен использовать ZodOptional для indentLevel', () => {
        const shape = multiSelectDoneParamsSchema.shape;
        assert.ok(shape.indentLevel.isOptional());
      });
    });
  });
});
