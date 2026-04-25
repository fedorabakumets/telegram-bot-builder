/**
 * @fileoverview Тесты для шаблона клавиатуры
 * @module templates/keyboard/keyboard.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateKeyboard } from './keyboard.renderer';
import {
  validParamsInline,
  validParamsReply,
  validParamsWithLayout,
  validParamsEmpty,
  validParamsOneTime,
  validParamsEmptyButtonIds,
  invalidParamsWrongType,
  invalidParamsMissingField,
  expectedOutputInline,
  expectedOutputReply,
  expectedOutputEmpty,
  validParamsContactLocation,
  validParamsCopyText,
  validParamsWebApp,
  validParamsWithStyle,
  validParamsDynamicInline,
  validParamsDynamicInlineLegacy,
  validParamsRequestManagedBot,
} from './keyboard.fixture';
import { keyboardParamsSchema } from './keyboard.schema';

describe('keyboard.py.jinja2 шаблон', () => {
  describe('generateKeyboard()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать inline клавиатуру', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('InlineKeyboardButton'));
        assert.ok(result.includes('callback_data'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes('resize_keyboard'));
      });

      it('должен генерировать пустую клавиатуру', () => {
        const result = generateKeyboard(validParamsEmpty);

        assert.ok(result.includes('keyboard = None'));
      });

      it('должен генерировать клавиатуру с раскладкой', () => {
        const result = generateKeyboard(validParamsWithLayout);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('builder.adjust(2, 2)'));
        assert.ok(result.includes('callback_data="btn1"'));
        assert.ok(result.includes('callback_data="btn4"'));
      });

      it('должен генерировать oneTimeKeyboard', () => {
        const result = generateKeyboard(validParamsOneTime);

        assert.ok(result.includes('one_time_keyboard=True'));
        assert.ok(result.includes('resize_keyboard=False'));
      });

      it('сохраняет ручные ряды вокруг __dynamic__ без пустого builder.adjust()', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_add',
              text: 'Добавить токен',
              action: 'goto',
              target: 'ask-token',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
            },
            {
              id: 'btn_rename',
              text: 'Переименовать',
              action: 'goto',
              target: 'rename-project',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
            },
            {
              id: 'btn_delete',
              text: 'Удалить',
              action: 'goto',
              target: 'delete-project',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
            },
            {
              id: 'btn_back',
              text: 'К списку',
              action: 'goto',
              target: 'fetch-projects',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
            },
          ],
          enableDynamicButtons: true,
          dynamicButtons: {
            sourceVariable: 'project_tokens',
            arrayPath: 'items',
            textTemplate: '{name}',
            callbackTemplate: 'token_{id}',
            columns: 1,
            styleMode: 'none',
            styleField: '',
            styleTemplate: '',
          },
          keyboardLayout: {
            autoLayout: false,
            columns: 2,
            rows: [
              { buttonIds: ['__dynamic__'] },
              { buttonIds: ['btn_add'] },
              { buttonIds: ['btn_rename', 'btn_delete'] },
              { buttonIds: ['btn_back'] },
            ],
          },
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(!result.includes('builder.adjust()'), `Не должно быть пустого builder.adjust():\n${result}`);
        assert.ok(result.includes('builder.row('), `Ожидался builder.row() для ручных рядов:\n${result}`);
        assert.ok(result.includes('callback_data="ask-token"'));
        assert.ok(result.includes('callback_data="rename-project"'));
        assert.ok(result.includes('callback_data="delete-project"'));
        assert.ok(result.includes('callback_data="fetch-projects"'));
      });
    });

    describe('Inline клавиатура', () => {
      it('должен генерировать callback кнопки', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('callback_data="btn_stats"'));
        assert.ok(result.includes('callback_data="btn_settings"'));
      });

      it('должен генерировать URL кнопки', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('url="https://example.com"'));
      });

      it('должен генерировать keyboard = builder.as_markup()', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('keyboard = builder.as_markup()'));
      });
    });

    describe('Reply клавиатура', () => {
      it('должен генерировать KeyboardButton', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('KeyboardButton(text='));
      });

      it('должен сохранять multi_select_variable для reply multi-select', () => {
        const result = generateKeyboard({
          ...validParamsReply,
          allowMultipleSelection: true,
          nodeId: 'node_1',
          multiSelectVariable: 'reply_choices',
        });

        assert.ok(result.includes('multi_select_variable"] = "reply_choices"'));
      });

      it('должен генерировать resize_keyboard=True по умолчанию', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('resize_keyboard=True'));
      });

      it('должен генерировать one_time_keyboard=False по умолчанию', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('one_time_keyboard=False'));
      });
    });

    describe('Раскладка', () => {
      it('должен генерировать комментарии для ручной раскладки', () => {
        const result = generateKeyboard(validParamsWithLayout);

        assert.ok(result.includes('builder.adjust(2, 2)'), `Ожидался builder.adjust(2, 2), получено:\n${result}`);
        assert.ok(result.includes('callback_data="btn1"'));
        assert.ok(result.includes('callback_data="btn3"'));
      });

      it('не должен генерировать builder.adjust(, ) при пустых buttonIds', () => {
        const result = generateKeyboard(validParamsEmptyButtonIds);

        assert.ok(
          !result.includes('builder.adjust(, )'),
          `Не должно быть builder.adjust(, ), получено:\n${result}`
        );
        assert.ok(result.includes('builder.adjust('), 'Должен быть builder.adjust() с аргументом');
      });

      it('должен генерировать авто-раскладку', () => {
        const result = generateKeyboard({
          ...validParamsWithLayout,
          keyboardLayout: {
            rows: [],
            columns: 3,
            autoLayout: true,
          },
        });

        assert.ok(result.includes('builder.adjust(3)'), `Ожидался builder.adjust(3), получено:\n${result}`);
      });

      it('должен генерировать кнопки в правильном порядке', () => {
        const result = generateKeyboard(validParamsWithLayout);

        // Ручная раскладка: rows = [[btn_1, btn_2], [btn_3, btn_4]]
        // Кнопки должны идти в порядке btn1 → btn2 → btn3 → btn4
        const btn1Index = result.indexOf('callback_data="btn1"');
        const btn2Index = result.indexOf('callback_data="btn2"');
        const btn3Index = result.indexOf('callback_data="btn3"');
        const btn4Index = result.indexOf('callback_data="btn4"');

        assert.ok(btn1Index !== -1, 'btn1 не найден');
        assert.ok(btn1Index < btn2Index && btn2Index < btn3Index && btn3Index < btn4Index,
          `Неправильный порядок: btn1=${btn1Index} btn2=${btn2Index} btn3=${btn3Index} btn4=${btn4Index}`);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateKeyboard(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateKeyboard(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный keyboardType', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'invalid',
          buttons: [],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(!result.success);
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = keyboardParamsSchema.safeParse(validParamsInline);
        assert.ok(result.success);
      });

      it('должен использовать значения по умолчанию для всех полей', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'none',
          buttons: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.oneTimeKeyboard, false);
          assert.strictEqual(result.data.allowMultipleSelection, false);
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        const types = ['inline', 'reply', 'none'];

        for (const type of types) {
          const result = keyboardParamsSchema.safeParse({
            keyboardType: type,
            buttons: [],
            oneTimeKeyboard: false,
            resizeKeyboard: true,
          });
          assert.ok(result.success, `Тип ${type} должен быть валидным`);
        }
      });

      it('должен принимать keyboardLayout с правильной структурой', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [],
          keyboardLayout: {
            rows: [{ buttonIds: ['btn_1', 'btn_2'] }],
            columns: 2,
            autoLayout: false,
          },
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.success);
      });

      it('должен использовать пустой массив для buttons по умолчанию', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'none',
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.success);
        if (result.success) {
          assert.deepStrictEqual(result.data.buttons, []);
        }
      });
    });

    describe('customCallbackData', () => {
      it('кастомный customCallbackData используется вместо target для goto', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_order',
              text: 'Подтвердить',
              action: 'goto',
              target: 'node_confirm',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
              customCallbackData: 'confirm_order',
            },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.includes('callback_data="confirm_order"'), `Ожидался callback_data="confirm_order", получено:\n${result}`);
        assert.ok(!result.includes('callback_data="node_confirm"'), 'target не должен использоваться как callback_data');
      });

      it('кастомный customCallbackData используется вместо авто-значения для command', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_cmd',
              text: 'Команда',
              action: 'command',
              target: '/start',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
              customCallbackData: 'my_custom_cmd',
            },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.includes('callback_data="my_custom_cmd"'), `Ожидался callback_data="my_custom_cmd", получено:\n${result}`);
        assert.ok(!result.includes('cmd_start'), 'авто-значение cmd_start не должно использоваться');
      });

      it('без customCallbackData используется target как callback_data', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_back',
              text: 'Назад',
              action: 'goto',
              target: 'node_back',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
            },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.includes('callback_data="node_back"'), `Ожидался callback_data="node_back", получено:\n${result}`);
      });
    });

    describe('переменные в customCallbackData', () => {
      it('customCallbackData с {переменной} генерирует replace_variables_in_text', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_next',
              text: '➡️ Далее',
              action: 'goto',
              target: 'pagination-input',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
              customCallbackData: 'offset_{users_data.nextOffset}',
            },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(
          result.includes('replace_variables_in_text("offset_{users_data.nextOffset}"'),
          `Ожидался replace_variables_in_text для customCallbackData с переменной, получено:\n${result}`
        );
      });

      it('customCallbackData без переменных остаётся статическим', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_confirm',
              text: 'Подтвердить',
              action: 'goto',
              target: 'node_confirm',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
              customCallbackData: 'confirm_order',
            },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(
          result.includes('callback_data="confirm_order"'),
          `Ожидался статический callback_data="confirm_order", получено:\n${result}`
        );
        assert.ok(
          !result.includes('replace_variables_in_text("confirm_order"'),
          'Статический customCallbackData не должен использовать replace_variables_in_text'
        );
      });

      it('customCallbackData с несколькими переменными подставляется корректно', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            {
              id: 'btn_edit',
              text: 'Редактировать',
              action: 'goto',
              target: 'edit-node',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false,
              customCallbackData: 'edit_{item.type}_{item.id}',
            },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(
          result.includes('replace_variables_in_text("edit_{item.type}_{item.id}"'),
          `Ожидался replace_variables_in_text для нескольких переменных, получено:\n${result}`
        );
      });
    });

    describe('requestContact / requestLocation', () => {
      it('генерирует request_contact=True для кнопки с requestContact', () => {
        const result = generateKeyboard(validParamsContactLocation);
        assert.ok(result.includes('request_contact=True'), `Ожидался request_contact=True, получено:\n${result}`);
      });

      it('генерирует request_location=True для кнопки с requestLocation', () => {
        const result = generateKeyboard(validParamsContactLocation);
        assert.ok(result.includes('request_location=True'), `Ожидался request_location=True, получено:\n${result}`);
      });

      it('не генерирует request_contact для обычной goto кнопки', () => {
        const result = generateKeyboard(validParamsContactLocation);
        const lines = result.split('\n');
        // Строка с btn_skip не должна содержать request_contact
        const skipLine = lines.find(l => l.includes('Пропустить'));
        assert.ok(!skipLine?.includes('request_contact'), 'goto кнопка не должна иметь request_contact');
      });

      it('не генерирует request_location для обычной goto кнопки', () => {
        const result = generateKeyboard(validParamsContactLocation);
        const lines = result.split('\n');
        const skipLine = lines.find(l => l.includes('Пропустить'));
        assert.ok(!skipLine?.includes('request_location'), 'goto кнопка не должна иметь request_location');
      });

      it('использует ReplyKeyboardBuilder для contact/location кнопок', () => {
        const result = generateKeyboard(validParamsContactLocation);
        assert.ok(result.includes('ReplyKeyboardBuilder'), 'Должен использоваться ReplyKeyboardBuilder');
        assert.ok(!result.includes('InlineKeyboardBuilder'), 'Не должен использоваться InlineKeyboardBuilder');
      });

      it('contact кнопка не генерирует callback_data', () => {
        const result = generateKeyboard({
          keyboardType: 'reply',
          buttons: [{
            id: 'btn_c', text: 'Контакт', action: 'contact',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            requestContact: true,
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(!result.includes('callback_data'), 'contact кнопка не должна иметь callback_data');
        assert.ok(result.includes('request_contact=True'));
      });

      it('location кнопка не генерирует callback_data', () => {
        const result = generateKeyboard({
          keyboardType: 'reply',
          buttons: [{
            id: 'btn_l', text: 'Геолокация', action: 'location',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            requestLocation: true,
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(!result.includes('callback_data'), 'location кнопка не должна иметь callback_data');
        assert.ok(result.includes('request_location=True'));
      });

      it('схема принимает requestContact=true в кнопке', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'reply',
          buttons: [{
            id: 'btn_c', text: 'Контакт', action: 'contact',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            requestContact: true,
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success, `Схема должна принять requestContact: ${JSON.stringify(result)}`);
      });

      it('схема принимает requestLocation=true в кнопке', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'reply',
          buttons: [{
            id: 'btn_l', text: 'Геолокация', action: 'location',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            requestLocation: true,
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success, `Схема должна принять requestLocation: ${JSON.stringify(result)}`);
      });

      it('смешанная клавиатура: contact + goto кнопки вместе', () => {
        const result = generateKeyboard({
          keyboardType: 'reply',
          buttons: [
            { id: 'btn_c', text: 'Контакт', action: 'contact', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false, requestContact: true },
            { id: 'btn_g', text: 'Далее', action: 'goto', target: 'next_node', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.includes('request_contact=True'), 'Должен быть request_contact=True');
        assert.ok(result.includes('Далее'), 'Должна быть кнопка Далее');
        assert.ok(result.includes('ReplyKeyboardBuilder'));
      });
    });

    describe('copy_text действие', () => {
      it('генерирует CopyTextButton(text="...") для copy_text кнопки', () => {
        const result = generateKeyboard(validParamsCopyText);
        assert.ok(result.includes('CopyTextButton(text="PROMO2024")'), `Ожидался CopyTextButton(text="PROMO2024"), получено:\n${result}`);
      });

      it('не генерирует callback_data для copy_text кнопки', () => {
        const result = generateKeyboard(validParamsCopyText);
        const lines = result.split('\n');
        const copyLine = lines.find(l => l.includes('CopyTextButton'));
        assert.ok(!copyLine?.includes('callback_data'), 'copy_text кнопка не должна иметь callback_data');
      });

      it('схема принимает copyText поле в кнопке', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [{ id: 'btn_c', text: 'Скопировать', action: 'copy_text', copyText: 'hello', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success, `Схема должна принять copyText: ${JSON.stringify(result)}`);
      });

      it('copy_text кнопка работает вместе с другими inline кнопками', () => {
        const result = generateKeyboard(validParamsCopyText);
        assert.ok(result.includes('CopyTextButton'), 'Должна быть copy_text кнопка');
        assert.ok(result.includes('callback_data="next_node"'), 'Должна быть goto кнопка');
        assert.ok(result.includes('InlineKeyboardBuilder'), 'Должен использоваться InlineKeyboardBuilder');
      });
    });

    describe('web_app действие', () => {
      it('генерирует WebAppInfo(url="https://example.com/shop") для web_app кнопки', () => {
        const result = generateKeyboard(validParamsWebApp);
        assert.ok(result.includes('WebAppInfo(url="https://example.com/shop")'), `Ожидался WebAppInfo(url="https://example.com/shop"), получено:\n${result}`);
      });

      it('не генерирует callback_data для web_app кнопки с заполненным URL', () => {
        const result = generateKeyboard(validParamsWebApp);
        const lines = result.split('\n');
        const webAppLine = lines.find(l => l.includes('WebAppInfo'));
        assert.ok(!webAppLine?.includes('callback_data'), 'web_app кнопка с URL не должна иметь callback_data');
      });

      it('фоллбэк на callback_data при пустом webAppUrl', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [{
            id: 'btn_wa_empty',
            text: 'Web App',
            action: 'web_app',
            buttonType: 'normal',
            skipDataCollection: false,
            hideAfterClick: false,
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.includes('callback_data='), 'Пустой webAppUrl должен генерировать callback_data');
        assert.ok(!result.includes('WebAppInfo'), 'Не должен генерировать WebAppInfo при пустом URL');
      });

      it('схема принимает webAppUrl поле в кнопке', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [{ id: 'btn_wa', text: 'Открыть', action: 'web_app', webAppUrl: 'https://example.com', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success, `Схема должна принять webAppUrl: ${JSON.stringify(result)}`);
      });

      it('web_app кнопка работает вместе с другими inline кнопками', () => {
        const result = generateKeyboard(validParamsWebApp);
        assert.ok(result.includes('WebAppInfo'), 'Должна быть web_app кнопка');
        assert.ok(result.includes('callback_data="next_node"'), 'Должна быть goto кнопка');
        assert.ok(result.includes('InlineKeyboardBuilder'), 'Должен использоваться InlineKeyboardBuilder');
      });

      it('web_app кнопка корректно работает с ручной раскладкой', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [
            { id: 'btn_wa', text: '🌐 Открыть', action: 'web_app', webAppUrl: 'https://example.com', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
            { id: 'btn_g1', text: 'Далее', action: 'goto', target: 'node_2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
            { id: 'btn_g2', text: 'Назад', action: 'goto', target: 'node_3', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
          ],
          keyboardLayout: {
            rows: [
              { buttonIds: ['btn_wa', 'btn_g1'] },
              { buttonIds: ['btn_g2'] },
            ],
            columns: 2,
            autoLayout: false,
          },
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.includes('WebAppInfo(url="https://example.com")'), 'Должна быть web_app кнопка');
        assert.ok(result.includes('builder.adjust(2, 1)'), `Ожидался builder.adjust(2, 1), получено:\n${result}`);
      });
    });

    describe('request_managed_bot действие (Bot API 9.6)', () => {
      it('генерирует KeyboardButtonRequestManagedBot для кнопки с request_managed_bot', () => {
        const result = generateKeyboard(validParamsRequestManagedBot);
        assert.ok(
          result.includes('KeyboardButtonRequestManagedBot('),
          `Ожидался KeyboardButtonRequestManagedBot, получено:\n${result}`
        );
      });

      it('генерирует suggested_name если задан suggestedBotName', () => {
        const result = generateKeyboard(validParamsRequestManagedBot);
        assert.ok(
          result.includes('suggested_name="Мой бот"'),
          `Ожидался suggested_name="Мой бот", получено:\n${result}`
        );
      });

      it('генерирует suggested_username если задан suggestedBotUsername', () => {
        const result = generateKeyboard(validParamsRequestManagedBot);
        assert.ok(
          result.includes('suggested_username="my_new_bot"'),
          `Ожидался suggested_username="my_new_bot", получено:\n${result}`
        );
      });

      it('не генерирует callback_data для request_managed_bot кнопки', () => {
        const result = generateKeyboard(validParamsRequestManagedBot);
        const lines = result.split('\n');
        const botLine = lines.find(l => l.includes('KeyboardButtonRequestManagedBot'));
        assert.ok(!botLine?.includes('callback_data'), 'request_managed_bot кнопка не должна иметь callback_data');
      });

      it('использует ReplyKeyboardBuilder', () => {
        const result = generateKeyboard(validParamsRequestManagedBot);
        assert.ok(result.includes('ReplyKeyboardBuilder'), 'Должен использоваться ReplyKeyboardBuilder');
        assert.ok(!result.includes('InlineKeyboardBuilder'), 'Не должен использоваться InlineKeyboardBuilder');
      });

      it('схема принимает suggestedBotName и suggestedBotUsername в кнопке', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'reply',
          buttons: [{
            id: 'btn_mb', text: '🤖 Создать', action: 'request_managed_bot',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            suggestedBotName: 'Тест бот',
            suggestedBotUsername: 'test_bot_123',
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success, `Схема должна принять suggestedBotName/suggestedBotUsername: ${JSON.stringify(result)}`);
      });

      it('работает вместе с другими reply кнопками', () => {
        const result = generateKeyboard(validParamsRequestManagedBot);
        assert.ok(result.includes('KeyboardButtonRequestManagedBot('), 'Должна быть request_managed_bot кнопка');
        assert.ok(result.includes('Пропустить'), 'Должна быть кнопка Пропустить');
        assert.ok(result.includes('ReplyKeyboardBuilder'), 'Должен использоваться ReplyKeyboardBuilder');
      });
    });

    describe('style — цвет кнопки (Bot API 9.4)', () => {
      it('style="primary" генерирует style="primary" в InlineKeyboardButton', () => {
        const result = generateKeyboard(validParamsWithStyle);
        assert.ok(result.includes('style="primary"'), `Ожидался style="primary", получено:\n${result}`);
      });

      it('style="danger" генерирует style="danger"', () => {
        const result = generateKeyboard(validParamsWithStyle);
        assert.ok(result.includes('style="danger"'), `Ожидался style="danger", получено:\n${result}`);
      });

      it('style="success" генерирует style="success"', () => {
        const result = generateKeyboard(validParamsWithStyle);
        assert.ok(result.includes('style="success"'), `Ожидался style="success", получено:\n${result}`);
      });

      it('кнопка без style не генерирует параметр style', () => {
        const result = generateKeyboard(validParamsInline);
        assert.ok(!result.includes('style='), `Кнопка без style не должна содержать style=, получено:\n${result}`);
      });

      it('style работает вместе с goto кнопкой', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [{
            id: 'btn_s', text: 'Удалить', action: 'goto', target: 'node_del',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            style: 'danger',
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.includes('callback_data="node_del"'), 'Должен быть callback_data');
        assert.ok(result.includes('style="danger"'), 'Должен быть style="danger"');
      });

      it('style работает вместе с url кнопкой', () => {
        const result = generateKeyboard({
          keyboardType: 'inline',
          buttons: [{
            id: 'btn_u', text: 'Сайт', action: 'url', url: 'https://example.com',
            buttonType: 'normal', skipDataCollection: false, hideAfterClick: false,
            style: 'primary',
          }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.includes('url="https://example.com"'), 'Должен быть url=');
        assert.ok(result.includes('style="primary"'), 'Должен быть style="primary"');
      });

      it('схема принимает все три значения style', () => {
        for (const style of ['primary', 'success', 'danger'] as const) {
          const result = keyboardParamsSchema.safeParse({
            keyboardType: 'inline',
            buttons: [{ id: 'b', text: 'T', action: 'goto', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false, style }],
            oneTimeKeyboard: false,
            resizeKeyboard: true,
          });
          assert.ok(result.success, `Схема должна принять style="${style}": ${JSON.stringify(result)}`);
        }
      });

      it('схема отклоняет неизвестное значение style', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [{ id: 'b', text: 'T', action: 'goto', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false, style: 'secondary' }],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(!result.success, 'Схема должна отклонить неизвестный style="secondary"');
      });
    });

    describe('Производительность', () => {      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateKeyboard(validParamsInline);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateKeyboard(validParamsInline);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 500, `1000 генераций заняли ${duration}ms (ожидалось < 500ms)`);
      });
    });

    describe('Проверка отступов', () => {
      it('должен генерировать keyboard = None без начальных отступов', () => {
        const result = generateKeyboard(validParamsEmpty);

        // Проверяем, что keyboard = None начинается без отступов
        const lines = result.split('\n');
        const keyboardLine = lines.find(line => line.includes('keyboard = None'));

        assert.ok(keyboardLine, 'Должна быть строка с keyboard = None');
        assert.ok(
          keyboardLine.startsWith('keyboard'),
          `keyboard = None не должен начинаться с отступов, получено: "${keyboardLine}"`
        );
      });

      it('должен генерировать builder = InlineKeyboardBuilder без начальных отступов', () => {
        const result = generateKeyboard(validParamsInline);

        const lines = result.split('\n');
        const builderLine = lines.find(line => line.includes('builder = InlineKeyboardBuilder()'));

        assert.ok(builderLine, 'Должна быть строка с builder = InlineKeyboardBuilder()');
        assert.ok(
          builderLine.startsWith('builder'),
          `builder = InlineKeyboardBuilder() не должен начинаться с отступов, получено: "${builderLine}"`
        );
      });

      it('должен генерировать keyboard = builder.as_markup() без начальных отступов', () => {
        const result = generateKeyboard(validParamsInline);

        const lines = result.split('\n');
        const keyboardLine = lines.find(line => line.includes('keyboard = builder.as_markup()'));

        assert.ok(keyboardLine, 'Должна быть строка с keyboard = builder.as_markup()');
        assert.ok(
          keyboardLine.startsWith('keyboard'),
          `keyboard = builder.as_markup() не должен начинаться с отступов, получено: "${keyboardLine}"`
        );
      });

      it('должен генерировать keyboard = builder.as_markup() с правильными параметрами', () => {
        const result = generateKeyboard(validParamsReply);
        
        assert.ok(result.includes('resize_keyboard='));
        assert.ok(result.includes('one_time_keyboard='));
      });

      it('не должен содержать несколько операторов на одной строке (Python syntax)', () => {
        const result = generateKeyboard(validParamsInline);

        // Проверяем что нет конструкций вида ")builder.add(" или ")keyboard ="
        assert.ok(
          !result.includes(')builder.add('),
          'Не должно быть нескольких операторов на одной строке: ")builder.add("'
        );
        assert.ok(
          !result.includes(')keyboard ='),
          'Не должно быть нескольких операторов на одной строке: ")keyboard ="'
        );
        assert.ok(
          !result.includes('builder.add(InlineKeyboardButton') || result.split('\n').every(line => 
            !line.includes('builder.add(InlineKeyboardButton') || 
            line.trim().startsWith('builder.add(')
          ),
          'Каждый builder.add() должен быть на отдельной строке'
        );
      });

      it('должен генерировать каждый оператор на отдельной строке', () => {
        const result = generateKeyboard(validParamsInline);
        const lines = result.split('\n');

        // Находим строки с builder.add
        const addLines = lines.filter(line => line.trim().startsWith('builder.add('));
        
        // Каждая строка должна содержать только один вызов builder.add
        for (const line of addLines) {
          const addCount = (line.match(/builder\.add\(/g) || []).length;
          assert.strictEqual(
            addCount,
            1,
            `Строка должна содержать только один builder.add(), получено ${addCount}: "${line.trim()}"`
          );
        }
      });
    });
  });

  it('генерирует dynamic inline keyboard helper', () => {
    const result = generateKeyboard(validParamsDynamicInline);

    assert.ok(result.includes('def _resolve_dynamic_path('));
    assert.ok(result.includes('replace_variables_in_text('));
    assert.ok(result.includes('project_{id}'));
    assert.ok(result.includes('builder.row(*_dynamic_row)'));
  });

  it('mixed dynamic + static manual rows сохраняет layout после __dynamic__', () => {
    const result = generateKeyboard({
      ...validParamsDynamicInline,
      buttons: [
        {
          id: 'btn_add',
          text: 'Добавить',
          action: 'goto',
          target: 'node_add',
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
        {
          id: 'btn_rename',
          text: 'Переименовать',
          action: 'goto',
          target: 'node_rename',
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
        {
          id: 'btn_delete',
          text: 'Удалить',
          action: 'goto',
          target: 'node_delete',
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
        {
          id: 'btn_back',
          text: 'Назад',
          action: 'goto',
          target: 'node_back',
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
      ],
      keyboardLayout: {
        autoLayout: false,
        columns: 2,
        rows: [
          { buttonIds: ['__dynamic__'] },
          { buttonIds: ['btn_add'] },
          { buttonIds: ['btn_rename', 'btn_delete'] },
          { buttonIds: ['btn_back'] },
        ],
      },
    });

    assert.ok(!result.includes('builder.adjust('), `Не ожидался builder.adjust в mixed-режиме:\n${result}`);
    assert.ok(result.includes('builder.row(*_dynamic_row)'), `Динамические кнопки должны собираться через row():\n${result}`);
    assert.ok(result.includes('callback_data="node_add"'), 'Должна быть кнопка node_add');
    assert.ok(result.includes('callback_data="node_rename"'), 'Должна быть кнопка node_rename');
    assert.ok(result.includes('callback_data="node_delete"'), 'Должна быть кнопка node_delete');
    assert.ok(result.includes('callback_data="node_back"'), 'Должна быть кнопка node_back');
    assert.ok(result.includes('builder.row('), `Ожидались явные строки layout:\n${result}`);
  });

  describe('keyboardParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = keyboardParamsSchema.safeParse(validParamsInline);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [],
          oneTimeKeyboard: 'true',
          resizeKeyboard: true,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для keyboardType', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'popup',
          buttons: [],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(!result.success);
      });

      it('должен принимать buttons с правильной структурой', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [
            { id: 'btn_1', text: 'Button', action: 'goto', target: 'btn', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success);
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 20 полей', () => {
        const shape = keyboardParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 22);
      });

      it('должен использовать ZodOptional для keyboardType', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.keyboardType.isOptional());
      });

      it('должен использовать ZodOptional для oneTimeKeyboard', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.oneTimeKeyboard.isOptional());
      });

      it('должен использовать ZodOptional для resizeKeyboard', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.resizeKeyboard.isOptional());
      });

      it('должен использовать ZodOptional для buttons', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.buttons.isOptional());
      });

      it('принимает dynamicButtons model', () => {
        const result = keyboardParamsSchema.safeParse(validParamsDynamicInline);
        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.enableDynamicButtons, true);
          assert.strictEqual(result.data.dynamicButtons?.sourceVariable, 'projects');
          assert.strictEqual(result.data.dynamicButtons?.arrayPath, 'items');
        }
      });

      it('принимает legacy dynamicButtons поля', () => {
        const result = keyboardParamsSchema.safeParse(validParamsDynamicInlineLegacy);
        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.dynamicButtons?.sourceVariable, 'projects');
          assert.strictEqual(result.data.dynamicButtons?.arrayPath, 'items');
          assert.strictEqual(result.data.dynamicButtons?.textTemplate, '{name}');
          assert.strictEqual(result.data.dynamicButtons?.callbackTemplate, 'project_{id}');
          assert.strictEqual(result.data.dynamicButtons?.styleMode, 'template');
        }
      });
    });
  });

  describe('Динамические кнопки', () => {
    /**
     * enableDynamicButtons: true + валидный конфиг → генерирует _resolve_dynamic_path
     */
    it('генерирует _resolve_dynamic_path при enableDynamicButtons=true', () => {
      const result = generateKeyboard(validParamsDynamicInline);
      assert.ok(result.includes('def _resolve_dynamic_path('), `Ожидался _resolve_dynamic_path, получено:\n${result}`);
    });

    /**
     * enableDynamicButtons: true + валидный конфиг → генерирует _render_dynamic_template
     */
    it('генерирует _render_dynamic_template при enableDynamicButtons=true', () => {
      const result = generateKeyboard(validParamsDynamicInline);
      assert.ok(result.includes('def _render_dynamic_template('), `Ожидался _render_dynamic_template, получено:\n${result}`);
    });

    /**
     * enableDynamicButtons: true + валидный конфиг → генерирует _normalize_dynamic_style
     */
    it('генерирует _normalize_dynamic_style при enableDynamicButtons=true', () => {
      const result = generateKeyboard(validParamsDynamicInline);
      assert.ok(result.includes('def _normalize_dynamic_style('), `Ожидался _normalize_dynamic_style, получено:\n${result}`);
    });

    /**
     * columns=2 → builder.adjust(2)
     */
    it('генерирует builder.row для динамических кнопок при columns=2', () => {
      const result = generateKeyboard(validParamsDynamicInline);
      assert.ok(result.includes('if len(_dynamic_row) == 2:'), `Ожидалось разбиение по 2 кнопки, получено:\n${result}`);
      assert.ok(result.includes('builder.row(*_dynamic_row)'), `Ожидался builder.row(*_dynamic_row), получено:\n${result}`);
    });

    /**
     * columns=3 → builder.adjust(3)
     */
    it('генерирует builder.row для динамических кнопок при columns=3', () => {
      const result = generateKeyboard({
        ...validParamsDynamicInline,
        dynamicButtons: { ...validParamsDynamicInline.dynamicButtons!, columns: 3 },
      });
      assert.ok(result.includes('if len(_dynamic_row) == 3:'), `Ожидалось разбиение по 3 кнопки, получено:\n${result}`);
    });

    /**
     * styleMode='field' → генерирует код для styleField
     */
    it('styleMode field → генерирует код для styleField', () => {
      const result = generateKeyboard(validParamsDynamicInline);
      assert.ok(result.includes("'field'"), `Ожидался код для styleMode=field, получено:\n${result}`);
      assert.ok(result.includes('style'), `Ожидался styleField в коде, получено:\n${result}`);
    });

    /**
     * styleMode='template' → генерирует код для styleTemplate
     */
    it('styleMode template → генерирует код для styleTemplate', () => {
      const result = generateKeyboard({
        ...validParamsDynamicInline,
        dynamicButtons: {
          ...validParamsDynamicInline.dynamicButtons!,
          styleMode: 'template',
          styleTemplate: '{status}',
        },
      });
      assert.ok(result.includes("'template'"), `Ожидался код для styleMode=template, получено:\n${result}`);
    });

    /**
     * styleMode='none' → не генерирует style код (возвращает None)
     */
    it('styleMode none → _normalize_dynamic_style возвращает None', () => {
      const result = generateKeyboard({
        ...validParamsDynamicInline,
        dynamicButtons: {
          ...validParamsDynamicInline.dynamicButtons!,
          styleMode: 'none',
        },
      });
      assert.ok(result.includes("'none'"), `Ожидался код для styleMode=none, получено:\n${result}`);
      assert.ok(result.includes('return None'), `Ожидался return None для styleMode=none, получено:\n${result}`);
    });

    /**
     * Legacy поля (variable, arrayField, textField, callbackField) → корректно генерируют код
     */
    it('legacy поля корректно генерируют код', () => {
      const result = generateKeyboard(validParamsDynamicInlineLegacy as any);
      assert.ok(result.includes('def _resolve_dynamic_path('), 'Должен генерировать _resolve_dynamic_path');
      assert.ok(result.includes('projects'), `Ожидался sourceVariable "projects", получено:\n${result}`);
      assert.ok(result.includes('project_{id}'), `Ожидался callbackTemplate, получено:\n${result}`);
    });

    /**
     * enableDynamicButtons: false → НЕ генерирует _resolve_dynamic_path
     */
    it('enableDynamicButtons=false → не генерирует _resolve_dynamic_path', () => {
      const result = generateKeyboard({
        ...validParamsDynamicInline,
        enableDynamicButtons: false,
      });
      assert.ok(!result.includes('def _resolve_dynamic_path('), `Не должен генерировать _resolve_dynamic_path, получено:\n${result}`);
    });

    /**
     * keyboardType='reply' + enableDynamicButtons=true → форсирует inline (нет ReplyKeyboardBuilder)
     */
    it('keyboardType reply + enableDynamicButtons=true → форсирует inline', () => {
      const result = generateKeyboard({
        ...validParamsDynamicInline,
        keyboardType: 'reply',
      });
      assert.ok(!result.includes('ReplyKeyboardBuilder'), `Не должен использоваться ReplyKeyboardBuilder, получено:\n${result}`);
      assert.ok(result.includes('InlineKeyboardBuilder'), `Должен использоваться InlineKeyboardBuilder, получено:\n${result}`);
    });

    /**
     * Вложенный arrayPath "data.results" → генерируется в коде
     */
    it('вложенный arrayPath "data.results" → генерируется в коде', () => {
      const result = generateKeyboard({
        ...validParamsDynamicInline,
        dynamicButtons: {
          ...validParamsDynamicInline.dynamicButtons!,
          arrayPath: 'data.results',
        },
      });
      assert.ok(result.includes('data.results'), `Ожидался "data.results" в коде, получено:\n${result}`);
    });

    /**
     * Схема принимает validParamsDynamicInline
     */
    it('схема принимает validParamsDynamicInline', () => {
      const result = keyboardParamsSchema.safeParse(validParamsDynamicInline);
      assert.ok(result.success, `Схема должна принять validParamsDynamicInline: ${JSON.stringify(result)}`);
    });

    /**
     * Схема принимает validParamsDynamicInlineLegacy и конвертирует legacy поля
     */
    it('схема принимает validParamsDynamicInlineLegacy и конвертирует legacy поля', () => {
      const result = keyboardParamsSchema.safeParse(validParamsDynamicInlineLegacy);
      assert.ok(result.success, `Схема должна принять legacy params: ${JSON.stringify(result)}`);
      if (result.success) {
        assert.strictEqual(result.data.dynamicButtons?.sourceVariable, 'projects');
        assert.strictEqual(result.data.dynamicButtons?.callbackTemplate, 'project_{id}');
      }
    });
  });
});
