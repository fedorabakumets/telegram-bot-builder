/**
 * @fileoverview Генерация кода для отправки медиа через Client API (Telethon)
 *
 * Этот модуль генерирует Python-код для отправки медиафайлов
 * (фото, видео, аудио, документы) получателям рассылки через
 * Telegram Client API с использованием библиотеки Telethon.
 *
 * @module generateBroadcastClientMediaSend
 */

/**
 * Генерирует код для отправки медиафайлов получателю через Client API
 *
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientMediaSend(indent: string = '                '): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Отправка медиа если есть`);
  codeLines.push(`${indent}media_sent = False`);
  codeLines.push(`${indent}attached_media = node_data.get("attachedMedia", [])`);
  codeLines.push(`${indent}image_url = node_data.get("imageUrl")`);
  codeLines.push(`${indent}audio_url = node_data.get("audioUrl")`);
  codeLines.push(`${indent}video_url = node_data.get("videoUrl")`);
  codeLines.push(`${indent}document_url = node_data.get("documentUrl")`);
  codeLines.push(`${indent}if attached_media or image_url or audio_url or video_url or document_url:`);
  codeLines.push(`${indent}    try:`);
  codeLines.push(`${indent}        if attached_media:`);
  codeLines.push(`${indent}            for media_var in attached_media:`);
  codeLines.push(`${indent}                media_value = all_user_vars.get(media_var)`);
  codeLines.push(`${indent}                if media_value:`);
  codeLines.push(`${indent}                    media_url_to_use = None`);
  codeLines.push(`${indent}                    if isinstance(media_value, dict):`);
  codeLines.push(`${indent}                        if "audio" in media_var.lower() and "audioUrl" in media_value:`);
  codeLines.push(`${indent}                            media_url_to_use = media_value.get("audioUrl")`);
  codeLines.push(`${indent}                        elif "video" in media_var.lower() and "videoUrl" in media_value:`);
  codeLines.push(`${indent}                            media_url_to_use = media_value.get("videoUrl")`);
  codeLines.push(`${indent}                        elif "document" in media_var.lower() and "documentUrl" in media_value:`);
  codeLines.push(`${indent}                            media_url_to_use = media_value.get("documentUrl")`);
  codeLines.push(`${indent}                        elif "photoUrl" in media_value:`);
  codeLines.push(`${indent}                            media_url_to_use = media_value.get("photoUrl")`);
  codeLines.push(`${indent}                        if not media_url_to_use:`);
  codeLines.push(`${indent}                            media_url_to_use = media_value.get("value")`);
  codeLines.push(`${indent}                    else:`);
  codeLines.push(`${indent}                        media_url_to_use = media_value`);
  codeLines.push(`${indent}                    if media_url_to_use:`);
  codeLines.push(`${indent}                        # Преобразуем путь к файлу`);
  codeLines.push(`${indent}                        media_path = get_full_media_path(media_url_to_use)`);
  codeLines.push(`${indent}                        if "audio" in media_var.lower():`);
  codeLines.push(`${indent}                            await app.send_file(recipient, media_path, caption=message_text)`);
  codeLines.push(`${indent}                        elif "video" in media_var.lower():`);
  codeLines.push(`${indent}                            await app.send_file(recipient, media_path, caption=message_text)`);
  codeLines.push(`${indent}                        elif "document" in media_var.lower():`);
  codeLines.push(`${indent}                            await app.send_file(recipient, media_path, caption=message_text)`);
  codeLines.push(`${indent}                        else:`);
  codeLines.push(`${indent}                            await app.send_file(recipient, media_path, caption=message_text)`);
  codeLines.push(`${indent}                        media_sent = True`);
  codeLines.push(`${indent}        if not media_sent:`);
  codeLines.push(`${indent}            # Преобразуем пути к файлам`);
  codeLines.push(`${indent}            if audio_url:`);
  codeLines.push(`${indent}                await app.send_file(recipient, get_full_media_path(audio_url), caption=message_text)`);
  codeLines.push(`${indent}                media_sent = True`);
  codeLines.push(`${indent}            elif video_url:`);
  codeLines.push(`${indent}                await app.send_file(recipient, get_full_media_path(video_url), caption=message_text)`);
  codeLines.push(`${indent}                media_sent = True`);
  codeLines.push(`${indent}            elif document_url:`);
  codeLines.push(`${indent}                await app.send_file(recipient, get_full_media_path(document_url), caption=message_text)`);
  codeLines.push(`${indent}                media_sent = True`);
  codeLines.push(`${indent}            elif image_url:`);
  codeLines.push(`${indent}                await app.send_file(recipient, get_full_media_path(image_url), caption=message_text)`);
  codeLines.push(`${indent}                media_sent = True`);
  codeLines.push(`${indent}    except Exception as media_error:`);
  codeLines.push(`${indent}        logging.error(f"❌ Ошибка отправки медиа: {media_error}")`);
  codeLines.push(`${indent}if not media_sent:`);
  codeLines.push(`${indent}    await app.send_message(recipient, message_text)`);

  return codeLines.join('\n');
}
