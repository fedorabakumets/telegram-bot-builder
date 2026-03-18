/**
 * @fileoverview Тесты для компонентов команд
 * @module tests/unit/massive/commands.test
 */

/// <reference types="vitest/globals" />

import { describe, it, expect } from 'vitest';
import { startCommand } from '../../../massive/commands/start-command';
import { helpCommand } from '../../../massive/commands/help-command';
import { settingsCommand } from '../../../massive/commands/settings-command';
import { menuCommand } from '../../../massive/commands/menu-command';
import { customCommand } from '../../../massive/commands/custom-command';

describe('Command Components', () => {
  describe('startCommand', () => {
    it('должен иметь правильный id', () => {
      expect(startCommand.id).toBe('start-command');
    });

    it('должен иметь тип start', () => {
      expect(startCommand.type).toBe('start');
    });

    it('должен иметь команду /start', () => {
      expect(startCommand.defaultData?.command).toBe('/start');
    });

    it('должен иметь showInMenu: true', () => {
      expect(startCommand.defaultData?.showInMenu).toBe(true);
    });

    it('должен иметь описание', () => {
      expect(startCommand.description).toContain('Точка входа');
    });
  });

  describe('helpCommand', () => {
    it('должен иметь правильный id', () => {
      expect(helpCommand.id).toBe('help-command');
    });

    it('должен иметь тип command', () => {
      expect(helpCommand.type).toBe('command');
    });

    it('должен иметь команду /help', () => {
      expect(helpCommand.defaultData?.command).toBe('/help');
    });
  });

  describe('settingsCommand', () => {
    it('должен иметь правильный id', () => {
      expect(settingsCommand.id).toBe('settings-command');
    });

    it('должен иметь команду /settings', () => {
      expect(settingsCommand.defaultData?.command).toBe('/settings');
    });
  });

  describe('menuCommand', () => {
    it('должен иметь правильный id', () => {
      expect(menuCommand.id).toBe('menu-command');
    });

    it('должен иметь команду /menu', () => {
      expect(menuCommand.defaultData?.command).toBe('/menu');
    });
  });

  describe('customCommand', () => {
    it('должен иметь правильный id', () => {
      expect(customCommand.id).toBe('custom-command');
    });

    it('должен иметь тип command', () => {
      expect(customCommand.type).toBe('command');
    });

    it('должен иметь пустую команду по умолчанию', () => {
      expect(customCommand.defaultData?.command).toBe('');
    });
  });
});
