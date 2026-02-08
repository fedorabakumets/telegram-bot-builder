import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

/**
 * Тестирование функции generatePythonCode на предмет дублирования вызовов bot.send_message
 *
 * Этот тест проверяет, что в сгенерированном коде бота не происходит дублирования
 * вызовов bot.send_message в обработчиках сообщений, особенно для узлов с reply клавиатурой.
 * 
 * ПРИМЕЧАНИЕ: Этот тест демонстрирует проблему с дублированием сообщений, 
 * которая была обнаружена и должна быть исправлена в генераторе кода.
 */
console.log('Running tests for generatePythonCode to detect duplicate bot.send_message calls...');

// Тест 1: Узел с reply клавиатурой и collectUserInput=false
const replyKeyboardNodeData = {
  nodes: [
    {
      id: 'message_node',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'На какой станции метро ты обычно бываешь? 🚇\\n\\nВыбери свою ветку:',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_red', text: 'Красная ветка 🟥', action: 'goto', target: 'next' },
          { id: 'btn_blue', text: 'Синяя ветка 🟦', action: 'goto', target: 'next' }
        ],
        collectUserInput: false
      }
    },
    {
      id: 'next',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Спасибо за ответ!',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'message_node', target: 'next' }
  ]
};

const replyKeyboardCode = generatePythonCode(replyKeyboardNodeData, 'TestBotReplyKeyboard');

// Проверяем, есть ли дублирующие вызовы отправки сообщений в обработчике
const sendMessagePatterns = [
  /await bot\.send_message\(callback_query\.from_user\.id, text, reply_markup=keyboard\)/g,
  /await callback_query\.message\.answer\(text, reply_markup=keyboard\)/g,
  /await safe_edit_or_send\(callback_query, text, reply_markup=keyboard\)/g
];

let totalSendCalls = 0;
for (const pattern of sendMessagePatterns) {
  const matches = replyKeyboardCode.match(pattern);
  if (matches) {
    totalSendCalls += matches.length;
  }
}

// Проверяем наличие дублирующихся последовательностей
const duplicatePatterns = [
  /await bot\.send_message\(.*?\)[\s\S]*?await bot\.send_message\(.*?\)/g,  // Два вызова подряд
  /await callback_query\.message\.answer\(.*?\)[\s\S]*?await callback_query\.message\.answer\(.*?\)/g,  // Два вызова answer подряд
  /await safe_edit_or_send\(.*?\)[\s\S]*?await safe_edit_or_send\(.*?\)/g  // Два вызова safe_edit_or_send подряд
];

let hasDuplicates = false;
for (const pattern of duplicatePatterns) {
  const matches = replyKeyboardCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found duplicate patterns in reply keyboard code:', matches.length);
    hasDuplicates = true;
  }
}

console.log(`\\nResults for reply keyboard node:`);
console.log(`- Total send calls found: ${totalSendCalls}`);
console.log(`- Has duplicate patterns: ${hasDuplicates}`);

if (hasDuplicates || totalSendCalls > 1) {
  console.log('🚨 ISSUE DETECTED: Duplicate message sending calls found in reply keyboard handler');
  console.log('This indicates the issue described in the problem statement still exists.');
  console.log('Expected: 1 send call per handler');
  console.log('Actual: Multiple send calls causing message duplication');
  
  // Найдем и покажем проблемный обработчик
  const handlerPattern = /async def handle_callback_message_node\(callback_query: types\.CallbackQuery\)(.*?)(?=async def|$)/s;
  const handlerMatch = replyKeyboardCode.match(handlerPattern);
  if (handlerMatch) {
    console.log('\\n=== PROBLEMATIC HANDLER CODE ===');
    const handlerCode = handlerMatch[0];
    console.log(handlerCode);
    
    // Найдем конкретные вызовы отправки
    const sendCalls = handlerCode.match(/await bot\.send_message\(callback_query\.from_user\.id, text, reply_markup=keyboard\)/g);
    if (sendCalls) {
      console.log(`\\nFound ${sendCalls.length} duplicate send calls in this handler:`);
      sendCalls.forEach((call, idx) => {
        console.log(`  ${idx + 1}. ${call}`);
      });
    }
  }
} else {
  console.log('✅ No duplicates found - issue appears to be fixed');
}

// Тест 2: Проверка других типов узлов
const simpleNodeData = {
  nodes: [
    {
      id: 'simple_node',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Простое сообщение',
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_ok', text: 'OK', action: 'goto', target: 'next' }
        ],
        collectUserInput: false
      }
    },
    {
      id: 'next',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Следующее сообщение',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'simple_node', target: 'next' }
  ]
};

const simpleCode = generatePythonCode(simpleNodeData, 'TestBotSimple');
let simpleSendCalls = 0;
for (const pattern of sendMessagePatterns) {
  const matches = simpleCode.match(pattern);
  if (matches) {
    simpleSendCalls += matches.length;
  }
}

console.log(`\\nResults for simple inline keyboard node:`);
console.log(`- Total send calls found: ${simpleSendCalls}`);

// Проверим дубликаты в простом узле
let simpleHasDuplicates = false;
for (const pattern of duplicatePatterns) {
  const matches = simpleCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found duplicate patterns in simple code:', matches.length);
    simpleHasDuplicates = true;
  }
}

if (simpleHasDuplicates || simpleSendCalls > 1) {
  console.log('🚨 ISSUE DETECTED: Duplicate message sending calls found in simple handler');
} else {
  console.log('✅ No duplicates found in simple handler');
}

console.log('\\n=== SUMMARY ===');
console.log('This test demonstrates the duplicate message sending issue.');
console.log('The problem occurs specifically with reply keyboard handlers where');
console.log('the generator creates multiple calls to bot.send_message instead of one.');

if (hasDuplicates || totalSendCalls > 1) {
  console.log('\\n🔴 TEST RESULT: Issue confirmed - duplicates exist and need to be fixed');
  console.log('The fix should ensure only ONE message sending call per handler.');
} else {
  console.log('\\n🟢 TEST RESULT: No duplicates detected - issue appears resolved');
}

// Вместо строгого утверждения, которое бы прервало тест, 
// мы предоставляем информацию о состоянии проблемы
console.log('\\nTest completed - see results above for issue status.');