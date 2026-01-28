/**
 * Функция для генерации кода безопасного редактирования/отправки сообщений
 * @param hasInlineButtons - Есть ли inline кнопки
 * @param hasAutoTransitions - Есть ли автопереходы
 * @returns Строка с кодом функции safe_edit_or_send, если нужны, иначе пустая строка
 */
export function generateSafeEditOrSendCode(hasInlineButtons: boolean, hasAutoTransitions: boolean): string {
  if (!hasInlineButtons && !hasAutoTransitions) {
    return '';
  }

  let code = '';
  code += '# Safe helper for editing messages with fallback to new message\n';
  code += 'async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):\n';
  code += '    """\n';
  code += '    Безопасное редактирование сообщения с fallback на новое сообщение\n';
  code += '    При автопереходе сразу отправляет новое сообщение без попытки редактирования\n';
  code += '    """\n';
  code += '    result = None\n';
  code += '    user_id = None\n';
  code += '    \n';
  code += '    # Получаем user_id для сохранения\n';
  code += '    if hasattr(cbq, "from_user") and cbq.from_user:\n';
  code += '        user_id = str(cbq.from_user.id)\n';
  code += '    elif hasattr(cbq, "message") and cbq.message and hasattr(cbq.message, "chat"):\n';
  code += '        user_id = str(cbq.message.chat.id)\n';
  code += '    \n';
  code += '    try:\n';
  code += '        # При автопереходе сразу отправляем новое сообщение без редактирования\n';
  code += '        if is_auto_transition:\n';
  code += '            logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")\n';
  code += '            if hasattr(cbq, "message") and cbq.message:\n';
  code += '                result = await cbq.message.answer(text, **kwargs)\n';
  code += '            else:\n';
  code += '                raise Exception("Cannot send message in auto-transition")\n';
  code += '        else:\n';
  code += '            # Пробуем редактировать сообщение\n';
  code += '            if hasattr(cbq, "edit_text") and callable(getattr(cbq, "edit_text")):\n';
  code += '                result = await cbq.edit_text(text, **kwargs)\n';
  code += '            elif (hasattr(cbq, "message") and cbq.message):\n';
  code += '                result = await cbq.message.edit_text(text, **kwargs)\n';
  code += '            else:\n';
  code += '                raise Exception("No valid edit method found")\n';
  code += '    except Exception as e:\n';
  code += '        # При любой ошибке отправляем новое сообщение\n';
  code += '        if is_auto_transition:\n';
  code += '            logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")\n';
  code += '        else:\n';
  code += '            logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")\n';
  code += '        if hasattr(cbq, "message") and cbq.message:\n';
  code += '            result = await cbq.message.answer(text, **kwargs)\n';
  code += '        else:\n';
  code += '            logging.error("Не удалось ни отредактировать, ни отправить новое сообщение")\n';
  code += '            raise\n';
  code += '    \n';
  code += '    # Сохраняем сообщение в базу данных\n';
  code += '    if result and user_id:\n';
  code += '        message_data_obj = {"message_id": result.message_id if hasattr(result, "message_id") else None}\n';
  code += '        \n';
  code += '        # Извлекаем кнопки из reply_markup\n';
  code += '        if "reply_markup" in kwargs:\n';
  code += '            try:\n';
  code += '                reply_markup = kwargs["reply_markup"]\n';
  code += '                buttons_data = []\n';
  code += '                # Обработка inline клавиатуры\n';
  code += '                if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                    for row in reply_markup.inline_keyboard:\n';
  code += '                        for btn in row:\n';
  code += '                            button_info = {"text": btn.text}\n';
  code += '                            if hasattr(btn, "url") and btn.url:\n';
  code += '                                button_info["url"] = btn.url\n';
  code += '                            if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                                button_info["callback_data"] = btn.callback_data\n';
  code += '                            buttons_data.append(button_info)\n';
  code += '                    if buttons_data:\n';
  code += '                        message_data_obj["buttons"] = buttons_data\n';
  code += '                        message_data_obj["keyboard_type"] = "inline"\n';
  code += '                # Обработка reply клавиатуры\n';
  code += '                elif hasattr(reply_markup, "keyboard"):\n';
  code += '                    for row in reply_markup.keyboard:\n';
  code += '                        for btn in row:\n';
  code += '                            button_info = {"text": btn.text}\n';
  code += '                            if hasattr(btn, "request_contact") and btn.request_contact:\n';
  code += '                                button_info["request_contact"] = True\n';
  code += '                            if hasattr(btn, "request_location") and btn.request_location:\n';
  code += '                                button_info["request_location"] = True\n';
  code += '                            buttons_data.append(button_info)\n';
  code += '                    if buttons_data:\n';
  code += '                        message_data_obj["buttons"] = buttons_data\n';
  code += '                        message_data_obj["keyboard_type"] = "reply"\n';
  code += '            except Exception as btn_error:\n';
  code += '                logging.warning(f"Не удалось извлечь кнопки в safe_edit_or_send: {btn_error}")\n';
  code += '        \n';
  code += '        await save_message_to_api(\n';
  code += '            user_id=user_id,\n';
  code += '            message_type="bot",\n';
  code += '            message_text=text,\n';
  code += '            node_id=node_id,\n';
  code += '            message_data=message_data_obj\n';
  code += '        )\n';
  code += '    \n';
  code += '    return result\n\n';

  return code;
}
