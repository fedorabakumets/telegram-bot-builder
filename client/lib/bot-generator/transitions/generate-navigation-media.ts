/**
 * @fileoverview Генерация отправки медиа при навигации
 *
 * Модуль создаёт Python-код для отправки медиафайлов
 * при переходе между узлами в callback обработчиках.
 *
 * @module bot-generator/transitions/generate-navigation-media
 */

import { generateAttachedMediaSendCode } from '../MediaHandler';

/**
 * Параметры навигации
 */
export interface NavigationMediaParams {
  /** Узел для навигации */
  navTargetNode: any;
  /** ID пользователя */
  userId: string;
}

/**
 * Генерирует код отправки медиа при навигации
 *
 * @param params - Параметры навигации
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateNavigationMedia(
  params: NavigationMediaParams,
  indent: string
): string {
  const { navTargetNode, userId } = params;
  let code = '';

  const attachedMedia = navTargetNode.data.attachedMedia || [];
  if (attachedMedia.length > 0) {
    code += `${indent}# Обновляем user_vars для медиа\n`;
    code += `${indent}nav_user_vars = await get_user_from_db(${userId})\n`;
    code += `${indent}if not nav_user_vars:\n`;
    code += `${indent}    nav_user_vars = user_data.get(${userId}, {})\n`;
    code += `${indent}if not isinstance(nav_user_vars, dict):\n`;
    code += `${indent}    nav_user_vars = {}\n`;
    code += `${indent}# Отправляем сообщение с медиа\n`;

    const parseModeStr = navTargetNode.data.formatMode || 'HTML';
    const collectUserInputFlag = navTargetNode.data.collectUserInput === true ||
      navTargetNode.data.enableTextInput === true ||
      navTargetNode.data.enablePhotoInput === true ||
      navTargetNode.data.enableVideoInput === true ||
      navTargetNode.data.enableAudioInput === true ||
      navTargetNode.data.enableDocumentInput === true;

    const mediaCode = generateAttachedMediaSendCode(
      attachedMedia,
      new Map(),
      'nav_text',
      parseModeStr,
      'None',
      navTargetNode.id,
      indent,
      undefined,
      collectUserInputFlag,
      navTargetNode.data
    );

    if (mediaCode) {
      code += mediaCode;
    } else {
      code += `${indent}await bot.send_message(${userId}, nav_text)\n`;
    }
  } else {
    code += `${indent}await bot.send_message(${userId}, nav_text)\n`;
  }

  return code;
}
