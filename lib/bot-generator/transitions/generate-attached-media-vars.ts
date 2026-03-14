/**
 * @fileoverview Генерация кода для обработки attachedMedia переменных
 * 
 * Модуль создаёт Python-код для установки переменных из attachedMedia
 * в user_data для последующего использования в других узлах.
 * 
 * @module bot-generator/transitions/generate-attached-media-vars
 */

/**
 * Генерирует Python-код для обработки attachedMedia
 * 
 * @param node - Узел сообщения с attachedMedia данными
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateAttachedMediaVars(
  node: any,
  indent: string = '                '
): string {
  if (!node.data.attachedMedia || !Array.isArray(node.data.attachedMedia)) {
    return '';
  }
  
  let code = '';
  
  code += `${indent}# Устанавливаем переменные из attachedMedia\n`;
  code += `${indent}user_id = message.from_user.id\n`;
  code += `${indent}if user_id not in user_data:\n`;
  code += `${indent}    user_data[user_id] = {}\n`;
  
  node.data.attachedMedia.forEach((mediaVar: string) => {
    if (mediaVar.startsWith('image_url_')) {
      // Уже обрабатывается в generateMediaSaveVars
    } else if (mediaVar.startsWith('video_url_')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.videoUrl}"\n`;
    } else if (mediaVar.startsWith('audio_url_')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.audioUrl}"\n`;
    } else if (mediaVar.startsWith('document_url_')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.documentUrl}"\n`;
    } else if (mediaVar.startsWith('audioUrlVar')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.audioUrl}"\n`;
    } else if (mediaVar.startsWith('videoUrlVar')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.videoUrl}"\n`;
    } else if (mediaVar.startsWith('imageUrlVar')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.imageUrl}"\n`;
    } else if (mediaVar.startsWith('documentUrlVar')) {
      code += `${indent}user_data[user_id]["${mediaVar}"] = "${node.data.documentUrl}"\n`;
    }
  });
  
  code += `${indent}logging.info(f"✅ Переменные из attachedMedia установлены для узла ${node.id}")\n`;
  
  return code;
}
