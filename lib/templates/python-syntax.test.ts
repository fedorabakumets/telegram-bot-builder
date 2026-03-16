/**
 * @fileoverview Интеграционные тесты на синтаксическую корректность Python
 * @module templates/python-syntax.test
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Проверяет синтаксическую корректность Python кода через py_compile
 * @param code - Python код для проверки
 * @param testName - Имя теста для сообщения об ошибке
 */
function assertValidPythonSyntax(code: string, testName: string): void {
  const tempDir = join(tmpdir(), `bot-builder-test-${Date.now()}`);
  const tempFile = join(tempDir, 'test.py');

  try {
    // Создаём временную директорию
    mkdirSync(tempDir, { recursive: true });

    // Записываем код в файл
    writeFileSync(tempFile, code, 'utf-8');

    // Запускаем python -m py_compile
    try {
      execSync(`python -m py_compile "${tempFile}"`, {
        stdio: 'pipe',
        timeout: 5000,
      });
    } catch (error: any) {
      const stderr = error.stderr?.toString() || error.stdout?.toString() || 'Unknown error';
      assert.fail(
        `${testName}: Синтаксическая ошибка Python:\n${stderr}\n\nКод:\n${code}`
      );
    }
  } finally {
    // Очищаем временные файлы
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки очистки
    }
  }
}

