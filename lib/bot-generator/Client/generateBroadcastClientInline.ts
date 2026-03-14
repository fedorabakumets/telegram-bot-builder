/**
 * @fileoverview Генерация inline-кода рассылки через Client API (Userbot)
 *
 * Этот модуль генерирует Python-код для обработки рассылки сообщений
 * через Telegram Client API (Telethon). Использует модульные функции
 * для проверки сессии, получения получателей, отправки медиа и автоперехода.
 *
 * @module generateBroadcastClientInline
 */

import { Node } from '@shared/schema';
import { generateBroadcastClientSession, generateBroadcastClientInit } from './generateBroadcastClientSession';
import { generateBroadcastClientRecipients } from './generateBroadcastClientRecipients';
import { generateBroadcastClientMediaSend } from './generateBroadcastClientMediaSend';
import { generateBroadcastClientAutoTransition } from './generateBroadcastClientAutoTransition';
import { generateBroadcastClientMultiMessage } from './generateBroadcastClientMultiMessage';

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

  // Генерируем код проверки сессии
  codeLines.push(generateBroadcastClientSession(indent, errorMessage));
  codeLines.push(`${indent}`);

  // Генерируем код получения получателей
  const idSource = data.idSourceType || 'bot_users';
  codeLines.push(generateBroadcastClientRecipients(idSource, indent, errorMessage));
  codeLines.push(`${indent}`);

  // Формируем список сообщений
  if (allNodes && allNodes.length > 0) {
    codeLines.push(`${indent}# Формируем список сообщений для рассылки`);
    codeLines.push(generateBroadcastClientMultiMessage(allNodes, node.id, indent));
    codeLines.push(`${indent}`);

    // Генерируем код инициализации клиента
    codeLines.push(generateBroadcastClientInit(indent));
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

    // Генерируем код отправки медиа
    codeLines.push(generateBroadcastClientMediaSend(`${indent}                `));

    codeLines.push(`${indent}                success_count += 1`);
    codeLines.push(`${indent}                `);

    // Генерируем код автоперехода
    codeLines.push(generateBroadcastClientAutoTransition(`${indent}                `));

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
