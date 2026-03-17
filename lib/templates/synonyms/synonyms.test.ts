/**
 * @fileoverview Тесты для шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSynonyms } from './synonyms.renderer';
import {
  validParamsStartSynonyms,
  validParamsCommandSynonyms,
  validParamsMessageSynonyms,
  validParamsPinSynonyms,
  validParamsEmpty,
  validParamsMixed,
  invalidParamsWrongNodeType,
} from './synonyms.fixture';
import { synonymsParamsSchema } from './synonyms.schema';

describe('synonyms.py.jinja2 шаблон', () => {
  describe('generateSynonyms()', () => {
    it('должен возвращать пустую строку для пустого массива', () => {
      const result = generateSynonyms(validParamsEmpty);
      assert.strictEqual(result, '');
    });

    it('должен генерировать обработчик синонима для start', () => {
      const result = generateSynonyms(validParamsStartSynonyms);
      assert.ok(result.includes('start_synonym_'));
      assert.ok(result.includes('message.text.lower() == "привет"'));
      assert.ok(result.includes('await start_handler(message)'));
    });

    it('должен генерировать обработчик синонима для command', () => {
      const result = generateSynonyms(validParamsCommandSynonyms);
      assert.ok(result.includes('help_synonym_'));
      assert.ok(result.includes('message.text.lower() == "помощь"'));
      assert.ok(result.includes('await help_handler(message)'));
    });

    it('должен генерировать MockCallback для message-узла', () => {
      const result = generateSynonyms(validParamsMessageSynonyms);
      assert.ok(result.includes('class MockCallback:'));
      assert.ok(result.includes('mock_callback = MockCallback'));
      assert.ok(result.includes('handle_callback_msg_main_menu'));
    });

    it('должен генерировать обработчик pin_message', () => {
      const result = generateSynonyms(validParamsPinSynonyms);
      assert.ok(result.includes('bot.pin_chat_message'));
      assert.ok(result.includes('disable_notification=False'));
    });

    it('должен генерировать обработчик unpin_message', () => {
      const result = generateSynonyms(validParamsPinSynonyms);
      assert.ok(result.includes('bot.unpin_chat_message'));
    });

    it('должен генерировать обработчик delete_message с кастомным текстом', () => {
      const result = generateSynonyms(validParamsPinSynonyms);
      assert.ok(result.includes('bot.delete_message'));
      assert.ok(result.includes('🗑️ Удалено!'));
    });

    it('должен генерировать маркеры NODE_START/NODE_END', () => {
      const result = generateSynonyms(validParamsStartSynonyms);
      assert.ok(result.includes('@@NODE_START:start_1@@'));
      assert.ok(result.includes('@@NODE_END:start_1@@'));
    });

    it('должен генерировать обработчики для смешанных типов', () => {
      const result = generateSynonyms(validParamsMixed);
      assert.ok(result.includes('start_handler'));
      assert.ok(result.includes('MockCallback'));
      assert.ok(result.includes('bot.pin_chat_message'));
    });

    it('должен генерировать проверку типа чата для content management', () => {
      const result = generateSynonyms(validParamsPinSynonyms);
      assert.ok(result.includes("message.chat.type in ['group', 'supergroup']"));
    });

    it('должен генерировать обработку ошибок TelegramBadRequest', () => {
      const result = generateSynonyms(validParamsPinSynonyms);
      assert.ok(result.includes('except TelegramBadRequest as e:'));
      assert.ok(result.includes('CHAT_ADMIN_REQUIRED'));
    });
  });

  describe('synonymsParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const result = synonymsParamsSchema.safeParse(validParamsStartSynonyms);
      assert.ok(result.success);
    });

    it('должен отклонять неправильный nodeType', () => {
      const result = synonymsParamsSchema.safeParse(invalidParamsWrongNodeType);
      assert.ok(!result.success);
    });

    it('должен принимать пустой массив синонимов', () => {
      const result = synonymsParamsSchema.safeParse(validParamsEmpty);
      assert.ok(result.success);
    });
  });

  describe('Производительность', () => {
    it('должен генерировать код быстрее 10ms', () => {
      const start = Date.now();
      generateSynonyms(validParamsMixed);
      const duration = Date.now() - start;
      assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
    });
  });
});
