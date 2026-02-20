/**
 * @fileoverview Генерация кода для рассылки через Client API (Userbot)
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * реализующего рассылку сообщений через Telegram Client API (Pyrogram).
 * Позволяет отправлять сообщения пользователям, которые не писали боту.
 *
 * @module generateBroadcastClientHandler
 */

import { Node } from '@shared/schema';
import { formatTextForPython } from '../format';

/**
 * Генерирует код рассылки через Client API для вставки внутрь callback handler
 *
 * @param {Node} node - Узел типа broadcast
 * @param {Node[]} allNodes - Все узлы проекта для поиска message узлов с enableBroadcast
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientInline(node: Node, allNodes: Node[] | null, indent: string = '    '): string {
  const codeLines: string[] = [];
  const data = node.data as any;

  const errorMessage = data.errorMessage || '❌ Ошибка рассылки';

  codeLines.push(`${indent}# Обработка узла рассылки через Client API`);
  codeLines.push(`${indent}logging.info(f"📢 Запуск рассылки через Client API из узла ${node.id}")`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Проверка авторизации Client API`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);
  codeLines.push(`${indent}        client_session = await conn.fetchrow(`);
  codeLines.push(`${indent}            "SELECT session_string, user_id, api_id, api_hash FROM user_telegram_settings WHERE is_active = 1 LIMIT 1"`);
  codeLines.push(`${indent}        )`);
  codeLines.push(`${indent}        logging.info(f"🔑 Client API сессия: user_id={client_session['user_id'] if client_session else 'None'}")`);
  codeLines.push(`${indent}        if client_session:`);
  codeLines.push(`${indent}            logging.info(f"🔑 API ID: {client_session.get('api_id', 'None')[:10] if client_session.get('api_id') else 'None'}...")`);
  codeLines.push(`${indent}except Exception as e:`);
  codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения сессии Client API: {e}")`);
  codeLines.push(`${indent}    await callback_query.message.answer("${errorMessage}")`);
  codeLines.push(`${indent}    return`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}if not client_session:`);
  codeLines.push(`${indent}    logging.error("❌ Client API не авторизован")`);
  codeLines.push(`${indent}    await callback_query.message.answer("⚠️ Требуется авторизация Client API во вкладке Telegram Client")`);
  codeLines.push(`${indent}    return`);
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
  codeLines.push(`${indent}logging.info(f"👤 Рассылка через Client API (Userbot) от {client_session['user_id']}")`);
  codeLines.push(`${indent}`);

  // Формируем список сообщений
  if (allNodes && allNodes.length > 0) {
    codeLines.push(`${indent}# Формируем список сообщений для рассылки`);
    codeLines.push(generateMultiMessageBroadcast(allNodes, node.id, indent));
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Проверка credentials перед инициализацией`);
    codeLines.push(`${indent}api_id_val = client_session["api_id"] if client_session else None`);
    codeLines.push(`${indent}api_hash_val = client_session["api_hash"] if client_session else None`);
    codeLines.push(`${indent}session_string_val = client_session["session_string"] if client_session else None`);
    codeLines.push(`${indent}if not api_id_val or not api_hash_val or not session_string_val:`);
    codeLines.push(`${indent}    logging.error("❌ Client API: отсутствуют credentials или сессия")`);
    codeLines.push(`${indent}    logging.error(f"🔍 Debug: api_id={api_id_val}, api_hash={'present' if api_hash_val else 'None'}, session={'present' if session_string_val else 'None'}")`);
    codeLines.push(`${indent}    error_msg = "⚠️ Client API не настроен: "`);
    codeLines.push(`${indent}    if not api_id_val or not api_hash_val: error_msg += "Нет API credentials. "`);
    codeLines.push(`${indent}    if not session_string_val: error_msg += "Нет сессии. Авторизуйтесь во вкладке Telegram Client."`);
    codeLines.push(`${indent}    await callback_query.message.answer(error_msg)`);
    codeLines.push(`${indent}    return`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Инициализация Client API (Telethon)`);
    codeLines.push(`${indent}from telethon import TelegramClient`);
    codeLines.push(`${indent}from telethon.sessions import StringSession`);
    codeLines.push(`${indent}from telethon.tl.types import Message`);
    codeLines.push(`${indent}import os`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Функция для преобразования локального пути в полный путь`);
    codeLines.push(`${indent}def get_full_media_path(path):`);
    codeLines.push(`${indent}    """Преобразует локальный путь в полный путь для Windows"""`);
    codeLines.push(`${indent}    if not path:`);
    codeLines.push(`${indent}        return path`);
    codeLines.push(`${indent}    # Если путь уже полный или это URL, возвращаем как есть`);
    codeLines.push(`${indent}    if path.startswith('http://') or path.startswith('https://'):`);
    codeLines.push(`${indent}        return path`);
    codeLines.push(`${indent}    if os.path.isabs(path):`);
    codeLines.push(`${indent}        return path`);
    codeLines.push(`${indent}    # Путь к папке uploads (находится в корне проекта)`);
    codeLines.push(`${indent}    # Бот находится в bots/имя_бота/, проект на 2 уровня выше`);
    codeLines.push(`${indent}    base_dir = os.path.dirname(os.path.abspath(__file__))  # bots\\имя_бота\\`);
    codeLines.push(`${indent}    project_dir = os.path.dirname(os.path.dirname(base_dir))  # поднимаемся к корню проекта`);
    codeLines.push(`${indent}    # Преобразуем путь /uploads/34/... в полный путь`);
    codeLines.push(`${indent}    if path.startswith('/uploads/'):`);
    codeLines.push(`${indent}        relative_path = path.lstrip('/')  # uploads/34/...`);
    codeLines.push(`${indent}        full_path = os.path.join(project_dir, relative_path)`);
    codeLines.push(`${indent}    else:`);
    codeLines.push(`${indent}        uploads_dir = os.path.join(project_dir, 'uploads')`);
    codeLines.push(`${indent}        full_path = os.path.join(uploads_dir, path.lstrip('/'))`);
    codeLines.push(`${indent}    # Для Windows конвертируем обратные слеши`);
    codeLines.push(`${indent}    return full_path.replace('/', '\\\\')`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Создание клиента из сессии`);
    codeLines.push(`${indent}api_id = int(client_session["api_id"])`);
    codeLines.push(`${indent}api_hash = client_session["api_hash"]`);
    codeLines.push(`${indent}session_string = client_session["session_string"]`);
    codeLines.push(`${indent}logging.info(f"🔧 Инициализация Telethon: api_id={api_id}, session={session_string[:20]}...")`);
    codeLines.push(`${indent}app = TelegramClient(StringSession(session_string), api_id=api_id, api_hash=api_hash)`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Отправляем сообщения всем получателям`);
    codeLines.push(`${indent}success_count = 0`);
    codeLines.push(`${indent}error_count = 0`);
    codeLines.push(`${indent}blocked_count = 0`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}await app.connect()`);
    codeLines.push(`${indent}try:`);
    codeLines.push(`${indent}    for recipient_id in recipients:`);
    codeLines.push(`${indent}        # Преобразуем ID в формат для Telethon`);
    codeLines.push(`${indent}        try:`);
    codeLines.push(`${indent}            recipient_int = int(recipient_id)`);
    codeLines.push(`${indent}            # Для пользователей используем PeerUser`);
    codeLines.push(`${indent}            from telethon.tl.types import PeerUser`);
    codeLines.push(`${indent}            recipient = PeerUser(user_id=recipient_int)`);
    codeLines.push(`${indent}        except ValueError:`);
    codeLines.push(`${indent}            # Если ID не число, используем как username`);
    codeLines.push(`${indent}            recipient = recipient_id`);
    codeLines.push(`${indent}        `);
    codeLines.push(`${indent}        # Обработка цепочки узлов с автопереходом`);
    codeLines.push(`${indent}        current_node_index = 0`);
    codeLines.push(`${indent}        while current_node_index < len(broadcast_nodes):`);
    codeLines.push(`${indent}            node_data = broadcast_nodes[current_node_index]`);
    codeLines.push(`${indent}            if not node_data["text"].strip():`);
    codeLines.push(`${indent}                current_node_index += 1`);
    codeLines.push(`${indent}                continue`);
    codeLines.push(`${indent}            try:`);
    codeLines.push(`${indent}                # Замена переменных для текущего получателя`);
    codeLines.push(`${indent}                message_text = replace_variables_in_text(node_data["text"], {**user_data.get(recipient_id, {}), "user_id": recipient_id})`);
    codeLines.push(`${indent}                all_user_vars = {**user_data.get(recipient_id, {}), "user_id": recipient_id}`);
    codeLines.push(`${indent}                # Отправка медиа если есть`);
    codeLines.push(`${indent}                media_sent = False`);
    codeLines.push(`${indent}                attached_media = node_data.get("attachedMedia", [])`);
    codeLines.push(`${indent}                image_url = node_data.get("imageUrl")`);
    codeLines.push(`${indent}                audio_url = node_data.get("audioUrl")`);
    codeLines.push(`${indent}                video_url = node_data.get("videoUrl")`);
    codeLines.push(`${indent}                document_url = node_data.get("documentUrl")`);
    codeLines.push(`${indent}                if attached_media or image_url or audio_url or video_url or document_url:`);
    codeLines.push(`${indent}                    try:`);
    codeLines.push(`${indent}                        if attached_media:`);
    codeLines.push(`${indent}                            for media_var in attached_media:`);
    codeLines.push(`${indent}                                media_value = all_user_vars.get(media_var)`);
    codeLines.push(`${indent}                                if media_value:`);
    codeLines.push(`${indent}                                    media_url_to_use = None`);
    codeLines.push(`${indent}                                    if isinstance(media_value, dict):`);
    codeLines.push(`${indent}                                        if "audio" in media_var.lower() and "audioUrl" in media_value:`);
    codeLines.push(`${indent}                                            media_url_to_use = media_value.get("audioUrl")`);
    codeLines.push(`${indent}                                        elif "video" in media_var.lower() and "videoUrl" in media_value:`);
    codeLines.push(`${indent}                                            media_url_to_use = media_value.get("videoUrl")`);
    codeLines.push(`${indent}                                        elif "document" in media_var.lower() and "documentUrl" in media_value:`);
    codeLines.push(`${indent}                                            media_url_to_use = media_value.get("documentUrl")`);
    codeLines.push(`${indent}                                        elif "photoUrl" in media_value:`);
    codeLines.push(`${indent}                                            media_url_to_use = media_value.get("photoUrl")`);
    codeLines.push(`${indent}                                        if not media_url_to_use:`);
    codeLines.push(`${indent}                                            media_url_to_use = media_value.get("value")`);
    codeLines.push(`${indent}                                    else:`);
    codeLines.push(`${indent}                                        media_url_to_use = media_value`);
    codeLines.push(`${indent}                                    if media_url_to_use:`);
    codeLines.push(`${indent}                                        # Преобразуем путь к файлу`);
    codeLines.push(`${indent}                                        media_path = get_full_media_path(media_url_to_use)`);
    codeLines.push(`${indent}                                        if "audio" in media_var.lower():`);
    codeLines.push(`${indent}                                            await app.send_file(recipient, media_path, caption=message_text)`);
    codeLines.push(`${indent}                                        elif "video" in media_var.lower():`);
    codeLines.push(`${indent}                                            await app.send_file(recipient, media_path, caption=message_text)`);
    codeLines.push(`${indent}                                        elif "document" in media_var.lower():`);
    codeLines.push(`${indent}                                            await app.send_file(recipient, media_path, caption=message_text)`);
    codeLines.push(`${indent}                                        else:`);
    codeLines.push(`${indent}                                            await app.send_file(recipient, media_path, caption=message_text)`);
    codeLines.push(`${indent}                                        media_sent = True`);
    codeLines.push(`${indent}                        if not media_sent:`);
    codeLines.push(`${indent}                            # Преобразуем пути к файлам`);
    codeLines.push(`${indent}                            if audio_url:`);
    codeLines.push(`${indent}                                await app.send_file(recipient, get_full_media_path(audio_url), caption=message_text)`);
    codeLines.push(`${indent}                                media_sent = True`);
    codeLines.push(`${indent}                            elif video_url:`);
    codeLines.push(`${indent}                                await app.send_file(recipient, get_full_media_path(video_url), caption=message_text)`);
    codeLines.push(`${indent}                                media_sent = True`);
    codeLines.push(`${indent}                            elif document_url:`);
    codeLines.push(`${indent}                                await app.send_file(recipient, get_full_media_path(document_url), caption=message_text)`);
    codeLines.push(`${indent}                                media_sent = True`);
    codeLines.push(`${indent}                            elif image_url:`);
    codeLines.push(`${indent}                                await app.send_file(recipient, get_full_media_path(image_url), caption=message_text)`);
    codeLines.push(`${indent}                                media_sent = True`);
    codeLines.push(`${indent}                    except Exception as media_error:`);
    codeLines.push(`${indent}                        logging.error(f"❌ Ошибка отправки медиа: {media_error}")`);
    codeLines.push(`${indent}                if not media_sent:`);
    codeLines.push(`${indent}                    await app.send_message(recipient, message_text)`);
    codeLines.push(`${indent}                success_count += 1`);
    codeLines.push(`${indent}                `);
    codeLines.push(`${indent}                # Проверка автоперехода к следующему узлу`);
    codeLines.push(`${indent}                auto_transition_to = node_data.get("autoTransitionTo", "")`);
    codeLines.push(`${indent}                if auto_transition_to:`);
    codeLines.push(`${indent}                    logging.info(f"⚡ Автопереход от узла {node_data['id']} к узлу {auto_transition_to}")`);
    codeLines.push(`${indent}                    # Ищем следующий узел в списке broadcast_nodes`);
    codeLines.push(`${indent}                    next_index = next((i for i, n in enumerate(broadcast_nodes) if n["id"] == auto_transition_to), -1)`);
    codeLines.push(`${indent}                    if next_index != -1:`);
    codeLines.push(`${indent}                        current_node_index = next_index`);
    codeLines.push(`${indent}                        logging.info(f"✅ Автопереход выполнен: {node_data['id']} -> {auto_transition_to}")`);
    codeLines.push(`${indent}                    else:`);
    codeLines.push(`${indent}                        logging.warning(f"⚠️ Узел для автоперехода не найден: {auto_transition_to}")`);
    codeLines.push(`${indent}                        current_node_index += 1`);
    codeLines.push(`${indent}                else:`);
    codeLines.push(`${indent}                    current_node_index += 1`);
    codeLines.push(`${indent}            `);
    codeLines.push(`${indent}            except Exception as send_error:`);
    codeLines.push(`${indent}                error_msg = str(send_error)`);
    codeLines.push(`${indent}                if "PEER_ID_INVALID" in error_msg or "bot" in str(recipient_id):`);
    codeLines.push(`${indent}                    blocked_count += 1`);
    codeLines.push(`${indent}                    logging.warning(f"⚠️ Пользователь {recipient_id} заблокировал бота")`);
    codeLines.push(`${indent}                else:`);
    codeLines.push(`${indent}                    error_count += 1`);
    codeLines.push(`${indent}                    logging.error(f"❌ Ошибка отправки {recipient_id}: {send_error}")`);
    codeLines.push(`${indent}                current_node_index += 1`);
    codeLines.push(`${indent}finally:`);
    codeLines.push(`${indent}    await app.disconnect()`);
    codeLines.push(`${indent}`);
    codeLines.push(`${indent}# Отчёт о рассылке`);
    codeLines.push(`${indent}report = f"✅ Рассылка завершена\\n👤 Метод: Client API (Userbot)\\n📊 Успешно: {success_count}\\n⚠️ Ошибок: {error_count}\\n🚫 Заблокировано: {blocked_count}"`);
    codeLines.push(`${indent}logging.info(report)`);
    codeLines.push(`${indent}await callback_query.message.answer(report)`);
  } else {
    codeLines.push(`${indent}# Нет сообщений для рассылки (проверьте enableBroadcast у message узлов)`);
    codeLines.push(`${indent}report = "⚠️ Нет сообщений для рассылки"`);
    codeLines.push(`${indent}logging.warning(report)`);
    codeLines.push(`${indent}await callback_query.message.answer(report)`);
  }

  return codeLines.join('\n');
}

/**
 * Генерирует код для рассылки нескольких message узлов с enableBroadcast=true
 * Строит полную цепочку узлов с учётом автопереходов
 *
 * @param {Node[]} nodes - Все узлы проекта
 * @param {string} broadcastNodeId - ID текущего broadcast узла
 * @param {string} indent - Отступ
 * @returns {string} Код для формирования списка сообщений
 */
