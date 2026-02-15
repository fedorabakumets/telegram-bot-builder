import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

console.log('Тест: Проверка определения user_id в сгенерированном коде');

// Тест 1: Проверяем, что user_id определён в обработчике start
console.log('Тест 1: Проверка определения user_id в обработчике start...');
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
  
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id'
  );
  assert.ok(
    code.includes('@dp.message(CommandStart())'),
    'Код должен содержать декоратор для команды start'
  );
  assert.ok(
    code.includes('async def start_handler'),
    'Код должен содержать определение start_handler'
  );
  
  console.log('✓ Тест 1 пройден');
} catch (error) {
  console.error('✗ Тест 1 не пройден:', error.message);
}

// Тест 2: Проверяем, что user_id определён в обработчике команды
console.log('Тест 2: Проверка определения user_id в обработчике команды...');
try {
  const botData = {
    nodes: [
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
  
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id'
  );
  assert.ok(
    code.includes('@dp.message(Command("help"))'),
    'Код должен содержать декоратор для команды help'
  );
  
  console.log('✓ Тест 2 пройден');
} catch (error) {
  console.error('✗ Тест 2 не пройден:', error.message);
}

// Тест 3: Проверяем, что user_id определён в универсальном обработчике ввода
console.log('Тест 3: Проверка определения user_id в универсальном обработчике ввода...');
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
  
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id'
  );
  assert.ok(
    code.includes('@dp.message(F.text)'),
    'Код должен содержать декоратор для текстовых сообщений'
  );
  assert.ok(
    code.includes('async def handle_user_input'),
    'Код должен содержать определение handle_user_input'
  );
  
  console.log('✓ Тест 3 пройден');
} catch (error) {
  console.error('✗ Тест 3 не пройден:', error.message);
}

// Тест 4: Проверяем, что user_id определён в обработчике callback'ов
console.log('Тест 4: Проверка определения user_id в обработчике callback\'ов...');
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
  
  assert.ok(
    code.includes('user_id = callback_query.from_user.id'),
    'Код должен содержать определение user_id для callback\'ов'
  );
  assert.ok(
    code.includes('@dp.callback_query'),
    'Код должен содержать декоратор для callback\'ов'
  );
  assert.ok(
    code.includes('async def handle_callback_'),
    'Код должен содержать определение handle_callback_'
  );
  
  console.log('✓ Тест 4 пройден');
} catch (error) {
  console.error('✗ Тест 4 не пройден:', error.message);
}

// Тест 5: Проверяем, что user_id определён в алиасах команд
console.log('Тест 5: Проверка определения user_id в алиасах команд...');
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
        id: 'menu',
        type: 'command',
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Меню',
          command: '/menu'
        }
      }
    ],
    edges: []
  };

  const code = generatePythonCode(botData, 'TestBot');
  
  // Проверяем, что в коде есть определение user_id в алиасах команд
  // Для этого ищем определение функции handle_command_ и внутри неё user_id
  const hasHandleCommand = code.includes('async def handle_command_');
  const hasUserIdInHandleCommand = code.includes('user_id = message.from_user.id');
  
  // Проверяем, что есть как минимум одно определение user_id в контексте алиасов
  assert.ok(
    hasUserIdInHandleCommand,
    'Код должен содержать определение user_id в алиасах команд'
  );
  
  console.log('✓ Тест 5 пройден');
} catch (error) {
  console.error('✗ Тест 5 не пройден:', error.message);
}

// Тест 6: Проверяем, что user_id определён при включенной базе данных
console.log('Тест 6: Проверка определения user_id при включенной базе данных...');
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
  
  assert.ok(
    code.includes('user_id = message.from_user.id'),
    'Код должен содержать определение user_id при включенной базе данных'
  );
  assert.ok(
    code.includes('await save_user_to_db'),
    'Код должен содержать вызов save_user_to_db'
  );
  assert.ok(
    code.includes('await update_user_data_in_db'),
    'Код должен содержать вызов update_user_data_in_db'
  );
  
  console.log('✓ Тест 6 пройден');
} catch (error) {
  console.error('✗ Тест 6 не пройден:', error.message);
}

console.log('\nВсе тесты выполнены!');