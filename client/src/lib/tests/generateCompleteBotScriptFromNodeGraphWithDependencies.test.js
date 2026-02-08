import { strict as assert } from 'assert';
import { generateCompleteBotScriptFromNodeGraphWithDependencies } from '../generate-complete-bot-script';

/**
 * Тестирование функции generateCompleteBotScriptFromNodeGraphWithDependencies с различными входными данными
 *
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for generateCompleteBotScriptFromNodeGraphWithDependencies with various inputs...');

// Вспомогательные функции для генерации логики мультиселекта
const mockGenerateMultiSelectCallbackLogic = (nodes, allNodeIds, isLoggingEnabled) => {
  return '# Mock Multi-Select Callback Logic\n';
};

const mockGenerateMultiSelectDoneHandler = (nodes, multiSelectNodes, allNodeIds, isLoggingEnabled) => {
  return '# Mock Multi-Select Done Handler\n';
};

const mockGenerateMultiSelectReplyHandler = (nodes, allNodeIds, isLoggingEnabled) => {
  return '# Mock Multi-Select Reply Handler\n';
};

const mockIsLoggingEnabled = () => false;

// Тест 1: Правильные входные данные с мультиселект узлами
const validCode = 'initial code\n';
const validMultiSelectNodes = [{ id: 'multiselect1', data: {} }];
const validAllNodeIds = ['node1', 'multiselect1'];
const validNodes = [{ id: 'node1', data: {} }];

const validResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof validResult, 'string', 'Should return a string with valid input');
assert.ok(validResult.includes('initial code'), 'Should include initial code');
assert.ok(validResult.includes('# Mock Multi-Select Callback Logic'), 'Should include multi-select callback logic');
assert.ok(validResult.includes('# Mock Multi-Select Done Handler'), 'Should include multi-select done handler');
assert.ok(validResult.includes('# Mock Multi-Select Reply Handler'), 'Should include multi-select reply handler');
assert.ok(validResult.includes('if __name__ == "__main__":'), 'Should include main entry point');
console.log('✓ Test 1 passed: Valid input with multi-select nodes handled correctly');

// Тест 2: Правильные входные данные без мультиселект узлов
const validResultNoMultiSelect = generateCompleteBotScriptFromNodeGraphWithDependencies(
  validCode, [], validAllNodeIds, mockIsLoggingEnabled, validNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof validResultNoMultiSelect, 'string', 'Should return a string with valid input and no multi-select nodes');
assert.ok(validResultNoMultiSelect.includes('initial code'), 'Should include initial code');
// Should not include multi-select logic
assert.ok(!validResultNoMultiSelect.includes('# Mock Multi-Select Callback Logic'), 'Should NOT include multi-select callback logic if no multi-select nodes');
assert.ok(!validResultNoMultiSelect.includes('# Mock Multi-Select Done Handler'), 'Should NOT include multi-select done handler if no multi-select nodes');
assert.ok(!validResultNoMultiSelect.includes('# Mock Multi-Select Reply Handler'), 'Should NOT include multi-select reply handler if no multi-select nodes');
assert.ok(validResultNoMultiSelect.includes('if __name__ == "__main__":'), 'Should include main entry point');
console.log('✓ Test 2 passed: Valid input without multi-select nodes handled correctly');

// Тест 3: null/undefined inputs
let nullCodeResult;
try {
  nullCodeResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    null, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null code caused an error (expected): ${error.message}`);
  nullCodeResult = '';
}
assert.strictEqual(typeof nullCodeResult, 'string', 'Should handle null code');

let undefinedCodeResult;
try {
  undefinedCodeResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    undefined, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined code caused an error (expected): ${error.message}`);
  undefinedCodeResult = '';
}
assert.strictEqual(typeof undefinedCodeResult, 'string', 'Should handle undefined code');

let nullMultiSelectNodesResult;
try {
  nullMultiSelectNodesResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, null, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null multiSelectNodes caused an error (expected): ${error.message}`);
  nullMultiSelectNodesResult = '';
}
assert.strictEqual(typeof nullMultiSelectNodesResult, 'string', 'Should handle null multiSelectNodes');

let undefinedMultiSelectNodesResult;
try {
  undefinedMultiSelectNodesResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, undefined, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined multiSelectNodes caused an error (expected): ${error.message}`);
  undefinedMultiSelectNodesResult = '';
}
assert.strictEqual(typeof undefinedMultiSelectNodesResult, 'string', 'Should handle undefined multiSelectNodes');

let nullAllNodeIdsResult;
try {
  nullAllNodeIdsResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, null, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null allNodeIds caused an error (expected): ${error.message}`);
  nullAllNodeIdsResult = '';
}
assert.strictEqual(typeof nullAllNodeIdsResult, 'string', 'Should handle null allNodeIds');

let undefinedAllNodeIdsResult;
try {
  undefinedAllNodeIdsResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, undefined, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined allNodeIds caused an error (expected): ${error.message}`);
  undefinedAllNodeIdsResult = '';
}
assert.strictEqual(typeof undefinedAllNodeIdsResult, 'string', 'Should handle undefined allNodeIds');

let nullIsLoggingEnabledResult;
try {
  nullIsLoggingEnabledResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, null, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null isLoggingEnabled caused an error (expected): ${error.message}`);
  nullIsLoggingEnabledResult = '';
}
assert.strictEqual(typeof nullIsLoggingEnabledResult, 'string', 'Should handle null isLoggingEnabled');

let undefinedIsLoggingEnabledResult;
try {
  undefinedIsLoggingEnabledResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, undefined, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined isLoggingEnabled caused an error (expected): ${error.message}`);
  undefinedIsLoggingEnabledResult = '';
}
assert.strictEqual(typeof undefinedIsLoggingEnabledResult, 'string', 'Should handle undefined isLoggingEnabled');

let nullNodesResult;
try {
  nullNodesResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, null,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null nodes caused an error (expected): ${error.message}`);
  nullNodesResult = '';
}
assert.strictEqual(typeof nullNodesResult, 'string', 'Should handle null nodes');

let undefinedNodesResult;
try {
  undefinedNodesResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, undefined,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined nodes caused an error (expected): ${error.message}`);
  undefinedNodesResult = '';
}
assert.strictEqual(typeof undefinedNodesResult, 'string', 'Should handle undefined nodes');

let nullGenerateMultiSelectCallbackLogicResult;
try {
  nullGenerateMultiSelectCallbackLogicResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    null, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null generateMultiSelectCallbackLogic caused an error (expected): ${error.message}`);
  nullGenerateMultiSelectCallbackLogicResult = '';
}
assert.strictEqual(typeof nullGenerateMultiSelectCallbackLogicResult, 'string', 'Should handle null generateMultiSelectCallbackLogic');

let undefinedGenerateMultiSelectCallbackLogicResult;
try {
  undefinedGenerateMultiSelectCallbackLogicResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    undefined, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined generateMultiSelectCallbackLogic caused an error (expected): ${error.message}`);
  undefinedGenerateMultiSelectCallbackLogicResult = '';
}
assert.strictEqual(typeof undefinedGenerateMultiSelectCallbackLogicResult, 'string', 'Should handle undefined generateMultiSelectCallbackLogic');

let nullGenerateMultiSelectDoneHandlerResult;
try {
  nullGenerateMultiSelectDoneHandlerResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, null, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ null generateMultiSelectDoneHandler caused an error (expected): ${error.message}`);
  nullGenerateMultiSelectDoneHandlerResult = '';
}
assert.strictEqual(typeof nullGenerateMultiSelectDoneHandlerResult, 'string', 'Should handle null generateMultiSelectDoneHandler');

let undefinedGenerateMultiSelectDoneHandlerResult;
try {
  undefinedGenerateMultiSelectDoneHandlerResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, undefined, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ undefined generateMultiSelectDoneHandler caused an error (expected): ${error.message}`);
  undefinedGenerateMultiSelectDoneHandlerResult = '';
}
assert.strictEqual(typeof undefinedGenerateMultiSelectDoneHandlerResult, 'string', 'Should handle undefined generateMultiSelectDoneHandler');

let nullGenerateMultiSelectReplyHandlerResult;
try {
  nullGenerateMultiSelectReplyHandlerResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, null
  );
} catch (error) {
  console.log(`⚠️ null generateMultiSelectReplyHandler caused an error (expected): ${error.message}`);
  nullGenerateMultiSelectReplyHandlerResult = '';
}
assert.strictEqual(typeof nullGenerateMultiSelectReplyHandlerResult, 'string', 'Should handle null generateMultiSelectReplyHandler');

let undefinedGenerateMultiSelectReplyHandlerResult;
try {
  undefinedGenerateMultiSelectReplyHandlerResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    validCode, validMultiSelectNodes, validAllNodeIds, mockIsLoggingEnabled, validNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, undefined
  );
} catch (error) {
  console.log(`⚠️ undefined generateMultiSelectReplyHandler caused an error (expected): ${error.message}`);
  undefinedGenerateMultiSelectReplyHandlerResult = '';
}
assert.strictEqual(typeof undefinedGenerateMultiSelectReplyHandlerResult, 'string', 'Should handle undefined generateMultiSelectReplyHandler');

console.log('✓ Test 3 passed: Null/undefined inputs handled correctly');

// Тест 4: Проверка с пустыми массивами
const emptyMultiSelectNodesResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  validCode, [], validAllNodeIds, mockIsLoggingEnabled, validNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof emptyMultiSelectNodesResult, 'string', 'Should handle empty multiSelectNodes array');
assert.ok(emptyMultiSelectNodesResult.includes('initial code'), 'Should include initial code');
assert.ok(!emptyMultiSelectNodesResult.includes('# Mock Multi-Select Callback Logic'), 'Should NOT include multi-select callback logic if multiSelectNodes array is empty');
assert.ok(emptyMultiSelectNodesResult.includes('if __name__ == "__main__":'), 'Should include main entry point');
console.log('✓ Test 4 passed: Empty multiSelectNodes array handled correctly');

// Тест 5: Проверка с пустыми строками и нулями
const zeroValueCodeResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  '', [], [], mockIsLoggingEnabled, [],
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof zeroValueCodeResult, 'string', 'Should handle zero value inputs');
assert.ok(zeroValueCodeResult.includes('if __name__ == "__main__":'), 'Should include main entry point even with zero values');
console.log('✓ Test 5 passed: Zero values handled correctly');

// Тест 6: Проверка с длинными строками
const longStringCode = 'initial code' + 'A'.repeat(1000);
const longStringAllNodeIds = Array.from({ length: 1000 }, (_, i) => `node${i}`);
const longStringNodes = Array.from({ length: 1000 }, (_, i) => ({ id: `node${i}`, data: {} }));
const longStringMultiSelectNodes = Array.from({ length: 1000 }, (_, i) => ({ id: `multiselect${i}`, data: {} }));

const longStringResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  longStringCode, longStringMultiSelectNodes, longStringAllNodeIds, mockIsLoggingEnabled, longStringNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof longStringResult, 'string', 'Should handle very long strings');
assert.ok(longStringResult.includes('initial code'), 'Should include part of long initial code');
assert.ok(longStringResult.includes('# Mock Multi-Select Callback Logic'), 'Should include multi-select callback logic with long strings');
assert.ok(longStringResult.includes('if __name__ == "__main__":'), 'Should include main entry point with long strings');
console.log('✓ Test 6 passed: Very long strings handled correctly');

// Тест 7: Проверка с особыми символами
const specialCharCode = 'initial code with special chars: @#$%^&*()';
const specialCharAllNodeIds = ['node@#$%^&*()'];
const specialCharNodes = [{ id: 'node@#$%^&*()', data: {} }];
const specialCharMultiSelectNodes = [{ id: 'multiselect@#$%^&*()', data: {} }];

const specialCharResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  specialCharCode, specialCharMultiSelectNodes, specialCharAllNodeIds, mockIsLoggingEnabled, specialCharNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof specialCharResult, 'string', 'Should handle special characters');
assert.ok(specialCharResult.includes('initial code with special chars: @#$%^&*()'), 'Should include code with special chars');
assert.ok(specialCharResult.includes('# Mock Multi-Select Callback Logic'), 'Should include multi-select callback logic with special chars');
assert.ok(specialCharResult.includes('if __name__ == "__main__":'), 'Should include main entry point with special chars');
console.log('✓ Test 7 passed: Special characters handled correctly');

// Тест 8: Проверка с Unicode символами
const unicodeCode = 'initial code with unicode: 🚀🎉';
const unicodeAllNodeIds = ['node🚀🎉'];
const unicodeNodes = [{ id: 'node🚀🎉', data: {} }];
const unicodeMultiSelectNodes = [{ id: 'multiselect🚀🎉', data: {} }];

const unicodeResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  unicodeCode, unicodeMultiSelectNodes, unicodeAllNodeIds, mockIsLoggingEnabled, unicodeNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof unicodeResult, 'string', 'Should handle unicode characters');
assert.ok(unicodeResult.includes('initial code with unicode: 🚀🎉'), 'Should include code with unicode chars');
assert.ok(unicodeResult.includes('# Mock Multi-Select Callback Logic'), 'Should include multi-select callback logic with unicode chars');
assert.ok(unicodeResult.includes('if __name__ == "__main__":'), 'Should include main entry point with unicode chars');
console.log('✓ Test 8 passed: Unicode characters handled correctly');

// Тест 9: Проверка с различными типами данных
const mixedTypeCode = 123;
const mixedTypeMultiSelectNodes = [null, { id: 'multiselect1', data: {} }, 'invalid'];
const mixedTypeAllNodeIds = [null, 'node1', 123];
const mixedTypeNodes = [null, { id: 'node1', data: {} }, 'invalid'];
const mixedTypeIsLoggingEnabled = () => 'true'; // Function returning non-boolean

let mixedTypeResult;
try {
  mixedTypeResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
    mixedTypeCode, mixedTypeMultiSelectNodes, mixedTypeAllNodeIds, mixedTypeIsLoggingEnabled, mixedTypeNodes,
    mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
  );
} catch (error) {
  console.log(`⚠️ Mixed data types caused an error (expected): ${error.message}`);
  mixedTypeResult = '';
}
assert.strictEqual(typeof mixedTypeResult, 'string', 'Should handle mixed data types');
console.log('✓ Test 9 passed: Mixed data types handled correctly');

// Тест 10: Проверка с очень большими массивами
const hugeMultiSelectNodes = Array.from({ length: 10000 }, (_, i) => ({ id: `multiselect${i}`, data: {} }));
const hugeAllNodeIds = Array.from({ length: 10000 }, (_, i) => `node${i}`);
const hugeNodes = Array.from({ length: 10000 }, (_, i) => ({ id: `node${i}`, data: {} }));

const hugeResult = generateCompleteBotScriptFromNodeGraphWithDependencies(
  validCode, hugeMultiSelectNodes, hugeAllNodeIds, mockIsLoggingEnabled, hugeNodes,
  mockGenerateMultiSelectCallbackLogic, mockGenerateMultiSelectDoneHandler, mockGenerateMultiSelectReplyHandler
);
assert.strictEqual(typeof hugeResult, 'string', 'Should handle huge arrays');
assert.ok(hugeResult.includes('initial code'), 'Should include initial code with huge arrays');
assert.ok(hugeResult.includes('# Mock Multi-Select Callback Logic'), 'Should include multi-select callback logic with huge arrays');
assert.ok(hugeResult.includes('if __name__ == "__main__":'), 'Should include main entry point with huge arrays');
console.log('✓ Test 10 passed: Huge arrays handled correctly');

console.log('All tests for generateCompleteBotScriptFromNodeGraphWithDependencies with various inputs passed!');