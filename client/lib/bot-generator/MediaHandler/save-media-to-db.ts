/**
 * @fileoverview Генерация функции сохранения медиа в базу данных
 *
 * Модуль создаёт Python-код для сохранения информации о медиа-файлах
 * (фото, видео, аудио, документы) напрямую в PostgreSQL без API.
 *
 * @module bot-generator/MediaHandler/save-media-to-db
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код для функции сохранения медиа в БД
 *
 * @returns Сгенерированный Python-код
 */
export function generateSaveMediaToDb(): string {
  const codeLines: string[] = [];

  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │      Сохранение медиа в БД              │');
  codeLines.push('# └─────────────────────────────────────────┘');
  codeLines.push('');
  codeLines.push('async def save_media_to_db(file_id: str, file_type: str, file_name: str = None, file_size: int = None, mime_type: str = None):');
  codeLines.push('    """Сохраняет информацию о медиа-файле в базу данных напрямую');
  codeLines.push('');
  codeLines.push('    Args:');
  codeLines.push('        file_id: ID файла в Telegram');
  codeLines.push('        file_type: Тип медиа (photo, video, audio, document)');
  codeLines.push('        file_name: Имя файла (опционально)');
  codeLines.push('        file_size: Размер файла в байтах (опционально)');
  codeLines.push('        mime_type: MIME-тип файла (опционально)');
  codeLines.push('');
  codeLines.push('    Returns:');
  codeLines.push('        dict: Информация о сохранённом медиа с id или None');
  codeLines.push('    """');
  codeLines.push('    try:');
  codeLines.push('        # Формируем путь к файлу в uploads');
  codeLines.push('        file_path = f"/uploads/{PROJECT_ID}/{file_id}_{file_name or file_type}"');
  codeLines.push('        ');
  codeLines.push('        # Формируем URL для доступа к файлу');
  codeLines.push('        file_url = f"{PROJECT_DIR}{file_path}"');
  codeLines.push('        ');
  codeLines.push('        async with db_pool.acquire() as conn:');
  codeLines.push('            # Вставляем информацию о медиа-файле');
  codeLines.push('            result = await conn.fetchrow(');
  codeLines.push('                """');
  codeLines.push('                INSERT INTO media_files (project_id, file_name, file_type, file_path, file_size, mime_type, url, is_public, usage_count)');
  codeLines.push('                VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0)');
  codeLines.push('                RETURNING id, file_name, file_type, url');
  codeLines.push('                """,');
  codeLines.push('                PROJECT_ID,');
  codeLines.push('                file_name or f"{file_type}_{file_id}",');
  codeLines.push('                file_type,');
  codeLines.push('                file_path,');
  codeLines.push('                file_size or 0,');
  codeLines.push('                mime_type or "application/octet-stream",');
  codeLines.push('                file_url');
  codeLines.push('            )');
  codeLines.push('            ');
  codeLines.push('            logging.info(f"✅ Медиа сохранено в БД: {file_type} (id={result[\'id\']})")');
  codeLines.push('            return {"id": result["id"], "file_name": result["file_name"], "file_type": result["file_type"], "url": result["url"]}');
  codeLines.push('    except Exception as e:');
  codeLines.push('        logging.error(f"❌ Ошибка сохранения медиа в БД: {e}")');
  codeLines.push('    return None');
  codeLines.push('');
  codeLines.push('async def link_media_to_message(message_id: int, media_id: int, media_kind: str = "photo", order_index: int = 0):');
  codeLines.push('    """Связывает медиа с сообщением в базе данных');
  codeLines.push('');
  codeLines.push('    Args:');
  codeLines.push('        message_id: ID сообщения в БД');
  codeLines.push('        media_id: ID медиа в БД');
  codeLines.push('        media_kind: Тип медиа (photo, video, audio, document)');
  codeLines.push('        order_index: Порядок медиа в сообщении');
  codeLines.push('    """');
  codeLines.push('    try:');
  codeLines.push('        async with db_pool.acquire() as conn:');
  codeLines.push('            # Вставляем связь в bot_message_media');
  codeLines.push('            await conn.execute(');
  codeLines.push('                """');
  codeLines.push('                INSERT INTO bot_message_media (message_id, media_file_id, media_kind, order_index)');
  codeLines.push('                VALUES ($1, $2, $3, $4)');
  codeLines.push('                """,');
  codeLines.push('                message_id,');
  codeLines.push('                media_id,');
  codeLines.push('                media_kind,');
  codeLines.push('                order_index');
  codeLines.push('            )');
  codeLines.push('            ');
  codeLines.push('            # Обновляем primary_media_id в bot_messages');
  codeLines.push('            await conn.execute(');
  codeLines.push('                """');
  codeLines.push('                UPDATE bot_messages SET primary_media_id = $1 WHERE id = $2');
  codeLines.push('                """,');
  codeLines.push('                media_id,');
  codeLines.push('                message_id');
  codeLines.push('            )');
  codeLines.push('            ');
  codeLines.push('            logging.info(f"🔗 Медиа связано с сообщением {message_id}")');
  codeLines.push('            return True');
  codeLines.push('    except Exception as e:');
  codeLines.push('        logging.error(f"❌ Ошибка связи медиа с сообщением: {e}")');
  codeLines.push('    return False');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'save-media-to-db.ts');
  return commentedCodeLines.join('\n');
}
