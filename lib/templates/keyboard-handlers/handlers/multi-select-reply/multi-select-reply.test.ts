/**
 * @fileoverview Тесты для шаблона multi-select reply обработчика
 * @module templates/handlers/multi-select-reply/multi-select-reply.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMultiSelectReply } from './multi-select-reply.renderer';
import {
  validParamsBasic,
  validParamsWithGotoButtons,
  validParamsWithCommandTarget,
  validParamsMultipleNodes,
  validParamsEmpty,
  validParamsCustomIndent,
  invalidParamsMissingNodes,
  invalidParamsWrongType,
} from './multi-select-reply.fixture';
import { multiSelectReplyParamsSchema } from './multi-select-reply.schema';

describe('multi-select-reply.py.jinja2 шаблон', () => {
  describe('generateMultiSelectReply()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик для базового multi-select reply', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('# Обработчик для reply кнопок множественного выбора'));
        assert.ok(result.includes('@dp.message()'));
        assert.ok(result.includes('handle_multi_select_reply'));
      });

      it('должен генерировать обработчик с goto кнопками', () => {
        const result = generateMultiSelectReply(validParamsWithGotoButtons);

        assert.ok(result.includes('goto'));
        assert.ok(result.includes('target_node'));
        assert.ok(result.includes('Перейти'));
      });

      it('должен генерировать обработчик с command целевым узлом', () => {
        const result = generateMultiSelectReply(validParamsWithCommandTarget);

        assert.ok(result.includes('handle_command_'));
      });

      it('должен генерировать обработчик для нескольких узлов', () => {
        const result = generateMultiSelectReply(validParamsMultipleNodes);

        assert.ok(result.includes('node_1'));
        assert.ok(result.includes('node_2'));
        assert.ok(result.includes('var_1'));
        assert.ok(result.includes('var_2'));
      });

      it('должен генерировать пустой вывод для пустого массива узлов', () => {
        const result = generateMultiSelectReply(validParamsEmpty);

        assert.strictEqual(result.trim(), '');
      });

      it('должен использовать custom indent', () => {
        const result = generateMultiSelectReply(validParamsCustomIndent);

        const lines = result.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          assert.ok(lines[0].startsWith('        '));
        }
      });    });

    describe('Обработка кнопки "Готово"', () => {
      it('должен генерировать код завершения multi-select', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('Завершение множественного выбора'));
        assert.ok(result.includes('selected_options'));
        assert.ok(result.includes('save_user_data_to_db'));
      });

      it('должен генерировать очистку состояния', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('user_data[user_id].pop'));
        assert.ok(result.includes('multi_select_node'));
        assert.ok(result.includes('multi_select_type'));
      });

      it('должен генерировать переход к следующему узлу', () => {
        const result = generateMultiSelectReply(validParamsWithGotoButtons);

        assert.ok(result.includes('Переход к следующему узлу'));
      });
    });

    describe('Обработка выбора опций', () => {
      it('должен генерировать код добавления/удаления выбора', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('selected_list.append'));
        assert.ok(result.includes('selected_list.remove'));
      });

      it('должен генерировать сообщения о выборе', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('✅ Выбрано:'));
        assert.ok(result.includes('❌ Убрано:'));
      });

      it('должен генерировать очистку текста от галочки', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('replace("✅ ", "")'));
        assert.ok(result.includes('clean_user_input'));
      });

      it('должен генерировать обновление клавиатуры с галочками', () => {
        const result = generateMultiSelectReply(validParamsBasic);

        assert.ok(result.includes('ReplyKeyboardBuilder()'));
        assert.ok(result.includes("'✅ ' if "));
        assert.ok(result.includes('builder.as_markup'));
      });
    });

    describe('Обработка goto кнопок', () => {
      it('должен генерировать fake_callback для goto кнопок', () => {
        const result = generateMultiSelectReply(validParamsWithGotoButtons);

        assert.ok(result.includes('SimpleNamespace'));
        assert.ok(result.includes('fake_callback'));
        assert.ok(result.includes('handle_callback_'));
      });

      it('должен генерировать вызов command обработчика', () => {
        const result = generateMultiSelectReply(validParamsWithCommandTarget);

        assert.ok(result.includes('handle_command_'));
      });

      it('должен генерировать сохранение состояния перед переходом', () => {
        const result = generateMultiSelectReply(validParamsWithGotoButtons);

        assert.ok(result.includes('Сохраняем текущее состояние выбора'));
        assert.ok(result.includes('save_user_data_to_db'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с отсутствующим multiSelectNodes', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateMultiSelectReply(invalidParamsMissingNodes);
        });
      });

      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateMultiSelectReply(invalidParamsWrongType);
        });
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = multiSelectReplyParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен использовать indentLevel по умолчанию', () => {
        const result = multiSelectReplyParamsSchema.safeParse({
          multiSelectNodes: [],
          allNodes: [],
          allNodeIds: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.indentLevel, '');
        }
      });

      it('должен принимать completeButton как опциональное поле', () => {
        const result = multiSelectReplyParamsSchema.safeParse({
          multiSelectNodes: [
            {
              id: 'node_1',
              variableName: 'var_1',
              selectionButtons: [],
              regularButtons: [],
              gotoButtons: [],
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
        generateMultiSelectReply(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 100 раз быстрее 50ms', () => {
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
          generateMultiSelectReply(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 50, `100 генераций заняли ${duration}ms (ожидалось < 50ms)`);
      });
    });
  });

  describe('multiSelectReplyParamsSchema', () => {
    describe('Структура схемы', () => {
      it('должен иметь 4 поля', () => {
        const shape = multiSelectReplyParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 4);
      });

      it('должен использовать ZodOptional для indentLevel', () => {
        const shape = multiSelectReplyParamsSchema.shape;
        assert.ok(shape.indentLevel.isOptional());
      });
    });
  });
});