export function generateMultiMessageBroadcast(nodes: Node[], broadcastNodeId: string, indent: string = '    '): string {
  const codeLines: string[] = [];

  // Находим все message узлы с enableBroadcast=true
  const broadcastNodes = nodes.filter(n => {
    const nodeData = n.data as any;
    return n.type === 'message' &&
      nodeData?.enableBroadcast === true &&
      (!nodeData?.broadcastTargetNode || nodeData.broadcastTargetNode === 'all' || nodeData.broadcastTargetNode === broadcastNodeId);
  });

  if (broadcastNodes.length === 0) {
    codeLines.push(`${indent}# Нет сообщений для рассылки с enableBroadcast=true`);
    codeLines.push(`${indent}broadcast_nodes = []`);
    return codeLines.join('\n');
  }

  // Строим полную цепочку узлов с учётом автопереходов
  const allNodesInChain = new Map<string, any>();

  // Сначала добавляем все broadcast узлы
  broadcastNodes.forEach(node => {
    const nodeData = node.data as any;
    allNodesInChain.set(node.id, {
      id: node.id,
      text: nodeData.messageText || nodeData.text || '',
      formatMode: nodeData.formatMode || 'text',
      imageUrl: nodeData.imageUrl || '',
      audioUrl: nodeData.audioUrl || '',
      videoUrl: nodeData.videoUrl || '',
      documentUrl: nodeData.documentUrl || '',
      attachedMedia: nodeData.attachedMedia || [],
      autoTransitionTo: nodeData.autoTransitionTo || ''
    });
  });

  // Теперь проходим по цепочке автопереходов и добавляем недостающие узлы
  let hasNewNodes = true;
  while (hasNewNodes) {
    hasNewNodes = false;
    allNodesInChain.forEach((nodeData) => {
      if (nodeData.autoTransitionTo && !allNodesInChain.has(nodeData.autoTransitionTo)) {
        // Ищем узел для автоперехода в общем списке узлов
        const targetNode = nodes.find(n => n.id === nodeData.autoTransitionTo);
        if (targetNode && targetNode.type === 'message') {
          const targetData = targetNode.data as any;
          allNodesInChain.set(targetNode.id, {
            id: targetNode.id,
            text: targetData.messageText || targetData.text || '',
            formatMode: targetData.formatMode || 'text',
            imageUrl: targetData.imageUrl || '',
            audioUrl: targetData.audioUrl || '',
            videoUrl: targetData.videoUrl || '',
            documentUrl: targetData.documentUrl || '',
            attachedMedia: targetData.attachedMedia || [],
            autoTransitionTo: targetData.autoTransitionTo || ''
          });
          hasNewNodes = true;
        }
      }
    });
  }

  codeLines.push(`${indent}# Рассылка нескольких сообщений с учётом цепочки автопереходов`);
  codeLines.push(`${indent}broadcast_nodes = [`);

  allNodesInChain.forEach((nodeData) => {
    const formattedText = formatTextForPython(nodeData.text);

    codeLines.push(`${indent}    {`);
    codeLines.push(`${indent}        "id": "${nodeData.id}",`);
    codeLines.push(`${indent}        "text": ${formattedText},`);
    codeLines.push(`${indent}        "formatMode": "${nodeData.formatMode}",`);
    codeLines.push(`${indent}        "imageUrl": "${nodeData.imageUrl}",`);
    codeLines.push(`${indent}        "audioUrl": "${nodeData.audioUrl}",`);
    codeLines.push(`${indent}        "videoUrl": "${nodeData.videoUrl}",`);
    codeLines.push(`${indent}        "documentUrl": "${nodeData.documentUrl}",`);
    codeLines.push(`${indent}        "attachedMedia": ${JSON.stringify(nodeData.attachedMedia)},`);
    codeLines.push(`${indent}        "autoTransitionTo": "${nodeData.autoTransitionTo}"`);
    codeLines.push(`${indent}    },`);
  });

  codeLines.push(`${indent}]`);

  return codeLines.join('\n');
}

/**
 * Генерирует отдельную функцию обработчика рассылки через Client API
 *
 * @param {Node} node - Узел типа broadcast
 * @param {Node[]} allNodes - Все узлы проекта для поиска message узлов с enableBroadcast
 * @param {boolean} enableComments - Включить комментарии
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientHandler(node: Node, allNodes: Node[], enableComments: boolean = true): string {
  const codeLines: string[] = [];
  const safeNodeId = node.id.replace(/-/g, '_');

  if (enableComments) {
    codeLines.push('# Код сгенерирован в generateBroadcastClientHandler.ts');
    codeLines.push(`# Обработчик рассылки через Client API для узла ${node.id}`);
    codeLines.push('');
  }

  codeLines.push(`async def handle_broadcast_client_${safeNodeId}(callback_query, user_id):`);
  codeLines.push(`    # Обработчик рассылки через Client API для узла ${node.id}`);
  codeLines.push(generateBroadcastClientInline(node, allNodes, '    '));

  return codeLines.join('\n');
}
