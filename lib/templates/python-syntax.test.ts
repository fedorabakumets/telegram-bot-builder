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
 * Оборачивает код в async-функцию если он начинается с отступа
 * (т.е. является фрагментом, а не standalone-файлом).
 * Обрабатывает специальные случаи:
 * - фрагменты с `except` — оборачивает в try/except
 * - фрагменты с `elif`/`else` — оборачивает в if True: pass
 */
function wrapIfIndented(code: string): string {
  const lines = code.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return 'pass\n';
  const firstLine = lines[0];
  if (firstLine.startsWith(' ') || firstLine.startsWith('\t')) {
    const trimmedFirst = firstLine.trim();
    // Фрагмент начинается с except — нужен try: pass перед ним
    if (trimmedFirst.startsWith('except ')) {
      const indented = code.split('\n').map(l => '    ' + l).join('\n');
      return `async def _test_func():\n    try:\n        pass\n${indented}\n`;
    }
    // Фрагмент начинается с elif/else — нужен if True: pass перед ним
    if (trimmedFirst.startsWith('elif ') || trimmedFirst.startsWith('else:')) {
      const indented = code.split('\n').map(l => '    ' + l).join('\n');
      return `async def _test_func():\n    if True:\n        pass\n${indented}\n`;
    }
    const indented = code.split('\n').map(l => '    ' + l).join('\n');
    return `async def _test_func():\n${indented}\n`;
  }
  return code;
}

/**
 * Проверяет синтаксическую корректность Python кода через py_compile
 */
function assertValidPythonSyntax(code: string, testName: string): void {
  const tempDir = join(tmpdir(), `bot-builder-test-${Date.now()}`);
  const tempFile = join(tempDir, 'test.py');

  try {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(tempFile, wrapIfIndented(code), 'utf-8');

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
          {
            text: 'Button 1', action: 'goto', target: 'btn1', id: 'btn_1',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            text: 'Button 2', action: 'goto', target: 'btn2', id: 'btn_2',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            text: 'Site', action: 'url', target: 'https://example.com', id: 'btn_site',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
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
          {
            text: 'Button 1', action: 'goto', target: 'btn1', id: 'btn_1',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
          {
            text: 'Button 2', action: 'goto', target: 'btn2', id: 'btn_2',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
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
          {
            text: 'Menu', action: 'goto', target: 'menu', id: 'btn_menu',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
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
          {
            text: 'Help', action: 'goto', target: 'help', id: 'btn_help',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
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
          {
            text: 'OK', action: 'goto', target: 'ok', id: 'btn_ok',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
        ],
        formatMode: 'none',
        enableConditionalMessages: false,
        conditionalMessages: [],
        fallbackMessage: '',
      });

      assertValidPythonSyntax(code, 'generateMessage');
    });

    it('должен генерировать валидный Python код для message обработчика с синонимами', async () => {
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
          {
            text: 'OK', action: 'goto', target: 'ok', id: 'btn_ok',
            buttonType: 'complete',
            skipDataCollection: false,
            hideAfterClick: false
          },
        ],
        formatMode: 'none',
        enableConditionalMessages: false,
        conditionalMessages: [],
        fallbackMessage: '',
        synonymEntries: [
          {
            synonym: 'новое',
            nodeId: 'msg_1',
            nodeType: 'message',
            functionName: 'handle_callback_msg_1',
            originalCommand: '',
            messageText: '',
          },
        ],
      });

      assertValidPythonSyntax(code, 'generateMessage с синонимами');
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
        generateStart({ nodeId: 'start_1', messageText: 'Привет!', isPrivateOnly: false, adminOnly: false, requiresAuth: false, userDatabaseEnabled: true, synonyms: [], allowMultipleSelection: false, multiSelectVariable: '', keyboardType: 'inline', buttons: [{
          text: 'OK', action: 'goto', target: 'msg_1', id: 'btn_ok',
          buttonType: 'complete',
          skipDataCollection: false,
          hideAfterClick: false
        }], formatMode: 'html' }),
        generateCommand({ nodeId: 'cmd_1', command: '/help', messageText: 'Помощь', isPrivateOnly: false, adminOnly: false, requiresAuth: false, userDatabaseEnabled: true, synonyms: [], enableConditionalMessages: false, conditionalMessages: [], fallbackMessage: '', keyboardType: 'inline', buttons: [], formatMode: 'html' }),
        generateMessage({ nodeId: 'msg_1', messageText: 'Сообщение', isPrivateOnly: false, adminOnly: false, requiresAuth: false, userDatabaseEnabled: true, enableAutoTransition: false, autoTransitionTo: undefined, keyboardType: 'inline', buttons: [], formatMode: 'none', enableConditionalMessages: false, conditionalMessages: [], fallbackMessage: '' }),
        generateMain({ userDatabaseEnabled: true, hasInlineButtons: false, menuCommands: [{ command: 'start', description: 'Запустить бота' }] }),
      ];

      const fullCode = parts.join('\n');
      assertNoUndefinedNames(fullCode, 'полный файл бота');
    });
  });
});

