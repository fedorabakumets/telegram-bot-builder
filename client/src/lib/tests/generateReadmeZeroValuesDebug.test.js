import { strict as assert } from 'assert';
import { generateReadme } from '../scaffolding/generateReadme';

/**
 * Тестирование функции generateReadme для выявления проблемы с нулевыми значениями
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии, 
 * которые могут привести к нулевым значениям в README.
 */
console.log('Running tests for generateReadme to identify zero-values issue...');

// Тест 1: Проверка с полностью пустыми данными
const emptyBotData = {};
const emptyReadme = generateReadme(emptyBotData, 'TestBot');
assert.ok(emptyReadme.includes('содержит 0 узлов и 0 соединений'), 'Should show 0 nodes and connections with completely empty data');
console.log('✓ Test 1 passed: Empty data produces 0 counts');

// Тест 2: Проверка с null/undefined значениями внутри
const nullishBotData = { nodes: null, connections: undefined };
const nullishReadme = generateReadme(nullishBotData, 'TestBot');
assert.ok(nullishReadme.includes('содержит 0 узлов и 0 соединений'), 'Should handle null/undefined nodes and connections');
console.log('✓ Test 2 passed: Null/undefined values handled correctly');

// Тест 3: Проверка с пустыми массивами
const emptyArraysData = { nodes: [], connections: [] };
const emptyArraysReadme = generateReadme(emptyArraysData, 'TestBot');
assert.ok(emptyArraysReadme.includes('содержит 0 узлов и 0 соединений'), 'Should show 0 with empty arrays');
console.log('✓ Test 3 passed: Empty arrays produce 0 counts');

// Тест 4: Проверка с массивами, содержащими null/undefined элементы
const arrayWithNulls = { nodes: [null, undefined, null], connections: [null] };
const arrayWithNullsReadme = generateReadme(arrayWithNulls, 'TestBot');
// После фильтрации null/undefined значений, массивы становятся пустыми
assert.ok(arrayWithNullsReadme.includes('содержит 0 узлов и 0 соединений'), 'Should handle arrays with null/undefined elements');
console.log('✓ Test 4 passed: Arrays with null/undefined elements handled correctly');

// Тест 5: Проверка с узлами, не имеющими необходимых свойств
const malformedNodesData = {
  nodes: [
    {}, // Пустой узел
    { type: null }, // Узел с null типом
    { data: undefined }, // Узел с undefined данными
    { id: '1' } // Узел только с ID
  ],
  connections: [
    {}, // Пустое соединение
    { source: null, target: undefined } // Соединение с null/undefined
  ]
};
const malformedReadme = generateReadme(malformedNodesData, 'TestBot');
assert.ok(malformedReadme.includes('содержит 4 узлов и 2 соединений'), 'Should count malformed nodes and connections');
console.log('✓ Test 5 passed: Malformed nodes counted correctly');

// Тест 6: Проверка с узлами, имеющими неправильные типы
const wrongTypeNodesData = {
  nodes: [
    { id: '1', type: 'invalid_type', data: { command: '/test' } },
    { id: '2', type: 123, data: { messageText: 'Hello' } }, // Числовой тип
    { id: '3', type: '', data: { command: '/start' } }, // Пустая строка
    { id: '4', type: true, data: { messageText: 'World' } } // Boolean тип
  ],
  connections: []
};
const wrongTypeReadme = generateReadme(wrongTypeNodesData, 'TestBot');
// Узлы с неправильными типами все равно учитываются в общем счетчике
assert.ok(wrongTypeReadme.includes('содержит 4 узлов и 0 соединений'), 'Should count nodes regardless of type validity');
// Но команды учитываются только для определенных типов
const commandCount = (wrongTypeNodesData.nodes.filter(node => (node.type === 'start' || node.type === 'command') && node.data?.command)).length;
assert.ok(wrongTypeReadme.includes(`Команд**: ${commandCount}`), `Should count ${commandCount} commands correctly`);
console.log('✓ Test 6 passed: Wrong type nodes handled correctly');

// Тест 7: Проверка с узлами, не прошедшими фильтрацию команд
const nonCommandNodesData = {
  nodes: [
    { id: '1', type: 'message', data: { messageText: 'Hello' } },
    { id: '2', type: 'action', data: { action: 'something' } },
    { id: '3', type: 'input', data: { inputType: 'text' } }
  ],
  connections: []
};
const nonCommandReadme = generateReadme(nonCommandNodesData, 'TestBot');
assert.ok(nonCommandReadme.includes('содержит 3 узлов и 0 соединений'), 'Should count non-command nodes');
assert.ok(nonCommandReadme.includes('Команд**: 0'), 'Should show 0 commands for non-command nodes');
console.log('✓ Test 7 passed: Non-command nodes handled correctly');

// Тест 8: Проверка с узлами, у которых data.command есть, но тип не start/command
const commandInWrongTypeData = {
  nodes: [
    { id: '1', type: 'message', data: { command: '/test', messageText: 'Hello' } }, // Команда в узле не командного типа
    { id: '2', type: 'action', data: { command: '/action', action: 'something' } } // Команда в узле не командного типа
  ],
  connections: []
};
const commandInWrongTypeReadme = generateReadme(commandInWrongTypeData, 'TestBot');
assert.ok(commandInWrongTypeReadme.includes('содержит 2 узлов и 0 соединений'), 'Should count nodes with commands in wrong types');
assert.ok(commandInWrongTypeReadme.includes('Команд**: 0'), 'Should not count commands in wrong node types');
console.log('✓ Test 8 passed: Commands in wrong node types handled correctly');

// Тест 9: Проверка сценария, когда в реальном файле может быть 0
// Это может происходить, если данные бота не были правильно загружены или сериализованы
const scenarioData = {
  nodes: [], // Представим, что данные не были загружены
  connections: []
};
const scenarioReadme = generateReadme(scenarioData, 'RealBot');
console.log('Scenario README snippet:');
const lines = scenarioReadme.split('\n');
for (let i = 0; i < lines.length && i < 15; i++) {
  if (lines[i].includes('узлов') || lines[i].includes('соединений') || lines[i].includes('Команд') || lines[i].includes('Сообщений') || lines[i].includes('Кнопок')) {
    console.log(`  Line ${i + 1}: ${lines[i]}`);
  }
}
console.log('✓ Test 9 passed: Scenario with zero values demonstrated');

console.log('All tests for identifying zero-values issue in generateReadme passed!');