describe('PythonSyntaxValidation - интеграционные тесты', () => {
  let hasPython = false;

  before(() => {
    // Проверяем наличие Python
    try {
      execSync('python --version', { stdio: 'pipe' });
      hasPython = true;
    } catch {
      try {
        execSync('python3 --version', { stdio: 'pipe' });
        hasPython = true;
      } catch {
        hasPython = false;
      }
    }
  });

  describe('generateKeyboard', () => {
    it('должен генерировать валидный Python код для inline клавиатуры', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateKeyboard } = await import('./keyboard/keyboard.renderer');

      const code = generateKeyboard({
        keyboardType: 'inline',
        buttons: [
          { text: 'Button 1', action: 'callback', target: 'btn1', id: 'btn_1' },
          { text: 'Button 2', action: 'callback', target: 'btn2', id: 'btn_2' },
          { text: 'Site', action: 'url', target: 'https://example.com', id: 'btn_site' },
        ],
        resizeKeyboard: true,
        oneTimeKeyboard: false,
      });

      assertValidPythonSyntax(code, 'generateKeyboard inline');
    });

    it('должен генерировать валидный Python код для reply клавиатуры', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateKeyboard } = await import('./keyboard/keyboard.renderer');

      const code = generateKeyboard({
        keyboardType: 'reply',
        buttons: [
          { text: 'Button 1', action: 'callback', target: 'btn1', id: 'btn_1' },
          { text: 'Button 2', action: 'callback', target: 'btn2', id: 'btn_2' },
        ],
        resizeKeyboard: true,
        oneTimeKeyboard: false,
      });

      assertValidPythonSyntax(code, 'generateKeyboard reply');
    });
  });

  describe('generateStart', () => {
    it('должен генерировать валидный Python код для start обработчика', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateStart } = await import('./start/start.renderer');

      const code = generateStart({
        nodeId: 'start_1',
        messageText: '👋 Добро пожаловать!',
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        userDatabaseEnabled: true,
        synonyms: [],
        allowMultipleSelection: false,
        multiSelectVariable: '',
        keyboardType: 'inline',
        buttons: [
          { text: 'Menu', action: 'callback', target: 'menu', id: 'btn_menu' },
        ],
        formatMode: 'html',
      });

      assertValidPythonSyntax(code, 'generateStart');
    });
  });

  describe('generateCommand', () => {
    it('должен генерировать валидный Python код для command обработчика', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateCommand } = await import('./command/command.renderer');

      const code = generateCommand({
        nodeId: 'cmd_1',
        command: '/help',
        messageText: '🤖 Доступные команды:',
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        userDatabaseEnabled: true,
        synonyms: [],
        enableConditionalMessages: false,
        conditionalMessages: [],
        fallbackMessage: '',
        keyboardType: 'inline',
        buttons: [
          { text: 'Help', action: 'callback', target: 'help', id: 'btn_help' },
        ],
        formatMode: 'html',
      });

      assertValidPythonSyntax(code, 'generateCommand');
    });
  });

  describe('generateMessage', () => {
    it('должен генерировать валидный Python код для message обработчика', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateMessage } = await import('./message/message.renderer');

      const code = generateMessage({
        nodeId: 'msg_1',
        messageText: 'Привет!',
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        userDatabaseEnabled: true,
        enableAutoTransition: false,
        autoTransitionTo: undefined,
        keyboardType: 'inline',
        buttons: [
          { text: 'OK', action: 'callback', target: 'ok', id: 'btn_ok' },
        ],
        formatMode: 'none',
        enableConditionalMessages: false,
        conditionalMessages: [],
        fallbackMessage: '',
      });

      assertValidPythonSyntax(code, 'generateMessage');
    });
  });

  describe('generateDatabase', () => {
    it('должен генерировать валидный Python код для database функций', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateDatabase } = await import('./database/database.renderer');

      const code = generateDatabase({
        userDatabaseEnabled: true,
      });

      assertValidPythonSyntax(code, 'generateDatabase');
    });
  });

  describe('generateUtils', () => {
    it('должен генерировать валидный Python код для utils функций', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateUtils } = await import('./utils/utils-template.renderer');

      const code = generateUtils({
        userDatabaseEnabled: true,
      });

      assertValidPythonSyntax(code, 'generateUtils');
    });
  });

  describe('generateImports', () => {
    it('должен генерировать валидный Python код для imports', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateImports } = await import('./imports/imports.renderer');

      const code = generateImports({
        userDatabaseEnabled: true,
        hasInlineButtons: true,
        hasAutoTransitions: false,
        hasMediaNodes: false,
        hasUploadImages: false,
      });

      assertValidPythonSyntax(code, 'generateImports');
    });
  });

  describe('generateConfig', () => {
    it('должен генерировать валидный Python код для config', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateConfig } = await import('./config/config.renderer');

      const code = generateConfig({
        userDatabaseEnabled: true,
        projectId: 123,
      });

      assertValidPythonSyntax(code, 'generateConfig');
    });
  });

  describe('generateHeader', () => {
    it('должен генерировать валидный Python код для header', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateHeader } = await import('./header/header.renderer');

      const code = generateHeader({
        userDatabaseEnabled: false,
        hasInlineButtons: false,
        hasMediaNodes: false,
      });

      assertValidPythonSyntax(code, 'generateHeader');
    });
  });

  describe('generateMain', () => {
    it('должен генерировать валидный Python код для main', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateMain } = await import('./main/main.renderer');

      const code = generateMain({
        userDatabaseEnabled: true,
        hasInlineButtons: true,
        menuCommandsCount: 2,
      });

      assertValidPythonSyntax(code, 'generateMain');
    });
  });

  describe('generateMiddleware', () => {
    it('должен генерировать валидный Python код для middleware', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateMiddleware } = await import('./middleware/middleware.renderer');

      const code = generateMiddleware({
        userDatabaseEnabled: true,
      });

      assertValidPythonSyntax(code, 'generateMiddleware');
    });
  });

  describe('generateUniversalHandlers', () => {
    it('должен генерировать валидный Python код для universal handlers', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateUniversalHandlers } = await import('./universal-handlers/universal-handlers.renderer');

      const code = generateUniversalHandlers({
        userDatabaseEnabled: true,
      });

      assertValidPythonSyntax(code, 'generateUniversalHandlers');
    });
  });

  describe('generateBroadcast', () => {
    it('должен генерировать валидный Python код для broadcast', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateBroadcast } = await import('./broadcast/broadcast.renderer');

      const code = generateBroadcast({
        nodeId: 'broadcast_1',
        messageText: 'Рассылка!',
        enableBroadcast: true,
        enableConfirmation: true,
        confirmationText: 'Подтвердите',
        idSourceType: 'user_ids',
        broadcastApiType: 'bot',
      });

      assertValidPythonSyntax(code, 'generateBroadcast');
    });
  });

  describe('generateSticker', () => {
    it('должен генерировать валидный Python код для sticker', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateSticker } = await import('./sticker/sticker.renderer');

      const code = generateSticker({
        nodeId: 'sticker_1',
        stickerUrl: 'https://example.com/sticker.tgs',
        mediaCaption: 'Стикер',
        disableNotification: false,
      });

      assertValidPythonSyntax(code, 'generateSticker');
    });
  });

  describe('generateVoice', () => {
    it('должен генерировать валидный Python код для voice', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateVoice } = await import('./voice/voice.renderer');

      const code = generateVoice({
        nodeId: 'voice_1',
        voiceUrl: 'https://example.com/voice.ogg',
        mediaCaption: 'Голосовое',
        disableNotification: false,
      });

      assertValidPythonSyntax(code, 'generateVoice');
    });
  });

  describe('generateSafeEditOrSend', () => {
    it('должен генерировать валидный Python код для safe_edit_or_send', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateSafeEditOrSend } = await import('./safe-edit-or-send/safe-edit-or-send.renderer');

      const code = generateSafeEditOrSend({
        hasInlineButtonsOrSpecialNodes: true,
        hasAutoTransitions: false,
      });

      assertValidPythonSyntax(code, 'generateSafeEditOrSend');
    });
  });
});
