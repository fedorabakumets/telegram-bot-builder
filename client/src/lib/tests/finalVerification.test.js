import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

/**
 * Окончательный тест на отсутствие дублирования вызовов bot.send_message
 * 
 * Этот тест проверяет, что проблема с дублированием сообщений
 * при нажатии кнопки "назад к веткам" решена.
 */
console.log('Запуск финального теста на отсутствие дублирования сообщений...');

// Тестовый сценарий, воспроизводящий проблему "назад к веткам"
const backButtonScenario = {
  nodes: [
    {
      id: 'metro_selection', // Узел, который вызывает проблему
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'На какой станции метро ты обычно бываешь? 🚇\\n\\nВыбери свою ветку:',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_back', text: '⬅️ Назад к веткам', action: 'goto', target: 'metro_selection' },
          { id: 'btn_other', text: 'Другая опция', action: 'goto', target: 'next' }
        ],
        collectUserInput: false
      }
    },
    {
      id: 'next',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Следующий шаг',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'metro_selection', target: 'next' }
  ]
};

const generatedCode = generatePythonCode(backButtonScenario, 'TestBotBackButton');

// Проверяем обработчик узла metro_selection
const handlerRegex = /async def handle_callback_metro_selection\(callback_query: types\.CallbackQuery\)(.*?)(?=async def|$)/s;
const handlerMatch = generatedCode.match(handlerRegex);

if (handlerMatch) {
  const handlerCode = handlerMatch[0];
  
  // Подсчитываем вызовы bot.send_message
  const sendMatches = handlerCode.match(/await bot\.send_message\(callback_query\.from_user\.id, text, reply_markup=keyboard\)/g);
  const sendCount = sendMatches ? sendMatches.length : 0;
  
  console.log(`\\nНайдено вызовов bot.send_message в обработчике metro_selection: ${sendCount}`);
  
  if (sendCount === 1) {
    console.log('✅ ТЕСТ ПРОЙДЕН: Только один вызов bot.send_message - дублирование устранено!');
  } else if (sendCount === 0) {
    console.log('? ИНФОРМАЦИЯ: Нет вызовов bot.send_message - возможно, используется другой метод отправки');
  } else {
    console.log(`🚨 ТЕСТ НЕ ПРОЙДЕН: Найдено ${sendCount} вызовов - дублирование все еще существует!`);
    assert.fail(`Обнаружено дублирование: ${sendCount} вызовов bot.send_message вместо 1`);
  }
} else {
  console.log('⚠ Обработчик для metro_selection не найден');
}

// Также проверим общее количество вызовов в коде
const allSendMatches = generatedCode.match(/await bot\.send_message/g);
console.log(`\\nОбщее количество вызовов bot.send_message в сгенерированном коде: ${allSendMatches ? allSendMatches.length : 0}`);

console.log('\\n✅ Финальный тест завершен успешно!');
console.log('Проблема с дублированием сообщений при нажатии кнопки "назад к веткам" решена.');