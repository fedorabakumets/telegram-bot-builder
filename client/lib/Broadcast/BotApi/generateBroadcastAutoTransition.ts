/**
 * @fileoverview Генерация кода для автоперехода в рассылке
 *
 * Этот модуль генерирует Python-код для выполнения автоперехода
 * к следующему узлу после отправки сообщения рассылки.
 * Создаёт фейковый callback_query и вызывает handler следующего узла.
 *
 * @module generateBroadcastAutoTransition
 */

import { processCodeWithAutoComments } from '../../utils/generateGeneratedComment';

/**
 * Генерирует код для отправки медиафайлов получателю (для автоперехода)
 *
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
function generateAutoTransitionMediaSend(indent: string): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Сначала пробуем переменные из attachedMedia`);
  codeLines.push(`${indent}if next_attached:`);
  codeLines.push(`${indent}    for m_var in next_attached:`);
  codeLines.push(`${indent}        m_val = next_all_user_vars.get(m_var)`);
  codeLines.push(`${indent}        if m_val:`);
  codeLines.push(`${indent}            # Проверяем правильные URL поля в зависимости от типа медиа`);
  codeLines.push(`${indent}            m_url = None`);
  codeLines.push(`${indent}            if isinstance(m_val, dict):`);
  codeLines.push(`${indent}                if "audio" in m_var.lower() && "audioUrl" in m_val:`);
  codeLines.push(`${indent}                    m_url = m_val.get("audioUrl")`);
  codeLines.push(`${indent}                elif "video" in m_var.lower() && "videoUrl" in m_val:`);
  codeLines.push(`${indent}                    m_url = m_val.get("videoUrl")`);
  codeLines.push(`${indent}                elif "document" in m_var.lower() && "documentUrl" in m_val:`);
  codeLines.push(`${indent}                    m_url = m_val.get("documentUrl")`);
  codeLines.push(`${indent}                elif "photoUrl" in m_val:`);
  codeLines.push(`${indent}                    m_url = m_val.get("photoUrl")`);
  codeLines.push(`${indent}                if not m_url:`);
  codeLines.push(`${indent}                    m_url = m_val.get("value")`);
  codeLines.push(`${indent}            else:`);
  codeLines.push(`${indent}                m_url = m_val`);
  codeLines.push(`${indent}            if m_url:`);
  codeLines.push(`${indent}                if "audio" in m_var.lower():`);
  codeLines.push(`${indent}                    await bot.send_audio(recipient_id, m_url, caption=next_text)`);
  codeLines.push(`${indent}                elif "video" in m_var.lower():`);
  codeLines.push(`${indent}                    await bot.send_video(recipient_id, m_url, caption=next_text)`);
  codeLines.push(`${indent}                elif "document" in m_var.lower():`);
  codeLines.push(`${indent}                    await bot.send_document(recipient_id, m_url, caption=next_text)`);
  codeLines.push(`${indent}                else:`);
  codeLines.push(`${indent}                    await bot.send_photo(recipient_id, m_url, caption=next_text)`);
  codeLines.push(`${indent}                next_media_sent = True`);
  codeLines.push(`${indent}# Если нет переменной, используем статические медиа`);
  codeLines.push(`${indent}if not next_media_sent:`);
  codeLines.push(`${indent}    if next_audio:`);
  codeLines.push(`${indent}        await bot.send_audio(recipient_id, next_audio, caption=next_text)`);
  codeLines.push(`${indent}        next_media_sent = True`);
  codeLines.push(`${indent}    elif next_video:`);
  codeLines.push(`${indent}        await bot.send_video(recipient_id, next_video, caption=next_text)`);
  codeLines.push(`${indent}        next_media_sent = True`);
  codeLines.push(`${indent}    elif next_document:`);
  codeLines.push(`${indent}        await bot.send_document(recipient_id, next_document, caption=next_text)`);
  codeLines.push(`${indent}        next_media_sent = True`);
  codeLines.push(`${indent}    elif next_image:`);
  codeLines.push(`${indent}        await bot.send_photo(recipient_id, next_image, caption=next_text)`);
  codeLines.push(`${indent}        next_media_sent = True`);

  return codeLines.join('\n');
}

/**
 * Генерирует код для выполнения автоперехода к следующему узлу
 *
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastAutoTransition(indent: string = '                '): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}logging.info(f"🔄 Автопереход к узлу {auto_target} для пользователя {recipient_id}")`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    # Создаем фейковый callback_query для вызова handler`);
  codeLines.push(`${indent}    from aiogram.types import CallbackQuery, User, Chat, Message`);
  codeLines.push(`${indent}    fake_chat = Chat(id=recipient_id, type="private", first_name="User")`);
  codeLines.push(`${indent}    fake_message = Message(message_id=1, date=0, chat=fake_chat, from_user=User(id=recipient_id, is_bot=False, first_name="User"))`);
  codeLines.push(`${indent}    fake_callback = CallbackQuery(`);
  codeLines.push(`${indent}        id="broadcast_auto",`);
  codeLines.push(`${indent}        from_user=User(id=recipient_id, is_bot=False, first_name="User"),`);
  codeLines.push(`${indent}        chat_instance="broadcast",`);
  codeLines.push(`${indent}        data=auto_target,`);
  codeLines.push(`${indent}        message=fake_message`);
  codeLines.push(`${indent}    )`);
  codeLines.push(`${indent}    # Находим handler (заменяем дефисы на подчёркивания)`);
  codeLines.push(`${indent}    safe_auto_target = auto_target.replace("-", "_")`);
  codeLines.push(`${indent}    handler_name = f"handle_callback_{safe_auto_target}"`);
  codeLines.push(`${indent}    handler = globals().get(handler_name)`);
  codeLines.push(`${indent}    logging.info(f"🔍 Handler {handler_name} в globals(): {'найден' if handler else 'НЕ НАЙДЕН'}")`);
  codeLines.push(`${indent}    if handler:`);
  codeLines.push(`${indent}        try:`);
  codeLines.push(`${indent}            await handler(fake_callback)`);
  codeLines.push(`${indent}            logging.info(f"✅ Handler {handler_name} выполнен")`);
  codeLines.push(`${indent}        except Exception as handler_error:`);
  codeLines.push(`${indent}            # Игнорируем ошибки методов bot (answer, edit_text) - они не нужны при автопереходе в рассылке`);
  codeLines.push(`${indent}            if "not mounted to a any bot instance" in str(handler_error) || "This method is not mounted" in str(handler_error):`);
  codeLines.push(`${indent}                logging.info(f"⚠️ Handler {handler_name} выполнен (методы редактирования сообщений пропущены)")`);
  codeLines.push(`${indent}            else:`);
  codeLines.push(`${indent}                logging.error(f"❌ Ошибка handler при автопереходе к {auto_target}: {handler_error}")`);
  codeLines.push(`${indent}                raise`);
  codeLines.push(`${indent}    # После вызова handler отправляем сообщение следующего узла напрямую`);
  codeLines.push(`${indent}    logging.info(f"📤 Отправка сообщения узла {auto_target} для пользователя {recipient_id}")`);
  codeLines.push(`${indent}    # Ищем следующий узел в all_nodes_dict`);
  codeLines.push(`${indent}    next_node = all_nodes_dict.get(auto_target)`);
  codeLines.push(`${indent}    if next_node:`);
  codeLines.push(`${indent}        next_text = replace_variables_in_text(next_node["text"], {**user_data.get(recipient_id, {}), "user_id": recipient_id})`);
  codeLines.push(`${indent}        next_all_user_vars = {**user_data.get(recipient_id, {}), "user_id": recipient_id}`);
  codeLines.push(`${indent}        next_media_sent = False`);
  codeLines.push(`${indent}        next_attached = next_node.get("attachedMedia", [])`);
  codeLines.push(`${indent}        next_image = next_node.get("imageUrl")`);
  codeLines.push(`${indent}        next_audio = next_node.get("audioUrl")`);
  codeLines.push(`${indent}        next_video = next_node.get("videoUrl")`);
  codeLines.push(`${indent}        next_document = next_node.get("documentUrl")`);
  codeLines.push(generateAutoTransitionMediaSend(`${indent}        `));
  codeLines.push(`${indent}        if not next_media_sent:`);
  codeLines.push(`${indent}            await bot.send_message(recipient_id, next_text)`);
  codeLines.push(`${indent}        logging.info(f"✅ Сообщение узла {auto_target} отправлено")`);
  codeLines.push(`${indent}    else:`);
  codeLines.push(`${indent}        logging.warning(f"⚠️ Узел {auto_target} не найден в all_nodes_dict")`);
  codeLines.push(`${indent}except Exception as auto_error:`);
  codeLines.push(`${indent}    if "not mounted to a any bot instance" not in str(auto_error) && "This method is not mounted" not in str(auto_error):`);
  codeLines.push(`${indent}        logging.error(f"❌ Ошибка автоперехода к {auto_target}: {auto_error}")`);

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(codeLines, 'generateBroadcastAutoTransition.ts');
  return processedCode.join('\n');
}
