import { strict as assert } from 'assert';
import { generateUniqueShortId } from '../format/generateUniqueShortId';

/**
 * Тестирование функции generateUniqueShortId
 * 
 * Эта функция генерирует уникальный короткий идентификатор для узла.
 */
console.log('Running tests for generateUniqueShortId...');

// Тест 1: Узел интересов
const interestsId = generateUniqueShortId('user_profile_interests', []);
assert.strictEqual(interestsId, 'user_p', 'Interests node should return prefix substring');

// Тест 2: Обычный узел без конфликтов
const normalId = generateUniqueShortId('node_1234567890', []);
assert.strictEqual(normalId, '1234567890', 'Normal node without conflicts should return last 10 chars');

// Тест 3: Узел с коротким ID
const shortId = generateUniqueShortId('node_123', []);
assert.strictEqual(shortId, 'node_123', 'Short node ID should return as is');

// Тест 4: Узел с ведущими подчеркиваниями
const underscoreId = generateUniqueShortId('___node_1234567890', []);
assert.strictEqual(underscoreId, '1234567890', 'Node with leading underscores should return last 10 chars after removing leading underscores from that substring');

// Тест 5: Узел с конфликтующим ID
const conflictingId = generateUniqueShortId('node_1234567890', ['other_node_1234567890']);
assert.notStrictEqual(conflictingId, '1234567890', 'Conflicting node should return different ID');
assert.ok(conflictingId.length <= 8, 'Conflicting node should return max 8 chars');
assert.ok(/^[a-zA-Z0-9]+$/.test(conflictingId), 'Conflicting node should return alphanumeric only');

// Тест 6: Узел с символами, не проходящими фильтр (без конфликта)
const specialCharsId = generateUniqueShortId('node_abc123!@#', []);
assert.ok(specialCharsId.includes('!@#'), 'Node with special chars should return last chars as is when no conflict');

// Тест 7: Пустой ID
const emptyId = generateUniqueShortId('', []);
assert.strictEqual(emptyId, 'node', 'Empty node ID should return default value');

// Тест 8: Узел интересов с длинным префиксом
const longInterestsId = generateUniqueShortId('very_long_prefix_for_interests', []);
assert.strictEqual(longInterestsId, 'very_l', 'Long interests prefix should be truncated to 6 chars');

// Тест 9: Узел интересов с коротким префиксом
const shortInterestsId = generateUniqueShortId('a_interests', []);
assert.strictEqual(shortInterestsId, 'a', 'Short interests prefix should return as is');

// Тест 10: Узел с конфликтом и специальными символами
// Создадим конфликт: обе строки имеют одинаковые последние 10 символов
const conflictWithSpecial = generateUniqueShortId('prefix1_node_1234567890', ['prefix2_node_1234567890']);
assert.ok(/^[a-zA-Z0-9]+$/.test(conflictWithSpecial), 'Conflicting node with special chars should return alphanumeric only');
assert.ok(conflictWithSpecial.length <= 8, 'Conflicting node should return max 8 chars');

console.log('All tests for generateUniqueShortId passed!');