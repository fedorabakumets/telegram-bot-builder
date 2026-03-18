/**
 * @fileoverview Тесты для шаблона обработчиков управления сообщениями
 * @module templates/message-handler/message-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMessageHandler } from './message-handler.renderer';
import {
  validParamsPinMessage,
  validParamsUnpinMessage,
  validParamsDeleteMessage,
  validParamsPinWithGroup,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './message-handler.fixture';
import { messageHandlerParamsSchema } from './message-handler.schema';

describe('message-handler.py.jinja2 шаблон', () => {
  describe('generateMessageHandler()', () => {
    describe('pin_message', () => {
      it('должен генерировать callback обработчик', () => {
        const result = generateMessageHandler(validParamsPinMessage);
        assert.ok(result.includes('handle_callback_pin_1'));
        assert.ok(result.includes('pin_chat_message'));
      });

      it('должен генерировать command обработчик', () => {
        const result = generateMessageHandler(validParamsPinMessage);
        assert.ok(result.includes('Command("pin_message")'));
        assert.ok(result.includes('pin_message_pin_1_command_handler'));
      });

      it('должен генерировать синонимы', () => {
        const result = generateMessageHandler(validParamsPinMessage);
        assert.ok(result.includes('startswith("закрепить")'));
        assert.ok(result.includes('startswith("прикрепить")'));
      });

      it('должен генерировать disable_notification', () => {
        const result = generateMessageHandler(validParamsPinWithGroup);
        assert.ok(result.includes('disable_notification=True'));
      });

      it('должен фильтровать по конкретной группе', () => {
        const result = generateMessageHandler(validParamsPinWithGroup);
        assert.ok(result.includes('str(message.chat.id) == "-1001234567890"'));
      });
    });

    describe('unpin_message', () => {
      it('должен генерировать unpin_all_chat_messages', () => {
        const result = generateMessageHandler(validParamsUnpinMessage);
        assert.ok(result.includes('unpin_all_chat_messages'));
      });

      it('должен генерировать unpin_chat_message для конкретного сообщения', () => {
        const result = generateMessageHandler(validParamsUnpinMessage);
        assert.ok(result.includes('unpin_chat_message'));
      });

      it('должен генерировать синонимы', () => {
        const result = generateMessageHandler(validParamsUnpinMessage);
        assert.ok(result.includes('startswith("открепить")'));
        assert.ok(result.includes('startswith("отцепить")'));
      });
    });

    describe('delete_message', () => {
      it('должен генерировать delete_message', () => {
        const result = generateMessageHandler(validParamsDeleteMessage);
        assert.ok(result.includes('delete_message'));
        assert.ok(result.includes('bot.delete_message'));
      });

      it('должен генерировать синонимы', () => {
        const result = generateMessageHandler(validParamsDeleteMessage);
        assert.ok(result.includes('startswith("удалить")'));
        assert.ok(result.includes('startswith("стереть")'));
      });

      it('должен генерировать текст ответа', () => {
        const result = generateMessageHandler(validParamsDeleteMessage);
        assert.ok(result.includes('🗑️ Сообщение успешно удалено!'));
      });
    });

    describe('Общее', () => {
      it('должен генерировать проверку типа чата', () => {
        const result = generateMessageHandler(validParamsPinMessage);
        assert.ok(result.includes("chat.type not in ['group', 'supergroup']"));
      });

      it('должен генерировать обработку TelegramBadRequest', () => {
        const result = generateMessageHandler(validParamsPinMessage);
        assert.ok(result.includes('TelegramBadRequest'));
        assert.ok(result.includes('not enough rights'));
      });

      it('должен генерировать логирование', () => {
        const result = generateMessageHandler(validParamsPinMessage);
        assert.ok(result.includes('logging.info'));
        assert.ok(result.includes('logging.error'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateMessageHandler(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateMessageHandler(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный nodeType', () => {
        const result = messageHandlerParamsSchema.safeParse({
          nodeType: 'invalid_type',
          nodeId: 'test',
          safeName: 'test',
          synonyms: ['тест'],
        });
        assert.ok(!result.success);
      });

      it('должен отклонять пустой массив synonyms', () => {
        const result = messageHandlerParamsSchema.safeParse({
          nodeType: 'pin_message',
          nodeId: 'test',
          safeName: 'test',
          synonyms: [],
        });
        assert.ok(!result.success);
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMessageHandler(validParamsPinMessage);
        const duration = Date.now() - start;
        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 1000 раз быстрее 500ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateMessageHandler(validParamsPinMessage);
        }
        const duration = Date.now() - start;
        assert.ok(duration < 500, `1000 генераций заняли ${duration}ms`);
      });
    });
  });
});
