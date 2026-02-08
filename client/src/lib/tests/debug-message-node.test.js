import { generatePythonCode } from '../bot-generator';

// Тест для проверки узла с типом 'message' и reply клавиатурой
const messageNodeData = {
  nodes: [
    {
      id: 'message_node',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'На какой станции метро ты обычно бываешь? 🚇\\n\\nВыбери свою ветку:',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_red', text: 'Красная ветка 🟥', action: 'goto', target: 'red_line' },
          { id: 'btn_blue', text: 'Синяя ветка 🟦', action: 'goto', target: 'blue_line' }
        ],
        collectUserInput: false
      }
    },
    {
      id: 'red_line',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Красная ветка',
        keyboardType: 'none'
      }
    },
    {
      id: 'blue_line',
      type: 'message',
      position: { x: 400, y: 0 },
      data: {
        messageText: 'Синяя ветка',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'message_node', target: 'red_line' },
    { source: 'message_node', target: 'blue_line' }
  ]
};

const code = generatePythonCode(messageNodeData, 'TestBot');
console.log('Looking for message_node handler in generated code...');
console.log('Code length:', code.length);

// Проверим весь код на наличие вызовов отправки сообщений
console.log('\\nSearching for all message sending calls in the code...');
const allSendMatches = code.match(/await (bot\.send_message|callback_query\.message\.answer|safe_edit_or_send|message\.answer)/g);
console.log('Total number of message sending calls:', allSendMatches ? allSendMatches.length : 0);
if (allSendMatches) {
  console.log('All calls found:', allSendMatches);
}

// Попробуем найти обработчики callback
console.log('\\nLooking for callback handlers...');
const handlerMatches = code.match(/async def handle_callback_.*?\(callback_query: types\.CallbackQuery\)/gs);
if (handlerMatches) {
  console.log('Found', handlerMatches.length, 'callback handlers');
  console.log('Handler names:', handlerMatches);
  
  // Попробуем найти обработчик для message_node
  const messageNodePattern = /async def handle_callback_message_node\(callback_query: types\.CallbackQuery\)(.*?)(?=async def handle_callback_|$)/s;
  const messageNodeMatch = code.match(messageNodePattern);
  if (messageNodeMatch) {
    console.log('\\nDetailed message_node handler code:');
    console.log(messageNodeMatch[0]);
    
    // Подсчитаем вызовы отправки сообщений в этом обработчике
    const sendMatches = messageNodeMatch[0].match(/await (bot\.send_message|callback_query\.message\.answer|safe_edit_or_send)/g);
    console.log('\\nNumber of message sending calls in message_node handler:', sendMatches ? sendMatches.length : 0);
    if (sendMatches) {
      console.log('Calls in message_node handler:', sendMatches);
      
      // Проверим, есть ли дубликаты
      if (sendMatches.length > 1) {
        console.log('🚨 FOUND DUPLICATES in message_node handler!');
      } else {
        console.log('✅ NO DUPLICATES in message_node handler');
      }
    }
  } else {
    console.log('\\nmessage_node handler not found specifically');
  }
} else {
  console.log('No callback handlers found');
}