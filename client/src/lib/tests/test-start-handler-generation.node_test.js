const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { generateNodeHandlers } = require('../generate/generate-node-handlers');

// Тест для проверки генерации обработчика start_handler при разных настройках комментариев
describe('Тестирование генерации обработчика start_handler', () => {
  // Тест 1: Проверка генерации при включённых комментариях
  it('должен генерировать start_handler при включённых комментариях', () => {
    const nodes = [
      {
        id: 'start',
        type: 'start',
        data: {
          command: '/start',
          messageText: 'Привет! Это стартовое сообщение.',
          buttons: []
        }
      }
    ];

    const codeWithComments = generateNodeHandlers(nodes, false, true); // enableComments: true
    
    // Проверяем, что в коде присутствует определение start_handler
    assert.ok(
      codeWithComments.includes('@dp.message(CommandStart())'),
      'Код должен содержать декоратор @dp.message(CommandStart()) при включённых комментариях'
    );
    
    assert.ok(
      codeWithComments.includes('async def start_handler'),
      'Код должен содержать определение start_handler при включённых комментариях'
    );
    
    console.log('✓ Тест 1 пройден: start_handler генерируется при включённых комментариях');
  });

  // Тест 2: Проверка генерации при отключённых комментариях
  it('должен генерировать start_handler при отключённых комментариях', () => {
    const nodes = [
      {
        id: 'start',
        type: 'start',
        data: {
          command: '/start',
          messageText: 'Привет! Это стартовое сообщение.',
          buttons: []
        }
      }
    ];

    const codeWithoutComments = generateNodeHandlers(nodes, false, false); // enableComments: false
    
    // Проверяем, что в коде присутствует определение start_handler
    assert.ok(
      codeWithoutComments.includes('@dp.message(CommandStart())'),
      'Код должен содержать декоратор @dp.message(CommandStart()) при отключённых комментариях'
    );
    
    assert.ok(
      codeWithoutComments.includes('async def start_handler'),
      'Код должен содержать определение start_handler при отключённых комментариях'
    );
    
    console.log('✓ Тест 2 пройден: start_handler генерируется при отключённых комментариях');
  });

  // Тест 3: Сравнение кода с комментариями и без
  it('генерация кода должна быть одинаковой за исключением комментариев', () => {
    const nodes = [
      {
        id: 'start',
        type: 'start',
        data: {
          command: '/start',
          messageText: 'Привет! Это стартовое сообщение.',
          buttons: []
        }
      }
    ];

    const codeWithComments = generateNodeHandlers(nodes, false, true);
    const codeWithoutComments = generateNodeHandlers(nodes, false, false);
    
    // Удаляем все строки комментариев из обеих версий
    const removeCommentLines = (code) => {
      return code.split('\n').filter(line => !line.trim().startsWith('#')).join('\n');
    };
    
    const cleanCodeWithComments = removeCommentLines(codeWithComments);
    const cleanCodeWithoutComments = removeCommentLines(codeWithoutComments);
    
    // После удаления комментариев код должен быть одинаковым
    assert.strictEqual(
      cleanCodeWithComments,
      cleanCodeWithoutComments,
      'Код должен быть одинаковым за исключением комментариев'
    );
    
    console.log('✓ Тест 3 пройден: код генерируется одинаково вне зависимости от комментариев');
  });

  // Тест 4: Проверка с несколькими узлами
  it('должен корректно генерировать start_handler среди других узлов', () => {
    const nodes = [
      {
        id: 'start',
        type: 'start',
        data: {
          command: '/start',
          messageText: 'Привет! Это стартовое сообщение.',
          buttons: []
        }
      },
      {
        id: 'help',
        type: 'command',
        data: {
          command: '/help',
          messageText: 'Справка',
          buttons: []
        }
      }
    ];

    const code = generateNodeHandlers(nodes, false, false); // enableComments: false
    
    // Проверяем, что в коде присутствует определение start_handler
    assert.ok(
      code.includes('@dp.message(CommandStart())'),
      'Код должен содержать декоратор @dp.message(CommandStart())'
    );
    
    assert.ok(
      code.includes('async def start_handler'),
      'Код должен содержать определение start_handler'
    );
    
    console.log('✓ Тест 4 пройден: start_handler генерируется корректно среди других узлов');
  });
});

// Запуск тестов
console.log('Запуск тестов генерации обработчика start_handler...\n');

try {
  // Выполнение тестов
  const nodes = [
    {
      id: 'start',
      type: 'start',
      data: {
        command: '/start',
        messageText: 'Привет! Это стартовое сообщение.',
        buttons: []
      }
    }
  ];

  console.log('Тест 1: Проверка генерации при включённых комментариях');
  const codeWithComments = generateNodeHandlers(nodes, false, true);
  assert.ok(codeWithComments.includes('@dp.message(CommandStart())'));
  assert.ok(codeWithComments.includes('async def start_handler'));
  console.log('✓ Тест 1 пройден');

  console.log('Тест 2: Проверка генерации при отключённых комментариях');
  const codeWithoutComments = generateNodeHandlers(nodes, false, false);
  assert.ok(codeWithoutComments.includes('@dp.message(CommandStart())'));
  assert.ok(codeWithoutComments.includes('async def start_handler'));
  console.log('✓ Тест 2 пройден');

  console.log('Тест 3: Сравнение кода с комментариями и без');
  const removeCommentLines = (code) => {
    return code.split('\n').filter(line => !line.trim().startsWith('#')).join('\n');
  };
  
  const cleanCodeWithComments = removeCommentLines(codeWithComments);
  const cleanCodeWithoutComments = removeCommentLines(codeWithoutComments);
  assert.strictEqual(cleanCodeWithComments, cleanCodeWithoutComments);
  console.log('✓ Тест 3 пройден');

  console.log('Тест 4: Проверка с несколькими узлами');
  const multipleNodes = [
    {
      id: 'start',
      type: 'start',
      data: {
        command: '/start',
        messageText: 'Привет! Это стартовое сообщение.',
        buttons: []
      }
    },
    {
      id: 'help',
      type: 'command',
      data: {
        command: '/help',
        messageText: 'Справка',
        buttons: []
      }
    }
  ];
  const codeMultiple = generateNodeHandlers(multipleNodes, false, false);
  assert.ok(codeMultiple.includes('@dp.message(CommandStart())'));
  assert.ok(codeMultiple.includes('async def start_handler'));
  console.log('✓ Тест 4 пройден');

  console.log('\n🎉 Все тесты пройдены успешно!');
} catch (error) {
  console.error('\n❌ Один или несколько тестов не прошли:');
  console.error(error.message);
  process.exit(1);
}