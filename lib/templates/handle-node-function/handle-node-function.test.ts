/**
 * @fileoverview Тесты для шаблона handle_node_* функций
 * @module templates/handle-node-function/handle-node-function.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateHandleNodeFunction, generateHandleNodeFunctionsFromParams } from './handle-node-function.renderer';
import {
  validParamsBasic,
  validParamsWithConditional,
  validParamsWithAutoTransition,
  validParamsWithImage,
  validParamsMultiple,
  invalidParamsMissingNodeId,
  invalidParamsWrongType,
} from './handle-node-function.fixture';
import { handleNodeFunctionParamsSchema } from './handle-node-function.schema';

describe('handle-node-function.py.jinja2 шаблон', () => {
  describe('generateHandleNodeFunction()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать async def функцию', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(result.includes('async def handle_node_node_abc123'));
      });

      it('должен включать logging.info с nodeId', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(result.includes('node_abc123'));
        assert.ok(result.includes('logging.info'));
      });

      it('должен включать init_user_variables', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(result.includes('init_user_variables'));
      });

      it('должен включать get_user_from_db', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(result.includes('get_user_from_db'));
      });

      it('должен включать safe_edit_or_send', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(result.includes('safe_edit_or_send'));
      });

      it('должен устанавливать waiting_for_input при collectUserInput=true', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(result.includes('waiting_for_input'));
      });
    });

    describe('Условные сообщения', () => {
      it('должен генерировать if/elif блоки для условий', () => {
        const result = generateHandleNodeFunction(validParamsWithConditional);
        assert.ok(result.includes('check_user_variable_inline'));
        assert.ok(result.includes('is_premium'));
      });

      it('должен генерировать else с основным текстом', () => {
        const result = generateHandleNodeFunction(validParamsWithConditional);
        assert.ok(result.includes('else:'));
        assert.ok(result.includes('Добро пожаловать!'));
      });

      it('должен включать replace_variables_in_text', () => {
        const result = generateHandleNodeFunction(validParamsWithConditional);
        assert.ok(result.includes('replace_variables_in_text'));
      });

      it('должен включать _variable_filters', () => {
        const result = generateHandleNodeFunction(validParamsWithConditional);
        assert.ok(result.includes('_variable_filters'));
      });
    });

    describe('Автопереход', () => {
      it('должен генерировать блок автоперехода', () => {
        const result = generateHandleNodeFunction(validParamsWithAutoTransition);
        assert.ok(result.includes('АВТОПЕРЕХОД') || result.includes('Автопереход'));
      });

      it('должен вызывать handle_node_ целевого узла', () => {
        const result = generateHandleNodeFunction(validParamsWithAutoTransition);
        assert.ok(result.includes('handle_node_node_result'));
      });

      it('должен проверять _has_conditional_keyboard перед автопереходом', () => {
        const result = generateHandleNodeFunction(validParamsWithAutoTransition);
        assert.ok(result.includes('_has_conditional_keyboard'));
      });
    });

    describe('Изображение', () => {
      it('должен устанавливать image_url переменную', () => {
        const result = generateHandleNodeFunction(validParamsWithImage);
        assert.ok(result.includes('image_url_node_img1'));
        assert.ok(result.includes('https://example.com/image.jpg'));
      });

      it('должен вызывать update_user_data_in_db для imageUrl', () => {
        const result = generateHandleNodeFunction(validParamsWithImage);
        assert.ok(result.includes('update_user_data_in_db'));
      });
    });

    describe('HTML форматирование', () => {
      it('должен генерировать ParseMode.HTML при formatMode=html', () => {
        const result = generateHandleNodeFunction(validParamsWithConditional);
        assert.ok(result.includes('ParseMode.HTML'));
      });

      it('не должен включать ParseMode при formatMode=none', () => {
        const result = generateHandleNodeFunction(validParamsBasic);
        assert.ok(!result.includes('ParseMode.HTML'));
        assert.ok(!result.includes('ParseMode.MARKDOWN'));
      });
    });
  });

  describe('generateHandleNodeFunctionsFromParams()', () => {
    it('должен генерировать несколько функций', () => {
      const result = generateHandleNodeFunctionsFromParams(validParamsMultiple);
      assert.ok(result.includes('handle_node_node_abc123'));
      assert.ok(result.includes('handle_node_node_cond1'));
    });

    it('должен возвращать пустую строку для пустого массива', () => {
      const result = generateHandleNodeFunctionsFromParams({ nodes: [] });
      // Jinja2 шаблон с пустым массивом — нет функций
      assert.ok(!result.includes('async def handle_node_'));
    });
  });

  describe('Невалидные данные', () => {
    it('должен отклонять параметры без nodeId', () => {
      assert.throws(() => {
        // @ts-expect-error — намеренно передаём неполные параметры
        generateHandleNodeFunction(invalidParamsMissingNodeId);
      });
    });

    it('должен отклонять параметры с неправильным типом nodeId', () => {
      assert.throws(() => {
        // @ts-expect-error — намеренно передаём неправильный тип
        generateHandleNodeFunction(invalidParamsWrongType);
      });
    });
  });

  describe('Валидация схемы', () => {
    it('должен принимать валидные параметры', () => {
      const result = handleNodeFunctionParamsSchema.safeParse(validParamsBasic);
      assert.ok(result.success);
    });

    it('должен применять defaults для опциональных полей', () => {
      const result = handleNodeFunctionParamsSchema.safeParse({
        nodeId: 'test',
        safeName: 'test',
      });
      assert.ok(result.success);
      if (result.success) {
        assert.strictEqual(result.data.formatMode, 'none');
        assert.strictEqual(result.data.enableConditionalMessages, false);
        assert.strictEqual(result.data.enableAutoTransition, false);
        assert.strictEqual(result.data.collectUserInput, false);
      }
    });

    it('должен отклонять неправильный logicOperator', () => {
      const result = handleNodeFunctionParamsSchema.safeParse({
        nodeId: 'test',
        safeName: 'test',
        conditionalMessages: [{ logicOperator: 'XOR' }],
      });
      assert.ok(!result.success);
    });
  });

  describe('Производительность', () => {
    it('должен генерировать код быстрее 10ms', () => {
      const start = Date.now();
      generateHandleNodeFunction(validParamsBasic);
      const duration = Date.now() - start;
      assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
    });

    it('должен генерировать 1000 функций быстрее 500ms', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        generateHandleNodeFunction(validParamsBasic);
      }
      const duration = Date.now() - start;
      assert.ok(duration < 500, `1000 генераций заняли ${duration}ms (ожидалось < 500ms)`);
    });
  });
});
