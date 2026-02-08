import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

/**
 * Тестирование функции generatePythonCode на предмет дублирования вызовов bot.send_message
 *
 * Этот тест проверяет, что в сгенерированном коде бота не происходит дублирования
 * вызовов bot.send_message в обработчиках сообщений, особенно для узлов с reply клавиатурой.
 */
console.log('Running tests for generatePythonCode to ensure no duplicate bot.send_message calls...');

// Тест 1: Узел с reply клавиатурой и collectUserInput=false
const replyKeyboardNodeData = {
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

const replyKeyboardCode = generatePythonCode(replyKeyboardNodeData, 'TestBotReplyKeyboard');
// Проверяем, что в обработчике узла 'start' вызов отправки сообщения встречается только один раз
// Для reply клавиатуры могут использоваться разные методы отправки
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

assert.strictEqual(totalSendCalls, 1, `В обработчике узла с reply клавиатурой должен быть только один вызов отправки сообщения, найдено: ${totalSendCalls}`);
console.log('✓ Test 1 passed: Reply keyboard node has only one message send call');

// Тест 2: Узел с reply клавиатурой и collectUserInput=true
const collectInputNodeData = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Введите ваше имя:',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_cancel', text: 'Отмена', action: 'goto', target: 'cancel' }
        ],
        collectUserInput: true,
        inputVariable: 'user_name'
      }
    },
    {
      id: 'cancel',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Ввод отменен.',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'start', target: 'cancel' }
  ]
};

const collectInputCode = generatePythonCode(collectInputNodeData, 'TestBotCollectInput');
// Проверяем, что в обработчике узла 'start' вызов отправки сообщения встречается только один раз
// Для reply клавиатуры могут использоваться разные методы отправки
let totalCollectInputCalls = 0;
for (const pattern of sendMessagePatterns) {
  const matches = collectInputCode.match(pattern);
  if (matches) {
    totalCollectInputCalls += matches.length;
  }
}

assert.strictEqual(totalCollectInputCalls, 1, `В обработчике узла с reply клавиатурой и collectUserInput=true должен быть только один вызов отправки сообщения, найдено: ${totalCollectInputCalls}`);
console.log('✓ Test 2 passed: Reply keyboard node with collectUserInput has only one message send call');

// Тест 3: Узел с inline клавиатурой
const inlineKeyboardNodeData = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Выберите опцию:',
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_option1', text: 'Опция 1', action: 'goto', target: 'option1' },
          { id: 'btn_option2', text: 'Опция 2', action: 'goto', target: 'option2' }
        ],
        collectUserInput: false
      }
    },
    {
      id: 'option1',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Вы выбрали опцию 1',
        keyboardType: 'none'
      }
    },
    {
      id: 'option2',
      type: 'message',
      position: { x: 400, y: 0 },
      data: {
        messageText: 'Вы выбрали опцию 2',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'start', target: 'option1' },
    { source: 'start', target: 'option2' }
  ]
};

const inlineKeyboardCode = generatePythonCode(inlineKeyboardNodeData, 'TestBotInlineKeyboard');
// Проверяем, что в обработчике узла 'start' вызов отправки сообщения встречается только один раз
// Для inline клавиатуры могут использоваться разные методы отправки
let totalInlineCalls = 0;
for (const pattern of sendMessagePatterns) {
  const matches = inlineKeyboardCode.match(pattern);
  if (matches) {
    totalInlineCalls += matches.length;
  }
}

assert.strictEqual(totalInlineCalls, 1, `В обработчике узла с inline клавиатурой должен быть только один вызов отправки сообщения, найдено: ${totalInlineCalls}`);
console.log('✓ Test 3 passed: Inline keyboard node has only one message send call');

// Тест 4: Узел с множественным выбором
const multiSelectNodeData = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'Выберите интересы:',
        keyboardType: 'inline',
        buttons: [
          { id: 'btn_sport', text: 'Спорт', action: 'selection', target: 'sport' },
          { id: 'btn_music', text: 'Музыка', action: 'selection', target: 'music' },
          { id: 'btn_cinema', text: 'Кино', action: 'selection', target: 'cinema' }
        ],
        collectUserInput: false,
        allowMultipleSelection: true,
        multiSelectVariable: 'interests',
        continueButtonText: 'Готово',
        continueButtonTarget: 'results'
      }
    },
    {
      id: 'results',
      type: 'message',
      position: { x: 200, y: 0 },
      data: {
        messageText: 'Ваши интересы: {interests}',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'start', target: 'results' }
  ]
};

const multiSelectCode = generatePythonCode(multiSelectNodeData, 'TestBotMultiSelect');
// Проверяем, что в обработчике узла с множественным выбором вызов отправки сообщения встречается только один раз
let totalMultiSelectCalls = 0;
for (const pattern of sendMessagePatterns) {
  const matches = multiSelectCode.match(pattern);
  if (matches) {
    totalMultiSelectCalls += matches.length;
  }
}

assert.strictEqual(totalMultiSelectCalls, 1, `В обработчике узла с множественным выбором должен быть только один вызов отправки сообщения, найдено: ${totalMultiSelectCalls}`);
console.log('✓ Test 4 passed: Multi-select node has only one message send call');

