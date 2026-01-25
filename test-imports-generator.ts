/**
 * Тест генератора импортов
 */

import { generateImportsAndHeaders } from './client/src/lib/bot-generator/core/imports-generator';

// Тестовые данные
const testBotData = {
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      data: {
        messageText: 'Привет! Это тестовый бот.',
        keyboardType: 'inline' as const,
        buttons: [
          {
            id: 'btn-1',
            text: 'Начать',
            type: 'inline' as const,
            action: 'goto',
            target: 'message-1'
          }
        ]
      }
    },
    {
      id: 'message-1', 
      type: 'message',
      data: {
        messageText: 'Это второе сообщение',
        keyboardType: 'none' as const,
        buttons: []
      }
    }
  ],
  connections: [
    {
      id: 'conn-1',
      source: 'start-1',
      target: 'message-1',
      data: {}
    }
  ]
};

console.log('🧪 Тестируем генератор импортов...');

try {
  const result = generateImportsAndHeaders(
    testBotData,
    'ТестовыйБот',
    [],
    true, // включаем базу данных
    123,  // ID проекта
    true  // включаем логирование
  );
  
  console.log('✅ Генерация прошла успешно!');
  console.log('📏 Размер сгенерированного кода:', result.length, 'символов');
  console.log('📄 Первые 500 символов:');
  console.log(result.substring(0, 500));
  console.log('...');
  
} catch (error) {
  console.error('❌ Ошибка при тестировании:', error.message);
  console.error(error.stack);
}