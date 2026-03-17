/**
 * @fileoverview Тесты для generateDatabaseVariablesCode
 * @module generate-database-variables-universal.test
 *
 * Покрывает проблему мёртвого кода в handle_user_input:
 * загрузка user_telegram_settings и user_ids генерируется даже когда
 * переменные не используются в тексте сообщения.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateDatabaseVariablesCode } from './generate-database-variables-universal';

// ─── Базовая генерация ────────────────────────────────────────────────────────

describe('generateDatabaseVariablesCode()', () => {
  describe('без фильтрации (все переменные)', () => {
    it('генерирует блок для user_telegram_settings', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(r.includes('user_telegram_settings'));
    });

    it('генерирует блок для user_ids', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(r.includes('user_ids'));
    });

    it('содержит try/except для каждой таблицы', () => {
      const r = generateDatabaseVariablesCode('    ');
      const tryCount = (r.match(/\btry:/g) || []).length;
      assert.ok(tryCount >= 2, `Ожидалось >= 2 try-блоков, получено ${tryCount}`);
    });

    it('добавляет переменные в all_user_vars', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(r.includes('all_user_vars['));
    });

    it('логирует добавление переменных', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(r.includes('Переменные из БД добавлены в all_user_vars'));
    });
  });

  describe('фильтрация по используемым переменным (проблема #3)', () => {
    it('пропускает user_telegram_settings если переменные не используются', () => {
      const r = generateDatabaseVariablesCode('    ', ['user_name', 'first_name']);
      // Не должно быть кода загрузки tg_api_id и т.д.
      assert.ok(!r.includes("SELECT * FROM user_telegram_settings"));
    });

    it('пропускает user_ids если переменные не используются', () => {
      const r = generateDatabaseVariablesCode('    ', ['user_name']);
      assert.ok(!r.includes("SELECT user_id FROM user_ids"));
    });

    it('включает user_ids если user_ids используется', () => {
      const r = generateDatabaseVariablesCode('    ', ['user_ids']);
      assert.ok(r.includes("SELECT user_id FROM user_ids"));
    });

    it('включает user_telegram_settings если tg_api_id используется', () => {
      const r = generateDatabaseVariablesCode('    ', ['tg_api_id']);
      assert.ok(r.includes("SELECT * FROM user_telegram_settings"));
    });

    it('включает user_ids_count если используется', () => {
      const r = generateDatabaseVariablesCode('    ', ['user_ids_count']);
      assert.ok(r.includes('user_ids_count'));
    });

    it('пустой массив usedVariables — пропускает все таблицы', () => {
      const r = generateDatabaseVariablesCode('    ', []);
      assert.ok(!r.includes("SELECT * FROM user_telegram_settings"));
      assert.ok(!r.includes("SELECT user_id FROM user_ids"));
    });
  });

  describe('отступы', () => {
    it('применяет переданный отступ', () => {
      const r = generateDatabaseVariablesCode('        ');
      assert.ok(r.includes('        # Таблица:'));
    });

    it('дефолтный отступ — 8 пробелов', () => {
      const r = generateDatabaseVariablesCode();
      assert.ok(r.includes('        # Таблица:'));
    });
  });

  describe('корректность Python-кода', () => {
    it('не содержит артефактов Jinja2', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(!r.includes('{{'));
      assert.ok(!r.includes('{%'));
    });

    it('содержит обработку ошибок для каждого блока', () => {
      const r = generateDatabaseVariablesCode('    ');
      const exceptCount = (r.match(/except Exception as e:/g) || []).length;
      assert.ok(exceptCount >= 2, `Ожидалось >= 2 except-блоков, получено ${exceptCount}`);
    });

    it('user_ids инициализируется пустым списком при ошибке', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(r.includes('user_ids = []'));
      assert.ok(r.includes('user_ids_count = 0'));
    });

    it('tg-переменные инициализируются None при ошибке', () => {
      const r = generateDatabaseVariablesCode('    ');
      assert.ok(r.includes('tg_api_id = None'));
    });
  });

  describe('производительность', () => {
    it('быстрее 10ms', () => {
      const start = Date.now();
      generateDatabaseVariablesCode('    ');
      assert.ok(Date.now() - start < 10);
    });
  });
});
