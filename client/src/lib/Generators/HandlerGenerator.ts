/**
 * HandlerGenerator - Генератор обработчиков для Telegram ботов
 * 
 * Отвечает за генерацию всех типов обработчиков:
 * - Обработчики сообщений
 * - Обработчики callback'ов (inline кнопки)
 * - Обработчики множественного выбора
 * - Обработчики медиа
 */

import { Node } from '../../../../shared/schema';
import { GenerationContext, IHandlerGenerator, HandlerGenerationResult } from '../Core/types';
import {
  generateSynonymHandler,
  generateMessageSynonymHandler
} from '../Synonyms';
import {
  generateUserManagementSynonymHandler
} from '../UserHandler';
import {
  generateCommandHandler,
  generateStartHandler
} from '../CommandHandler';
import {
  generateStickerHandler,
  generateVoiceHandler,
  generateAnimationHandler,
  generateLocationHandler,
  generateContactHandler
} from '../MediaHandler';
import {
  generateInlineKeyboardCode,
  generateReplyKeyboardCode
} from '../Keyboard';
import {
  hasInlineButtons,
  hasAutoTransitions,
  hasMultiSelectNodes
} from '../has';
import {
  generateUniqueShortId
} from '../format';
import {
  generateConditionalMessageLogic
} from '../Conditional';

/**
 * Генератор обработчиков для различных типов узлов и взаимодействий
 */
export class HandlerGenerator implements IHandlerGenerator {