// ===== ИНТЕГРАЦИОННЫЕ ТЕСТЫ: шаблоны не покрытые выше =====

describe('generateAdminRights', () => {
  it('должен генерировать валидный Python код для admin-rights', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateAdminRightsHandler } = await import('./admin-rights/admin-rights.renderer');
    const code = generateAdminRightsHandler({
      nodeId: 'admin_rights_node_1',
      safeName: 'admin_rights_node_1',
      messageText: '⚙️ Управление правами',
      command: 'admin_rights',
    });
    assertValidPythonSyntax(code, 'generateAdminRights');
  });
});

describe('generateAnimationHandler', () => {
  it('должен генерировать валидный Python код для animation-handler', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateAnimationHandler } = await import('./animation-handler/animation-handler.renderer');
    const code = generateAnimationHandler({
      animationUrl: 'https://example.com/animation.gif',
      nodeId: 'node_anim_1',
    });
    assertValidPythonSyntax(code, 'generateAnimationHandler');
  });
});



describe('generateAttachedMediaVars', () => {
  it('должен генерировать валидный Python код для attached-media-vars', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateAttachedMediaVars } = await import('./attached-media-vars/attached-media-vars.renderer');
    const code = generateAttachedMediaVars({
      nodeId: 'node_img',
      attachedMedia: ['imageUrlVar_node_img'],
      imageUrl: 'https://example.com/photo.jpg',
    });
    assertValidPythonSyntax(code, 'generateAttachedMediaVars');
  });
});

describe('generateAutoTransition', () => {
  it('должен генерировать валидный Python код для auto-transition', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateAutoTransition } = await import('./auto-transition/auto-transition.renderer');
    const code = generateAutoTransition({
      nodeId: 'node_source',
      autoTransitionTarget: 'node_target',
      targetExists: true,
    });
    assertValidPythonSyntax(code, 'generateAutoTransition');
  });
});

describe('generateCallbackHandlerInit', () => {
  it('должен генерировать валидный Python код для callback-handler-init', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateCallbackHandlerInit } = await import('./callback-handler-init/callback-handler-init.renderer');
    const code = generateCallbackHandlerInit({
      nodeId: 'node_abc',
      hasHideAfterClick: false,
      variableFilters: null,
    });
    assertValidPythonSyntax(code, 'generateCallbackHandlerInit');
  });
});

describe('generateCommandNavigation', () => {
  it('должен генерировать валидный Python код для command-navigation', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateCommandNavigation } = await import('./command-navigation/command-navigation.renderer');
    const code = generateCommandNavigation({
      commandName: 'start',
      handlerName: 'start_handler',
    });
    assertValidPythonSyntax(code, 'generateCommandNavigation');
  });
});

describe('generateConditionalBranch', () => {
  it('должен генерировать валидный Python код для conditional-branch', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateConditionalBranch } = await import('./conditional-branch/conditional-branch.renderer');
    const code = generateConditionalBranch({ index: 0, nodeId: 'node_abc' });
    assertValidPythonSyntax(code, 'generateConditionalBranch');
  });
});

