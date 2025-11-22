import https from 'https';
import http from 'http';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, normalize, relative, isAbsolute } from 'path';
import { pipeline } from 'stream/promises';

interface DownloadedPhoto {
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileName: string;
}

/**
 * Скачивает фото из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id фото из Telegram
 * @param projectId - ID проекта для организации файлов
 * @returns Информация о скачанном файле
 */
export async function downloadTelegramPhoto(
  botToken: string,
  fileId: string,
  projectId: number
): Promise<DownloadedPhoto> {
  try {
    // Шаг 1: Получаем file_path через getFile API
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    
    const fileInfo = await new Promise<any>((resolve, reject) => {
      const request = https.get(getFileUrl, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) {
              resolve(parsed.result);
            } else {
              reject(new Error(`Telegram API error: ${parsed.description || 'Unknown error'}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;
    
    // Санитизировать fileId (оставить только безопасные символы)
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
    
    // Определяем MIME тип на основе расширения файла
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    // Валидировать расширение (только безопасные форматы изображений)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid file type');
    }
    
    const mimeTypeMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    const mimeType = mimeTypeMap[extension] || 'image/jpeg';

    // Шаг 2: Создаем директорию для сохранения
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uploadDir = join(process.cwd(), 'uploads', String(projectId), date);
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Шаг 3: Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileName = `${timestamp}-${randomSuffix}-${safeFileId}.${extension}`;
    const localFilePath = join(uploadDir, fileName);
    
    // Валидировать путь (защита от directory traversal)
    const normalizedPath = normalize(localFilePath);
    const rel = relative(uploadDir, normalizedPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('Invalid file path - potential directory traversal');
    }

    // Шаг 4: Скачиваем файл
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    await new Promise<void>((resolve, reject) => {
      const request = https.get(downloadUrl, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
          return;
        }
        
        const fileStream = createWriteStream(localFilePath);
        pipeline(res, fileStream)
          .then(() => resolve())
          .catch(reject);
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Возвращаем относительный путь от корня проекта
    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return {
      filePath: relativeFilePath,
      fileSize,
      mimeType,
      fileName,
    };
  } catch (error) {
    console.error('Error downloading Telegram photo:', error);
    throw new Error(`Failed to download photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Скачивает видео из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id видео из Telegram
 * @param projectId - ID проекта для организации файлов
 * @returns Информация о скачанном файле
 */
export async function downloadTelegramVideo(
  botToken: string,
  fileId: string,
  projectId: number
): Promise<DownloadedPhoto> {
  try {
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    
    const fileInfo = await new Promise<any>((resolve, reject) => {
      const request = https.get(getFileUrl, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) {
              resolve(parsed.result);
            } else {
              reject(new Error(`Telegram API error: ${parsed.description || 'Unknown error'}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;
    
    // Санитизировать fileId (оставить только безопасные символы)
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
    
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    // Валидировать расширение (только безопасные форматы видео)
    const allowedExtensions = ['mp4', 'webm', 'avi', 'mov'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid file type');
    }
    
    const mimeTypeMap: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
    };
    const mimeType = mimeTypeMap[extension] || 'video/mp4';

    const date = new Date().toISOString().split('T')[0];
    const uploadDir = join(process.cwd(), 'uploads', String(projectId), date);
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileName = `${timestamp}-${randomSuffix}-${safeFileId}.${extension}`;
    const localFilePath = join(uploadDir, fileName);
    
    // Валидировать путь (защита от directory traversal)
    const normalizedPath = normalize(localFilePath);
    const rel = relative(uploadDir, normalizedPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('Invalid file path - potential directory traversal');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    await new Promise<void>((resolve, reject) => {
      const request = https.get(downloadUrl, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
          return;
        }
        
        const fileStream = createWriteStream(localFilePath);
        pipeline(res, fileStream)
          .then(() => resolve())
          .catch(reject);
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return {
      filePath: relativeFilePath,
      fileSize,
      mimeType,
      fileName,
    };
  } catch (error) {
    console.error('Error downloading Telegram video:', error);
    throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Скачивает аудио из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id аудио из Telegram
 * @param projectId - ID проекта для организации файлов
 * @returns Информация о скачанном файле
 */
export async function downloadTelegramAudio(
  botToken: string,
  fileId: string,
  projectId: number
): Promise<DownloadedPhoto> {
  try {
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    
    const fileInfo = await new Promise<any>((resolve, reject) => {
      const request = https.get(getFileUrl, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) {
              resolve(parsed.result);
            } else {
              reject(new Error(`Telegram API error: ${parsed.description || 'Unknown error'}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;
    
    // Санитизировать fileId (оставить только безопасные символы)
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
    
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    // Валидировать расширение (только безопасные форматы аудио)
    const allowedExtensions = ['mp3', 'ogg', 'wav', 'aac'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid file type');
    }
    
    const mimeTypeMap: { [key: string]: string } = {
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'wav': 'audio/wav',
      'aac': 'audio/aac',
    };
    const mimeType = mimeTypeMap[extension] || 'audio/mpeg';

    const date = new Date().toISOString().split('T')[0];
    const uploadDir = join(process.cwd(), 'uploads', String(projectId), date);
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileName = `${timestamp}-${randomSuffix}-${safeFileId}.${extension}`;
    const localFilePath = join(uploadDir, fileName);
    
    // Валидировать путь (защита от directory traversal)
    const normalizedPath = normalize(localFilePath);
    const rel = relative(uploadDir, normalizedPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('Invalid file path - potential directory traversal');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    await new Promise<void>((resolve, reject) => {
      const request = https.get(downloadUrl, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
          return;
        }
        
        const fileStream = createWriteStream(localFilePath);
        pipeline(res, fileStream)
          .then(() => resolve())
          .catch(reject);
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return {
      filePath: relativeFilePath,
      fileSize,
      mimeType,
      fileName,
    };
  } catch (error) {
    console.error('Error downloading Telegram audio:', error);
    throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Скачивает документ из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id документа из Telegram
 * @param projectId - ID проекта для организации файлов
 * @param originalFileName - Оригинальное имя файла (опционально)
 * @returns Информация о скачанном файле
 */
export async function downloadTelegramDocument(
  botToken: string,
  fileId: string,
  projectId: number,
  originalFileName?: string
): Promise<DownloadedPhoto> {
  try {
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    
    const fileInfo = await new Promise<any>((resolve, reject) => {
      const request = https.get(getFileUrl, { timeout: 30000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) {
              resolve(parsed.result);
            } else {
              reject(new Error(`Telegram API error: ${parsed.description || 'Unknown error'}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;
    
    // Санитизировать fileId (оставить только безопасные символы)
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
    
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    // Валидировать расширение (только безопасные форматы документов)
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid file type');
    }
    
    const mimeType = 'application/octet-stream'; // Общий тип для документов

    const date = new Date().toISOString().split('T')[0];
    const uploadDir = join(process.cwd(), 'uploads', String(projectId), date);
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    
    // Санитизация originalFileName
    const sanitizedFileName = originalFileName?.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
    const fileName = sanitizedFileName || `${timestamp}-${randomSuffix}-${safeFileId}.${extension}`;
    const localFilePath = join(uploadDir, fileName);
    
    // Валидировать путь (защита от directory traversal)
    const normalizedPath = normalize(localFilePath);
    const rel = relative(uploadDir, normalizedPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error('Invalid file path - potential directory traversal');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    await new Promise<void>((resolve, reject) => {
      const request = https.get(downloadUrl, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
          return;
        }
        
        const fileStream = createWriteStream(localFilePath);
        pipeline(res, fileStream)
          .then(() => resolve())
          .catch(reject);
      }).on('error', reject);

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return {
      filePath: relativeFilePath,
      fileSize,
      mimeType,
      fileName,
    };
  } catch (error) {
    console.error('Error downloading Telegram document:', error);
    throw new Error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
