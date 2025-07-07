// Скрипт для исправления серверного генератора inline кнопок
const fs = require('fs');

console.log('Исправляем серверный генератор...');

let content = fs.readFileSync('server/routes.ts', 'utf8');

// Исправляем логику генерации inline кнопок
const oldPattern = /else \{\s*code \+= `\s*builder\.add\(InlineKeyboardButton\(text="\$\{button\.text\}", callback_data="\$\{button\.target\}"\)\)\s*`;\s*\}/g;

const newPattern = `else if (button.target && button.target.trim() !== "") {
            code += \`    builder.add(InlineKeyboardButton(text="\${button.text}", callback_data="\${button.target}"))
\`;
          } else {
            code += \`    # Кнопка "\${button.text}" пропущена - нет target
\`;
          }`;

content = content.replace(oldPattern, newPattern);

fs.writeFileSync('server/routes.ts', content);
console.log('✅ Серверный генератор исправлен!');