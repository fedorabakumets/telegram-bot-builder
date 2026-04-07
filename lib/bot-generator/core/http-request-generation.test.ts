/**
 * @fileoverview Интеграционные тесты фаз генерации для узла http_request.
 * Проверяют что generatePythonCode корректно обрабатывает http_request узел
 * в финальном Python коде.
 * @module bot-generator/core/http-request-generation.test
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../../bot-generator';
import type { BotData } from '@shared/schema';

// ---------------------------------------------------------------------------
// Вспомогательные функции
// ---------------------------------------------------------------------------

/**
 * Создаёт стартовый узел для BotData
 * @returns узел типа start
 */
function makeStartNode(): BotData['nodes'][number] {
  return {
    id: 'start_1',
    type: 'start',
    position: { x: 0, y: 0 },
    data: {
      command: '/start',
      messageText: 'Привет!',
      buttons: [],
      keyboardType: 'inline',
      adminOnly: false,
      requiresAuth: false,
      synonyms: [],
      showInMenu: true,
      description: 'Запустить бота',
      markdown: false,
      enableConditionalMessages: false,
      conditionalMessages: [],
    } as unknown as BotData['nodes'][number]['data'],
  };
}

/**
 * Создаёт узел http_request с заданными данными
 * @param id - идентификатор узла
 * @param data - данные узла
 * @returns узел типа http_request
 */
function makeHttpRequestNode(id: string, data: Record<string, any>): BotData['nodes'][number] {
  return {
    id,
    type: 'http_request',
    position: { x: 100, y: 100 },
    data: data as BotData['nodes'][number]['data'],
  };
}

/**
 * Создаёт BotData с start + http_request узлами
 * @param httpData - данные для узла http_request
 * @returns объект BotData
 */
function makeBotDataWithHttpRequest(httpData: Record<string, any>): BotData {
  return {
    nodes: [makeStartNode(), makeHttpRequestNode('http_req_1', httpData)],
    connections: [],
  };
}

// ---------------------------------------------------------------------------
// Группа 1: базовая генерация
// ---------------------------------------------------------------------------

describe('http_request — базовая генерация', () => {
  it('генерирует callback-обработчик для http_request узла', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('handle_callback_http_req_1');
  });

  it('содержит URL запроса', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('https://api.example.com');
  });

  it('содержит aiohttp', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('aiohttp');
  });

  it('сохраняет ответ в переменную', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
      httpRequestResponseVariable: 'my_response',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('my_response');
  });
});

// ---------------------------------------------------------------------------
// Группа 2: HTTP методы
// ---------------------------------------------------------------------------

describe('http_request — HTTP методы', () => {
  it('генерирует GET запрос', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('_session.get(');
  });

  it('генерирует POST запрос', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'POST',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('_session.post(');
  });

  it('генерирует PUT запрос', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'PUT',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('_session.put(');
  });

  it('генерирует DELETE запрос', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'DELETE',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('_session.delete(');
  });
});

// ---------------------------------------------------------------------------
// Группа 3: аутентификация
// ---------------------------------------------------------------------------

describe('http_request — аутентификация', () => {
  it('добавляет Bearer заголовок', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
      httpRequestAuthType: 'bearer',
      httpRequestAuthBearerToken: 'mytoken',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('Bearer mytoken');
  });

  it('добавляет Basic аутентификацию', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
      httpRequestAuthType: 'basic',
      httpRequestAuthBasicUsername: 'admin',
      httpRequestAuthBasicPassword: 'secret',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code.includes('b64encode') || code.includes('Basic')).toBe(true);
  });

  it('не добавляет auth при authType=none', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
      httpRequestAuthType: 'none',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).not.toContain('Authorization');
  });
});

// ---------------------------------------------------------------------------
// Группа 4: query параметры
// ---------------------------------------------------------------------------

describe('http_request — query параметры', () => {
  it('добавляет query параметры к URL', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com/search',
      httpRequestMethod: 'GET',
      httpRequestQueryParams: '[{"key":"q","value":"test"}]',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code.includes('_urlencode') || code.includes('_qp_list')).toBe(true);
  });

  it('не добавляет query params если поле пустое', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com/search',
      httpRequestMethod: 'GET',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).not.toContain('_qp_list');
  });
});

// ---------------------------------------------------------------------------
// Группа 5: статус код
// ---------------------------------------------------------------------------

describe('http_request — статус код', () => {
  it('сохраняет статус код если statusVariable задан', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
      httpRequestStatusVariable: 'http_status',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('http_status');
  });

  it('не сохраняет статус код если statusVariable пустой', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('_status_code');
    expect(code).not.toMatch(/set_user_var.*_status_code/);
  });
});

// ---------------------------------------------------------------------------
// Группа 6: опции SSL и редиректы
// ---------------------------------------------------------------------------

describe('http_request — опции SSL и редиректы', () => {
  it('отключает SSL верификацию при ignoreSsl=true', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://self-signed.example.com',
      httpRequestMethod: 'GET',
      httpRequestIgnoreSsl: true,
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code.includes('ssl=False') || code.includes('TCPConnector')).toBe(true);
  });

  it('отключает редиректы при followRedirects=false', () => {
    const botData = makeBotDataWithHttpRequest({
      httpRequestUrl: 'https://api.example.com',
      httpRequestMethod: 'GET',
      httpRequestFollowRedirects: false,
    });
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('allow_redirects=False');
  });
});

// ---------------------------------------------------------------------------
// Группа 7: несколько http_request узлов
// ---------------------------------------------------------------------------

describe('http_request — несколько узлов', () => {
  it('генерирует обработчики для каждого http_request узла', () => {
    const botData: BotData = {
      nodes: [
        makeStartNode(),
        makeHttpRequestNode('http_1', {
          httpRequestUrl: 'https://api.example.com/one',
          httpRequestMethod: 'GET',
        }),
        makeHttpRequestNode('http_2', {
          httpRequestUrl: 'https://api.example.com/two',
          httpRequestMethod: 'GET',
        }),
      ],
      connections: [],
    };
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('handle_callback_http_1');
    expect(code).toContain('handle_callback_http_2');
  });

  it('каждый узел сохраняет в свою переменную', () => {
    const botData: BotData = {
      nodes: [
        makeStartNode(),
        makeHttpRequestNode('http_1', {
          httpRequestUrl: 'https://api.example.com/one',
          httpRequestMethod: 'GET',
          httpRequestResponseVariable: 'resp1',
        }),
        makeHttpRequestNode('http_2', {
          httpRequestUrl: 'https://api.example.com/two',
          httpRequestMethod: 'GET',
          httpRequestResponseVariable: 'resp2',
        }),
      ],
      connections: [],
    };
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('resp1');
    expect(code).toContain('resp2');
  });
});

// ---------------------------------------------------------------------------
// Группа 8: автопереход
// ---------------------------------------------------------------------------

describe('http_request — автопереход', () => {
  it('генерирует автопереход если autoTransitionTo задан', () => {
    const botData: BotData = {
      nodes: [
        makeStartNode(),
        makeHttpRequestNode('http_req_1', {
          httpRequestUrl: 'https://api.example.com',
          httpRequestMethod: 'GET',
          autoTransitionTo: 'next_node',
        }),
        {
          id: 'next_node',
          type: 'message',
          position: { x: 200, y: 100 },
          data: {
            messageText: 'Готово!',
            buttons: [],
            keyboardType: 'none',
          } as unknown as BotData['nodes'][number]['data'],
        },
      ],
      connections: [],
    };
    const code = generatePythonCode(botData, { botName: 'TestBot' });
    expect(code).toContain('handle_callback_next_node');
  });
});
