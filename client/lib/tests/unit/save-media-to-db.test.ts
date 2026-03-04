/**
 * @fileoverview Тесты для генератора функций сохранения медиа в БД
 *
 * Модуль тестирует функцию generateSaveMediaToDb из save-media-to-db.ts.
 * Проверяет генерацию Python-кода для сохранения медиа в PostgreSQL.
 *
 * @module tests/unit/save-media-to-db.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSaveMediaToDb } from '../../bot-generator/MediaHandler/save-media-to-db';

/**
 * Тестирование генерации функций сохранения медиа
 */
describe('GenerateSaveMediaToDb', () => {
  /**
   * Тест: функция должна возвращать строку
   */
  it('должна возвращать строку с Python-кодом', () => {
    const code = generateSaveMediaToDb();

    assert.strictEqual(typeof code, 'string', 'должна возвращать строку');
    assert.ok(code.length > 0, 'код не должен быть пустым');
  });

  /**
   * Тест: код должен содержать функцию save_media_to_db
   */
  it('должен содержать функцию save_media_to_db', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('async def save_media_to_db('), 'должна содержать определение функции save_media_to_db');
    assert.ok(code.includes('file_id: str'), 'должна содержать параметр file_id');
    assert.ok(code.includes('file_type: str'), 'должна содержать параметр file_type');
  });

  /**
   * Тест: код должен содержать функцию link_media_to_message
   */
  it('должен содержать функцию link_media_to_message', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('async def link_media_to_message('), 'должна содержать определение функции link_media_to_message');
    assert.ok(code.includes('message_id: int'), 'должна содержать параметр message_id');
    assert.ok(code.includes('media_id: int'), 'должна содержать параметр media_id');
  });

  /**
   * Тест: код должен использовать db_pool для подключения к БД
   */
  it('должен использовать db_pool для подключения к БД', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('async with db_pool.acquire()'), 'должен использовать db_pool.acquire()');
  });

  /**
   * Тест: код должен содержать INSERT в media_files
   */
  it('должен содержать INSERT в media_files', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('INSERT INTO media_files'), 'должен содержать INSERT в media_files');
    assert.ok(code.includes('project_id'), 'должен содержать поле project_id');
    assert.ok(code.includes('file_name'), 'должен содержать поле file_name');
    assert.ok(code.includes('file_type'), 'должен содержать поле file_type');
    assert.ok(code.includes('file_path'), 'должен содержать поле file_path');
  });

  /**
   * Тест: код должен содержать INSERT в bot_message_media
   */
  it('должен содержать INSERT в bot_message_media', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('INSERT INTO bot_message_media'), 'должен содержать INSERT в bot_message_media');
    assert.ok(code.includes('message_id'), 'должен содержать поле message_id');
    assert.ok(code.includes('media_file_id'), 'должен содержать поле media_file_id');
    assert.ok(code.includes('media_kind'), 'должен содержать поле media_kind');
  });

  /**
   * Тест: код должен содержать UPDATE bot_messages
   */
  it('должен содержать UPDATE bot_messages', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('UPDATE bot_messages'), 'должен содержать UPDATE bot_messages');
    assert.ok(code.includes('primary_media_id'), 'должен содержать поле primary_media_id');
  });

  /**
   * Тест: код должен содержать логирование
   */
  it('должен содержать логирование', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('logging.info'), 'должен содержать logging.info');
    assert.ok(code.includes('logging.error'), 'должен содержать logging.error');
  });

  /**
   * Тест: код должен содержать обработку исключений
   */
  it('должен содержать обработку исключений', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('try:'), 'должен содержать try');
    assert.ok(code.includes('except Exception'), 'должен содержать except Exception');
  });

  /**
   * Тест: код должен содержать JSDoc комментарии
   */
  it('должен содержать JSDoc комментарии в Python', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('"""'), 'должен содержать docstring');
    assert.ok(code.includes('Args:'), 'должен содержать раздел Args');
    assert.ok(code.includes('Returns:'), 'должен содержать раздел Returns');
  });

  /**
   * Тест: код должен использовать PROJECT_ID
   */
  it('должен использовать PROJECT_ID', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('PROJECT_ID'), 'должен использовать PROJECT_ID');
  });

  /**
   * Тест: код должен возвращать результат из БД
   */
  it('должен возвращать результат из БД', () => {
    const code = generateSaveMediaToDb();

    assert.ok(code.includes('RETURNING'), 'должен содержать RETURNING');
    assert.ok(code.includes('return {'), 'должен возвращать dict');
  });
});
