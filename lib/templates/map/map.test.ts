/**
 * @fileoverview Тесты для шаблона геолокации
 * @module templates/map/map.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMap } from './map.renderer';
import {
  validParamsBasic,
  validParamsRequestLocation,
  validParamsWithChecks,
  validParamsWithAutoTransition,
  validParamsWithInlineKeyboard,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './map.fixture';
import { mapParamsSchema } from './map.schema';

describe('map.py.jinja2 шаблон', () => {
  describe('generateMap()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать базовый обработчик геолокации', () => {
        const result = generateMap(validParamsBasic);

        assert.ok(result.includes('handle_callback_map_1'));
        assert.ok(result.includes('callback.answer()'));
        assert.ok(result.includes('logging.info'));
      });

      it('должен генерировать отправку координат', () => {
        const result = generateMap(validParamsBasic);

        assert.ok(result.includes('answer_location'));
        assert.ok(result.includes('latitude=55.7558'));
        assert.ok(result.includes('longitude=37.6176'));
      });

      it('должен генерировать запрос геолокации у пользователя', () => {
        const result = generateMap(validParamsRequestLocation);

        assert.ok(result.includes('Запрос геолокации у пользователя'));
        assert.ok(!result.includes('answer_location'));
      });

      it('должен генерировать обработчик с проверкой приватности', () => {
        const result = generateMap(validParamsWithChecks);

        assert.ok(result.includes('is_private_chat'));
        assert.ok(result.includes('❌ Эта команда доступна только в приватных чатах'));
      });

      it('должен генерировать обработчик с проверкой администратора', () => {
        const result = generateMap(validParamsWithChecks);

        assert.ok(result.includes('is_admin'));
        assert.ok(result.includes('❌ У вас нет прав для выполнения этой команды'));
      });

      it('должен генерировать обработчик с проверкой авторизации', () => {
        const result = generateMap(validParamsWithChecks);

        assert.ok(result.includes('check_auth'));
        assert.ok(result.includes('❌ Необходимо войти в систему'));
      });

      it('должен генерировать HTML форматирование', () => {
        const result = generateMap(validParamsWithChecks);

        assert.ok(result.includes('parse_mode="HTML"'));
      });

      it('должен генерировать автопереход', () => {
        const result = generateMap(validParamsWithAutoTransition);

        assert.ok(result.includes('⚡ АВТОПЕРЕХОД'));
        assert.ok(result.includes('main_menu'));
        assert.ok(result.includes('FakeCallbackQuery'));
      });

      it('должен генерировать URL кнопки', () => {
        const result = generateMap(validParamsWithInlineKeyboard);

        assert.ok(result.includes('url="https://yandex.ru/maps"'));
      });

      it('должен генерировать замену переменных', () => {
        const result = generateMap(validParamsBasic);

        assert.ok(result.includes('init_all_user_vars'));
        assert.ok(result.includes('replace_variables_in_text'));
      });
    });

    describe('Проверки безопасности', () => {
      it('должен включать только isPrivateOnly проверку', () => {
        const result = generateMap({ ...validParamsBasic, isPrivateOnly: true });

        assert.ok(result.includes('is_private_chat'));
        assert.ok(!result.includes('is_admin'));
        assert.ok(!result.includes('check_auth'));
      });

      it('должен включать только adminOnly проверку', () => {
        const result = generateMap({ ...validParamsBasic, adminOnly: true });

        assert.ok(!result.includes('is_private_chat'));
        assert.ok(result.includes('is_admin'));
        assert.ok(!result.includes('check_auth'));
      });

      it('должен включать только requiresAuth проверку', () => {
        const result = generateMap({ ...validParamsBasic, requiresAuth: true });

        assert.ok(!result.includes('is_private_chat'));
        assert.ok(!result.includes('is_admin'));
        assert.ok(result.includes('check_auth'));
      });
    });

    describe('Автопереходы', () => {
      it('должен генерировать FakeCallbackQuery для автоперехода', () => {
        const result = generateMap(validParamsWithAutoTransition);

        assert.ok(result.includes('class FakeCallbackQuery:'));
        assert.ok(result.includes('fake_callback = FakeCallbackQuery'));
      });

      it('должен генерировать вызов handle_callback для автоперехода', () => {
        const result = generateMap(validParamsWithAutoTransition);

        assert.ok(result.includes('handle_callback_main_menu'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateMap(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateMap(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный keyboardType', () => {
        const result = mapParamsSchema.safeParse({
          nodeId: 'test',
          keyboardType: 'invalid',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять неправильный formatMode', () => {
        const result = mapParamsSchema.safeParse({
          nodeId: 'test',
          formatMode: 'invalid',
        });

        assert.ok(!result.success);
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = mapParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен принимать undefined для всех опциональных полей', () => {
        const result = mapParamsSchema.safeParse({ nodeId: 'test' });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.messageText, undefined);
          assert.strictEqual(result.data.latitude, undefined);
          assert.strictEqual(result.data.longitude, undefined);
          assert.strictEqual(result.data.keyboardType, undefined);
          assert.strictEqual(result.data.formatMode, undefined);
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        for (const type of ['inline', 'reply', 'none']) {
          const result = mapParamsSchema.safeParse({ nodeId: 'test', keyboardType: type });
          assert.ok(result.success, `Тип ${type} должен быть валидным`);
        }
      });

      it('должен принимать все значения enum для formatMode', () => {
        for (const mode of ['html', 'markdown', 'none']) {
          const result = mapParamsSchema.safeParse({ nodeId: 'test', formatMode: mode });
          assert.ok(result.success, `Режим ${mode} должен быть валидным`);
        }
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMap(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 500ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateMap(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 500, `1000 генераций заняли ${duration}ms (ожидалось < 500ms)`);
      });
    });
  });
});
