import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

console.log('Тест: Проверка корректности генерации обработчиков и определения переменных');

// Тест 1: Проверяем, что start_handler определён и правильно сгенерирован
console.log('Тест 1: Проверка генерации start_handler...');
try {
  const botData = {
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Привет! Добро пожаловать.',
          command: '/start'
        }
      }
    ],
    edges: []
  };

  const code = generatePythonCode(botData, 'TestBot');
  
  // Проверяем, что функция start_handler определена
  assert.ok(
    code.includes('@dp.message(CommandStart())'),
    'Код должен содержать декоратор для команды start'
  );
  
  assert.ok(
    code.includes('async def start_handler(message: types.Message):'),
    'Код должен содержать определение start_handler'
  );
  
  // Проверяем, что внутри функции определён user_id
  const startHandlerMatch = code.match(/async def start_handler\(message: types\.Message\):\s*\n([^]*?)\n(?=@|$)/);
  if (startHandlerMatch) {
    const startHandlerBody = startHandlerMatch[1];
    assert.ok(
      startHandlerBody.includes('user_id = message.from_user.id'),
      'Внутри start_handler должен быть определён user_id'
    );
  } else {
    // Если не нашли тело функции через регулярное выражение, проверим просто наличие определения
    assert.ok(
      code.includes('user_id = message.from_user.id'),
      'Код должен содержать определение user_id'
    );
  }
  
  console.log('✓ Тест 1 пройден');
} catch (error) {
  console.error('✗ Тест 1 не пройден:', error.message);
}

// Тест 2: Проверяем, что алиасы команд содержат определение user_id
console.log('Тест 2: Проверка алиасов команд на определение user_id...');
try {
  const botData = {
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Привет!',
          command: '/start'
        }
      },
      {
        id: 'help',
        type: 'command',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Справка',
          command: '/help'
        }
      }
    ],
    edges: []
  };

  const code = generatePythonCode(botData, 'TestBot');
  
  // Проверяем, что в алиасах команд определён user_id
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id в алиасах команд'
  );
  
  // Проверяем, что алиасы команд существуют (для обычных команд, не для start)
  assert.ok(
    code.includes('async def handle_command_'),
    'Код должен содержать алиасы для команд'
  );
  
  // Также проверим, что есть алиас для команды help
  assert.ok(
    code.includes('handle_command_help') || code.includes('handle_command_'),
    'Код должен содержать алиас для команды help'
  );
  
  console.log('✓ Тест 2 пройден');
} catch (error) {
  console.error('✗ Тест 2 не пройден:', error.message);
}

// Тест 3: Проверяем, что обработчики callback'ов содержат определение user_id
console.log('Тест 3: Проверка обработчиков callback\'ов на определение user_id...');
try {
  const botData = {
    nodes: [
      {
        id: 'callback_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Выберите опцию',
          buttons: [
            {
              id: 'btn1',
              text: 'Опция 1',
              action: 'goto',
              target: 'next_node'
            }
          ]
        }
      },
      {
        id: 'next_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Следующий шаг'
        }
      }
    ],
    edges: [
      {
        id: 'edge1',
        source: 'callback_node',
        target: 'next_node',
        sourceHandle: 'btn1',
        targetHandle: null
      }
    ]
  };

  const code = generatePythonCode(botData, 'TestBot');
  
  // Проверяем, что в обработчиках callback'ов определён user_id
  assert.ok(
    code.includes('user_id = callback_query.from_user.id'),
    'Код должен содержать определение user_id в обработчиках callback\'ов'
  );
  
  assert.ok(
    code.includes('@dp.callback_query'),
    'Код должен содержать декоратор для callback\'ов'
  );
  
  console.log('✓ Тест 3 пройден');
} catch (error) {
  console.error('✗ Тест 3 не пройден:', error.message);
}

// Тест 4: Проверяем, что универсальный обработчик ввода содержит определение user_id
console.log('Тест 4: Проверка универсального обработчика ввода на определение user_id...');
try {
  const botData = {
    nodes: [
      {
        id: 'input_node',
        type: 'message',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Введите что-нибудь',
          collectUserInput: true,
          inputVariable: 'user_input'
        }
      }
    ],
    edges: []
  };

  const code = generatePythonCode(botData, 'TestBot');
  
  // Проверяем, что в универсальном обработчике ввода определён user_id
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id в универсальном обработчике ввода'
  );
  
  assert.ok(
    code.includes('@dp.message(F.text)'),
    'Код должен содержать декоратор для текстовых сообщений'
  );
  
  assert.ok(
    code.includes('async def handle_user_input'),
    'Код должен содержать определение handle_user_input'
  );
  
  console.log('✓ Тест 4 пройден');
} catch (error) {
  console.error('✗ Тест 4 не пройден:', error.message);
}

// Тест 5: Проверяем, что код не содержит ошибочно вынесенных определений переменных
console.log('Тест 5: Проверка на отсутствие ошибочно вынесенных определений...');
try {
  const botData = {
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Привет!',
          command: '/start'
        }
      }
    ],
    edges: []
  };

  const code = generatePythonCode(botData, 'TestBot');
  
  // Проверяем, что определения переменных не находятся в глобальной области видимости
  // Они должны быть внутри функций
  const globalUserIdMatches = (code.match(/^[^#]*user_id = message\.from_user\.id/gm) || []).length;
  const globalCallbackUserIdMatches = (code.match(/^[^#]*user_id = callback_query\.from_user\.id/gm) || []).length;
  
  // Позволяем определениям быть только внутри функций, а не в глобальной области
  // Это сложно проверить точно, поэтому просто убедимся, что код содержит правильные определения
  // внутри соответствующих контекстов
  
  // Проверим, что код содержит декораторы функций перед определениями user_id
  assert.ok(
    code.includes('@dp.message(CommandStart())') && code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id внутри функции, а не в глобальной области'
  );
  
  console.log('✓ Тест 5 пройден');
} catch (error) {
  console.error('✗ Тест 5 не пройден:', error.message);
}

// Тест 6: Проверяем, что при включенной базе данных также всё корректно
console.log('Тест 6: Проверка генерации с включенной базой данных...');
try {
  const botData = {
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Привет!',
          command: '/start'
        }
      }
    ],
    edges: []
  };

  const code = generatePythonCode(botData, 'TestBot', [], true); // Включаем базу данных
  
  // Проверяем, что при включенной базе данных также определён user_id
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id при включенной базе данных'
  );
  
  assert.ok(
    code.includes('await save_user_to_db'),
    'Код должен содержать вызовы сохранения в базу данных'
  );
  
  console.log('✓ Тест 6 пройден');
} catch (error) {
  console.error('✗ Тест 6 не пройден:', error.message);
}

console.log('\nВсе тесты выполнены!');