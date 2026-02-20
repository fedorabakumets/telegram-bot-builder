/**
 * @fileoverview Генерация кода для узла рассылки (broadcast)
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * реализующего рассылку сообщений пользователям из базы данных.
 * Поддерживает рассылку нескольких message узлов с флагом enableBroadcast.
 *
 * @module generateBroadcastHandler
 */

import { Node } from '@shared/schema';
import { formatTextForPython } from '../format';

/**
 * Генерирует код рассылки для вставки внутрь callback handler
 *
 * @param {Node} node - Узел типа broadcast
 * @param {Node[]} allNodes - Все узлы проекта для поиска message узлов с enableBroadcast
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastInline(node: Node, allNodes: Node[] | null, indent: string = '    '): string {
  const codeLines: string[] = [];
  const data = node.data as any;

  // Сообщение об успехе
  const successMessage = data.successMessage || '✅ Рассылка отправлена!';
  const errorMessage = data.errorMessage || '❌ Ошибка рассылки';

  codeLines.push(`${indent}# Обработка узла рассылки`);
  codeLines.push(`${indent}logging.info(f"📢 Запуск рассылки из узла ${node.id}")`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Получение списка пользователей для рассылки`);
  codeLines.push(`${indent}recipients = []`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);

  const idSource = data.idSourceType || 'bot_users';
  if (idSource === 'user_ids' || idSource === 'both') {
    codeLines.push(`${indent}        # Получаем ID из таблицы user_ids`);
    codeLines.push(`${indent}        rows = await conn.fetch(`);
    codeLines.push(`${indent}            "SELECT DISTINCT user_id FROM user_ids WHERE project_id = $1",`);
    codeLines.push(`${indent}            PROJECT_ID`);
    codeLines.push(`${indent}        )`);
    codeLines.push(`${indent}        recipients.extend([str(row["user_id"]) for row in rows])`);
  }

  if (idSource === 'bot_users' || idSource === 'both') {
    codeLines.push(`${indent}        # Получаем ID из таблицы bot_users`);
    codeLines.push(`${indent}        rows = await conn.fetch(`);
    codeLines.push(`${indent}            "SELECT DISTINCT user_id FROM bot_users"`);
    codeLines.push(`${indent}        )`);
    codeLines.push(`${indent}        recipients.extend([str(row["user_id"]) for row in rows])`);
  }

  codeLines.push(`${indent}except Exception as e:`);
  codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения списка пользователей: {e}")`);
  codeLines.push(`${indent}    await callback_query.message.answer("${errorMessage}")`);
  codeLines.push(`${indent}    return`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Удаляем дубликаты`);
  codeLines.push(`${indent}recipients = list(set(recipients))`);
  codeLines.push(`${indent}logging.info(f"📋 Найдено {len(recipients)} получателей")`);
  codeLines.push(`${indent}`);
  
  // Формируем список сообщений только если allNodes передан
  if (allNodes && allNodes.length > 0) {
    codeLines.push(`${indent}# Формируем список сообщений для рассылки`);
    codeLines.push(generateMultiMessageBroadcast(allNodes, node.id, indent));
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Отправляем сообщения всем получателям`);
    codeLines.push(`${indent}success_count = 0`);
    codeLines.push(`${indent}error_count = 0`);
    codeLines.push(`${indent}for recipient_id in recipients:`);
    codeLines.push(`${indent}    for node_data in broadcast_nodes:`);
    codeLines.push(`${indent}        if not node_data["text"].strip():`);
    codeLines.push(`${indent}            continue`);
    codeLines.push(`${indent}        try:`);
    codeLines.push(`${indent}            # Замена переменных для текущего получателя`);
    codeLines.push(`${indent}            message_text = replace_variables_in_text(node_data["text"], {**user_data.get(recipient_id, {}), "user_id": recipient_id})`);
    codeLines.push(`${indent}            all_user_vars = {**user_data.get(recipient_id, {}), "user_id": recipient_id}`);
    codeLines.push(`${indent}            # Отправка медиа если есть`);
    codeLines.push(`${indent}            media_sent = False`);
    codeLines.push(`${indent}            attached_media = node_data.get("attachedMedia", [])`);
    codeLines.push(`${indent}            image_url = node_data.get("imageUrl")`);
    codeLines.push(`${indent}            audio_url = node_data.get("audioUrl")`);
    codeLines.push(`${indent}            video_url = node_data.get("videoUrl")`);
    codeLines.push(`${indent}            document_url = node_data.get("documentUrl")`);
    codeLines.push(`${indent}            if attached_media or image_url or audio_url or video_url or document_url:`);
    codeLines.push(`${indent}                try:`);
    codeLines.push(`${indent}                    # Сначала пробуем отправить из переменной`);
    codeLines.push(`${indent}                    if attached_media:`);
    codeLines.push(`${indent}                        for media_var in attached_media:`);
    codeLines.push(`${indent}                            media_value = all_user_vars.get(media_var)`);
    codeLines.push(`${indent}                            if media_value:`);
    codeLines.push(`${indent}                                # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа`);
    codeLines.push(`${indent}                                media_url_to_use = None`);
    codeLines.push(`${indent}                                if isinstance(media_value, dict):`);
    codeLines.push(`${indent}                                    if "audio" in media_var.lower() and "audioUrl" in media_value:`);
    codeLines.push(`${indent}                                        media_url_to_use = media_value.get("audioUrl")`);
    codeLines.push(`${indent}                                    elif "video" in media_var.lower() and "videoUrl" in media_value:`);
    codeLines.push(`${indent}                                        media_url_to_use = media_value.get("videoUrl")`);
    codeLines.push(`${indent}                                    elif "document" in media_var.lower() and "documentUrl" in media_value:`);
    codeLines.push(`${indent}                                        media_url_to_use = media_value.get("documentUrl")`);
    codeLines.push(`${indent}                                    elif "photoUrl" in media_value:`);
    codeLines.push(`${indent}                                        media_url_to_use = media_value.get("photoUrl")`);
    codeLines.push(`${indent}                                    if not media_url_to_use:`);
    codeLines.push(`${indent}                                        media_url_to_use = media_value.get("value")`);
    codeLines.push(`${indent}                                else:`);
    codeLines.push(`${indent}                                    media_url_to_use = media_value`);
    codeLines.push(`${indent}                                if media_url_to_use:`);
    codeLines.push(`${indent}                                    if "audio" in media_var.lower():`);
    codeLines.push(`${indent}                                        await bot.send_audio(recipient_id, media_url_to_use, caption=message_text)`);
    codeLines.push(`${indent}                                    elif "video" in media_var.lower():`);
    codeLines.push(`${indent}                                        await bot.send_video(recipient_id, media_url_to_use, caption=message_text)`);
    codeLines.push(`${indent}                                    elif "document" in media_var.lower():`);
    codeLines.push(`${indent}                                        await bot.send_document(recipient_id, media_url_to_use, caption=message_text)`);
    codeLines.push(`${indent}                                    else:`);
    codeLines.push(`${indent}                                        await bot.send_photo(recipient_id, media_url_to_use, caption=message_text)`);
    codeLines.push(`${indent}                                    media_sent = True`);
    codeLines.push(`${indent}                    # Если нет переменной, используем статические медиа`);
    codeLines.push(`${indent}                    if not media_sent:`);
    codeLines.push(`${indent}                        if audio_url:`);
    codeLines.push(`${indent}                            await bot.send_audio(recipient_id, audio_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                        elif video_url:`);
    codeLines.push(`${indent}                            await bot.send_video(recipient_id, video_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                        elif document_url:`);
    codeLines.push(`${indent}                            await bot.send_document(recipient_id, document_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                        elif image_url:`);
    codeLines.push(`${indent}                            await bot.send_photo(recipient_id, image_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                except Exception as media_error:`);
    codeLines.push(`${indent}                    logging.error(f"❌ Ошибка отправки медиа: {media_error}")`);
    codeLines.push(`${indent}                    # Fallback на статические медиа при ошибке`);
    codeLines.push(`${indent}                    if not media_sent:`);
    codeLines.push(`${indent}                        if audio_url:`);
    codeLines.push(`${indent}                            await bot.send_audio(recipient_id, audio_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                        elif video_url:`);
    codeLines.push(`${indent}                            await bot.send_video(recipient_id, video_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                        elif document_url:`);
    codeLines.push(`${indent}                            await bot.send_document(recipient_id, document_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}                        elif image_url:`);
    codeLines.push(`${indent}                            await bot.send_photo(recipient_id, image_url, caption=message_text)`);
    codeLines.push(`${indent}                            media_sent = True`);
    codeLines.push(`${indent}            if not media_sent:`);
    codeLines.push(`${indent}                await bot.send_message(recipient_id, message_text)`);
    codeLines.push(`${indent}            success_count += 1`);
    codeLines.push(`${indent}            # Автопереход если указан`);
    codeLines.push(`${indent}            auto_target = node_data.get("autoTransitionTo")`);
    codeLines.push(`${indent}            if auto_target:`);
    codeLines.push(`${indent}                logging.info(f"🔄 Автопереход к узлу {auto_target} для пользователя {recipient_id}")`);
    codeLines.push(`${indent}                try:`);
    codeLines.push(`${indent}                    # Создаем фейковый callback_query для вызова handler`);
    codeLines.push(`${indent}                    from aiogram.types import CallbackQuery, User, Chat, Message`);
    codeLines.push(`${indent}                    fake_chat = Chat(id=recipient_id, type="private", first_name="User")`);
    codeLines.push(`${indent}                    fake_message = Message(message_id=1, date=0, chat=fake_chat, from_user=User(id=recipient_id, is_bot=False, first_name="User"))`);
    codeLines.push(`${indent}                    fake_callback = CallbackQuery(`);
    codeLines.push(`${indent}                        id="broadcast_auto",`);
    codeLines.push(`${indent}                        from_user=User(id=recipient_id, is_bot=False, first_name="User"),`);
    codeLines.push(`${indent}                        chat_instance="broadcast",`);
    codeLines.push(`${indent}                        data=auto_target,`);
    codeLines.push(`${indent}                        message=fake_message`);
    codeLines.push(`${indent}                    )`);
    codeLines.push(`${indent}                    # Находим handler (заменяем дефисы на подчёркивания)`);
    codeLines.push(`${indent}                    safe_auto_target = auto_target.replace("-", "_")`);
    codeLines.push(`${indent}                    handler_name = f"handle_callback_{safe_auto_target}"`);
    codeLines.push(`${indent}                    handler = globals().get(handler_name)`);
    codeLines.push(`${indent}                    logging.info(f"🔍 Handler {handler_name} в globals(): {'найден' if handler else 'НЕ НАЙДЕН'}")`);
    codeLines.push(`${indent}                    if handler:`);
    codeLines.push(`${indent}                        try:`);
    codeLines.push(`${indent}                            await handler(fake_callback)`);
    codeLines.push(`${indent}                            logging.info(f"✅ Handler {handler_name} выполнен")`);
    codeLines.push(`${indent}                        except Exception as handler_error:`);
    codeLines.push(`${indent}                            # Игнорируем ошибки методов bot (answer, edit_text) - они не нужны при автопереходе в рассылке`);
    codeLines.push(`${indent}                            if "not mounted to a any bot instance" in str(handler_error) or "This method is not mounted" in str(handler_error):`);
    codeLines.push(`${indent}                                logging.info(f"⚠️ Handler {handler_name} выполнен (методы редактирования сообщений пропущены)")`);
    codeLines.push(`${indent}                            else:`);
    codeLines.push(`${indent}                                logging.error(f"❌ Ошибка handler при автопереходе к {auto_target}: {handler_error}")`);
    codeLines.push(`${indent}                                raise`);
    codeLines.push(`${indent}                    # После вызова handler отправляем сообщение следующего узла напрямую`);
    codeLines.push(`${indent}                    logging.info(f"📤 Отправка сообщения узла {auto_target} для пользователя {recipient_id}")`);
    codeLines.push(`${indent}                    # Ищем следующий узел в all_nodes_dict`);
    codeLines.push(`${indent}                    next_node = all_nodes_dict.get(auto_target)`);
    codeLines.push(`${indent}                    if next_node:`);
    codeLines.push(`${indent}                        next_text = replace_variables_in_text(next_node["text"], {**user_data.get(recipient_id, {}), "user_id": recipient_id})`);
    codeLines.push(`${indent}                        next_all_user_vars = {**user_data.get(recipient_id, {}), "user_id": recipient_id}`);
    codeLines.push(`${indent}                        next_media_sent = False`);
    codeLines.push(`${indent}                        next_attached = next_node.get("attachedMedia", [])`);
    codeLines.push(`${indent}                        next_image = next_node.get("imageUrl")`);
    codeLines.push(`${indent}                        next_audio = next_node.get("audioUrl")`);
    codeLines.push(`${indent}                        next_video = next_node.get("videoUrl")`);
    codeLines.push(`${indent}                        next_document = next_node.get("documentUrl")`);
    codeLines.push(`${indent}                        # Сначала пробуем переменные из attachedMedia`);
    codeLines.push(`${indent}                        if next_attached:`);
    codeLines.push(`${indent}                            for m_var in next_attached:`);
    codeLines.push(`${indent}                                m_val = next_all_user_vars.get(m_var)`);
    codeLines.push(`${indent}                                if m_val:`);
    codeLines.push(`${indent}                                    # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа`);
    codeLines.push(`${indent}                                    m_url = None`);
    codeLines.push(`${indent}                                    if isinstance(m_val, dict):`);
    codeLines.push(`${indent}                                        if "audio" in m_var.lower() and "audioUrl" in m_val:`);
    codeLines.push(`${indent}                                            m_url = m_val.get("audioUrl")`);
    codeLines.push(`${indent}                                        elif "video" in m_var.lower() and "videoUrl" in m_val:`);
    codeLines.push(`${indent}                                            m_url = m_val.get("videoUrl")`);
    codeLines.push(`${indent}                                        elif "document" in m_var.lower() and "documentUrl" in m_val:`);
    codeLines.push(`${indent}                                            m_url = m_val.get("documentUrl")`);
    codeLines.push(`${indent}                                        elif "photoUrl" in m_val:`);
    codeLines.push(`${indent}                                            m_url = m_val.get("photoUrl")`);
    codeLines.push(`${indent}                                        if not m_url:`);
    codeLines.push(`${indent}                                            m_url = m_val.get("value")`);
    codeLines.push(`${indent}                                    else:`);
    codeLines.push(`${indent}                                        m_url = m_val`);
    codeLines.push(`${indent}                                    if m_url:`);
    codeLines.push(`${indent}                                        if "audio" in m_var.lower():`);
    codeLines.push(`${indent}                                            await bot.send_audio(recipient_id, m_url, caption=next_text)`);
    codeLines.push(`${indent}                                        elif "video" in m_var.lower():`);
    codeLines.push(`${indent}                                            await bot.send_video(recipient_id, m_url, caption=next_text)`);
    codeLines.push(`${indent}                                        elif "document" in m_var.lower():`);
    codeLines.push(`${indent}                                            await bot.send_document(recipient_id, m_url, caption=next_text)`);
    codeLines.push(`${indent}                                        else:`);
    codeLines.push(`${indent}                                            await bot.send_photo(recipient_id, m_url, caption=next_text)`);
    codeLines.push(`${indent}                                        next_media_sent = True`);
    codeLines.push(`${indent}                        # Если нет переменной, используем статические медиа`);
    codeLines.push(`${indent}                        if not next_media_sent:`);
    codeLines.push(`${indent}                            if next_audio:`);
    codeLines.push(`${indent}                                await bot.send_audio(recipient_id, next_audio, caption=next_text)`);
    codeLines.push(`${indent}                                next_media_sent = True`);
    codeLines.push(`${indent}                            elif next_video:`);
    codeLines.push(`${indent}                                await bot.send_video(recipient_id, next_video, caption=next_text)`);
    codeLines.push(`${indent}                                next_media_sent = True`);
    codeLines.push(`${indent}                            elif next_document:`);
    codeLines.push(`${indent}                                await bot.send_document(recipient_id, next_document, caption=next_text)`);
    codeLines.push(`${indent}                                next_media_sent = True`);
    codeLines.push(`${indent}                            elif next_image:`);
    codeLines.push(`${indent}                                await bot.send_photo(recipient_id, next_image, caption=next_text)`);
    codeLines.push(`${indent}                                next_media_sent = True`);
    codeLines.push(`${indent}                        if not next_media_sent:`);
    codeLines.push(`${indent}                            await bot.send_message(recipient_id, next_text)`);
    codeLines.push(`${indent}                        logging.info(f"✅ Сообщение узла {auto_target} отправлено")`);
    codeLines.push(`${indent}                    else:`);
    codeLines.push(`${indent}                        logging.warning(f"⚠️ Узел {auto_target} не найден в all_nodes_dict")`);
    codeLines.push(`${indent}                except Exception as auto_error:`);
    codeLines.push(`${indent}                    if "not mounted to a any bot instance" not in str(auto_error) and "This method is not mounted" not in str(auto_error):`);
    codeLines.push(`${indent}                        logging.error(f"❌ Ошибка автоперехода к {auto_target}: {auto_error}")`);
    codeLines.push(`${indent}        except Exception as send_error:`);
    codeLines.push(`${indent}            error_count += 1`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Отчёт о рассылке`);
    codeLines.push(`${indent}report = f"${successMessage}\\n🤖 Метод: Bot API\\n✅ Успешно: {success_count}\\n❌ Ошибок: {error_count}"`);
    codeLines.push(`${indent}await callback_query.message.answer(report)`);
  } else {
    codeLines.push(`${indent}# Нет сообщений для рассылки (проверьте enableBroadcast у message узлов)`);
    codeLines.push(`${indent}report = "⚠️ Нет сообщений для рассылки"`);
    codeLines.push(`${indent}await callback_query.message.answer(report)`);
  }

  return codeLines.join('\n');
}

/**
 * Генерирует код для рассылки нескольких message узлов с enableBroadcast=true
 *
 * @param {Node[]} nodes - Все узлы проекта
 * @param {string} broadcastNodeId - ID текущего broadcast узла
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateMultiMessageBroadcast(nodes: Node[], broadcastNodeId: string, indent: string = '    '): string {
  const codeLines: string[] = [];

  // Находим все message узлы с enableBroadcast=true
  const broadcastNodes = nodes.filter(n => {
    const nodeData = n.data as any;
    return n.type === 'message' &&
      nodeData?.enableBroadcast === true &&
      (!nodeData?.broadcastTargetNode || nodeData.broadcastTargetNode === 'all' || nodeData.broadcastTargetNode === broadcastNodeId)
  });

  if (broadcastNodes.length === 0) {
    codeLines.push(`${indent}# Нет сообщений для рассылки с enableBroadcast=true`);
    codeLines.push(`${indent}broadcast_nodes = []`);
    return codeLines.join('\n');
  }

  codeLines.push(`${indent}# Рассылка нескольких сообщений с enableBroadcast=true`);
  codeLines.push(`${indent}broadcast_nodes = [`);

  broadcastNodes.forEach(node => {
    const messageText = node.data?.messageText || '';
    const attachedMedia = node.data?.attachedMedia || [];
    const imageUrl = node.data?.imageUrl || '';
    const autoTransitionTo = node.data?.autoTransitionTo || '';
    const mediaStr = attachedMedia.length > 0 ? JSON.stringify(attachedMedia) : '[]';
    const imageUrlStr = imageUrl ? `"${imageUrl}"` : '""';
    const autoTransitionStr = autoTransitionTo ? `"${autoTransitionTo}"` : '""';
    codeLines.push(`${indent}    {"id": "${node.id}", "text": ${formatTextForPython(messageText)}, "attachedMedia": ${mediaStr}, "imageUrl": ${imageUrlStr}, "autoTransitionTo": ${autoTransitionStr}},`);
  });

  codeLines.push(`${indent}]`);

  return codeLines.join('\n');
}

/**
 * Генерирует отдельную функцию обработчика рассылки
 *
 * @param {Node} node - Узел типа broadcast
 * @param {Node[]} allNodes - Все узлы проекта для поиска message узлов с enableBroadcast
 * @param {boolean} enableComments - Включить ли комментарии в коде
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastHandler(node: Node, allNodes: Node[], enableComments: boolean = true): string {
  const codeLines: string[] = [];

  if (enableComments) {
    codeLines.push('# Код сгенерирован в generateBroadcastHandler.ts');
  }

  const safeNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  codeLines.push(`\n# @@NODE_START:${node.id}@@`);
  codeLines.push(`async def handle_broadcast_${safeNodeId}(callback_query, user_id):`);
  codeLines.push(`    # Обработчик рассылки для узла ${node.id}`);
  codeLines.push(generateBroadcastInline(node, allNodes, '    '));
  codeLines.push(`\n# @@NODE_END:${node.id}@@`);

  return codeLines.join('\n');
}
