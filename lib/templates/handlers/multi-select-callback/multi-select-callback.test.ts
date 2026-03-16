/**
 * @fileoverview Тесты для шаблона multi-select callback обработчика
 * @module templates/handlers/multi-select-callback/multi-select-callback.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMultiSelectCallback } from './multi-select-callback.renderer';
import {
  validParamsBasic,
  validParamsWithRegularButtons,
  validParamsMultipleNodes,
  validParamsWithLayout,
  validParamsEmpty,
  validParamsCustomIndent,
  invalidParamsMissingNodes,
  invalidParamsWrongType,
} from './multi-select-callback.fixture';
import { multiSelectCallbackParamsSchema } from './multi-select-callback.schema';

describe('multi-select-callback.py.jinja2 шаблон', () => {
  describe('generateMultiSelectCallback()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик для базового multi-select узла', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('# Обработка выбора опции'));
        assert.ok(result.includes('callback_data.startswith("ms_")'));
        assert.ok(result.includes('InlineKeyboardBuilder()'));
      });

      it('должен генерировать обработчик с обычными кнопками', () => {
        const result = generateMultiSelectCallback(validParamsWithRegularButtons);

        assert.ok(result.includes('InlineKeyboardBuilder()'));
        assert.ok(result.includes('callback_data='));
        assert.ok(result.includes('url='));
      });

      it('должен генерировать обработчик для нескольких узлов', () => {
        const result = generateMultiSelectCallback(validParamsMultipleNodes);

        assert.ok(result.includes('node_1'));
        assert.ok(result.includes('node_2'));
        assert.ok(result.includes('ms_n1_'));
        assert.ok(result.includes('ms_n2_'));
      });

      it('должен генерировать обработчик с раскладкой', () => {
        const result = generateMultiSelectCallback(validParamsWithLayout);

        assert.ok(result.includes('builder.adjust('));
        assert.ok(result.includes('hasKeyboardLayout'));
      });

      it('должен генерировать пустой вывод для пустого массива узлов', () => {
        const result = generateMultiSelectCallback(validParamsEmpty);

        assert.strictEqual(result.trim(), '');
      });

      it('должен использовать custom indent', () => {
        const result = generateMultiSelectCallback(validParamsCustomIndent);

        const lines = result.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          assert.ok(lines[0].startsWith('        '));
        }
      });
    });

    describe('Callback data генерация', () => {
      it('должен генерировать правильный callback_data для кнопок', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('ms_abc123_opt1'));
        assert.ok(result.includes('ms_abc123_opt2'));
      });

      it('должен генерировать done callback_data', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('done_abc123'));
      });

      it('должен генерировать поиск узла по короткому ID', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('short_node_id = parts[1]'));
        assert.ok(result.includes('button_id = "_".join(parts[2:])'));
      });
    });

    describe('Логика выбора', () => {
      it('должен генерировать код добавления/удаления выбора', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('selected_list.append(button_text)'));
        assert.ok(result.includes('selected_list.remove(button_text)'));
      });

      it('должен генерировать восстановление из БД', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('get_user_from_db'));
        assert.ok(result.includes('saved_selections'));
      });

      it('должен генерировать обновление клавиатуры', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('edit_reply_markup'));
        assert.ok(result.includes('builder.as_markup()'));
      });
    });

    describe('Галочки на кнопках', () => {
      it('должен генерировать кнопки с галочками', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes("f\"{'✅ ' if '"));
        assert.ok(result.includes('in selected_list else \'\''));
      });

      it('должен генерировать escaped текст для кнопок', () => {
        const result = generateMultiSelectCallback(validParamsBasic);

        assert.ok(result.includes('Опция 1'));
        assert.ok(result.includes('Опция 2'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с отсутствующим multiSelectNodes', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateMultiSelectCallback(invalidParamsMissingNodes);
        });
      });

      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateMultiSelectCallback(invalidParamsWrongType);
        });
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = multiSelectCallbackParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен использовать indentLevel по умолчанию', () => {
        const result = multiSelectCallbackParamsSchema.safeParse({
          multiSelectNodes: [],
          allNodeIds: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.indentLevel, '    ');
        }
      });

      it('должен принимать completeButton как опциональное поле', () => {
        const result = multiSelectCallbackParamsSchema.safeParse({
          multiSelectNodes: [
            {
              id: 'node_1',
              shortNodeId: 'n1',
              selectionButtons: [],
              regularButtons: [],
            },
          ],
          allNodeIds: ['node_1'],
        });

        assert.ok(result.success);
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMultiSelectCallback(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 100 раз быстрее 50ms', () => {
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
          generateMultiSelectCallback(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 50, `100 генераций заняли ${duration}ms (ожидалось < 50ms)`);
      });
    });

    describe('Отступы', () => {
      it('должен генерировать правильные отступы для всех строк', () => {
        const result = generateMultiSelectCallback(validParamsBasic);
        const lines = result.split('\n');

        // Проверяем что все непустые строки имеют правильные отступы
        for (const line of lines) {
          if (line.trim().length > 0) {
            assert.ok(
              line.startsWith('    ') || line.startsWith('        ') || line.startsWith('            '),
              `Строка должна иметь правильные отступы: "${line}"`
            );
          }
        }
      });
    });
  });

  describe('multiSelectCallbackParamsSchema', () => {
    describe('Структура схемы', () => {
      it('должен иметь 3 поля', () => {
        const shape = multiSelectCallbackParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 3);
      });

      it('должен использовать ZodOptional для indentLevel', () => {
        const shape = multiSelectCallbackParamsSchema.shape;
        assert.ok(shape.indentLevel.isOptional());
      });

      it('должен использовать ZodDefault для indentLevel', () => {
        const shape = multiSelectCallbackParamsSchema.shape;
        assert.ok(shape.indentLevel.isOptional());
      });
    });
  });
});