describe('generateConditionalInputHandler', () => {
  it('должен генерировать валидный Python код для conditional-input-handler', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateConditionalInputHandler } = await import('./conditional-input-handler/conditional-input-handler.renderer');
    const code = generateConditionalInputHandler({
      nodes: [
        { id: 'node_abc', safeName: 'node_abc', type: 'message', data: { messageText: 'Привет' } },
      ],
      allNodeIds: ['node_abc'],
    });
    assertValidPythonSyntax(code, 'generateConditionalInputHandler');
  });
});

describe('generateConditionalMessages', () => {
  it('должен генерировать валидный Python код для conditional-messages', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateConditionalMessages } = await import('./conditional-messages/conditional-messages.renderer');
    const code = generateConditionalMessages({
      conditionalMessages: [
        { variableName: 'user_role', condition: 'user_role', messageText: 'Привет, администратор!' },
      ],
      defaultText: '"Привет!"',
    });
    assertValidPythonSyntax(code, 'generateConditionalMessages');
  });
});



describe('generateErrorHandler', () => {
  it('должен генерировать валидный Python код для error-handler', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateErrorHandler } = await import('./error-handler/error-handler.renderer');
    const code = generateErrorHandler({});
    assertValidPythonSyntax(code, 'generateErrorHandler');
  });
});

describe('generateFakeCallback', () => {
  it('должен генерировать валидный Python код для fake-callback', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateFakeCallback } = await import('./fake-callback/fake-callback.renderer');
    const code = generateFakeCallback({
      targetNodeId: 'node_target',
      sourceNodeId: 'node_source',
      safeFunctionName: 'node_target',
    });
    assertValidPythonSyntax(code, 'generateFakeCallback');
  });
});

describe('generateHandleUserInput', () => {
  it('должен генерировать валидный Python код для handle-user-input', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateHandleUserInput } = await import('./handle-user-input/handle-user-input.renderer');
    const code = generateHandleUserInput({});
    assertValidPythonSyntax(code, 'generateHandleUserInput');
  });
});



describe('generateMediaSaveVars', () => {
  it('должен генерировать валидный Python код для media-save-vars', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateMediaSaveVars } = await import('./database/media-save-vars/media-save-vars.renderer');
    const code = generateMediaSaveVars({ nodeId: 'node_img', imageUrl: 'https://example.com/photo.jpg' });
    assertValidPythonSyntax(code, 'generateMediaSaveVars');
  });
});



describe('generateMultiselectCheck', () => {
  it('должен генерировать валидный Python код для multiselect-check', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateMultiSelectCheck } = await import('./multiselect-check/multiselect-check.renderer');
    const code = generateMultiSelectCheck({ nodes: [], allNodeIds: [] });
    assertValidPythonSyntax(code, 'generateMultiselectCheck');
  });
});

describe('generateNavigateToNode', () => {
  it('должен генерировать валидный Python код для navigate-to-node', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateNavigateToNode } = await import('./navigation/navigate-to-node.renderer');
    const code = generateNavigateToNode();
    assertValidPythonSyntax(code, 'generateNavigateToNode');
  });
});

describe('generateParseMode', () => {
  it('должен генерировать валидный Python код для parse-mode (html)', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateParseMode } = await import('./parse-mode/parse-mode.renderer');
    const code = generateParseMode({ formatMode: 'html' });
    assertValidPythonSyntax(code, 'generateParseMode html');
  });
});


describe('generateSkipDataCollection', () => {
  it('должен генерировать валидный Python код для skip-data-collection', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateSkipDataCollectionCheck } = await import('./skip-data-collection/skip-data-collection.renderer');
    const code = generateSkipDataCollectionCheck({ variableName: 'user_name', variableValue: 'message.text' });
    assertValidPythonSyntax(code, 'generateSkipDataCollection');
  });
});

describe('generateSynonyms', () => {
  it('должен генерировать валидный Python код для synonyms', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateSynonyms } = await import('./synonyms/synonyms.renderer');
    const code = generateSynonyms({
      synonyms: [
        { synonym: 'привет', nodeId: 'start_1', nodeType: 'start', functionName: 'start', originalCommand: '/start' },
      ],
    });
    assertValidPythonSyntax(code, 'generateSynonyms');
  });
});

