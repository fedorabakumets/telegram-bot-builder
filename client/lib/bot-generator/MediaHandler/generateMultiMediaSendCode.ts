/**
 * @fileoverview Генерация кода отправки нескольких медиа-сообщений
 *
 * Модуль предоставляет функцию для генерации Python-кода отправки
 * нескольких медиафайлов через send_media_group.
 *
 * Документы отправляются отдельной группой (нельзя смешивать с photo/video/audio).
 *
 * @module generateMultiMediaSendCode
 */

import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";
import { splitMediaForSending, getMediaTypeByUrl } from './utils';

/**
 * Генерирует Python код для отправки нескольких медиафайлов
 *
 * @param attachedMedia - Массив URL медиафайлов
 * @param nodeId - Идентификатор узла
 * @param indentLevel - Уровень отступа
 * @param captionVar - Имя переменной caption (например, 'text')
 * @param parseMode - Режим форматирования (HTML/Markdown)
 * @param keyboard - Клавиатура
 * @param userIdSource - Источник user_id
 * @returns Сгенерированный Python код
 */
export function generateMultiMediaSendCode(
  attachedMedia: string[],
  nodeId: string,
  indentLevel: string,
  captionVar: string = 'text',
  parseMode: string = '',
  keyboard: string = 'None',
  userIdSource: string = 'callback_query.from_user.id'
): string {
  const codeLines: string[] = [];

  // Фильтруем URL (только /uploads/ или http)
  const mediaUrls = attachedMedia.filter(url =>
    url.startsWith('/uploads/') || url.startsWith('http')
  );

  if (mediaUrls.length === 0) {
    return '';
  }

  // Разделяем медиа на группы: документы отдельно, остальное вместе
  const { groupable, documents } = splitMediaForSending(mediaUrls);

  // Генерируем код для группы медиа (photo/video/audio)
  if (groupable.length > 0) {
    codeLines.push(`${indentLevel}# 📎 Отправка группы медиа (${groupable.length} шт.)`);
    codeLines.push(`${indentLevel}# NOTE: Требуется импорт: from aiogram.types import InputMediaPhoto, InputMediaVideo, InputMediaAudio`);
    codeLines.push(`${indentLevel}media_group = []`);

    groupable.forEach((url, index) => {
      const fileType = getMediaTypeByUrl(url);
      const mediaClass = getMediaClass(fileType);
      const hasCaption = index === 0 && captionVar && captionVar.trim() !== '';
      const hasParseMode = index === 0 && parseMode && parseMode.trim() !== '' && parseMode.trim().toLowerCase() !== 'none';
      const captionParam = hasCaption ? `, caption=${captionVar}` : '';
      const parseModeParam = hasParseMode ? `, parse_mode="${parseMode.trim().toLowerCase() === 'markdown' ? 'Markdown' : 'HTML'}"` : '';

      codeLines.push(`${indentLevel}# Файл ${index + 1}: ${url}`);
      codeLines.push(`${indentLevel}if str("${url}").startswith('/uploads/'):`);
      codeLines.push(`${indentLevel}    file_path_${index} = get_upload_file_path("${url}")`);
      codeLines.push(`${indentLevel}    media_group.append(${mediaClass}(media=FSInputFile(file_path_${index})${captionParam}${parseModeParam}))`);
      codeLines.push(`${indentLevel}else:`);
      codeLines.push(`${indentLevel}    media_group.append(${mediaClass}(media="${url}"${captionParam}${parseModeParam}))`);
    });

    codeLines.push(`${indentLevel}`);
    codeLines.push(`${indentLevel}# Отправляем группу медиафайлов`);
    codeLines.push(`${indentLevel}# NOTE: В aiogram 3.x send_media_group не поддерживает reply_markup`);
    codeLines.push(`${indentLevel}try:`);
    codeLines.push(`${indentLevel}    sent_messages = await bot.send_media_group(${userIdSource}, media_group)`);
    codeLines.push(`${indentLevel}    logging.info(f"✅ Отправлено {len(media_group)} медиафайлов для узла ${nodeId}")`);
    codeLines.push(`${indentLevel}    # Отправляем клавиатуру отдельным сообщением после медиагруппы`);
    codeLines.push(`${indentLevel}    if ${keyboard} and ${keyboard} is not None:`);
    codeLines.push(`${indentLevel}        await bot.send_message(${userIdSource}, text, reply_markup=${keyboard})`);
    codeLines.push(`${indentLevel}except Exception as e:`);
    codeLines.push(`${indentLevel}    logging.error(f"❌ Ошибка отправки медиа-группы: {e}")`);
  }

  // Генерируем код для документов (группой)
  if (documents.length > 0) {
    if (groupable.length > 0) {
      codeLines.push(`${indentLevel}`);
      codeLines.push(`${indentLevel}# 📄 Документы отправляются отдельной группой`);
    }

    codeLines.push(`${indentLevel}# Отправка группы документов (${documents.length} шт.)`);
    codeLines.push(`${indentLevel}document_group = []`);

    documents.forEach((url, index) => {
      codeLines.push(`${indentLevel}# Документ ${index + 1}: ${url}`);
      codeLines.push(`${indentLevel}if str("${url}").startswith('/uploads/'):`);
      codeLines.push(`${indentLevel}    file_path_doc_${index} = get_upload_file_path("${url}")`);
      codeLines.push(`${indentLevel}    document_group.append(InputMediaDocument(media=FSInputFile(file_path_doc_${index})))`);
      codeLines.push(`${indentLevel}else:`);
      codeLines.push(`${indentLevel}    document_group.append(InputMediaDocument(media="${url}"))`);
    });

    codeLines.push(`${indentLevel}`);
    codeLines.push(`${indentLevel}# Отправляем группу документов`);
    codeLines.push(`${indentLevel}# NOTE: В aiogram 3.x send_media_group не поддерживает reply_markup`);
    codeLines.push(`${indentLevel}try:`);
    codeLines.push(`${indentLevel}    sent_messages = await bot.send_media_group(${userIdSource}, document_group)`);
    codeLines.push(`${indentLevel}    logging.info(f"✅ Отправлено {len(document_group)} документов для узла ${nodeId}")`);
    codeLines.push(`${indentLevel}    # Отправляем клавиатуру отдельным сообщением после документов`);
    codeLines.push(`${indentLevel}    if ${keyboard} and ${keyboard} is not None:`);
    codeLines.push(`${indentLevel}        await bot.send_message(${userIdSource}, text, reply_markup=${keyboard})`);
    codeLines.push(`${indentLevel}except Exception as e:`);
    codeLines.push(`${indentLevel}    logging.error(f"❌ Ошибка отправки группы документов: {e}")`);
  }

  const processedCode = processCodeWithAutoComments(codeLines, 'generateMultiMediaSendCode.ts');
  return processedCode.join('\n');
}

/** Получение класса медиа для aiogram */
function getMediaClass(fileType: string): string {
  switch (fileType) {
    case 'photo': return 'InputMediaPhoto';
    case 'video': return 'InputMediaVideo';
    case 'audio': return 'InputMediaAudio';
    default: return 'InputMediaDocument';
  }
}
