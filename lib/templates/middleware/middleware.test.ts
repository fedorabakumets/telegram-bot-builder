/**
 * @fileoverview Тесты для шаблона middleware
 * @module templates/middleware/middleware.test
 */

import { describe, it, expect } from 'vitest';
import { generateMiddleware, generateMessageLoggingCode } from './middleware.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  validParamsNoAutoRegister,
  validParamsDbOnly,
  invalidParamsWrongType,
} from './middleware.fixture';
import { middlewareParamsSchema } from './middleware.schema';

// ─── generateMiddleware() ─────────────────────────────────────────────────────

describe('generateMiddleware()', () => {
  it('генерирует register_user_middleware по умолчанию', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('async def register_user_middleware');
  });

  it('генерирует message_logging_middleware при БД включена', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('async def message_logging_middleware');
  });

  it('не генерирует message_logging_middleware без БД', () => {
    const r = generateMiddleware(validParamsDisabled);
    expect(r).not.toContain('async def message_logging_middleware');
  });

  it('включает обработку ошибок', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('try:');
    expect(r).toContain('except Exception as e:');
  });

  it('включает return await handler', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('return await handler(event, data)');
  });

  it('включает logging.error', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('logging.error');
  });
});

// ─── register_user_middleware ─────────────────────────────────────────────────

describe('register_user_middleware', () => {
  it('генерируется когда autoRegisterUsers=true', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('async def register_user_middleware');
  });

  it('не генерируется когда autoRegisterUsers=false', () => {
    const r = generateMiddleware(validParamsNoAutoRegister);
    expect(r).not.toContain('async def register_user_middleware');
  });

  it('инициализирует user_data при первом обращении', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('user_id not in user_data');
    expect(r).toContain("user_data[user_id] = {");
  });

  it('сохраняет username, first_name, last_name', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('username');
    expect(r).toContain('first_name');
    expect(r).toContain('last_name');
  });

  it('сохраняет language_code, is_premium, is_bot', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('language_code');
    expect(r).toContain('is_premium');
    expect(r).toContain('is_bot');
  });

  it('вызывает save_user_to_db при БД включена', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('save_user_to_db');
  });

  it('не вызывает save_user_to_db без БД', () => {
    const r = generateMiddleware(validParamsDisabled);
    expect(r).not.toContain('save_user_to_db');
  });

  it('логирует нового пользователя', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('Новый пользователь зарегистрирован');
  });
});

// ─── generateMessageLoggingCode() ────────────────────────────────────────────

describe('generateMessageLoggingCode()', () => {
  it('без БД возвращает только register_user_middleware', () => {
    const r = generateMessageLoggingCode(false, false, null, true);
    expect(r).toContain('register_user_middleware');
    expect(r).not.toContain('message_logging_middleware');
    expect(r).not.toContain('save_message_to_api');
  });

  it('с БД возвращает все middleware', () => {
    const r = generateMessageLoggingCode(true, false, null, true);
    expect(r).toContain('register_user_middleware');
    expect(r).toContain('message_logging_middleware');
    expect(r).toContain('save_message_to_api');
  });

  it('autoRegisterUsers=false не генерирует register_user_middleware', () => {
    const r = generateMessageLoggingCode(false, false, null, false);
    expect(r).not.toContain('register_user_middleware');
  });

  it('hasInlineButtons добавляет callback_query_logging_middleware', () => {
    const r = generateMessageLoggingCode(true, true, null, false);
    expect(r).toContain('callback_query_logging_middleware');
  });

  it('без hasInlineButtons нет callback_query_logging_middleware', () => {
    const r = generateMessageLoggingCode(true, false, null, false);
    expect(r).not.toContain('callback_query_logging_middleware');
  });
});

// ─── middlewareParamsSchema ───────────────────────────────────────────────────

describe('middlewareParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(middlewareParamsSchema.safeParse(validParamsEnabled).success).toBe(true);
  });

  it('принимает пустой объект (defaults)', () => {
    const r = middlewareParamsSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.userDatabaseEnabled).toBe(false);
      expect(r.data.autoRegisterUsers).toBe(false);
    }
  });

  it('отклоняет string вместо boolean', () => {
    expect(middlewareParamsSchema.safeParse(invalidParamsWrongType).success).toBe(false);
  });

  it('отклоняет null', () => {
    expect(middlewareParamsSchema.safeParse({ userDatabaseEnabled: null }).success).toBe(false);
  });

  it('имеет 2 поля', () => {
    expect(Object.keys(middlewareParamsSchema.shape).length).toBe(2);
  });
});

// ─── stale_update_filter_middleware ──────────────────────────────────────────

describe('stale_update_filter_middleware', () => {
  it('присутствует в выводе generateMiddleware', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('stale_update_filter_middleware');
  });

  it('присутствует при отключённой БД', () => {
    const r = generateMiddleware(validParamsDisabled);
    expect(r).toContain('stale_update_filter_middleware');
  });

  it('содержит MAX_UPDATE_AGE_SECONDS', () => {
    const r = generateMiddleware(validParamsEnabled);
    expect(r).toContain('MAX_UPDATE_AGE_SECONDS');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {  it('generateMiddleware быстрее 50ms', () => {
    const start = Date.now();
    generateMiddleware(validParamsEnabled);
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('generateMessageLoggingCode 100 раз быстрее 200ms', () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      generateMessageLoggingCode(true, true, null, true);
    }
    expect(Date.now() - start).toBeLessThan(200);
  });
});