describe('generateUserHandler', () => {
  it('должен генерировать валидный Python код для user-handler (ban_user)', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateUserHandler } = await import('./user-handler/user-handler.renderer');
    const code = generateUserHandler({
      nodeType: 'ban_user',
      nodeId: 'ban_node_1',
      safeName: 'ban_node_1',
      synonyms: ['бан'],
      reason: 'Спам',
      untilDate: 0,
    });
    assertValidPythonSyntax(code, 'generateUserHandler ban_user');
  });
});

describe('generateUserVariablesFunc', () => {
  it('должен генерировать валидный Python код для user-variables-func', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateGetUserVariablesFunction } = await import('./user-variables-func/user-variables-func.renderer');
    const code = generateGetUserVariablesFunction({});
    assertValidPythonSyntax(code, 'generateUserVariablesFunc');
  });
});

describe('generateButtonResponse', () => {
  it('должен генерировать валидный Python код для button-response', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateButtonResponse } = await import('./handlers/button-response/button-response.renderer');
    const code = generateButtonResponse({
      userInputNodes: [
        {
          id: 'node_123',
          responseOptions: [
            { text: 'Опция 1', value: 'opt1' },
            { text: 'Опция 2', value: 'opt2' },
          ],
          allowSkip: false,
        },
      ],
      allNodes: [{ id: 'node_123', type: 'message' }],
      hasUrlButtonsInProject: false,
      indentLevel: '',
    });
    assertValidPythonSyntax(code, 'generateButtonResponse');
  });
});

describe('generateMultiSelectCallback', () => {
  it('должен генерировать валидный Python код для multi-select-callback', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateMultiSelectCallback } = await import('./handlers/multi-select-callback/multi-select-callback.renderer');
    const fragment = generateMultiSelectCallback({
      multiSelectNodes: [
        {
          id: 'node_123',
          shortNodeId: 'abc123',
          selectionButtons: [
            { id: 'btn_1', text: 'Опция 1', action: 'selection', target: 'opt1', value: 'opt1', valueTruncated: 'opt1', escapedText: 'Опция 1', callbackData: 'ms_abc123_opt1' },
          ],
          regularButtons: [],
          doneCallbackData: 'done_abc123',
          totalButtonsCount: 1,
        },
      ],
      allNodeIds: ['node_123'],
      indentLevel: '    ',
    });
    // Оборачиваем в функцию с заглушками глобальных переменных бота
    const code = `
import logging
user_data = {}
def calculate_optimal_columns(n): return 2
async def get_user_from_db(uid): return {}
async def handle_callback_node_123(callback_query): pass

async def _test_handler(callback_query):
    user_id = callback_query.from_user.id
    callback_data = callback_query.data
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram import types
    InlineKeyboardButton = types.InlineKeyboardButton
${fragment}
`;
    assertValidPythonSyntax(code, 'generateMultiSelectCallback');
  });
});

describe('generateReplyButtonHandlers', () => {
  it('должен генерировать валидный Python код для reply-button-handlers', async () => {
    const { execSync } = await import('child_process');
    let hasPython = false;
    try { execSync('python --version', { stdio: 'pipe' }); hasPython = true; } catch { }

    if (!hasPython) { console.warn('⚠️ Python не найден, тест пропущен'); return; }

    const { generateReplyButtonHandlers } = await import('./handlers/reply-button-handlers/reply-button-handlers.renderer');
    const code = generateReplyButtonHandlers({
      nodes: [
        {
          id: 'node1',
          type: 'message',
          data: {
            keyboardType: 'reply',
            messageText: 'Выберите:',
            buttons: [
              { id: 'btn1', text: 'Опция 1', action: 'goto', target: 'node2' },
            ],
          },
        },
        { id: 'node2', type: 'message', data: { keyboardType: 'none', messageText: 'OK' } },
      ] as any,
      indentLevel: '',
    });
    assertValidPythonSyntax(code, 'generateReplyButtonHandlers');
  });
});
