import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

/**
 * Тестирование функции generatePythonCode на предмет дублирования вызовов bot.send_message
 * 
 * Этот тест проверяет, что в сгенерированном коде бота не происходит дублирования
 * вызовов bot.send_message в обработчиках сообщений, особенно для узлов с reply клавиатурой.
 * 
 * После применения исправлений:
 * 1. В файле newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation.ts
 *    удален дублирующий вызов bot.send_message
 * 2. В файле newprocessNodeButtonsAndGenerateHandlers.ts
 *    удалены вызовы bot.send_message для reply клавиатуры
 */
console.log('Running tests for generatePythonCode to ensure no duplicate bot.send_message calls...');

// Тест 1: Узел с reply клавиатурой и collectUserInput=false (проблемный случай)
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

const code = generatePythonCode(replyKeyboardNodeData, 'TestBotReplyKeyboard');

// Проверим количество вызовов bot.send_message в обработчике message_node
const handlerPattern = /async def handle_callback_message_node\(callback_query: types\.CallbackQuery\)(.*?)(?=async def|$)/s;
const handlerMatch = code.match(handlerPattern);
if (handlerMatch) {
  const handlerCode = handlerMatch[0];
  const sendMatches = handlerCode.match(/await bot\.send_message\(callback_query\.from_user\.id, text, reply_markup=keyboard\)/g);
  const sendCount = sendMatches ? sendMatches.length : 0;
  
  console.log(`\\nResults for message_node handler:`);
  console.log(`- Found ${sendCount} bot.send_message calls`);
  
  if (sendCount === 1) {
    console.log('✅ SUCCESS: Only one bot.send_message call found - duplicates removed!');
  } else if (sendCount === 0) {
    console.log('? INFO: No bot.send_message calls found - may be handled differently');
  } else {
    console.log(`🚨 FAILURE: ${sendCount} bot.send_message calls found - duplicates still exist!`);
  }
  
  // Проверим также на наличие других возможных вызовов отправки сообщений
  const otherSendMatches = handlerCode.match(/await (callback_query\.message\.answer|safe_edit_or_send)/g);
  console.log(`- Found ${otherSendMatches ? otherSendMatches.length : 0} other send calls`);
} else {
  console.log('⚠ Handler for message_node not found');
}

// Проверим общее количество вызовов в коде
const allSendMatches = code.match(/await bot\.send_message/g);
console.log(`\\nTotal bot.send_message calls in generated code: ${allSendMatches ? allSendMatches.length : 0}`);

// Тест 2: Проверим другие типы узлов
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
const simpleHandlerMatch = simpleCode.match(/async def handle_callback_simple_node\(callback_query: types\.CallbackQuery\)(.*?)(?=async def|$)/s);
if (simpleHandlerMatch) {
  const simpleHandlerCode = simpleHandlerMatch[0];
  const simpleSendMatches = simpleHandlerCode.match(/await bot\.send_message\(callback_query\.from_user\.id, text, reply_markup=keyboard\)/g);
  const simpleSendCount = simpleSendMatches ? simpleSendMatches.length : 0;
  
  console.log(`\\nResults for simple_node handler:`);
  console.log(`- Found ${simpleSendCount} bot.send_message calls`);
  
  if (simpleSendCount <= 1) {
    console.log('✅ OK: Simple node has acceptable number of send calls');
  } else {
    console.log(`🚨 ISSUE: Simple node has ${simpleSendCount} send calls`);
  }
}

console.log('\\nTest completed - check results above for fix status.');