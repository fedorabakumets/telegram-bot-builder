/**
 * @fileoverview Генерация кода для сохранения медиа-переменных в user_data
 * 
 * Модуль создаёт Python-код для сохранения URL медиафайлов (фото, видео,
 * аудио, документы) в user_data и базу данных.
 * 
 * @module bot-generator/transitions/generate-media-save-vars
 */

/**
 * Генерирует Python-код для сохранения медиа-переменных
 * 
 * @param node - Узел сообщения с медиа-данными
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMediaSaveVars(
  node: any,
  indent: string = '                '
): string {
  let code = '';
  
  if (node.data.imageUrl && node.data.imageUrl !== 'undefined') {
    code += `${indent}# Сохраняем imageUrl в переменную image_url_${node.id}\n`;
    code += `${indent}user_id = message.from_user.id\n`;
    code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
    code += `${indent}user_data[user_id]["image_url_${node.id}"] = "${node.data.imageUrl}"\n`;
    code += `${indent}await update_user_data_in_db(user_id, "image_url_${node.id}", "${node.data.imageUrl}")\n`;
  }
  
  if (node.data.documentUrl) {
    code += `${indent}# Сохраняем documentUrl в переменную document_url_${node.id}\n`;
    code += `${indent}user_id = message.from_user.id\n`;
    code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
    code += `${indent}user_data[user_id]["document_url_${node.id}"] = "${node.data.documentUrl}"\n`;
    code += `${indent}await update_user_data_in_db(user_id, "document_url_${node.id}", "${node.data.documentUrl}")\n`;
  }
  
  if (node.data.videoUrl) {
    code += `${indent}# Сохраняем videoUrl в переменную video_url_${node.id}\n`;
    code += `${indent}user_id = message.from_user.id\n`;
    code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
    code += `${indent}user_data[user_id]["video_url_${node.id}"] = "${node.data.videoUrl}"\n`;
    code += `${indent}await update_user_data_in_db(user_id, "video_url_${node.id}", "${node.data.videoUrl}")\n`;
  }
  
  if (node.data.audioUrl) {
    code += `${indent}# Сохраняем audioUrl в переменную audio_url_${node.id}\n`;
    code += `${indent}user_id = message.from_user.id\n`;
    code += `${indent}user_data[user_id] = user_data.get(user_id, {})\n`;
    code += `${indent}user_data[user_id]["audio_url_${node.id}"] = "${node.data.audioUrl}"\n`;
    code += `${indent}await update_user_data_in_db(user_id, "audio_url_${node.id}", "${node.data.audioUrl}")\n`;
  }
  
  return code;
}
