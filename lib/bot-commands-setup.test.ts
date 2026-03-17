/**
 * @fileoverview Тесты для generateBotCommandsSetup
 * @module bot-commands-setup.test
 *
 * Покрывает проблему дублирования set_bot_commands:
 * функция должна генерироваться ровно один раз.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateBotCommandsSetup } from './bot-commands-setup';
import type { MenuCommand } from './bot-commands-setup';

const startCmd: MenuCommand = { data: { command: '/start', description: 'Запустить бота' } };
const helpCmd: MenuCommand = { data: { command: '/help', description: 'Помощь' } };
const noDescCmd: MenuCommand = { data: { command: '/info' } };

// ─── Базовая генерация ────────────────────────────────────────────────────────

describe('generateBotCommandsSetup()', () => {
  describe('пустой массив', () => {
    it('возвращает пустую строку', () => {
      assert.strictEqual(generateBotCommandsSetup([]), '');
    });
  });

  describe('одна команда', () => {
    it('генерирует async def set_bot_commands', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(r.includes('async def set_bot_commands():'));
    });

    it('содержит BotCommand с правильной командой', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(r.includes('BotCommand(command="start"'));
    });

    it('содержит описание команды', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(r.includes('Запустить бота'));
    });

    it('вызывает bot.set_my_commands', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(r.includes('await bot.set_my_commands(commands)'));
    });

    it('убирает слэш из имени команды', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(r.includes('command="start"'));
      assert.ok(!r.includes('command="/start"'));
    });
  });

  describe('несколько команд', () => {
    it('генерирует BotCommand для каждой команды', () => {
      const r = generateBotCommandsSetup([startCmd, helpCmd]);
      assert.ok(r.includes('command="start"'));
      assert.ok(r.includes('command="help"'));
    });

    it('содержит описания всех команд', () => {
      const r = generateBotCommandsSetup([startCmd, helpCmd]);
      assert.ok(r.includes('Запустить бота'));
      assert.ok(r.includes('Помощь'));
    });
  });

  describe('команда без описания', () => {
    it('использует дефолтное описание', () => {
      const r = generateBotCommandsSetup([noDescCmd]);
      assert.ok(r.includes('Команда бота'));
    });
  });

  // ─── Ключевая проверка: нет дублирования ─────────────────────────────────

  describe('отсутствие дублирования (проблема #4)', () => {
    it('set_bot_commands определяется ровно один раз', () => {
      const r = generateBotCommandsSetup([startCmd, helpCmd]);
      const count = (r.match(/async def set_bot_commands\(\)/g) || []).length;
      assert.strictEqual(count, 1, `set_bot_commands определена ${count} раз(а), ожидалось 1`);
    });

    it('bot.set_my_commands вызывается ровно один раз', () => {
      const r = generateBotCommandsSetup([startCmd, helpCmd]);
      const count = (r.match(/await bot\.set_my_commands/g) || []).length;
      assert.strictEqual(count, 1, `bot.set_my_commands вызван ${count} раз(а), ожидалось 1`);
    });
  });

  describe('корректность Python-кода', () => {
    it('не содержит артефактов Jinja2', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(!r.includes('{{'));
      assert.ok(!r.includes('}}'));
      assert.ok(!r.includes('{%'));
    });

    it('содержит список commands = [...]', () => {
      const r = generateBotCommandsSetup([startCmd]);
      assert.ok(r.includes('commands = ['));
      assert.ok(r.includes(']'));
    });
  });

  describe('производительность', () => {
    it('быстрее 10ms', () => {
      const start = Date.now();
      generateBotCommandsSetup([startCmd, helpCmd]);
      assert.ok(Date.now() - start < 10);
    });
  });
});