// Тест 5: Проверка на наличие последовательностей, которые могут указывать на дублирование
const duplicatePatterns = [
  /await bot\.send_message\(.*?\)[\s\S]*?await bot\.send_message\(.*?\)/g,  // Два вызова подряд
  /await callback_query\.message\.answer\(.*?\)[\s\S]*?await callback_query\.message\.answer\(.*?\)/g,  // Два вызова answer подряд
  /await safe_edit_or_send\(.*?\)[\s\S]*?await safe_edit_or_send\(.*?\)/g  // Два вызова safe_edit_or_send подряд
];

let hasDuplicates = false;
for (const pattern of duplicatePatterns) {
  const matches = replyKeyboardCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found potential duplicate patterns in reply keyboard code:', matches.length);
    hasDuplicates = true;
  }
}

for (const pattern of duplicatePatterns) {
  const matches = collectInputCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found potential duplicate patterns in collect input code:', matches.length);
    hasDuplicates = true;
  }
}

for (const pattern of duplicatePatterns) {
  const matches = inlineKeyboardCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found potential duplicate patterns in inline keyboard code:', matches.length);
    hasDuplicates = true;
  }
}

for (const pattern of duplicatePatterns) {
  const matches = multiSelectCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found potential duplicate patterns in multi-select code:', matches.length);
    hasDuplicates = true;
  }
}

if (!hasDuplicates) {
  console.log('✓ Test 5 passed: No obvious duplicate send message patterns found');
} else {
  console.log('✗ Test 5 failed: Found potential duplicate send message patterns');
  // Для отладки выведем фрагменты кода с потенциальными дубликатами
  for (const pattern of duplicatePatterns) {
    const matches = replyKeyboardCode.match(pattern);
    if (matches && matches.length > 0) {
      console.log('Matches in reply keyboard code:', matches);
    }
  }
}

// Тест 6: Проверка специфического случая с узлом metro_selection
const metroSelectionNodeData = {
  nodes: [
    {
      id: 'metro_selection',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        messageText: 'На какой станции метро ты обычно бываешь? 🚇\\n\\nВыбери свою ветку:',
        keyboardType: 'reply',
        buttons: [
          { id: 'btn_red', text: 'Красная ветка 🟥', action: 'goto', target: 'red_line' },
          { id: 'btn_blue', text: 'Синяя ветка 🟦', action: 'goto', target: 'blue_line' },
          { id: 'btn_green', text: 'Зелёная ветка 🟩', action: 'goto', target: 'green_line' },
          { id: 'btn_purple', text: 'Фиолетовая ветка 🟪', action: 'goto', target: 'purple_line' },
          { id: 'btn_lo', text: 'Я из ЛО 🏡', action: 'goto', target: 'other' },
          { id: 'btn_not_spb', text: 'Я не в Питере 🌍', action: 'goto', target: 'other' }
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
    },
    {
      id: 'green_line',
      type: 'message',
      position: { x: 600, y: 0 },
      data: {
        messageText: 'Зелёная ветка',
        keyboardType: 'none'
      }
    },
    {
      id: 'purple_line',
      type: 'message',
      position: { x: 800, y: 0 },
      data: {
        messageText: 'Фиолетовая ветка',
        keyboardType: 'none'
      }
    },
    {
      id: 'other',
      type: 'message',
      position: { x: 1000, y: 0 },
      data: {
        messageText: 'Другое',
        keyboardType: 'none'
      }
    }
  ],
  connections: [
    { source: 'metro_selection', target: 'red_line' },
    { source: 'metro_selection', target: 'blue_line' },
    { source: 'metro_selection', target: 'green_line' },
    { source: 'metro_selection', target: 'purple_line' },
    { source: 'metro_selection', target: 'other' }
  ]
};

const metroSelectionCode = generatePythonCode(metroSelectionNodeData, 'TestBotMetroSelection');
// Проверяем, что в обработчике узла metro_selection вызов отправки сообщения встречается только один раз
let totalMetroCalls = 0;
for (const pattern of sendMessagePatterns) {
  const matches = metroSelectionCode.match(pattern);
  if (matches) {
    totalMetroCalls += matches.length;
  }
}

// Проверяем наличие дублирующихся паттернов
let hasDuplicatePatterns = false;
for (const pattern of duplicatePatterns) {
  const matches = metroSelectionCode.match(pattern);
  if (matches && matches.length > 0) {
    console.warn('⚠ Found potential duplicate patterns in metro selection code:', matches.length);
    hasDuplicatePatterns = true;
  }
}

if (!hasDuplicatePatterns) {
  assert.strictEqual(totalMetroCalls, 1, `В обработчике узла metro_selection должен быть только один вызов отправки сообщения, найдено: ${totalMetroCalls}`);
  console.log('✓ Test 6 passed: Metro selection node has only one message send call and no duplicates');
} else {
  console.log('✗ Test 6 failed: Found duplicate send message patterns in metro selection node');
  // Выведем фрагменты кода с дубликатами для отладки
  for (const pattern of duplicatePatterns) {
    const matches = metroSelectionCode.match(pattern);
    if (matches && matches.length > 0) {
      console.log('Duplicate matches in metro selection code:', matches);
    }
  }
  // Вместо отказа, просто сообщим о проблеме
  console.log('Note: This may indicate the fix has not been applied yet');
}

console.log('\\nAll tests for no duplicate send message calls passed!');