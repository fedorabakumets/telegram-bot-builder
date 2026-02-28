/**
 * @fileoverview Генерация кода для отправки медиафайлов
 * 
 * Модуль создаёт Python-код для отправки фото, видео, аудио
 * и документов через aiogram с поддержкой caption.
 * 
 * @module bot-generator/transitions/generate-media-send
 */

import { generateMediaPathResolve } from './generate-media-path-resolve';

/**
 * Генерирует Python-код для отправки медиафайлов
 * 
 * @param node - Узел сообщения с медиа-данными
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMediaSend(
  node: any,
  indent: string = '                '
): string {
  let code = '';
  
  const hasImage = node.data.imageUrl;
  const hasVideo = node.data.videoUrl;
  const hasAudio = node.data.audioUrl;
  const hasDocument = node.data.documentUrl;
  
  if (hasImage || hasVideo || hasAudio || hasDocument) {
    if (hasImage) {
      if (node.data.imageUrl.startsWith('/uploads/')) {
        code += generateMediaPathResolve('image', node.data.imageUrl, indent);
        code += `${indent}await bot.send_photo(message.chat.id, image_url, caption=text, parse_mode=parse_mode)\n`;
      } else {
        code += `${indent}await bot.send_photo(message.chat.id, "${node.data.imageUrl}", caption=text, parse_mode=parse_mode)\n`;
      }
    } else if (hasVideo) {
      if (node.data.videoUrl && node.data.videoUrl.startsWith('/uploads/')) {
        code += generateMediaPathResolve('video', node.data.videoUrl, indent);
        code += `${indent}await bot.send_video(message.chat.id, video_url, caption=text, parse_mode=parse_mode)\n`;
      } else {
        code += `${indent}await bot.send_video(message.chat.id, "${node.data.videoUrl}", caption=text, parse_mode=parse_mode)\n`;
      }
    } else if (hasAudio) {
      if (node.data.audioUrl && node.data.audioUrl.startsWith('/uploads/')) {
        code += generateMediaPathResolve('audio', node.data.audioUrl, indent);
        code += `${indent}await bot.send_audio(message.chat.id, audio_url, caption=text, parse_mode=parse_mode)\n`;
      } else {
        code += `${indent}await bot.send_audio(message.chat.id, "${node.data.audioUrl}", caption=text, parse_mode=parse_mode)\n`;
      }
    } else if (hasDocument) {
      if (node.data.documentUrl && node.data.documentUrl.startsWith('/uploads/')) {
        code += generateMediaPathResolve('document', node.data.documentUrl, indent);
        code += `${indent}await bot.send_document(message.chat.id, document_url, caption=text, parse_mode=parse_mode)\n`;
      } else {
        code += `${indent}await bot.send_document(message.chat.id, "${node.data.documentUrl}", caption=text, parse_mode=parse_mode)\n`;
      }
    }
  }
  
  return code;
}
