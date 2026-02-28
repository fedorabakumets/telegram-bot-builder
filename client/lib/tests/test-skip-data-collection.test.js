/**
 * @fileoverview Тесты для skipDataCollection навигации
 *
 * Проверяет генерацию Python кода для кнопок пропуска сбора данных:
 * - generateSkipButtonsCheck
 * - generateSkipFakeCallbackCreation
 * - generateSkipNavigation
 * - generateSkipTargetHandlerFunction
 *
 * @module tests/test-skip-data-collection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSkipButtonsCheck,
  generateSkipFakeCallbackCreation,
  generateSkipNavigation,
  generateSkipTargetHandlerFunction
} from '../bot-generator/user-input/index.js';

describe('skipDataCollection навигация', () => {
  describe('generateSkipButtonsCheck', () => {
    it('должен генерировать проверку кнопок пропуска', () => {
      const code = generateSkipButtonsCheck('        ');
      
      assert.ok(code.includes('skip_buttons'), 'Должна быть проверка skip_buttons');
      assert.ok(code.includes('waiting_config.get'), 'Должно быть получение из config');
      assert.ok(code.includes('for skip_btn in skip_buttons'), 'Должен быть цикл по кнопкам');
      assert.ok(code.includes('skip_target'), 'Должно быть получение target');
    });

    it('должен содержать логирование нажатия кнопки', () => {
      const code = generateSkipButtonsCheck('        ');
      
      assert.ok(code.includes('logging.info'), 'Должно быть логирование');
      assert.ok(code.includes('⏭️ Нажата кнопка skipDataCollection'), 'Должно быть лого о нажатии кнопки');
    });

    it('должен очищать состояние ожидания', () => {
      const code = generateSkipButtonsCheck('        ');
      
      assert.ok(code.includes('del user_data[user_id]["waiting_for_input"]'), 'Должна быть очистка состояния');
    });
  });

  describe('generateSkipFakeCallbackCreation', () => {
    it('должен генерировать fake_callback для навигации', () => {
      const code = generateSkipFakeCallbackCreation('            ');
      
      assert.ok(code.includes('fake_callback'), 'Должен быть fake_callback');
      assert.ok(code.includes('SimpleNamespace'), 'Должен использоваться SimpleNamespace');
      assert.ok(code.includes('from_user=message.from_user'), 'Должен быть from_user');
      assert.ok(code.includes('data=skip_target'), 'Должна быть data=skip_target');
    });

    it('должен содержать проверку skip_target', () => {
      const code = generateSkipFakeCallbackCreation('            ');
      
      assert.ok(code.includes('if skip_target:'), 'Должна быть проверка skip_target');
    });

    it('должен содержать try блок', () => {
      const code = generateSkipFakeCallbackCreation('            ');
      
      assert.ok(code.includes('try:'), 'Должен быть try блок');
    });
  });

  describe('generateSkipNavigation', () => {
    it('должен генерировать вызов обработчика целевого узла', () => {
      const nodes = [
        { id: 'start', type: 'start', data: {} },
        { id: 'node-1', type: 'message', data: {} }
      ];
      const code = generateSkipNavigation(nodes, '        ');
      
      assert.ok(code.includes('call_skip_target_handler'), 'Должен быть вызов call_skip_target_handler');
      assert.ok(code.includes('fake_callback'), 'Должен передаваться fake_callback');
      assert.ok(code.includes('skip_target'), 'Должен передаваться skip_target');
    });

    it('должен содержать логирование успешного перехода', () => {
      const nodes = [{ id: 'start', type: 'start', data: {} }];
      const code = generateSkipNavigation(nodes, '        ');
      
      assert.ok(code.includes('logging.info'), 'Должно быть логирование');
      assert.ok(code.includes('✅ Переход skipDataCollection выполнен'), 'Должно быть лого об успехе');
    });

    it('должен генерировать пустой код для пустого массива узлов', () => {
      const code = generateSkipNavigation([], '        ');
      
      assert.strictEqual(code.trim(), '', 'Должен вернуть пустую строку для пустого массива');
    });
  });

  describe('generateSkipTargetHandlerFunction', () => {
    it('должен генерировать функцию call_skip_target_handler', () => {
      const code = generateSkipTargetHandlerFunction(['start', 'node1'], '    ');
      
      assert.ok(code.includes('async def call_skip_target_handler'), 'Должна быть функция call_skip_target_handler');
      assert.ok(code.includes('fake_callback'), 'Должен быть параметр fake_callback');
      assert.ok(code.includes('skip_target'), 'Должен быть параметр skip_target');
    });

    it('должен генерировать безопасное имя функции', () => {
      const code = generateSkipTargetHandlerFunction(['start'], '    ');
      
      assert.ok(code.includes('safe_func_name'), 'Должно быть safe_func_name');
      assert.ok(code.includes('replace("-", "_")'), 'Должна быть замена дефисов');
      assert.ok(code.includes('handle_callback_'), 'Должен быть префикс handle_callback_');
    });

    it('должен проверять наличие обработчика', () => {
      const code = generateSkipTargetHandlerFunction(['start'], '    ');
      
      assert.ok(code.includes('if handler_func_name in globals()'), 'Должна быть проверка наличия обработчика');
      assert.ok(code.includes('await globals()[handler_func_name]'), 'Должен быть вызов обработчика');
    });

    it('должен содержать fallback для отсутствующего обработчика', () => {
      const code = generateSkipTargetHandlerFunction(['start'], '    ');
      
      assert.ok(code.includes('logging.warning') || code.includes('logging.error'), 'Должно быть предупреждение');
      assert.ok(code.includes('not found') || code.includes('не найден'), 'Должно быть сообщение об отсутствии');
      assert.ok(code.includes('await fake_callback.message.answer') || code.includes('fake_callback.answer'), 'Должен быть fallback ответ');
    });

    it('должен содержать docstring', () => {
      const code = generateSkipTargetHandlerFunction(['start'], '    ');
      
      assert.ok(code.includes('"""'), 'Должен быть docstring');
      assert.ok(code.includes('Args:') || code.includes('fake_callback'), 'Должны быть описания аргументов или параметры');
    });
  });

  describe('Интеграция skipDataCollection функций', () => {
    it('должен генерировать полный код навигации', () => {
      const nodes = [
        { id: 'start', type: 'start', data: { command: '/start' } },
        { id: 'node-1', type: 'message', data: { messageText: 'Test' } }
      ];
      
      let fullCode = '';
      fullCode += generateSkipButtonsCheck('        ');
      fullCode += generateSkipFakeCallbackCreation('            ');
      fullCode += generateSkipNavigation(nodes, '        ');
      fullCode += generateSkipTargetHandlerFunction(nodes, '    ');
      
      assert.ok(fullCode.includes('skip_buttons'), 'Должна быть проверка кнопок');
      assert.ok(fullCode.includes('fake_callback'), 'Должен быть fake_callback');
      assert.ok(fullCode.includes('call_skip_target_handler'), 'Должен быть вызов обработчика');
      assert.ok(fullCode.includes('async def call_skip_target_handler'), 'Должна быть функция обработчика');
    });

    it('должен иметь правильные отступы', () => {
      const nodes = [{ id: 'start', type: 'start', data: {} }];
      
      const buttonsCheck = generateSkipButtonsCheck('        ');
      const fakeCallback = generateSkipFakeCallbackCreation('            ');
      const navigation = generateSkipNavigation(nodes, '        ');
      
      // Проверяем что отступы увеличиваются корректно
      assert.ok(buttonsCheck.startsWith('        #'), 'buttonsCheck должен иметь отступ 8 пробелов');
      assert.ok(fakeCallback.startsWith('            #'), 'fakeCallback должен иметь отступ 12 пробелов');
    });
  });
});
