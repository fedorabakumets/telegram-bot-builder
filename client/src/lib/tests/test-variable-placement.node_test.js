import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

console.log('Тест: Проверка на отсутствие определений переменных вне функций');

// Тест: Проверяем, что код не содержит определений переменных вне функций
console.log('Тест: Проверка корректного размещения определений переменных...');
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
      },
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
  
  // Проверим, что определения user_id находятся внутри функций, а не в глобальной области
  // Для этого проверим, что перед каждым определением user_id есть декоратор функции или def
  
  // Разобьем код на строки для анализа
  const lines = code.split('\n');
  
  let insideFunction = false;
  let foundUserIdOutsideFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Проверяем, начинается ли строка с декоратора функции
    if (line.startsWith('@dp.')) {
      insideFunction = true;
      continue;
    }
    
    // Проверяем, начинается ли строка с определения функции
    if (line.startsWith('async def ') || line.startsWith('def ')) {
      insideFunction = true;
      continue;
    }
    
    // Проверяем, заканчивается ли функция (по встрече с новым декоратором или def до отступа)
    if ((line.startsWith('@dp.') || line.startsWith('async def ') || line.startsWith('def ')) && !insideFunction) {
      insideFunction = true;
      continue;
    }
    
    // Если встречаем пустую строку или комментарий, не выходим из функции
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    
    // Если строка не пустая и не комментарий, и мы не внутри функции, и она содержит определение user_id
    if (!insideFunction && line.includes('user_id =')) {
      foundUserIdOutsideFunction = true;
      break;
    }
    
    // Если встречаем строку с отступом, значит мы внутри функции
    if (lines[i].startsWith('    ') || lines[i].startsWith('\t')) {
      insideFunction = true;
    }
    
    // Если встречаем строку без отступа после функции, возможно выходим из неё
    // Но это сложнее определить, поэтому просто проверим основные случаи
    
    // Сбросим флаг, если встречаем декоратор или определение функции
    if (line.startsWith('@dp.') || line.startsWith('async def ') || line.startsWith('def ')) {
      insideFunction = true;
    } else if (line !== '' && !line.startsWith('#') && !line.startsWith('    ') && !line.startsWith('\t')) {
      // Если строка не пустая, не комментарий и не с отступом, возможно мы вне функции
      // Но это не всегда так, так как могут быть и другие конструкции
      // Проверим только конкретные случаи
      if (line.includes('user_id =') && 
          !line.includes('@dp.') && 
          !line.includes('async def') && 
          !line.includes('def ')) {
        // Проверим, есть ли перед этим ближайшая функция
        let hasFunctionBefore = false;
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (lines[j].trim().startsWith('@dp.') || lines[j].trim().startsWith('async def ') || lines[j].trim().startsWith('def ')) {
            hasFunctionBefore = true;
            break;
          }
          if (lines[j].trim().startsWith('class ') || lines[j].trim().includes('if __name__')) {
            break; // Дошли до начала блока, функция не найдена
          }
        }
        if (!hasFunctionBefore) {
          foundUserIdOutsideFunction = true;
        }
      }
    }
  }
  
  assert.ok(
    !foundUserIdOutsideFunction,
    'Определения user_id не должны находиться вне функций'
  );
  
  // Также проверим, что код содержит правильные функции
  assert.ok(
    code.includes('@dp.message(CommandStart())'),
    'Код должен содержать декоратор для команды start'
  );
  
  assert.ok(
    code.includes('async def start_handler'),
    'Код должен содержать определение start_handler'
  );
  
  assert.ok(
    code.includes('async def handle_user_input'),
    'Код должен содержать определение handle_user_input'
  );
  
  console.log('✓ Тест пройден');
} catch (error) {
  console.error('✗ Тест не пройден:', error.message);
}

console.log('\nТест завершен!');