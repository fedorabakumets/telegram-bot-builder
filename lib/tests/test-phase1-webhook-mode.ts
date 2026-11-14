/**
 * @fileoverview Тесты Фазы 1 — webhook режим для Python ботов
 * @module tests/test-phase1-webhook-mode
 *
 * Блок A: Polling режим (без WEBHOOK_URL)
 * Блок B: Webhook режим (с WEBHOOK_URL)
 * Блок C: Валидация пути вебхука
 */

import { generatePythonCode } from '../bot-generator.ts';

/**
 * Создаёт минимальный проект с одним command_trigger и message узлом
 * @param nodes - Список узлов
 * @returns Объект проекта в формате BotData
 */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Создаёт минимальный набор узлов: command_trigger + message
 * @returns Массив узлов
 */
function makeMinimalNodes() {
  return [
    {
      id: 'trigger1',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: {
        command: '/start',
        description: 'Запустить бота',
        showInMenu: true,
        adminOnly: false,
        requiresAuth: false,
        autoTransitionTo: 'msg1',
        buttons: [],
        keyboardType: 'none',
      },
    },
    {
      id: 'msg1',
      type: 'message',
      position: { x: 400, y: 0 },
      data: {
        messageText: 'Привет!',
        buttons: [],
        keyboardType: 'none',
        formatMode: 'none',
        markdown: false,
      },
    },
  ];
}

/** Результат одного теста */
type TestResult = { id: string; name: string; passed: boolean; note: string };
const results: TestResult[] = [];

/**
 * Запускает один тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

/**
 * Проверяет условие и бросает ошибку если оно ложно
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 1 — Webhook режим для Python ботов                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Polling режим
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Polling режим (без webhookUrl) ────────────────────────');

/** Запуск сохраняет разрешённые обновления и различает сигналы воркера и отдельного процесса. */
const managedPollingPattern = /asyncio\.create_task\(dp\.start_polling\(\s*bot,\s*allowed_updates=dp\.resolve_used_update_types\(\),\s*handle_signals=not globals\(\)\.get\('_worker_manages_signals', False\)\s*\)\)/;

/** Проверяет запуск polling как управляемой фоновой задачи. */
test('A01', 'без webhookUrl → polling запускается как фоновая задача', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'PollingBot',
    userDatabaseEnabled: false,
    });
  ok(managedPollingPattern.test(code),
    'polling сохраняет разрешённые обновления, сигналы отдельного запуска и управление сигналами воркера');
});

test('A02', 'без webhookUrl → set_webhook находится только внутри if WEBHOOK_URL блока', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'PollingBot',
    userDatabaseEnabled: false,
    });
  // set_webhook должен быть только внутри if WEBHOOK_URL: ветки
  const ifWebhookIdx = code.indexOf('if WEBHOOK_URL and not _external_mode:');
  const setWebhookIdx = code.indexOf('set_webhook');
  ok(ifWebhookIdx !== -1, 'if WEBHOOK_URL: должен быть в коде');
  ok(setWebhookIdx === -1 || setWebhookIdx > ifWebhookIdx,
    'set_webhook должен быть только внутри if WEBHOOK_URL: блока');
});

test('A03', 'без webhookUrl → SimpleRequestHandler находится только внутри if WEBHOOK_URL блока', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'PollingBot',
    userDatabaseEnabled: false,
    });
  // SimpleRequestHandler должен быть только внутри if WEBHOOK_URL: ветки
  const ifWebhookIdx = code.indexOf('if WEBHOOK_URL and not _external_mode:');
  const handlerIdx = code.indexOf('SimpleRequestHandler');
  ok(ifWebhookIdx !== -1, 'if WEBHOOK_URL: должен быть в коде');
  ok(handlerIdx === -1 || handlerIdx > ifWebhookIdx,
    'SimpleRequestHandler должен быть только внутри if WEBHOOK_URL: блока');
});

test('A04', 'без webhookUrl → WEBHOOK_URL = os.getenv присутствует в config', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'PollingBot',
    userDatabaseEnabled: false,
    });
  ok(code.includes('WEBHOOK_URL = os.getenv("WEBHOOK_URL")'), 'WEBHOOK_URL должен читаться из env');
});

test('A05', 'без webhookUrl → WEBHOOK_PORT = int(os.getenv присутствует в config', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'PollingBot',
    userDatabaseEnabled: false,
    });
  ok(code.includes('WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT"'), 'WEBHOOK_PORT должен читаться из env');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Webhook режим
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Webhook режим (с webhookUrl) ──────────────────────────');

test('B01', 'с webhookUrl → bot.set_webhook присутствует в main.py', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9123,
    projectId: 42,
  });
  ok(code.includes('bot.set_webhook'), 'bot.set_webhook должен быть в webhook режиме');
});

