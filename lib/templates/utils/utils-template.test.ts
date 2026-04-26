/**
 * @fileoverview Тесты для шаблона утилит
 * @module templates/utils/utils-template.test
 */

import { describe, it, expect } from 'vitest';
import { generateUtils } from './utils-template.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  validParamsAdminOnly,
  invalidParamsWrongType,
} from './utils-template.fixture';
import { utilsParamsSchema } from './utils-template.schema';

// ─── init_user_variables ──────────────────────────────────────────────────────

describe('init_user_variables()', () => {
  it('генерируется всегда', () => {
    expect(generateUtils(validParamsDisabled)).toContain('async def init_user_variables');
  });

  it('сохраняет username, first_name, last_name', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain("user_data[user_id]['username']");
    expect(r).toContain("user_data[user_id]['first_name']");
    expect(r).toContain("user_data[user_id]['last_name']");
  });

  it('сохраняет language_code', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain("user_data[user_id]['language_code']");
  });

  it('сохраняет is_premium', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain("user_data[user_id]['is_premium']");
  });

  it('сохраняет is_bot', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain("user_data[user_id]['is_bot']");
  });

  it('сохраняет user_id и user_name', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain("user_data[user_id]['user_id']");
    expect(r).toContain("user_data[user_id]['user_name']");
  });
});

// ─── init_all_user_vars ───────────────────────────────────────────────────────

describe('init_all_user_vars()', () => {
  it('генерируется всегда', () => {
    expect(generateUtils(validParamsDisabled)).toContain('async def init_all_user_vars');
  });

  it('читает из user_data', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain('user_data.get(user_id, {})');
  });

  it('с БД подтягивает данные из bot_users', () => {
    const r = generateUtils(validParamsEnabled);
    expect(r).toContain('bot_users');
    expect(r).toContain('db_pool');
  });

  it('без БД не обращается к bot_users', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).not.toContain('bot_users');
  });

  it('добавляет project_id как системную переменную', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain('"project_id" not in all_vars');
    expect(r).toContain('all_vars["project_id"] = str(PROJECT_ID) if PROJECT_ID else ""');
  });

  it('добавляет token_id как системную переменную', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain('"token_id" not in all_vars');
    expect(r).toContain('all_vars["token_id"] = str(TOKEN_ID) if TOKEN_ID else ""');
  });
});

// ─── check_auth ───────────────────────────────────────────────────────────────

describe('check_auth()', () => {
  it('с БД проверяет через get_user_from_db', () => {
    const r = generateUtils(validParamsEnabled);
    expect(r).toContain('get_user_from_db');
    expect(r).toContain('if db_pool:');
  });

  it('без БД проверяет через user_data', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain('return user_id in user_data');
    expect(r).not.toContain('if db_pool:');
  });
});

// ─── is_admin ─────────────────────────────────────────────────────────────────

describe('is_admin()', () => {
  it('генерируется при adminOnly=true', () => {
    const r = generateUtils(validParamsAdminOnly);
    expect(r).toContain('async def is_admin');
    expect(r).toContain('ADMIN_IDS');
  });

  it('не генерируется без adminOnly', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).not.toContain('async def is_admin');
  });
});

// ─── get_user_variables ───────────────────────────────────────────────────────

describe('get_user_variables()', () => {
  it('генерируется всегда', () => {
    expect(generateUtils(validParamsDisabled)).toContain('def get_user_variables');
  });
});

// ─── replace_variables_in_text ───────────────────────────────────────────────

describe('replace_variables_in_text()', () => {
  it('генерируется всегда', () => {
    expect(generateUtils(validParamsDisabled)).toContain('def replace_variables_in_text');
  });

  it('поддерживает dot-notation для вложенных JSON путей', () => {
    const r = generateUtils(validParamsDisabled);
    // Функция должна содержать логику разбора пути через точку (через _re.split)
    expect(r).toContain("_re.split(r'\\.");
  });

  it('разворачивает вложенный путь из JSON-строки', () => {
    const r = generateUtils(validParamsDisabled);
    // Корень-строка парсится как JSON перед обходом пути
    expect(r).toContain('_json.loads(root)');
  });

  it('несуществующий dot-notation путь остаётся как есть', () => {
    const r = generateUtils(validParamsDisabled);
    // При отсутствии значения возвращается исходный match (match.group(0))
    expect(r).toContain('match.group(0)');
  });

  it('плоские переменные по-прежнему работают', () => {
    const r = generateUtils(validParamsDisabled);
    // Ветка без точки использует variables.get(var_path)
    expect(r).toContain("variables.get(var_path)");
  });

  it('использует regex для поиска {var} и {var.path}', () => {
    const r = generateUtils(validParamsDisabled);
    // Паттерн поддерживает {var}, {a.b.c}, {a.b[0][1].c}
    expect(r).toContain(String.raw`r'\{([\w.\[\]]+)\}'`);
  });
});

// ─── utilsParamsSchema ────────────────────────────────────────────────────────

describe('navigate_to_node()', () => {
  it('генерируется всегда как общий helper навигации', () => {
    const r = generateUtils(validParamsDisabled);
    expect(r).toContain('async def navigate_to_node');
    expect(r).toContain('await message.answer');
  });
});

describe('utilsParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(utilsParamsSchema.safeParse(validParamsEnabled).success).toBe(true);
  });

  it('принимает пустой объект (defaults)', () => {
    const r = utilsParamsSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.userDatabaseEnabled).toBe(false);
  });

  it('отклоняет string вместо boolean', () => {
    expect(utilsParamsSchema.safeParse(invalidParamsWrongType).success).toBe(false);
  });

  it('отклоняет null', () => {
    expect(utilsParamsSchema.safeParse({ userDatabaseEnabled: null }).success).toBe(false);
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateUtils быстрее 50ms', () => {
    const start = Date.now();
    generateUtils(validParamsEnabled);
    expect(Date.now() - start).toBeLessThan(50);
  });
});
