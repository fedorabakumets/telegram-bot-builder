/**
 * @fileoverview Тесты для шаблона button-response обработчика
 * @module templates/handlers/button-response/button-response.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateButtonResponse } from './button-response.renderer';
import {
  validParamsBasic,
  validParamsWithSkip,
  validParamsWithUrl,
  validParamsWithCommand,
  validParamsMultipleNodes,
  validParamsMultipleChoice,
  validParamsEmpty,
  invalidParamsMissingNodes,
  invalidParamsWrongType,
} from './button-response.fixture';
import { buttonResponseParamsSchema } from './button-response.schema';

describe('button-response.py.jinja2 шаблон', () => {
  describe('generateButtonResponse()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик для базового button-response', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('F.data == "response_'));
        assert.ok(result.includes('handle_response_'));
      });

      it('должен генерировать обработчик с allowSkip', () => {
        const result = generateButtonResponse(validParamsWithSkip);

        assert.ok(result.includes('handle_skip_'));
        assert.ok(result.includes('⏭️ Ответ пропущен'));
      });

      it('должен генерировать обработчик с URL кнопками', () => {
        const result = generateButtonResponse(validParamsWithUrl);

        assert.ok(result.includes('option_action == "url"'));
        assert.ok(result.includes('InlineKeyboardMarkup'));
        assert.ok(result.includes('url='));
      });

      it('должен генерировать обработчик с command навигацией', () => {
        const result = generateButtonResponse(validParamsWithCommand);

        assert.ok(result.includes('option_action == "command"'));
        assert.ok(result.includes('handle_command_'));
        assert.ok(result.includes('SimpleNamespace'));
      });

      it('должен генерировать обработчик для нескольких узлов', () => {
        const result = generateButtonResponse(validParamsMultipleNodes);

        assert.ok(result.includes('node_1'));
        assert.ok(result.includes('node_2'));
        assert.ok(result.includes('response_node_1'));
        assert.ok(result.includes('response_node_2'));
      });

      it('должен генерировать обработчик с множественным выбором', () => {
        const result = generateButtonResponse(validParamsMultipleChoice);

        assert.ok(result.includes('allow_multiple'));
        assert.ok(result.includes('selected_value == "done"'));
        assert.ok(result.includes('multiple_choice'));
      });

      it('должен генерировать пустой вывод для пустого массива узлов', () => {
        const result = generateButtonResponse(validParamsEmpty);

        assert.strictEqual(result.trim(), '');
      });
    });

    describe('Обработка одиночного выбора', () => {
      it('должен генерировать код сохранения одиночного выбора', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('response_data = {'));
        assert.ok(result.includes('"type": "button_choice"'));
        assert.ok(result.includes('update_user_data_in_db'));
      });

      it('должен генерировать сообщение об успехе', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('Спасибо за ваш выбор!'));
        assert.ok(result.includes('✅ Ваш выбор:'));
        assert.ok(result.includes('edit_text'));
      });

      it('должен генерировать очистку состояния', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('del user_data[user_id]["button_response_config"]'));
      });
    });

    describe('Обработка множественного выбора', () => {
      it('должен генерировать код добавления/удаления выбора', () => {
        const result = generateButtonResponse(validParamsMultipleChoice);

        assert.ok(result.includes('config["selected"].append'));
        assert.ok(result.includes('config["selected"] = [item for item in config["selected"]'));
      });

      it('должен генерировать обработку кнопки "Готово"', () => {
        const result = generateButtonResponse(validParamsMultipleChoice);

        assert.ok(result.includes('selected_value == "done"'));
        assert.ok(result.includes('len(config["selected"]) > 0'));
        assert.ok(result.includes('Выберите хотя бы один вариант'));
      });

      it('должен генерировать структурированный ответ для множественного выбора', () => {
        const result = generateButtonResponse(validParamsMultipleChoice);

        assert.ok(result.includes('"type": "multiple_choice"'));
        assert.ok(result.includes('[item["value"] for item in config["selected"]]'));
      });
    });

    describe('Навигация', () => {
      it('должен генерировать навигацию по target_node_id', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('target_node_id = option_target'));
        assert.ok(result.includes('handle_callback_'));
      });

      it('должен генерировать навигацию по next_node_id', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('next_node_id = config.get("next_node_id")'));
        assert.ok(result.includes('Fallback'));
      });

      it('должен генерировать обработку URL кнопок', () => {
        const result = generateButtonResponse(validParamsWithUrl);

        assert.ok(result.includes('🔗 Открыть ссылку'));
        assert.ok(result.includes('option_url'));
      });

      it('должен генерировать fake_message для command', () => {
        const result = generateButtonResponse(validParamsWithCommand);

        assert.ok(result.includes('SimpleNamespace'));
        assert.ok(result.includes('fake_message'));
        assert.ok(result.includes('from_user=callback_query.from_user'));
      });
    });

    describe('Логирование', () => {
      it('должен генерировать логирование сохранения в БД', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('✅ Кнопочный ответ сохранен в БД'));
        assert.ok(result.includes('⚠️ Не удалось сохранить в БД'));
      });

      it('должен генерировать логирование ошибок навигации', () => {
        const result = generateButtonResponse(validParamsBasic);

        assert.ok(result.includes('Ошибка при переходе к узлу'));
        assert.ok(result.includes('Неизвестный целевой узел'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с отсутствующим userInputNodes', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateButtonResponse(invalidParamsMissingNodes);
        });
      });

      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateButtonResponse(invalidParamsWrongType);
        });
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = buttonResponseParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен использовать hasUrlButtonsInProject по умолчанию false', () => {
        const result = buttonResponseParamsSchema.safeParse({
          userInputNodes: [],
          allNodes: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.hasUrlButtonsInProject, false);
        }
      });

      it('должен использовать indentLevel по умолчанию', () => {
        const result = buttonResponseParamsSchema.safeParse({
          userInputNodes: [],
          allNodes: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.indentLevel, '');
        }
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateButtonResponse(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 100 раз быстрее 50ms', () => {
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
          generateButtonResponse(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 50, `100 генераций заняли ${duration}ms (ожидалось < 50ms)`);
      });
    });
  });

  describe('buttonResponseParamsSchema', () => {
    describe('Структура схемы', () => {
      it('должен иметь 4 поля', () => {
        const shape = buttonResponseParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 4);
      });

      it('должен использовать ZodOptional для hasUrlButtonsInProject', () => {
        const shape = buttonResponseParamsSchema.shape;
        assert.ok(shape.hasUrlButtonsInProject.isOptional());
      });

      it('должен использовать ZodOptional для indentLevel', () => {
        const shape = buttonResponseParamsSchema.shape;
        assert.ok(shape.indentLevel.isOptional());
      });
    });
  });
});