test('B02', 'с webhookUrl → SimpleRequestHandler присутствует', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9123,
    projectId: 42,
  });
  ok(code.includes('SimpleRequestHandler'), 'SimpleRequestHandler должен быть в webhook режиме');
});

test('B03', 'с webhookUrl → web.TCPSite присутствует', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9123,
    projectId: 42,
  });
  ok(code.includes('web.TCPSite'), 'web.TCPSite должен быть в webhook режиме');
});

test('B04', 'с webhookUrl → WEBHOOK_URL = os.getenv присутствует в config', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9123,
    projectId: 42,
  });
  ok(code.includes('WEBHOOK_URL = os.getenv("WEBHOOK_URL")'), 'WEBHOOK_URL должен читаться из env');
});

test('B05', 'с webhookUrl → WEBHOOK_PORT = int(os.getenv присутствует в config', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9123,
    projectId: 42,
  });
  ok(code.includes('WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT"'), 'WEBHOOK_PORT должен читаться из env');
});

/** Проверяет, что polling выполняется только в ветке без webhook. */
test('B06', 'с webhookUrl → polling находится в else ветке', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9123,
    projectId: 42,
  });
  const webhookEndIdx = code.indexOf('await bot.delete_webhook()');
  const pollingBranchIdx = code.indexOf('        else:\n            # Polling режим', webhookEndIdx);
  const pollingIdx = code.search(managedPollingPattern);
  ok(webhookEndIdx !== -1, 'завершение webhook должно быть в коде');
  ok(pollingBranchIdx > webhookEndIdx, 'ветка polling должна следовать за webhook');
  ok(pollingIdx > pollingBranchIdx, 'polling должен запускаться внутри else ветки');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Валидация пути вебхука
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Валидация пути вебхука ────────────────────────────────');

test('C01', 'путь вебхука содержит PROJECT_ID', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9001,
    projectId: 77,
  });
  ok(code.includes('PROJECT_ID'), 'PROJECT_ID должен быть в пути вебхука');
});

test('C02', 'путь вебхука содержит TOKEN_ID', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9001,
    projectId: 77,
  });
  ok(code.includes('TOKEN_ID'), 'TOKEN_ID должен быть в пути вебхука');
});

test('C03', 'путь вебхука содержит /api/webhook/', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9001,
    projectId: 77,
  });
  ok(code.includes('/api/webhook/'), 'путь /api/webhook/ должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Валидация Redis обязательного при webhook
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Валидация Redis при webhook ───────────────────────────');

test('D01', 'сгенерированный код содержит валидацию REDIS_URL при webhook', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'WebhookBot',
    userDatabaseEnabled: false,
    webhookUrl: 'https://example.com',
    webhookPort: 9001,
    projectId: 77,
  });
  ok(code.includes('if WEBHOOK_URL and not REDIS_URL:'), 'валидация Redis должна быть в коде');
  ok(code.includes('raise RuntimeError'), 'RuntimeError должен быть при отсутствии Redis');
});

test('D02', 'в polling режиме условие валидации Redis присутствует (срабатывает только при WEBHOOK_URL)', () => {
  const p = makeCleanProject(makeMinimalNodes());
  const code = generatePythonCode(p as any, {
    botName: 'PollingBot',
    userDatabaseEnabled: false,
    });
  // Валидация всегда генерируется, но срабатывает только при WEBHOOK_URL
  // Проверяем что условие правильное — if WEBHOOK_URL and not REDIS_URL
  ok(code.includes('if WEBHOOK_URL and not REDIS_URL:'), 'условие валидации должно быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

/** Проверяет единый секрет регистрации и проверки запроса, а также отложенное подтверждение доставки. */
test('D03', 'webhook передаёт и проверяет секрет до подтверждения обработки', () => {
  const code = generatePythonCode(makeCleanProject(makeMinimalNodes()) as any, {
    botName: 'WebhookBot', userDatabaseEnabled: false, webhookUrl: 'https://example.com', projectId: 77,
  });
  ok(code.includes('WEBHOOK_SECRET_TOKEN = os.getenv("WEBHOOK_SECRET_TOKEN") or None'), 'секрет читается из окружения');
  ok(code.includes('secret_token=WEBHOOK_SECRET_TOKEN'), 'секрет регистрируется в Telegram');
  ok(code.includes('SimpleRequestHandler(dispatcher=dp, bot=bot, secret_token=WEBHOOK_SECRET_TOKEN, handle_in_background=False)'),
    'обработчик проверяет секрет и дожидается обработки');
});
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n──────────────────────────────────────────────────────────────────');
console.log(`Итого: ${passed} пройдено, ${failed} провалено из ${results.length}`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}: ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('✅ Все тесты пройдены!');
}
