/**
 * @fileoverview Генерация inline-кода рассылки для вставки в callback handler
 *
 * Этот модуль генерирует Python-код для обработки рассылки сообщений
 * пользователям из базы данных. Использует модульные функции для
 * получения получателей, отправки медиа и автоперехода.
 *
 * @module generateBroadcastInline
 */

import { Node } from '@shared/schema';
import { generateMultiMessageBroadcast } from './generateMultiMessageBroadcast';
import { generateBroadcastRecipients } from './generateBroadcastRecipients';
import { generateBroadcastMediaSend } from './generateBroadcastMediaSend';
import { generateBroadcastAutoTransition } from './generateBroadcastAutoTransition';
import { processCodeWithAutoComments } from '../../../utils/generateGeneratedComment';

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

  // Генерируем код получения получателей
  const idSource = data.idSourceType || 'bot_users';
  codeLines.push(generateBroadcastRecipients(idSource, indent, errorMessage));
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

    // Генерируем код отправки медиа
    codeLines.push(generateBroadcastMediaSend(indent));

    codeLines.push(`${indent}            success_count += 1`);
    codeLines.push(`${indent}            # Автопереход если указан`);
    codeLines.push(`${indent}            auto_target = node_data.get("autoTransitionTo")`);
    codeLines.push(`${indent}            if auto_target:`);

    // Генерируем код автоперехода
    codeLines.push(generateBroadcastAutoTransition(indent));

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

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(codeLines, 'generateBroadcastInline.ts');
  return processedCode.join('\n');
}