  /**
   * Генерирует обработчики сообщений для всех узлов
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков сообщений
   */
  generateMessageHandlers(context: GenerationContext): HandlerGenerationResult {
    const { nodes, userDatabaseEnabled } = context;
    let code = '';

    // Генерируем обработчики команд для каждого узла
    const commandNodes = (nodes || []).filter(node =>
      (node.type === 'start' || node.type === 'command' ||
        ['ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user'].includes(node.type)) &&
      node.data.command
    );

    if (commandNodes.length > 0) {
      code += '\n# Обработчики команд\n';

      commandNodes.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;

        if (node.type === 'start') {
          code += generateStartHandler(node, userDatabaseEnabled);
        } else if (node.type === 'command') {
          code += generateCommandHandler(node, userDatabaseEnabled);
        } else if (['ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user'].includes(node.type)) {
          // Генерируем обработчики админских команд
          const command = node.data.command.replace('/', '');
          code += `@dp.message(Command("${command}"))\n`;
          code += `async def ${node.type}_handler(message: types.Message):\n`;
          code += `    user_id = message.from_user.id\n`;
          code += `    logging.info(f"🔧 Команда /${command} от пользователя {user_id}")\n`;
          code += `    \n`;
          code += `    # Проверяем права администратора\n`;
          code += `    if not await is_admin(user_id):\n`;
          code += `        await message.answer("❌ У вас нет прав для выполнения этой команды")\n`;
          code += `        return\n`;
          code += `    \n`;

          const responseText = node.data.text || `Команда ${command} выполнена`;
          code += `    await message.answer("${responseText}")\n`;
          code += `\n`;
        }

        code += `# @@NODE_END:${node.id}@@\n`;
      });
    }

    // Handle start nodes that don't have explicit commands (treat as /start command)
    const startNodes = (nodes || []).filter(node =>
      (node.type === 'start' || node.id === 'start') && !node.data.command
    );

    if (startNodes.length > 0) {
      code += '\n# Обработчики start узлов\n';

      startNodes.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;

        // Generate CommandStart handler
        code += `@dp.message(CommandStart())\n`;
        code += `async def ${node.id}_handler(message: types.Message):\n`;
        code += `    user_id = message.from_user.id\n`;
        code += `    logging.info(f"🚀 Команда /start от пользователя {user_id}")\n`;
        code += `    logging.debug(f"Пользователь: {message.from_user.first_name} {message.from_user.last_name}")\n`;
        code += `    \n`;
        code += `    user_name = init_user_variables(user_id, message.from_user)\n`;
        code += `    \n`;

        const messageText = node.data.text || node.data.message || 'Добро пожаловать!';

        // Если есть кнопки, генерируем их
        if (node.data.buttons && node.data.buttons.length > 0) {
          if (node.data.keyboardType === 'inline') {
            code += `    # Создаем inline клавиатуру\n`;
            code += `    builder = InlineKeyboardBuilder()\n`;

            node.data.buttons.forEach(button => {
              if (button.action === 'url') {
                code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url}"))\n`;
              } else if (button.callbackData) {
                code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.callbackData}"))\n`;
              } else if (button.target) {
                code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target}"))\n`;
              }
            });

            code += `    keyboard = builder.as_markup()\n`;
            code += `    await message.answer("${messageText}", reply_markup=keyboard)\n`;
          } else {
            code += `    await message.answer("${messageText}")\n`;
          }
        } else {
          code += `    await message.answer("${messageText}")\n`;
        }

        code += `    logging.debug(f"Отправлено приветственное сообщение пользователю {user_id}")\n`;

        code += `# @@NODE_END:${node.id}@@\n`;
      });
    }

    // Генерируем обработчики для всех остальных узлов (message, text и др.)
    const messageNodes = (nodes || []).filter(node =>
      !['start', 'command', 'input', 'conditional', 'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user'].includes(node.type) &&
      !commandNodes.includes(node) &&
      !startNodes.includes(node)
    );

    if (messageNodes.length > 0) {
      code += '\n# Обработчики узлов сообщений\n';

      messageNodes.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;
        code += `async def ${node.id}_handler(message_or_callback):\n`;
        code += `    """Обработчик для узла ${node.id}"""\n`;

        const messageText = node.data.text || node.data.message || `Узел ${node.id}`;
        
        // Проверяем наличие условных сообщений
        if (node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
          code += `    # Обработка условных сообщений (conditionalMessages)\n`;
          code += `    user_id = None\n`;
          code += `    if hasattr(message_or_callback, 'from_user'):\n`;
          code += `        user_id = message_or_callback.from_user.id\n`;
          code += `    elif hasattr(message_or_callback, 'message') and hasattr(message_or_callback.message, 'from_user'):\n`;
          code += `        user_id = message_or_callback.message.from_user.id\n`;
          code += `    \n`;
          code += `    message_text = "${messageText}"\n`;
          code += `    \n`;
          
          // Генерируем условную логику
          node.data.conditionalMessages.forEach((condition: any, index: number) => {
            const keyword = index === 0 ? 'if' : 'elif';
            const variable = condition.condition;
            const value = condition.value;
            const conditionText = condition.text;
            
            code += `    ${keyword} user_id and user_data.get(user_id, {}).get("${variable}") == "${value}":\n`;
            code += `        message_text = "${conditionText}"\n`;
          });
          
          code += `    \n`;
        } else {
          code += `    message_text = "${messageText}"\n`;
        }

        // Если есть кнопки, генерируем их
        if (node.data.buttons && node.data.buttons.length > 0) {
          if (node.data.keyboardType === 'inline') {
            code += `    # Создаем inline клавиатуру\n`;
            code += `    builder = InlineKeyboardBuilder()\n`;

            node.data.buttons.forEach(button => {
              if (button.action === 'url') {
                code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url}"))\n`;
              } else if (button.callbackData) {
                code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.callbackData}"))\n`;
              } else if (button.target) {
                code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target}"))\n`;
              }
            });

            code += `    keyboard = builder.as_markup()\n`;
            code += `    \n`;
            code += `    if hasattr(message_or_callback, 'message'):\n`;
            code += `        await message_or_callback.message.answer(message_text, reply_markup=keyboard)\n`;
            code += `    else:\n`;
            code += `        await message_or_callback.answer(message_text, reply_markup=keyboard)\n`;
          } else {
            code += `    if hasattr(message_or_callback, 'message'):\n`;
            code += `        await message_or_callback.message.answer(message_text)\n`;
            code += `    else:\n`;
            code += `        await message_or_callback.answer(message_text)\n`;
          }
        } else {
          code += `    if hasattr(message_or_callback, 'message'):\n`;
          code += `        await message_or_callback.message.answer(message_text)\n`;
          code += `    else:\n`;
          code += `        await message_or_callback.answer(message_text)\n`;
        }

        // Добавляем поддержку attachedMedia
        if (node.data.attachedMedia && node.data.attachedMedia.length > 0) {
          code += `    \n`;
          code += `    # Отправка прикрепленных медиа (attachedMedia)\n`;
          
          node.data.attachedMedia.forEach((media: any, index: number) => {
            if (media.type === 'photo') {
              code += `    # Отправка фото\n`;
              code += `    photo_url = "${media.url}"\n`;
              code += `    photo_input = URLInputFile(photo_url)\n`;
              code += `    if hasattr(message_or_callback, 'message'):\n`;
              code += `        await message_or_callback.message.answer_photo(photo_input)\n`;
              code += `    else:\n`;
              code += `        await bot.send_photo(message_or_callback.from_user.id, photo_input)\n`;
            } else if (media.type === 'video') {
              code += `    # Отправка видео\n`;
              code += `    video_url = "${media.url}"\n`;
              code += `    video_input = URLInputFile(video_url)\n`;
              code += `    if hasattr(message_or_callback, 'message'):\n`;
              code += `        await message_or_callback.message.answer_video(video_input)\n`;
              code += `    else:\n`;
              code += `        await bot.send_video(message_or_callback.from_user.id, video_input)\n`;
            }
          });
        }

        // Добавляем логику автопереходов если они есть
        if (node.data.autoTransitionTo && node.data.autoTransitionDelay) {
          const delay = node.data.autoTransitionDelay;
          const targetNode = node.data.autoTransitionTo;

          code += `    \n`;
          code += `    # Автопереход через ${delay} секунд к узлу ${targetNode}\n`;
          code += `    await asyncio.sleep(${delay})\n`;
          code += `    \n`;
          code += `    # Выполняем автопереход\n`;
          code += `    if hasattr(message_or_callback, 'message'):\n`;
          code += `        # Создаем mock callback для автоперехода\n`;
          code += `        class MockCallback:\n`;
          code += `            def __init__(self, user, msg):\n`;
          code += `                self.from_user = user\n`;
          code += `                self.message = msg\n`;
          code += `            async def answer(self):\n`;
          code += `                pass\n`;
          code += `        \n`;
          code += `        mock_callback = MockCallback(message_or_callback.from_user, message_or_callback)\n`;
          code += `        await safe_edit_or_send(mock_callback, "Переход...", node_id="${targetNode}", is_auto_transition=True)\n`;
          code += `        await ${targetNode}_handler(mock_callback)\n`;
          code += `    else:\n`;
          code += `        await safe_edit_or_send(message_or_callback, "Переход...", node_id="${targetNode}", is_auto_transition=True)\n`;
          code += `        await ${targetNode}_handler(message_or_callback)\n`;
        }

        code += `# @@NODE_END:${node.id}@@\n\n`;
      });
    }

    // Генерируем обработчики input узлов
    const inputNodes = (nodes || []).filter(node => node.type === 'input');
    if (inputNodes.length > 0) {
      code += this.generateInputHandlers(context, inputNodes);
    }

    // Генерируем обработчики conditional узлов
    const conditionalNodes = (nodes || []).filter(node => node.type === 'conditional');
    if (conditionalNodes.length > 0) {
      code += this.generateConditionalHandlers(context, conditionalNodes);
    }

    // Генерируем обработчики синонимов
    code += this.generateSynonymHandlers(context);

    // Подсчитываем количество обработчиков
    const handlersCount = (nodes || []).filter(node => 
      node.type === 'start' || node.type === 'command' || node.type === 'input' ||
      ['ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user'].includes(node.type)
    ).length;

    return {
      code,
      handlersCount,
      warnings: []
    };
  }

  /**
   * Генерирует обработчики для input узлов
   */
  private generateInputHandlers(context: GenerationContext, inputNodes: Node[]): string {
    let code = '\n# Обработчики ввода данных\n';

    inputNodes.forEach(node => {
      code += `# @@NODE_START:${node.id}@@\n`;
      code += `@dp.message(lambda message: message.text and not message.text.startswith('/'))\n`;
      code += `async def handle_input_${node.id}(message: types.Message):\n`;
      code += `    user_id = message.from_user.id\n`;
      code += `    user_input = message.text\n`;
      code += `    \n`;

      if (node.data.variableName) {
        code += `    # Сохраняем введенное значение в переменную ${node.data.variableName}\n`;
        code += `    if user_id not in user_data:\n`;
        code += `        user_data[user_id] = {}\n`;
        code += `    user_data[user_id]["${node.data.variableName}"] = user_input\n`;
        code += `    \n`;
      }

      code += `    await message.answer("Данные сохранены!")\n`;
      code += `# @@NODE_END:${node.id}@@\n`;
    });

    return code;
  }

  /**
   * Генерирует обработчики для conditional узлов
   */
  private generateConditionalHandlers(context: GenerationContext, conditionalNodes: Node[]): string {
    let code = '\n# Обработчики условной логики\n';

    conditionalNodes.forEach(node => {
      code += `# @@NODE_START:${node.id}@@\n`;
      code += `async def handle_conditional_${node.id}(user_id: int):\n`;
      code += `    """Обработка условной логики для узла ${node.id}"""\n`;
      code += `    \n`;

      if (node.data.conditions && node.data.conditions.length > 0) {
        node.data.conditions.forEach((condition, index) => {
          const keyword = index === 0 ? 'if' : 'elif';
          const variable = condition.variable;
          const operator = condition.operator;
          const value = condition.value;

          code += `    ${keyword} user_data.get(user_id, {}).get("${variable}") ${operator} ${value}:\n`;
          code += `        # Переход к ${condition.target}\n`;
          code += `        await handle_callback_${condition.target}(None)  # Placeholder\n`;
        });

        code += `    else:\n`;
        code += `        # Условие по умолчанию\n`;
        code += `        pass\n`;
      }

      code += `# @@NODE_END:${node.id}@@\n`;
    });

    return code;
  }

  /**
   * Генерирует обработчики callback'ов для inline кнопок
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков callback'ов
   */
  generateCallbackHandlers(context: GenerationContext): HandlerGenerationResult {
    const { nodes, connections } = context;
    let code = '';

    // Проверяем наличие автопереходов
    const hasAutoTransitions = (nodes || []).some(node => node.data.autoTransition?.enabled);

    if (hasAutoTransitions) {
      code += '\n# Обработчики автопереходов\n';
      code += this.generateAutoTransitionHandlers(context);
    }

    // Собираем узлы с inline кнопками
    const inlineNodes = (nodes || []).filter(node =>
      node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
    );

    // Проверяем наличие multi-select узлов
    const multiSelectNodes = (nodes || []).filter(node => node.data.allowMultipleSelection);

    // Собираем все целевые узлы из различных источников
    const allReferencedNodeIds = this.collectReferencedNodeIds(nodes, connections);

    // Проверяем наличие кнопок управления пользователями
    const hasUserManagementButtons = inlineNodes.some(node =>
      node.data.buttons?.some(button =>
        ['ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user'].includes(button.action)
      )
    );

    if (hasUserManagementButtons) {
      code += this.generateUserManagementHandlers(context);
    }

    // Добавляем обработчики multi-select если есть такие узлы
    if (multiSelectNodes.length > 0) {
      code += this.generateMultiSelectLogic(context, multiSelectNodes);
    }

    if (inlineNodes.length > 0 || allReferencedNodeIds.size > 0) {
      if (inlineNodes.length > 0) {
        code += '\n# Обработчики inline кнопок\n';
      } else {
        code += '\n# Обработчики автопереходов\n';
      }

      code += this.generateInlineButtonHandlers(context, inlineNodes, allReferencedNodeIds);
    }

    return code;
  }

  /**
   * Генерирует обработчики автопереходов
   */
  private generateAutoTransitionHandlers(context: GenerationContext): string {
    const { nodes } = context;
    let code = '';

    const autoTransitionNodes = (nodes || []).filter(node => node.data.autoTransition?.enabled);

    if (autoTransitionNodes.length > 0) {
      autoTransitionNodes.forEach(node => {
        const delay = node.data.autoTransition?.delay || 3000;
        const target = node.data.autoTransition?.target;

        code += `# Автопереход для узла ${node.id}\n`;
        code += `async def auto_transition_${node.id}(message):\n`;
        code += `    await asyncio.sleep(${delay / 1000})  # Задержка в секундах\n`;

        if (target) {
          code += `    # Переход к ${target} с is_auto_transition=True\n`;
          code += `    await safe_edit_or_send(message, "Переход...", is_auto_transition=True)\n`;
        }

        code += `\n`;
      });
    }

    return code;
  }

  /**
   * Генерирует обработчики управления пользователями
   */
  private generateUserManagementHandlers(context: GenerationContext): string {
    let code = '\n# Обработчики управления пользователями\n';

    code += `
async def ban_user(chat_id: int, user_id: int) -> bool:
    """Забанить пользователя"""
    try:
        await bot.ban_chat_member(chat_id, user_id)
        return True
    except Exception as e:
        logging.error(f"Ошибка при бане пользователя: {e}")
        return False

async def unban_user(chat_id: int, user_id: int) -> bool:
    """Разбанить пользователя"""
    try:
        await bot.unban_chat_member(chat_id, user_id)
        return True
    except Exception as e:
        logging.error(f"Ошибка при разбане пользователя: {e}")
        return False

async def mute_user(chat_id: int, user_id: int, until_date=None) -> bool:
    """Замутить пользователя"""
    try:
        await bot.restrict_chat_member(
            chat_id, 
            user_id,
            permissions=types.ChatPermissions(can_send_messages=False),
            until_date=until_date
        )
        return True
    except Exception as e:
        logging.error(f"Ошибка при муте пользователя: {e}")
        return False

async def unmute_user(chat_id: int, user_id: int) -> bool:
    """Размутить пользователя"""
    try:
        await bot.restrict_chat_member(
            chat_id, 
            user_id,
            permissions=types.ChatPermissions(
                can_send_messages=True,
                can_send_media_messages=True,
                can_send_polls=True,
                can_send_other_messages=True,
                can_add_web_page_previews=True,
                can_change_info=True,
                can_invite_users=True,
                can_pin_messages=True
            )
        )
        return True
    except Exception as e:
        logging.error(f"Ошибка при размуте пользователя: {e}")
        return False

`;

    // Подсчитываем количество обработчиков callback'ов
    const callbackHandlersCount = inlineNodes.length + autoTransitionNodes.length + 
      (hasUserManagement ? 1 : 0) + multiSelectNodes.length;

    return {
      code,
      handlersCount: callbackHandlersCount,
      warnings: []
    };
  }

  /**
   * Генерирует обработчики множественного выбора
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков множественного выбора
   */
  generateMultiSelectHandlers(context: GenerationContext): HandlerGenerationResult {
    const { nodes, allNodeIds } = context;
    let code = '';

    const multiSelectNodes = (nodes || []).filter(node => node.data.allowMultipleSelection);

    if (multiSelectNodes.length > 0) {
      code += '\n# Обработчики множественного выбора\n';
      code += this.generateMultiSelectLogic(context, multiSelectNodes);
    }

    return {
      code,
      handlersCount: multiSelectNodes.length,
      warnings: []
    };
  }

  /**
   * Генерирует обработчики медиа
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков медиа
   */
  generateMediaHandlers(context: GenerationContext): HandlerGenerationResult {
    const { nodes } = context;
    let code = '';

    // Генерируем обработчики для различных типов медиа
    const mediaNodes = (nodes || []).filter(node =>
      ['sticker', 'voice', 'animation', 'location', 'contact', 'photo'].includes(node.type)
    );

    if (mediaNodes.length > 0) {
      code += '\n# Обработчики медиа\n';

      mediaNodes.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;

        switch (node.type) {
          case 'photo':
            code += `@dp.message(F.photo)\n`;
            code += `async def handle_photo_${node.id}(message: types.Message):\n`;
            code += `    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")\n`;
            code += `    logging.debug(f"Размер фото: {len(message.photo)} вариантов")\n`;
            code += `    await message.answer("${node.data.text || 'Получено фото!'}")\n\n`;
            break;
          case 'sticker':
            code += `@dp.message(F.sticker)\n`;
            code += `async def handle_sticker_${node.id}(message: types.Message):\n`;
            code += `    logging.info(f"😄 Получен стикер от пользователя {message.from_user.id}")\n`;
            code += `    logging.debug(f"Стикер ID: {message.sticker.file_id}")\n`;
            code += `    await message.answer("${node.data.text || 'Получен стикер!'}")\n\n`;
            break;
          case 'voice':
            code += `@dp.message(F.voice)\n`;
            code += `async def handle_voice_${node.id}(message: types.Message):\n`;
            code += `    logging.info(f"🎤 Получено голосовое сообщение от пользователя {message.from_user.id}")\n`;
            code += `    logging.debug(f"Длительность: {message.voice.duration} сек")\n`;
            code += `    await message.answer("${node.data.text || 'Получено голосовое сообщение!'}")\n\n`;
            break;
          case 'animation':
            code += `@dp.message(F.animation)\n`;
            code += `async def handle_animation_${node.id}(message: types.Message):\n`;
            code += `    logging.info(f"🎬 Получена анимация от пользователя {message.from_user.id}")\n`;
            code += `    logging.debug(f"Анимация: {message.animation.file_name}")\n`;
            code += `    await message.answer("${node.data.text || 'Получена анимация!'}")\n\n`;
            break;
          case 'location':
            code += `@dp.message(F.location)\n`;
            code += `async def handle_location_${node.id}(message: types.Message):\n`;
            code += `    logging.info(f"📍 Получена локация от пользователя {message.from_user.id}")\n`;
            code += `    logging.debug(f"Координаты: {message.location.latitude}, {message.location.longitude}")\n`;
            code += `    await message.answer("${node.data.text || 'Получена локация!'}")\n\n`;
            break;
          case 'contact':
            code += `@dp.message(F.contact)\n`;
            code += `async def handle_contact_${node.id}(message: types.Message):\n`;
            code += `    logging.info(f"📞 Получен контакт от пользователя {message.from_user.id}")\n`;
            code += `    logging.debug(f"Контакт: {message.contact.first_name} {message.contact.phone_number}")\n`;
            code += `    await message.answer("${node.data.text || 'Получен контакт!'}")\n\n`;
            break;
        }

        code += `# @@NODE_END:${node.id}@@\n`;
      });
    }

    return {
      code,
      handlersCount: mediaNodes.length,
      warnings: []
    };
  }

  /**
   * Генерирует обработчики синонимов для всех узлов
   */
  private generateSynonymHandlers(context: GenerationContext): string {
    const { nodes } = context;
    let code = '';

    const nodesWithSynonyms = (nodes || []).filter(node =>
      node.data.synonyms && node.data.synonyms.length > 0
    );

    if (nodesWithSynonyms.length > 0) {
      code += '\n# Обработчики синонимов\n';

      nodesWithSynonyms.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;

        if (node.type === 'start' || node.type === 'command') {
          code += generateSynonymHandler(node, node.data.synonyms[0]);
        } else if (['ban_user', 'unban_user', 'mute_user', 'unmute_user',
          'kick_user', 'promote_user', 'demote_user', 'admin_rights'].includes(node.type)) {
          code += generateUserManagementSynonymHandler(node, node.data.synonyms[0]);
        } else {
          // Generate one handler for all synonyms of this node
          code += generateMessageSynonymHandler(node, node.data.synonyms[0]);
        }

        code += `# @@NODE_END:${node.id}@@\n`;
      });
    }

    return code;
  }

  /**
   * Собирает все ID узлов, на которые есть ссылки
   */
  private collectReferencedNodeIds(nodes: Node[], connections: any[]): Set<string> {
    const allReferencedNodeIds = new Set<string>();

    // Добавляем узлы из inline кнопок
    const inlineNodes = (nodes || []).filter(node =>
      node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
    );

    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target) {
          allReferencedNodeIds.add(button.target);
        }
      });

      // Добавляем continueButtonTarget для multi-select узлов
      if (node.data.continueButtonTarget) {
        allReferencedNodeIds.add(node.data.continueButtonTarget);
      }
    });

    // Собираем кнопки из условных сообщений
    (nodes || []).forEach(node => {
      if (node.data.conditionalMessages) {
        node.data.conditionalMessages.forEach((condition: any) => {
          if (condition.buttons) {
            condition.buttons.forEach((button: any) => {
              if (button.action === 'goto' && button.target) {
                allReferencedNodeIds.add(button.target);
              }
            });
          }
        });
      }
    });

    // Добавляем узлы из inputTargetNodeId
    (nodes || []).forEach(node => {
      if (node.data.inputTargetNodeId) {
        allReferencedNodeIds.add(node.data.inputTargetNodeId);
      }
    });

    // Добавляем узлы из автопереходов
    (nodes || []).forEach(node => {
      if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
        allReferencedNodeIds.add(node.data.autoTransitionTo);
      }
    });

    // Добавляем все целевые узлы из соединений
    connections.forEach(connection => {
      if (connection.target) {
        allReferencedNodeIds.add(connection.target);
      }
    });

    return allReferencedNodeIds;
  }

  /**
   * Генерирует обработчики для inline кнопок
   */
  private generateInlineButtonHandlers(
    context: GenerationContext,
    inlineNodes: Node[],
    allReferencedNodeIds: Set<string>
  ): string {
    const { nodes } = context;
    let code = '';
    const processedCallbacks = new Set<string>();

    // Генерируем обработчики для каждой inline кнопки
    inlineNodes.forEach(node => {
      node.data.buttons?.forEach(button => {
        // Обрабатываем кнопки с callbackData или action === 'message' для inline кнопок
        let callbackData = '';

        if (button.callbackData) {
          callbackData = button.callbackData;
        } else if (button.action === 'goto' && button.target) {
          // Для кнопок с action='goto' используем target как callback_data
          callbackData = button.target;
        } else if (button.action === 'message' && button.target) {
          callbackData = button.target;
        } else if (button.id) {
          callbackData = button.id;
        }

        if (callbackData && !processedCallbacks.has(callbackData)) {
          const targetNode = button.target ? nodes?.find(n => n.id === button.target) : null;

          // Отмечаем как обработанные
          processedCallbacks.add(callbackData);

          // Генерируем обработчик
          code += this.generateSingleCallbackHandler(context, callbackData, targetNode, button);
        }
      });
    });

    return code;
  }

  /**
   * Генерирует отдельный обработчик callback'а
   */
  private generateSingleCallbackHandler(
    context: GenerationContext,
    callbackData: string,
    targetNode: Node | null,
    button?: any
  ): string {
    const { nodes, allNodeIds } = context;
    let code = '';

    const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');

    // Генерируем декоратор с callback_data
    code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;

    // Генерируем функцию обработчика
    code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
    code += '    await callback_query.answer()\n';
    code += '    \n';
    code += '    user_id = callback_query.from_user.id\n';
    code += `    logging.info(f"🔵 Callback: ${callbackData} от пользователя {user_id}")\n`;
    code += '    \n';

    // Если есть целевой узел, вызываем его обработчик
    if (targetNode) {
      // Проверяем, есть ли обработчик для этого узла
      const nodeHandlerExists = !['start', 'command', 'input', 'conditional'].includes(targetNode.type);

      if (nodeHandlerExists) {
        code += `    # Вызываем обработчик узла ${targetNode.id}\n`;
        code += `    await ${targetNode.id}_handler(callback_query)\n`;
      } else {
        // Для узлов без отдельных обработчиков генерируем прямой ответ
        const responseText = targetNode.data.text || targetNode.data.message || `Узел ${targetNode.id}`;
        code += `    await callback_query.message.answer("${responseText}")\n`;
      }
    } else if (button?.text) {
      code += `    await callback_query.message.answer("Вы выбрали: ${button.text}")\n`;
    } else {
      // Попробуем найти узел по callbackData
      const foundNode = nodes?.find(n => n.id === callbackData);
      if (foundNode) {
        const nodeHandlerExists = !['start', 'command', 'input', 'conditional'].includes(foundNode.type);

        if (nodeHandlerExists) {
          code += `    # Вызываем обработчик узла ${foundNode.id}\n`;
          code += `    await ${foundNode.id}_handler(callback_query)\n`;
        } else {
          const responseText = foundNode.data.text || foundNode.data.message || `Узел ${foundNode.id}`;
          code += `    await callback_query.message.answer("${responseText}")\n`;
        }
      } else {
        code += `    await callback_query.message.answer("Обработка callback: ${callbackData}")\n`;
      }
    }

    code += '\n';
    return code;
  }

  /**
   * Генерирует основную логику обработчика callback'а
   */
  private generateCallbackHandlerLogic(
    context: GenerationContext,
    targetNode: Node,
    callbackData: string
  ): string {
    let code = '';

    code += '    await callback_query.answer()\n';
    code += '    \n';

    // Генерируем логику в зависимости от типа узла
    switch (targetNode.type) {
      case 'message':
        code += this.generateMessageNodeLogic(context, targetNode);
        break;
      case 'user-input':
        code += this.generateUserInputNodeLogic(context, targetNode);
        break;
      default:
        // Базовая логика для других типов узлов
        code += `    # Обработка узла типа ${targetNode.type}\n`;
        code += `    logging.info(f"Обработка узла {targetNode.id} типа ${targetNode.type}")\n`;
        break;
    }

    return code;
  }

  /**
   * Генерирует логику для узла типа message
   */
  private generateMessageNodeLogic(context: GenerationContext, node: Node): string {
    let code = '';

    // Проверяем наличие условных сообщений
    if (node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
      code += generateConditionalMessageLogic(node, context.userDatabaseEnabled, context.projectId);
    } else {
      // Обычное сообщение
      const messageText = node.data.message || 'Сообщение не задано';
      code += `    message_text = "${messageText.replace(/"/g, '\\"')}"\n`;
      code += '    \n';

      // Генерируем клавиатуру если есть
      if (node.data.buttons && node.data.buttons.length > 0) {
        if (node.data.keyboardType === 'inline') {
          code += generateInlineKeyboardCode(node.data.buttons, '    ', node.id, node.data, context.allNodeIds);
        } else {
          code += generateReplyKeyboardCode(node.data.buttons, '    ', node.id, node.data);
        }
      }

      code += '    await callback_query.message.edit_text(\n';
      code += '        message_text,\n';
      if (node.data.buttons && node.data.buttons.length > 0) {
        code += '        reply_markup=keyboard\n';
      }
      code += '    )\n';
    }

    return code;
  }

  /**
   * Генерирует логику для узла типа user-input
   */
  private generateUserInputNodeLogic(context: GenerationContext, node: Node): string {
    let code = '';

    code += `    # Обработка пользовательского ввода для узла ${node.id}\n`;
    code += `    logging.info(f"Обработка пользовательского ввода: {node.id}")\n`;

    return code;
  }

  /**
   * Генерирует логику множественного выбора
   */
  private generateMultiSelectLogic(context: GenerationContext, multiSelectNodes: Node[]): string {
    let code = '';

    // Добавляем глобальную переменную для хранения выбранных опций
    code += '\n# Хранилище выбранных опций для мультиселекта (allowMultipleSelection)\n';
    code += 'selected_options = {}\n\n';

    // Генерируем обработчик для кнопок множественного выбора
    code += '@dp.callback_query(lambda c: c.data.startswith("multi_select_"))\n';
    code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
    code += '    await callback_query.answer()\n';
    code += '    \n';
    code += '    callback_data = callback_query.data\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    \n';

    // Логика обработки множественного выбора
    code += '    if callback_data.startswith("multi_select_done_"):\n';
    code += '        # Обработка кнопки "Готово" (continue_button)\n';
    code += '        short_node_id = callback_data.replace("multi_select_done_", "")\n';
    code += '        \n';

    // Находим полный node_id по короткому суффиксу
    code += '        # Находим полный node_id по короткому суффиксу\n';
    code += '        node_id = None\n';
    multiSelectNodes.forEach(node => {
      const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
      code += `        if short_node_id == "${shortNodeId}":\n`;
      code += `            node_id = "${node.id}"\n`;
    });

    code += '        \n';
    code += '        if node_id:\n';
    code += '            # Переходим к следующему узлу\n';

    // Генерируем переходы для каждого узла
    multiSelectNodes.forEach(node => {
      if (node.data.continueButtonTarget) {
        code += `            if node_id == "${node.id}":\n`;
        const safeFunctionName = node.data.continueButtonTarget.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `                await handle_callback_${safeFunctionName}(callback_query)\n`;
      }
    });

    code += '    else:\n';
    code += '        # Обработка выбора элемента\n';
    code += '        # Логика добавления/удаления элемента из выбранных\n';
    code += '        if user_id not in selected_options:\n';
    code += '            selected_options[user_id] = []\n';
    code += '        \n';
    code += '        # Добавляем или удаляем выбранный элемент\n';
    code += '        option_value = callback_data.replace("multi_select_", "")\n';
    code += '        if option_value in selected_options[user_id]:\n';
    code += '            selected_options[user_id].remove(option_value)\n';
    code += '        else:\n';
    code += '            selected_options[user_id].append(option_value)\n';

    // Добавляем информацию о continue_button для каждого узла
    multiSelectNodes.forEach(node => {
      if (node.data.continueButtonText) {
        code += `\n# continue_button для узла ${node.id}: "${node.data.continueButtonText}"\n`;
      } else {
        code += `\n# continue_button для узла ${node.id}\n`;
      }
    });

    return code;
  }

  /**
   * Генерирует обработчики для групп
   * @param context Контекст генерации
   * @returns Результат генерации обработчиков групп
   */
  generateGroupHandlers(context: GenerationContext): HandlerGenerationResult {
    let code = '';

    // Добавляем обработчики для групп только если они есть
    if (context.groups && context.groups.length > 0) {
      code += '\n# Обработчики для работы с группами\n';
      code += '@dp.message(F.chat.type.in_(["group", "supergroup"]))\n';
      code += 'async def handle_group_message(message: types.Message):\n';
      code += '    """Обработчик сообщений в группах"""\n';
      code += '    chat_id = message.chat.id\n';
      code += '    user_id = message.from_user.id\n';
      code += '    \n';
      code += '    # Проверяем, является ли группа подключенной\n';
      code += '    group_name = None\n';
      code += '    for name, config in CONNECTED_GROUPS.items():\n';
      code += '        if config.get("id") and str(config["id"]) == str(chat_id):\n';
      code += '            group_name = name\n';
      code += '            break\n';
      code += '    \n';
      code += '    if group_name:\n';
      code += '        logging.info(f"📢 Сообщение в подключенной группе {group_name}: {message.text}")\n';
      code += '        \n';
      code += '        # Здесь можно добавить логику обработки сообщений в группе\n';
      code += '        # Например, модерация, команды для группы и т.д.\n';
      code += '        \n';

      if (context.userDatabaseEnabled) {
        code += '        # Сохраняем сообщение в базу данных\n';
        code += '        await save_message_to_api(\n';
        code += '            user_id=str(user_id),\n';
        code += '            message_type="group_message",\n';
        code += '            message_text=message.text,\n';
        code += '            message_data={\n';
        code += '                "chat_id": str(chat_id),\n';
        code += '                "group_name": group_name,\n';
        code += '                "message_id": message.message_id\n';
        code += '            }\n';
        code += '        )\n';
      }

      code += '    else:\n';
      code += '        logging.debug(f"📢 Сообщение в неподключенной группе: {chat_id}")\n';
      code += '\n';

      // Обработчик callback'ов в группах
      code += '@dp.callback_query(lambda c: c.message and c.message.chat.type in ["group", "supergroup"])\n';
      code += 'async def handle_group_callback(callback_query: types.CallbackQuery):\n';
      code += '    """Обработчик callback\'ов в группах"""\n';
      code += '    await callback_query.answer()\n';
      code += '    \n';
      code += '    chat_id = callback_query.message.chat.id\n';
      code += '    user_id = callback_query.from_user.id\n';
      code += '    \n';
      code += '    # Проверяем, является ли группа подключенной\n';
      code += '    group_name = None\n';
      code += '    for name, config in CONNECTED_GROUPS.items():\n';
      code += '        if config.get("id") and str(config["id"]) == str(chat_id):\n';
      code += '            group_name = name\n';
      code += '            break\n';
      code += '    \n';
      code += '    if group_name:\n';
      code += '        logging.info(f"🔘 Callback в подключенной группе {group_name}: {callback_query.data}")\n';
      code += '        \n';
      code += '        # Здесь можно добавить логику обработки callback\'ов в группе\n';
      code += '        \n';

      if (context.userDatabaseEnabled) {
        code += '        # Сохраняем callback в базу данных\n';
        code += '        await save_message_to_api(\n';
        code += '            user_id=str(user_id),\n';
        code += '            message_type="group_callback",\n';
        code += '            message_text=callback_query.data,\n';
        code += '            message_data={\n';
        code += '                "chat_id": str(chat_id),\n';
        code += '                "group_name": group_name,\n';
        code += '                "message_id": callback_query.message.message_id\n';
        code += '            }\n';
        code += '        )\n';
      }

      code += '    else:\n';
      code += '        logging.debug(f"🔘 Callback в неподключенной группе: {chat_id}")\n';
      code += '\n';
    }

    // Подсчитываем количество групповых обработчиков
    const groupHandlersCount = context.groups ? context.groups.length : 0;

    return {
      code,
      handlersCount: groupHandlersCount,
      warnings: []
    };
  }
}