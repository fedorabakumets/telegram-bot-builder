/**
 * @fileoverview Примеры использования keyboardLayout
 *
 * Этот файл демонстрирует как работают функции keyboardLayout.
 * Можно использовать как шпаргалку при разработке.
 *
 * @module lib/bot-generator/Keyboard/EXAMPLES
 */

// ===== migrateKeyboardLayout =====
// Автоматическое создание keyboardLayout для узла

import { migrateKeyboardLayout } from '@/components/editor/properties/utils/migrate-keyboard-layout';

const buttons = [
  { id: 'btn1' },
  { id: 'btn2' },
  { id: 'btn3' },
  { id: 'btn4' },
  { id: 'btn5' }
];

// Пример 1: Создание новой раскладки
const _layout1 = migrateKeyboardLayout(buttons, undefined, 2);
// Результат:
// {
//   rows: [
//     { buttonIds: ['btn1', 'btn2'] },
//     { buttonIds: ['btn3', 'btn4'] },
//     { buttonIds: ['btn5'] }
//   ],
//   columns: 2,
//   autoLayout: true
// }

// Пример 2: Сохранение существующей раскладки
const existingLayout = {
  rows: [{ buttonIds: ['btn1', 'btn2', 'btn3'] }],
  columns: 3,
  autoLayout: false
};
const _layout2 = migrateKeyboardLayout(buttons, existingLayout);
// Результат: existingLayout (без изменений)

// Пример 3: Пустая раскладка
const _layout3 = migrateKeyboardLayout([], undefined, 2);
// Результат: { rows: [], columns: 2, autoLayout: true }


// ===== generateAdjustCode =====
// Генерация Python-кода для builder.adjust()

import { generateAdjustCode } from '@lib/bot-generator/Keyboard/generateKeyboardLayoutCode';

// Пример 1: Авто-раскладка
const autoLayout = { rows: [], columns: 2, autoLayout: true };
const _code1 = generateAdjustCode(autoLayout, 4);
// Результат: "builder.adjust(2)\n"

// Пример 2: Ручная раскладка с разным количеством кнопок в рядах
const manualLayout = {
  rows: [
    { buttonIds: ['btn1', 'btn2'] },
    { buttonIds: ['btn3', 'btn4', 'btn5'] },
    { buttonIds: ['btn6'] }
  ],
  columns: 2,
  autoLayout: false
};
const _code2 = generateAdjustCode(manualLayout, 6);
// Результат: "builder.adjust(2, 3, 1)\n"


// ===== getAdjustCode =====
// Универсальная функция для получения builder.adjust()

import { getAdjustCode } from '@lib/bot-generator/Keyboard/getAdjustCode';

// Пример 1: С keyboardLayout
const nodeData1 = {
  keyboardType: 'inline',
  keyboardLayout: {
    rows: [{ buttonIds: ['btn1', 'btn2'] }],
    columns: 2,
    autoLayout: false
  }
};
const _code3 = getAdjustCode([{ id: 'btn1' }, { id: 'btn2' }], nodeData1, '    ');
// Результат: "    builder.adjust(2)"

// Пример 2: Без keyboardLayout (fallback на calculateOptimalColumns)
const nodeData2 = {
  keyboardType: 'inline',
  allowMultipleSelection: true
};
const _code4 = getAdjustCode(
  [{ id: 'btn1' }, { id: 'btn2' }, { id: 'btn3' }, { id: 'btn4' }],
  nodeData2,
  ''
);
// Результат: "builder.adjust(2)" (2 колонки для мультивыбора)

// Пример 3: С отступами
const _code5 = getAdjustCode([{ id: 'btn1' }], nodeData1, '        ');
// Результат: "        builder.adjust(2)"


// ===== Интеграция в генератор =====
// Как используется в generateKeyboard.ts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _generateKeyboard(_node) {
  let code = '';

  // Генерация кнопок
  _node.data.buttons.forEach((_button) => {
    code += `    builder.add(KeyboardButton(text="${_button.text}"))\n`;
  });

  // Использование keyboardLayout
  code += `    ${getAdjustCode(_node.data.buttons, _node.data)}\n`;
  code += `    keyboard = builder.as_markup()\n`;

  return code;
}

// Пример результата для ручной раскладки (2, 3, 1):
//     builder.add(KeyboardButton(text="Кнопка 1"))
//     builder.add(KeyboardButton(text="Кнопка 2"))
//     builder.add(KeyboardButton(text="Кнопка 3"))
//     builder.add(KeyboardButton(text="Кнопка 4"))
//     builder.add(KeyboardButton(text="Кнопка 5"))
//     builder.add(KeyboardButton(text="Кнопка 6"))
//     builder.adjust(2, 3, 1)
//     keyboard = builder.as_markup()
