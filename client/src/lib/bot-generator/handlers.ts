import { Node } from '@shared/schema';
import { 
  formatTextForPython, 
  getParseMode, 
  generateSecurityChecks, 
  generateUserRegistration,
  createSafeFunctionName,
  stripHtmlTags
} from './utils';
import { generateMessageWithKeyboard } from './keyboard-utils';

// Генерация обработчика стартовой команды
export function generateStartHandler(node: Node): string {
  let code = '\n# Обработчик команды /start\n';
  code += '@dp.message(CommandStart())\n';
  code += 'async def start_handler(message: types.Message):\n';
  
  // Добавляем проверки безопасности
  code += generateSecurityChecks(node);
  
  // Регистрация пользователя
  code += generateUserRegistration();

  // Основной текст сообщения
  const cleanedText = stripHtmlTags(node.data.messageText || '');
  const messageText = formatTextForPython(cleanedText);
  const parseMode = getParseMode(node.data.formatMode || 'text');
  
  code += '\n    text = ' + messageText + '\n';
  
  // Генерация клавиатуры и отправка сообщения
  code += generateMessageWithKeyboard(
    'text',
    (node.data.keyboardType as 'inline' | 'reply' | 'none') || 'none',
    node.data.buttons || [],
    parseMode
  );
  
  return code + '\n';
}

// Генерация обработчика пользовательской команды
export function generateCommandHandler(node: Node): string {
  const command = (node.data as any).command?.replace('/', '') || 'unknown';
  const safeFunctionName = createSafeFunctionName(command, 'command');
  
  let code = `\n# Обработчик команды ${(node.data as any).command}\n`;
  code += `@dp.message(Command("${command}"))\n`;
  code += `async def ${safeFunctionName}_handler(message: types.Message):\n`;
  
  // Добавляем проверки безопасности
  code += generateSecurityChecks(node);
  
  // Основной текст сообщения
  const cleanedText = stripHtmlTags(node.data.messageText || '');
  const messageText = formatTextForPython(cleanedText);
  const parseMode = getParseMode(node.data.formatMode || 'text');
  
  code += '\n    text = ' + messageText + '\n';
  
  // Генерация клавиатуры и отправка сообщения
  code += generateMessageWithKeyboard(
    'text',
    (node.data.keyboardType as 'inline' | 'reply' | 'none') || 'none',
    node.data.buttons || [],
    parseMode
  );
  
  return code + '\n';
}

// Генерация обработчика фото
export function generatePhotoHandler(node: Node): string {
  const safeFunctionName = createSafeFunctionName(node.id, 'photo');
  
  let code = `\n# Обработчик отправки фото для узла ${node.id}\n`;
  code += `async def handle_photo_${safeFunctionName}(message: types.Message):\n`;
  
  // Добавляем проверки безопасности
  code += generateSecurityChecks(node);
  
  const photoUrl = (node.data as any).photoUrl || '';
  const caption = (node.data as any).caption || node.data.messageText || '';
  const parseMode = getParseMode(node.data.formatMode || 'text');
  
  if (photoUrl) {
    const formattedCaption = formatTextForPython(caption);
    code += `    caption = ${formattedCaption}\n`;
    
    if (photoUrl.startsWith('http')) {
      code += `    photo = URLInputFile("${photoUrl}")\n`;
    } else {
      code += `    photo = FSInputFile("${photoUrl}")\n`;
    }
    
    code += `    await message.answer_photo(photo, caption=caption${parseMode})\n`;
  } else {
    code += '    await message.answer("❌ Фото не найдено")\n';
  }
  
  return code + '\n';
}

// Генерация обработчика видео
export function generateVideoHandler(node: Node): string {
  const safeFunctionName = createSafeFunctionName(node.id, 'video');
  
  let code = `\n# Обработчик отправки видео для узла ${node.id}\n`;
  code += `async def handle_video_${safeFunctionName}(message: types.Message):\n`;
  
  // Добавляем проверки безопасности
  code += generateSecurityChecks(node);
  
  const videoUrl = (node.data as any).videoUrl || '';
  const caption = (node.data as any).caption || node.data.messageText || '';
  const parseMode = getParseMode(node.data.formatMode || 'text');
  
  if (videoUrl) {
    const formattedCaption = formatTextForPython(caption);
    code += `    caption = ${formattedCaption}\n`;
    
    if (videoUrl.startsWith('http')) {
      code += `    video = URLInputFile("${videoUrl}")\n`;
    } else {
      code += `    video = FSInputFile("${videoUrl}")\n`;
    }
    
    code += `    await message.answer_video(video, caption=caption${parseMode})\n`;
  } else {
    code += '    await message.answer("❌ Видео не найдено")\n';
  }
  
  return code + '\n';
}

// Генерация обработчика аудио
export function generateAudioHandler(node: Node): string {
  const safeFunctionName = createSafeFunctionName(node.id, 'audio');
  
  let code = `\n# Обработчик отправки аудио для узла ${node.id}\n`;
  code += `async def handle_audio_${safeFunctionName}(message: types.Message):\n`;
  
  // Добавляем проверки безопасности
  code += generateSecurityChecks(node);
  
  const audioUrl = (node.data as any).audioUrl || '';
  const caption = (node.data as any).caption || node.data.messageText || '';
  
  if (audioUrl) {
    const formattedCaption = formatTextForPython(caption);
    code += `    caption = ${formattedCaption}\n`;
    
    if (audioUrl.startsWith('http')) {
      code += `    audio = URLInputFile("${audioUrl}")\n`;
    } else {
      code += `    audio = FSInputFile("${audioUrl}")\n`;
    }
    
    code += `    await message.answer_audio(audio, caption=caption)\n`;
  } else {
    code += '    await message.answer("❌ Аудио не найдено")\n';
  }
  
  return code + '\n';
}

// Генерация обработчика документа
export function generateDocumentHandler(node: Node): string {
  const safeFunctionName = createSafeFunctionName(node.id, 'document');
  
  let code = `\n# Обработчик отправки документа для узла ${node.id}\n`;
  code += `async def handle_document_${safeFunctionName}(message: types.Message):\n`;
  
  // Добавляем проверки безопасности
  code += generateSecurityChecks(node);
  
  const documentUrl = (node.data as any).documentUrl || '';
  const caption = (node.data as any).caption || node.data.messageText || '';
  
  if (documentUrl) {
    const formattedCaption = formatTextForPython(caption);
    code += `    caption = ${formattedCaption}\n`;
    
    if (documentUrl.startsWith('http')) {
      code += `    document = URLInputFile("${documentUrl}")\n`;
    } else {
      code += `    document = FSInputFile("${documentUrl}")\n`;
    }
    
    code += `    await message.answer_document(document, caption=caption)\n`;
  } else {
    code += '    await message.answer("❌ Документ не найден")\n';
  }
  
  return code + '\n';
}