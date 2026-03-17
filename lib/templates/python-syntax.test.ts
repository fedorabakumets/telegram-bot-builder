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
 */
function assertValidPythonSyntax(code: string, testName: string): void {
  const tempDir = join(tmpdir(), `bot-builder-test-${Date.now()}`);
  const tempFile = join(tempDir, 'test.py');

  try {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(tempFile, code, 'utf-8');

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
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch { /* игнорируем */ }
  }
}

/**
 * Проверяет отсутствие undefined names через pyflakes.
 * Ловит NameError-подобные проблемы которые py_compile пропускает.
 *
 * Игнорируемые категории (шум от глобальных переменных бота):
 * - "imported but unused" — избыточные импорты не ломают бота
 * - "redefinition of unused" — переопределения не критичны
 * - "local variable.*assigned to but never used" — неиспользуемые переменные
 * - "global.*is unused" — global-декларации без присваивания
 * - "f-string is missing placeholders" — f-строки без {} (стилистика)
 * - "local variable.*defined in enclosing scope" — замыкания
 */
function assertNoUndefinedNames(code: string, testName: string): void {
  const tempDir = join(tmpdir(), `bot-builder-pyflakes-${Date.now()}`);
  const tempFile = join(tempDir, 'test.py');

  const IGNORED_PATTERNS = [
    /imported but unused/,
    /redefinition of unused/,
    /local variable .+ assigned to but never used/,
    /`global .+` is unused/,
    /f-string is missing placeholders/,
    /local variable .+ defined in enclosing scope/,
  ];

  try {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(tempFile, code, 'utf-8');

    let output = '';
    try {
      output = execSync(`python -m pyflakes "${tempFile}"`, {
        stdio: 'pipe',
        timeout: 10000,
      }).toString();
    } catch (error: any) {
      // pyflakes возвращает exit code 1 при наличии предупреждений — это нормально
      output = error.stdout?.toString() || error.stderr?.toString() || '';
    }

    // Фильтруем только критичные строки
    const criticalLines = output
      .split('\n')
      .filter(line => line.trim())
      .filter(line => !IGNORED_PATTERNS.some(p => p.test(line)));

    if (criticalLines.length > 0) {
      assert.fail(
        `${testName}: pyflakes обнаружил undefined names:\n${criticalLines.join('\n')}`
      );
    }
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch { /* игнорируем */ }
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
        menuCommands: [{ command: 'start', description: 'Запустить бота' }, { command: 'help', description: 'Помощь' }],
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

      const { generateBroadcastBot } = await import('./broadcast-bot/broadcast-bot.renderer');

      const code = generateBroadcastBot({
        nodeId: 'broadcast_1',
        idSourceType: 'bot_users',
        successMessage: 'Рассылка завершена!',
        errorMessage: 'Ошибка рассылки',
        broadcastNodes: [
          {
            id: 'msg_1',
            text: 'Рассылка!',
            formatMode: 'none',
            imageUrl: '',
            audioUrl: '',
            videoUrl: '',
            documentUrl: '',
            attachedMedia: [],
            autoTransitionTo: '',
          },
        ],
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

  describe('generateCommandCallbackHandler - спецсимволы в nodeId', () => {
    it('должен генерировать валидный Python код при дефисе в callbackData', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateCommandCallbackHandler } = await import('./handlers/command-callback-handler/command-callback-handler.renderer');

      // Реальный nodeId из бага: cmd_1KvQin0bE6-tRu9mm8xK_
      const code = generateCommandCallbackHandler({
        callbackData: 'cmd_1KvQin0bE6-tRu9mm8xK_',
        button: { action: 'command', id: 'btn_test', target: 'test', text: 'Test' },
        indentLevel: '',
        commandNode: 'command',
        command: 'test',
      });

      assertValidPythonSyntax(code, 'generateCommandCallbackHandler с дефисом');
    });

    it('должен генерировать валидный Python код при точках и спецсимволах в callbackData', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateCommandCallbackHandler } = await import('./handlers/command-callback-handler/command-callback-handler.renderer');

      const code = generateCommandCallbackHandler({
        callbackData: 'cmd_node.id@v2+extra',
        button: { action: 'command', id: 'btn_test', target: 'help', text: 'Help' },
        indentLevel: '',
        commandNode: 'command',
        command: 'help',
      });

      assertValidPythonSyntax(code, 'generateCommandCallbackHandler со спецсимволами');
    });

    it('должен генерировать валидный Python код при цифре в начале callbackData', async () => {
      if (!hasPython) {
        console.warn('⚠️ Python не найден, тест пропущен');
        return;
      }

      const { generateCommandCallbackHandler } = await import('./handlers/command-callback-handler/command-callback-handler.renderer');

      const code = generateCommandCallbackHandler({
        callbackData: '1abc-def',
        button: { action: 'command', id: 'btn_test', target: 'start', text: 'Start' },
        indentLevel: '',
        commandNode: 'start',
        command: 'start',
      });

      assertValidPythonSyntax(code, 'generateCommandCallbackHandler с цифрой в начале');
    });
  });

  // ===== PYFLAKES: проверка undefined names =====
  describe('pyflakes - полный собранный файл бота', () => {
    let hasPyflakes = false;

    before(() => {
      try {
        execSync('python -m pyflakes --version', { stdio: 'pipe' });
        hasPyflakes = true;
      } catch {
        hasPyflakes = false;
      }
    });

    it('полный минимальный файл бота не должен содержать undefined names', async () => {
      if (!hasPython || !hasPyflakes) {
        console.warn('⚠️ Python или pyflakes не найден, тест пропущен');
        return;
      }

      // Собираем полный файл из всех шаблонов — как это делает bot-generator
      const [
        { generateImports },
        { generateConfig },
        { generateHeader },
        { generateDatabase },
        { generateUtils },
        { generateMiddleware },
        { generateStart },
        { generateCommand },
        { generateMessage },
        { generateMain },
      ] = await Promise.all([
        import('./imports/imports.renderer'),
        import('./config/config.renderer'),
        import('./header/header.renderer'),
        import('./database/database.renderer'),
        import('./utils/utils-template.renderer'),
        import('./middleware/middleware.renderer'),
        import('./start/start.renderer'),
        import('./command/command.renderer'),
        import('./message/message.renderer'),
        import('./main/main.renderer'),
      ]);

      const parts = [
        generateHeader({ userDatabaseEnabled: true, hasInlineButtons: true, hasMediaNodes: false }),
        generateImports({ userDatabaseEnabled: true, hasInlineButtons: true, hasAutoTransitions: false, hasMediaNodes: false, hasUploadImages: false }),
        generateConfig({ userDatabaseEnabled: true, projectId: 1 }),
        generateDatabase({ userDatabaseEnabled: true }),
        generateUtils({ userDatabaseEnabled: true }),
        generateMiddleware({ userDatabaseEnabled: true }),
        generateStart({ nodeId: 'start_1', messageText: 'Привет!', isPrivateOnly: false, adminOnly: false, requiresAuth: false, userDatabaseEnabled: true, synonyms: [], allowMultipleSelection: false, multiSelectVariable: '', keyboardType: 'inline', buttons: [{ text: 'OK', action: 'callback', target: 'msg_1', id: 'btn_ok' }], formatMode: 'html' }),
        generateCommand({ nodeId: 'cmd_1', command: '/help', messageText: 'Помощь', isPrivateOnly: false, adminOnly: false, requiresAuth: false, userDatabaseEnabled: true, synonyms: [], enableConditionalMessages: false, conditionalMessages: [], fallbackMessage: '', keyboardType: 'inline', buttons: [], formatMode: 'html' }),
        generateMessage({ nodeId: 'msg_1', messageText: 'Сообщение', isPrivateOnly: false, adminOnly: false, requiresAuth: false, userDatabaseEnabled: true, enableAutoTransition: false, autoTransitionTo: undefined, keyboardType: 'inline', buttons: [], formatMode: 'none', enableConditionalMessages: false, conditionalMessages: [], fallbackMessage: '' }),
        generateMain({ userDatabaseEnabled: true, hasInlineButtons: true, menuCommands: [{ command: 'start', description: 'Запустить бота' }] }),
      ];

      const fullCode = parts.join('\n');
      assertNoUndefinedNames(fullCode, 'полный файл бота');
    });
  });
});
