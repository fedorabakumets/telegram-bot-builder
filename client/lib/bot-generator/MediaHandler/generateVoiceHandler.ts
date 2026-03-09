import { generateButtonText } from '../format/generateButtonText';
import { Node } from '@shared/schema';

export function generateVoiceHandler(node: Node): string {
  let code = `\n# Обработчик голосового сообщения для узла ${node.id}\n`;

  // Генерируем имя функции на основе ID узла, а не команды
  const functionName = `handle_node_${node.id.replace(/-/g, '_')}`.replace(/[^a-zA-Z0-9_]/g, '_');

  code += `async def ${functionName}(message: types.Message):\n`;

  // Добавляем логирование
  code += `    logging.info(f"Обработка голосового сообщения узла ${node.id} пользователем {message.from_user.id}")\n`;

  // Проверки безопасности (если они определены в данных узла)
  if (node.data?.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Этот узел доступен только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data?.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для доступа к этому узлу")\n';
    code += '        return\n';
  }

  // Получаем параметры голосового сообщения
  const voiceUrl = node.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
  const duration = node.data.duration || 10;

  code += `    voice_url = "${voiceUrl}"\n`;
  code += `    duration = ${duration}\n`;
  code += '    \n';
  code += '    try:\n';
  code += '        # Отправляем голосовое сообщение\n';
  code += '        await message.answer_voice(voice_url, duration=duration)\n';

  // Добавляем кнопки после голосового сообщения если они есть
  if (node.data.keyboardType === "inline" && node.data.buttons && node.data.buttons.length > 0) {
    code += '        \n';
    code += '        # Отправляем кнопки отдельно после голосового сообщения\n';
    code += '        builder = InlineKeyboardBuilder()\n';

    // Проверяем, что buttons существует и является массивом
    if (Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
    }

    code += '        keyboard = builder.as_markup()\n';
    code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
  }

  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
  code += '        await message.answer("❌ Не удалось отправить голосовое сообщение")\n';

  return code;
}
