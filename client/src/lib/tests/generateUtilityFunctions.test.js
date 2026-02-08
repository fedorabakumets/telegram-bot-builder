import { strict as assert } from 'assert';
import { generateUtilityFunctions } from '../generate/generateUtilityFunctions';

/**
 * Тестирование функции generateUtilityFunctions
 * 
 * Эта функция генерирует код утилитарных функций для бота.
 */
console.log('Running tests for generateUtilityFunctions...');

// Тест 1: Генерация без базы данных пользователей
const codeWithoutDB = generateUtilityFunctions(false);
assert.ok(codeWithoutDB.includes('# Утилитарные функции'), 'Should include header comment');
assert.ok(codeWithoutDB.includes('async def check_auth(user_id: int) -> bool:'), 'Should include simple auth check without DB');
assert.ok(codeWithoutDB.includes('return user_id in user_data'), 'Should include simple auth check logic');
assert.ok(!codeWithoutDB.includes('get_user_from_db'), 'Should not include DB functions when DB is disabled');

// Тест 2: Генерация с базой данных пользователей
const codeWithDB = generateUtilityFunctions(true);
assert.ok(codeWithDB.includes('# Утилитарные функции'), 'Should include header comment');
assert.ok(codeWithDB.includes('async def check_auth(user_id: int) -> bool:'), 'Should include auth check with DB');
assert.ok(codeWithDB.includes('get_user_from_db'), 'Should include DB functions when DB is enabled');
assert.ok(codeWithDB.includes('user = await get_user_from_db(user_id)'), 'Should include DB user check logic');

// Тест 3: Проверка наличия обязательных функций
assert.ok(codeWithoutDB.includes('async def is_admin(user_id: int) -> bool:'), 'Should include is_admin function');
assert.ok(codeWithoutDB.includes('async def is_private_chat(message: types.Message) -> bool:'), 'Should include is_private_chat function');
assert.ok(codeWithoutDB.includes('def get_user_variables(user_id):'), 'Should include get_user_variables function');

// Тест 4: Проверка содержания функции is_admin
assert.ok(codeWithoutDB.includes('return user_id in ADMIN_IDS'), 'is_admin function should check against ADMIN_IDS');

// Тест 5: Проверка содержания функции is_private_chat
assert.ok(codeWithoutDB.includes('message.chat.type == "private"'), 'is_private_chat function should check chat type');

// Тест 6: Проверка содержания функции get_user_variables
assert.ok(codeWithoutDB.includes('return user_data.get(user_id, {})'), 'get_user_variables should return user data from storage');

// Тест 7: Сравнение кода с и без БД
assert.notStrictEqual(codeWithoutDB, codeWithDB, 'Code with and without DB should be different');

console.log('All tests for generateUtilityFunctions passed!');