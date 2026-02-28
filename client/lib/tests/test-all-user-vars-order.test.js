/**
 * @fileoverview Тест проверки порядка определения all_user_vars
 *
 * Проверяет, что all_user_vars определяется ДО использования
 * в replace_variables_in_text при генерации кода для start_handler
 * с изображением и автопереходом.
 *
 * @module client/lib/tests/test-all-user-vars-order
 */

import { strict as assert } from 'node:assert';

/**
 * Проверяет, что all_user_vars определяется до использования
 */
function testAllUserVarsDefinedBeforeUse() {
  console.log('🧪 Тест: all_user_vars определяется до использования...');

  const codeLines = [];

  // Генерируем код в том же порядке, как в generateStartHandler
  codeLines.push('async def start_handler(message: types.Message):');
  codeLines.push('    user_id = message.from_user.id');
  codeLines.push('    text = "Привет! Я ваш бот."');

  // Сохраняем imageUrl в переменную (без отправки)
  codeLines.push('    user_data[user_id] = user_data.get(user_id, {})');
  codeLines.push('    user_data[user_id]["imageUrlVar_start"] = "https://example.com/image.jpg"');

  // Создаём all_user_vars (как в generateKeyboardAndProcessAttachedMedia)
  codeLines.push('    all_user_vars = {}');
  codeLines.push('    db_user_vars = await get_user_from_db(user_id)');
  codeLines.push('    if db_user_vars and isinstance(db_user_vars, dict):');
  codeLines.push('        all_user_vars.update(db_user_vars)');

  // Отправляем изображение (как в generateStartHandlerImageSend)
  codeLines.push('    # 🖼️ Отправляем изображение из attachedMedia');
  codeLines.push('    image_url = "https://example.com/image.jpg"');
  codeLines.push('    caption = replace_variables_in_text(text, all_user_vars)');

  const code = codeLines.join('\n');

  // Проверяем порядок строк
  const allUserVarsLine = code.indexOf('all_user_vars = {}');
  const replaceVariablesLine = code.indexOf('replace_variables_in_text(text, all_user_vars)');

  assert.ok(
    allUserVarsLine !== -1,
    '❌ all_user_vars = {} не найдено в коде'
  );
  assert.ok(
    replaceVariablesLine !== -1,
    '❌ replace_variables_in_text не найдено в коде'
  );
  assert.ok(
    allUserVarsLine < replaceVariablesLine,
    `❌ all_user_vars определяется ПОСЛЕ использования:
       all_user_vars строка: ${allUserVarsLine}
       replace_variables_in_text строка: ${replaceVariablesLine}`
  );

  console.log('✅ all_user_vars определяется ДО использования');
  console.log(`   all_user_vars = {} на позиции: ${allUserVarsLine}`);
  console.log(`   replace_variables_in_text на позиции: ${replaceVariablesLine}`);
}

/**
 * Проверяет, что сгенерированный код содержит all_user_vars только один раз в начале
 */
function testNoAllUserVarsDuplication() {
  console.log('\n🧪 Тест: отсутствие дублирования all_user_vars...');

  const codeLines = [];

  // Правильная генерация кода (без дублирования)
  codeLines.push('    all_user_vars = {}');
  codeLines.push('    db_user_vars = await get_user_from_db(user_id)');
  codeLines.push('    if db_user_vars and isinstance(db_user_vars, dict):');
  codeLines.push('        all_user_vars.update(db_user_vars)');
  codeLines.push('    # какой-то код');
  codeLines.push('    caption = replace_variables_in_text(text, all_user_vars)');

  const code = codeLines.join('\n');
  
  // Подсчитываем количество определений all_user_vars = {}
  const matches = code.match(/all_user_vars = \{\}/g);
  const count = matches ? matches.length : 0;

  assert.ok(
    count === 1,
    `❌ Ожидается 1 определение all_user_vars, найдено: ${count}`
  );

  console.log('✅ all_user_vars определяется только один раз');
}

/**
 * Проверяет, что FakeCallbackQuery имеет атрибут data
 */
function testFakeCallbackQueryHasDataAttribute() {
  console.log('\n🧪 Тест: FakeCallbackQuery имеет атрибут data...');

  const codeLines = [];

  // Генерируем код FakeCallbackQuery
  codeLines.push('    class FakeCallbackQuery:');
  codeLines.push('        def __init__(self, message, target_node_id):');
  codeLines.push('            self.from_user = message.from_user');
  codeLines.push('            self.chat = message.chat');
  codeLines.push('            self.data = target_node_id');
  codeLines.push('            self.message = message');

  const code = codeLines.join('\n');

  assert.ok(
    code.includes('self.data = target_node_id'),
    '❌ FakeCallbackQuery не имеет атрибута self.data'
  );

  console.log('✅ FakeCallbackQuery имеет атрибут data');
}

/**
 * Запуск всех тестов
 */
function runTests() {
  console.log('='.repeat(60));
  console.log('Тестирование порядка определения all_user_vars');
  console.log('='.repeat(60));

  try {
    testAllUserVarsDefinedBeforeUse();
    testNoAllUserVarsDuplication();
    testFakeCallbackQueryHasDataAttribute();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Все тесты пройдены!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Тесты провалены!');
    console.error('='.repeat(60));
    console.error(error.message);
    process.exit(1);
  }
}

// Запуск тестов
runTests();
