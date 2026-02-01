import { generateButtonText } from '../format/generateButtonText';
import { Node } from '@shared/schema';

export function generateAnimationHandler(node: Node): string {
  let code = `\n# Обработчик GIF анимации для узла ${node.id}\n`;

  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `animation_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');

    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;

    code += `    logging.info(f"Команда анимации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;

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

    const animationUrl = node.data.animationUrl || "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif";
    const caption = node.data.mediaCaption || node.data.messageText || "🎬 GIF анимация";
    const duration = node.data.duration || 0;
    const width = node.data.width || 0;
    const height = node.data.height || 0;

    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }

    code += `    animation_url = "${animationUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (width > 0) code += `    width = ${width}\n`;
    if (height > 0) code += `    height = ${height}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем GIF анимацию\n';

    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
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
      code += '        await message.answer_animation(animation_url, caption=caption, reply_markup=keyboard';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    } else {
      code += '        await message.answer_animation(animation_url, caption=caption';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    }

    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить анимацию\\n{caption}")\n';
  }

  return code;
}
