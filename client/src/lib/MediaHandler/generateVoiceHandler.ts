import { generateButtonText } from '../Keyboard/generateButtonText';
import { Node } from '@shared/schema';

export function generateVoiceHandler(node: Node): string {
  let code = `\n# Обработчик голосового сообщения для узла ${node.id}\n`;

  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `voice_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');

    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;

    code += `    logging.info(f"Команда голосового сообщения ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;

    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const voiceUrl = node.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const duration = node.data.duration || 10;

    code += `    voice_url = "${voiceUrl}"\n`;
    code += `    duration = ${duration}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем голосовое сообщение\n';
    code += '        await message.answer_voice(voice_url, duration=duration)\n';

    // Добавляем кнопки после голосового сообщения если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после голосового сообщения\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }

    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить голосовое сообщение")\n';
  }

  return code;
}
