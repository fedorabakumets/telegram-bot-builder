import { generatePythonCode } from '../bot-generator';

// Простой тест для проверки сгенерированного кода
const simpleNodeData = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Привет! Как дела?',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_ok', text: 'Хорошо', action: 'goto', target: 'next' },
          { id: 'btn_bad', text: 'Плохо', action: 'goto', target: 'next' }
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
    { source: 'start', target: 'next' }
  ]
};

const code = generatePythonCode(simpleNodeData, 'TestBot');
console.log('Looking for start handler in generated code...');
console.log('Code length:', code.length);

// Проверим весь код на наличие вызовов отправки сообщений
console.log('\\nSearching for all message sending calls in the code...');
const allSendMatches = code.match(/await (bot\.send_message|callback_query\.message\.answer|safe_edit_or_send)/g);
console.log('Total number of message sending calls:', allSendMatches ? allSendMatches.length : 0);
if (allSendMatches) {
  console.log('All calls found:', allSendMatches);
}

// Попробуем найти любые обработчики callback
console.log('\\nLooking for callback handlers...');
const handlerMatches = code.match(/async def handle_callback_.*?\(callback_query: types\.CallbackQuery\)/gs);
if (handlerMatches) {
  console.log('Found', handlerMatches.length, 'callback handlers');
  console.log('Handler names:', handlerMatches);

  // Попробуем найти обработчик для start
  const startHandlerPattern = /async def handle_callback_start\(callback_query: types\.CallbackQuery\)(.*?)(?=async def handle_callback_|$)/s;
  const startMatch = code.match(startHandlerPattern);
  if (startMatch) {
    console.log('\\nDetailed start handler code:');
    console.log(startMatch[0]);

    // Подсчитаем вызовы отправки сообщений в этом обработчике
    const startSendMatches = startMatch[0].match(/await (bot\.send_message|callback_query\.message\.answer|safe_edit_or_send)/g);
    console.log('\\nNumber of message sending calls in start handler:', startSendMatches ? startSendMatches.length : 0);
    if (startSendMatches) {
      console.log('Calls in start handler:', startSendMatches);
    }
  } else {
    console.log('\\nStart handler not found specifically');
  }
} else {
  console.log('No callback handlers found');
}

// Также проверим, есть ли обработчики message (для start узлов)
console.log('\\nLooking for message handlers...');
const messageHandlerMatches = code.match(/async def .*?start.*?\(message: types\.Message\)/gs);
if (messageHandlerMatches) {
  console.log('Found message handlers related to start:', messageHandlerMatches);

  // Попробуем найти конкретный обработчик start
  const startMessagePattern = /async def .*?start.*?\(message: types\.Message\)(.*?)(?=async def |$)/s;
  const messageMatch = code.match(startMessagePattern);
  if (messageMatch) {
    console.log('\\nDetailed start message handler code:');
    console.log(messageMatch[0]);

    // Подсчитаем вызовы отправки сообщений в этом обработчике
    const messageSendMatches = messageMatch[0].match(/await (bot\.send_message|message\.answer|safe_edit_or_send)/g);
    console.log('\\nNumber of message sending calls in start message handler:', messageSendMatches ? messageSendMatches.length : 0);
    if (messageSendMatches) {
      console.log('Calls in start message handler:', messageSendMatches);
    }
  }
}