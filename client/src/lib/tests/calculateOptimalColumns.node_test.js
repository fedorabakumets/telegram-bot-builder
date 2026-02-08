import { calculateOptimalColumns } from '../Keyboard/calculateOptimalColumns.js';

// Тесты для функции calculateOptimalColumns
function runTests() {
  console.log('Запуск тестов для calculateOptimalColumns...\n');

  // Тест 1: Пустой массив кнопок
  console.assert(calculateOptimalColumns([]) === 1, 'Тест 1 не пройден: пустой массив должен возвращать 1');
  console.log('✓ Тест 1 пройден: пустой массив возвращает 1');

  // Тест 2: null/undefined массив
  console.assert(calculateOptimalColumns(null) === 1, 'Тест 2 не пройден: null должен возвращать 1');
  console.assert(calculateOptimalColumns(undefined) === 1, 'Тест 2.1 не пройден: undefined должен возвращать 1');
  console.log('✓ Тест 2 пройден: null/undefined возвращает 1');

  // Тест 3: Множественный выбор - всегда 2 колонки
  const buttons = [{ id: 1 }, { id: 2 }];
  const multiSelectNodeData = { allowMultipleSelection: true };
  console.assert(calculateOptimalColumns(buttons, multiSelectNodeData) === 2, 'Тест 3 не пройден: множественный выбор должен возвращать 2');
  console.log('✓ Тест 3 пройден: множественный выбор возвращает 2');

  // Тест 4: Множественный выбор с большим количеством кнопок
  const manyButtons = Array.from({ length: 10 }, (_, i) => ({ id: i }));
  console.assert(calculateOptimalColumns(manyButtons, multiSelectNodeData) === 2, 'Тест 4 не пройден: множественный выбор с многими кнопками должен возвращать 2');
  console.log('✓ Тест 4 пройден: множественный выбор с многими кнопками возвращает 2');

  // Тест 5: 6 и более кнопок - 2 колонки
  const sixButtons = Array.from({ length: 6 }, (_, i) => ({ id: i }));
  console.assert(calculateOptimalColumns(sixButtons) === 2, 'Тест 5 не пройден: 6 кнопок должны возвращать 2');
  console.log('✓ Тест 5 пройден: 6 кнопок возвращают 2');

  // Тест 6: 7 кнопок - 2 колонки
  const sevenButtons = Array.from({ length: 7 }, (_, i) => ({ id: i }));
  console.assert(calculateOptimalColumns(sevenButtons) === 2, 'Тест 6 не пройден: 7 кнопок должны возвращать 2');
  console.log('✓ Тест 6 пройден: 7 кнопок возвращают 2');

  // Тест 7: 3-5 кнопок - 1 колонка
  const fourButtons = Array.from({ length: 4 }, (_, i) => ({ id: i }));
  console.assert(calculateOptimalColumns(fourButtons) === 1, 'Тест 7 не пройден: 4 кнопки должны возвращать 1');
  console.log('✓ Тест 7 пройден: 4 кнопки возвращают 1');

  // Тест 8: 1-2 кнопки - 1 колонка
  const twoButtons = [{ id: 1 }, { id: 2 }];
  console.assert(calculateOptimalColumns(twoButtons) === 1, 'Тест 8 не пройден: 2 кнопки должны возвращать 1');
  console.log('✓ Тест 8 пройден: 2 кнопки возвращают 1');

  // Тест 9: 1 кнопка - 1 колонка
  const oneButton = [{ id: 1 }];
  console.assert(calculateOptimalColumns(oneButton) === 1, 'Тест 9 не пройден: 1 кнопка должна возвращать 1');
  console.log('✓ Тест 9 пройден: 1 кнопка возвращает 1');

  // Тест 10: Сложные объекты кнопок
  const complexButtons = [
    { id: 'btn1', text: 'Button 1', action: 'goto', target: 'node1' },
    { id: 'btn2', text: 'Button 2', action: 'goto', target: 'node2' },
    { id: 'btn3', text: 'Button 3', action: 'goto', target: 'node3' },
    { id: 'btn4', text: 'Button 4', action: 'goto', target: 'node4' },
    { id: 'btn5', text: 'Button 5', action: 'goto', target: 'node5' },
    { id: 'btn6', text: 'Button 6', action: 'goto', target: 'node6' },
  ];
  console.assert(calculateOptimalColumns(complexButtons) === 2, 'Тест 10 не пройден: 6 сложных кнопок должны возвращать 2');
  console.log('✓ Тест 10 пройден: 6 сложных кнопок возвращают 2');

  // Тест 11: Смешанные свойства кнопок
  const mixedButtons = [
    { id: 'btn1', text: 'Button 1', action: 'goto' },
    { text: 'Button 2', action: 'url', url: 'https://example.com' },
    { id: 'btn3', action: 'command', target: '/help' },
  ];
  console.assert(calculateOptimalColumns(mixedButtons) === 1, 'Тест 11 не пройден: 3 кнопки с разными свойствами должны возвращать 1');
  console.log('✓ Тест 11 пройден: 3 кнопки с разными свойствами возвращают 1');

  // Тест 12: Узел с allowMultipleSelection = false
  const regularNodeData = { allowMultipleSelection: false };
  console.assert(calculateOptimalColumns(sixButtons, regularNodeData) === 2, 'Тест 12 не пройден: 6 кнопок с allowMultipleSelection=false должны возвращать 2');
  console.log('✓ Тест 12 пройден: 6 кнопок с allowMultipleSelection=false возвращают 2');

  // Тест 13: Узел с отсутствующим allowMultipleSelection
  const nodeWithoutProperty = { someOtherProperty: 'value' };
  console.assert(calculateOptimalColumns(fourButtons, nodeWithoutProperty) === 1, 'Тест 13 не пройден: 4 кнопки без allowMultipleSelection должны возвращать 1');
  console.log('✓ Тест 13 пройден: 4 кнопки без allowMultipleSelection возвращают 1');

  // Тест 14: Большие массивы (производительность)
  const largeButtonsArray = Array.from({ length: 100 }, (_, i) => ({ id: i }));
  const startTime = Date.now();
  const result = calculateOptimalColumns(largeButtonsArray);
  const endTime = Date.now();
  console.assert(result === 2, 'Тест 14 не пройден: 100 кнопок должны возвращать 2');
  console.assert(endTime - startTime < 100, 'Тест 14.1 не пройден: функция должна работать быстро');
  console.log('✓ Тест 14 пройден: 100 кнопок возвращают 2 и функция работает быстро');

  // Тест 15: Сценарий с метростанциями
  const metroStationButtons = Array.from({ length: 18 }, (_, i) => ({
    id: `station_${i}`,
    text: `Station ${i}`,
    action: 'selection',
    target: `station_${i}`
  }));
  const metroResult = calculateOptimalColumns(metroStationButtons);
  console.assert(metroResult === 2, 'Тест 15 не пройден: 18 метростанций должны возвращать 2');
  console.log('✓ Тест 15 пройден: 18 метростанций возвращают 2');

  // Тест 16: То же с включенным множественным выбором
  const metroResultMulti = calculateOptimalColumns(metroStationButtons, { allowMultipleSelection: true });
  console.assert(metroResultMulti === 2, 'Тест 16 не пройден: 18 метростанций с множественным выбором должны возвращать 2');
  console.log('✓ Тест 16 пройден: 18 метростанций с множественным выбором возвращают 2');

  // Тест 17: Простое меню с несколькими опциями
  const menuButtons = [
    { id: 'option1', text: 'Option 1', action: 'goto', target: 'node1' },
    { id: 'option2', text: 'Option 2', action: 'goto', target: 'node2' },
    { id: 'option3', text: 'Option 3', action: 'goto', target: 'node3' },
  ];
  const menuResult = calculateOptimalColumns(menuButtons);
  console.assert(menuResult === 1, 'Тест 17 не пройден: 3 опции меню должны возвращать 1');
  console.log('✓ Тест 17 пройден: 3 опции меню возвращают 1');

  // Тест 18: Умеренное количество опций
  const moderateButtons = Array.from({ length: 6 }, (_, i) => ({
    id: `option_${i}`,
    text: `Option ${i}`,
    action: 'goto',
    target: `node_${i}`
  }));
  const moderateResult = calculateOptimalColumns(moderateButtons);
  console.assert(moderateResult === 2, 'Тест 18 не пройден: 6 опций должны возвращать 2');
  console.log('✓ Тест 18 пройден: 6 опций возвращают 2');

  console.log('\n✅ Все тесты для calculateOptimalColumns пройдены успешно!');
}

// Запуск тестов
runTests();