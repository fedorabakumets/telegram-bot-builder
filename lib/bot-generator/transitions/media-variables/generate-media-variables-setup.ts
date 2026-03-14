/**
 * @fileoverview Генерация установки переменных медиа
 * 
 * Модуль создаёт Python-код для установки переменных медиафайлов
 * (imageUrl, videoUrl, audioUrl, documentUrl) в user_data.
 * 
 * @module bot-generator/transitions/media-variables/generate-media-variables-setup
 */

/**
 * Параметры для генерации установки переменных медиа
 */
export interface MediaVariablesSetupParams {
  nodeId: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  documentUrl?: string;
  attachedMedia?: string[];
  userDatabaseEnabled: boolean;
}

/**
 * Генерирует Python-код для установки переменных медиа
 * 
 * @param params - Параметры медиа переменных
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMediaVariablesSetup(
  params: MediaVariablesSetupParams,
  indent: string = '    '
): string {
  const { nodeId, imageUrl, videoUrl, audioUrl, documentUrl, attachedMedia, userDatabaseEnabled } = params;
  
  let code = '';
  
  // Устанавливаем переменную изображения
  if (imageUrl && imageUrl.trim() !== '' && imageUrl !== 'undefined') {
    code += `${indent}# Устанавливаем переменную изображения для узла\n`;
    code += `${indent}user_id = callback_query.from_user.id\n`;
    code += `${indent}if user_id not in user_data:\n`;
    code += `${indent}    user_data[user_id] = {}\n`;
    code += `${indent}user_data[user_id]["image_url_${nodeId}"] = "${imageUrl}"\n`;
    if (userDatabaseEnabled) {
      code += `${indent}await update_user_data_in_db(user_id, "image_url_${nodeId}", "${imageUrl}")\n`;
    }
    code += `${indent}logging.info(f"✅ Переменная image_url_${nodeId} установлена: ${imageUrl}")\n`;
    code += `${indent}\n`;
  }

  // Устанавливаем переменные из attachedMedia
  if (attachedMedia && Array.isArray(attachedMedia)) {
    code += `${indent}# Устанавливаем переменные из attachedMedia\n`;
    code += `${indent}user_id = callback_query.from_user.id\n`;
    code += `${indent}if user_id not in user_data:\n`;
    code += `${indent}    user_data[user_id] = {}\n`;

    attachedMedia.forEach((mediaVar: string) => {
      if (mediaVar.startsWith('image_url_')) {
        // Уже обрабатывается выше
      } else if (mediaVar.startsWith('video_url_')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${videoUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${videoUrl}")\n`;
        }
      } else if (mediaVar.startsWith('audio_url_')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${audioUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${audioUrl}")\n`;
        }
      } else if (mediaVar.startsWith('document_url_')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${documentUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${documentUrl}")\n`;
        }
      } else if (mediaVar.startsWith('audioUrlVar')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${audioUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${audioUrl}")\n`;
        }
      } else if (mediaVar.startsWith('videoUrlVar')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${videoUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${videoUrl}")\n`;
        }
      } else if (mediaVar.startsWith('imageUrlVar')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${imageUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${imageUrl}")\n`;
        }
      } else if (mediaVar.startsWith('documentUrlVar')) {
        code += `${indent}user_data[user_id]["${mediaVar}"] = "${documentUrl}"\n`;
        if (userDatabaseEnabled) {
          code += `${indent}await update_user_data_in_db(user_id, "${mediaVar}", "${documentUrl}")\n`;
        }
      }
    });

    code += `${indent}logging.info(f"✅ Переменные из attachedMedia установлены для узла ${nodeId}")\n`;
    code += `${indent}\n`;
  }
  
  return code;
}
