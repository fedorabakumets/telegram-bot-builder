import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/routes.ts', 'utf-8');

// Replace the problematic line with the corrected version
const oldLine = '    await bot.edit_message_text(chat_id=sent_message.chat.id, message_id=sent_message.message_id, text=text + " ⚡", reply_markup=inline_keyboard)';
const newLines = `    await message.answer(text, reply_markup=inline_keyboard)
    # Устанавливаем reply клавиатуру отдельным минимальным сообщением
    await message.answer("⚡", reply_markup=reply_keyboard)`;

// Replace all occurrences
content = content.replace(new RegExp(oldLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLines);

// Also need to remove the line that assigns sent_message since we don't need it anymore
content = content.replace(/sent_message = await message.answer\(text, reply_markup=reply_keyboard\)/g, 'await message.answer(text, reply_markup=inline_keyboard)');

// And remove the redundant line after creating inline keyboard
content = content.replace(/# Отправляем основное сообщение с reply клавиатурой\n    await message.answer\(text, reply_markup=inline_keyboard\)/g, '# Отправляем основное сообщение с inline кнопками\n    await message.answer(text, reply_markup=inline_keyboard)');

// Write the file back
fs.writeFileSync('server/routes.ts', content);

console.log('Fixed combined keyboard implementation in server/routes.ts');