/**
 * @fileoverview Тесты шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/http-request.test
 */

import { describe, expect, it } from 'vitest';
import {
  generateHttpRequest,
  generateHttpRequestFromNode,
  nodeToHttpRequestParams,
} from './http-request.renderer';
import { httpRequestParamsSchema } from './http-request.schema';
import {
  validParamsGet,
  validParamsPost,
  validParamsWithHeaders,
  validParamsWithStatus,
  validParamsWithVariables,
  validParamsWithDotNotationUrl,
  validParamsWithDotNotationBody,
  httpRequestNodeGet,
  httpRequestNodePost,
  validParamsBearer,
  validParamsBasic,
  validParamsWithQueryParams,
  validParamsFormEncoded,
  validParamsIgnoreErrors,
  validParamsInteractivePagination,
  validParamsFetchAll,
  httpRequestNodePagination,
  validParamsFileFormat,
} from './http-request.fixture';

describe('generateHttpRequest()', () => {
  it('генерирует callback-обработчик с правильным nodeId', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).toContain('@dp.callback_query(lambda c: c.data == "http_request_1")');
    expect(code).toContain('async def handle_callback_http_request_1');
  });

  it('подставляет переменные в URL через replace_variables_in_text', () => {
    const code = generateHttpRequest(validParamsWithVariables);
    expect(code).toContain('replace_variables_in_text(_url, _all_vars, {})');
    expect(code).not.toContain('for _k, _v in _all_vars.items()');
  });

  it('подставляет dot-notation переменные в URL', () => {
    const code = generateHttpRequest(validParamsWithDotNotationUrl);
    expect(code).toContain('replace_variables_in_text(_url, _all_vars, {})');
    expect(code).toContain('{validate_response.result.user_id}');
  });

  it('подставляет dot-notation переменные в тело запроса через replace_variables_in_text', () => {
    const code = generateHttpRequest(validParamsWithDotNotationBody);
    expect(code).toContain('replace_variables_in_text(_body_raw_str, _all_vars, {})');
    expect(code).not.toContain('for _k, _v in _all_vars.items()');
  });

  it('парсит JSON заголовки', () => {
    const code = generateHttpRequest(validParamsWithHeaders);
    expect(code).toContain('_headers_raw');
    expect(code).toContain('_json_mod.loads(_headers_raw)');
  });

  it('парсит JSON тело для POST', () => {
    const code = generateHttpRequest(validParamsPost);
    expect(code).toContain('_body_raw_str');
    expect(code).toContain('_json_mod.loads(_body_raw_str)');
  });

  it('не генерирует тело для GET', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).not.toContain('_body_raw_str');
  });

  it('сохраняет ответ в responseVariable', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).toContain('set_user_var(user_id, "response", _response_data)');
  });

  it('сохраняет статус код если statusVariable задан', () => {
    const code = generateHttpRequest(validParamsWithStatus);
    expect(code).toContain('set_user_var(user_id, "http_status", str(_status_code))');
  });

  it('не сохраняет статус код если statusVariable пустой', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).not.toContain('_status_code)');
  });

  it('логирует запрос', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).toContain('logging.info(');
    expect(code).toContain('http_request [http_request_1]');
  });

  it('обрабатывает ошибки', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).toContain('logging.error(');
    expect(code).toContain('ошибка запроса');
  });

  it('выполняет автопереход если autoTransitionTo задан и узел существует', () => {
    const code = generateHttpRequest({
      ...validParamsGet,
      autoTransitionTo: 'next_node',
      autoTransitionTargetExists: true,
    });
    expect(code).toContain('await handle_callback_next_node(callback_query, state=state)');
  });

  it('логирует предупреждение если узел автоперехода не найден', () => {
    const code = generateHttpRequest({
      ...validParamsGet,
      autoTransitionTo: 'missing_node',
      autoTransitionTargetExists: false,
    });
    expect(code).toContain('узел автоперехода не найден: missing_node');
  });

  it('валидирует параметры через Zod-схему без ошибок', () => {
    expect(() => httpRequestParamsSchema.parse(validParamsGet)).not.toThrow();
    expect(() => httpRequestParamsSchema.parse(validParamsPost)).not.toThrow();
    expect(() => httpRequestParamsSchema.parse(validParamsWithHeaders)).not.toThrow();
    expect(() => httpRequestParamsSchema.parse(validParamsWithStatus)).not.toThrow();
  });
});

describe('аутентификация', () => {
  it('добавляет Bearer заголовок', () => {
    const code = generateHttpRequest(validParamsBearer);
    expect(code).toContain("_headers['Authorization'] = 'Bearer mytoken123'");
  });

  it('добавляет Basic заголовок', () => {
    const code = generateHttpRequest(validParamsBasic);
    expect(code).toContain('_base64.b64encode');
    expect(code).toContain('Basic');
  });
});

describe('query параметры', () => {
  it('добавляет query параметры к URL', () => {
    const code = generateHttpRequest(validParamsWithQueryParams);
    expect(code).toContain('_urlencode');
    expect(code).toContain('_qp_list');
  });
});

describe('формат тела', () => {
  it('использует form-urlencoded', () => {
    const code = generateHttpRequest(validParamsFormEncoded);
    expect(code).toContain('_body_form');
  });
});

describe('опции', () => {
  it('отключает SSL верификацию', () => {
    const code = generateHttpRequest(validParamsIgnoreErrors);
    expect(code).toContain('ssl=False');
  });

  it('отключает редиректы', () => {
    const code = generateHttpRequest(validParamsIgnoreErrors);
    expect(code).toContain('allow_redirects=False');
  });
});

describe('nodeToHttpRequestParams()', () => {
  it('корректно извлекает параметры из узла', () => {
    const params = nodeToHttpRequestParams(httpRequestNodeGet);
    expect(params.nodeId).toBe('http_request_1');
    expect(params.url).toBe('https://api.example.com/data');
    expect(params.method).toBe('GET');
    expect(params.timeout).toBe(30);
    expect(params.responseVariable).toBe('response');
  });

  it('корректно извлекает параметры POST узла', () => {
    const params = nodeToHttpRequestParams(httpRequestNodePost);
    expect(params.method).toBe('POST');
    expect(params.body).toBe('{"name": "test"}');
  });

  it('использует дефолтные значения при отсутствии полей', () => {
    const params = nodeToHttpRequestParams({
      id: 'test_node',
      type: 'http_request',
      position: { x: 0, y: 0 },
      data: {} as any,
    });
    expect(params.method).toBe('GET');
    expect(params.timeout).toBe(30);
    expect(params.responseVariable).toBe('response');
  });

  it('генерирует safeName без спецсимволов', () => {
    const params = nodeToHttpRequestParams({
      id: 'node-with-dashes',
      type: 'http_request',
      position: { x: 0, y: 0 },
      data: {} as any,
    });
    expect(params.safeName).toBe('node_with_dashes');
    expect(params.safeName).not.toContain('-');
  });

  it('разрешает autoTransitionTargetExists через контекст', () => {
    const params = nodeToHttpRequestParams(
      { ...httpRequestNodeGet, data: { ...httpRequestNodeGet.data, autoTransitionTo: 'next' } as any },
      { allNodes: [{ id: 'next', type: 'message', position: { x: 0, y: 0 }, data: {} as any }] }
    );
    expect(params.autoTransitionTo).toBe('next');
    expect(params.autoTransitionTargetExists).toBe(true);
  });

  it('маппит новые поля аутентификации из data узла', () => {
    const params = nodeToHttpRequestParams({
      id: 'test_auth',
      type: 'http_request',
      position: { x: 0, y: 0 },
      data: {
        httpRequestAuthType: 'bearer',
        httpRequestAuthBearerToken: 'tok123',
        httpRequestIgnoreSsl: true,
        httpRequestFollowRedirects: false,
      } as any,
    });
    expect(params.authType).toBe('bearer');
    expect(params.authBearerToken).toBe('tok123');
    expect(params.ignoreSsl).toBe(true);
    expect(params.followRedirects).toBe(false);
  });
});

describe('generateHttpRequestFromNode()', () => {
  it('рендерит код из узла графа', () => {
    const code = generateHttpRequestFromNode(httpRequestNodeGet);
    expect(code).toContain('http_request [http_request_1]');
    expect(code).toContain('handle_callback_http_request_1');
  });

  it('рендерит код POST узла с телом', () => {
    const code = generateHttpRequestFromNode(httpRequestNodePost);
    expect(code).toContain('_body_raw_str');
  });
});

describe('пагинация', () => {
  it('интерактивная пагинация: генерирует вычисление nextOffset и prevOffset', () => {
    const code = generateHttpRequest(validParamsInteractivePagination);
    expect(code).toContain('nextOffset');
    expect(code).toContain('prevOffset');
    expect(code).toContain('_pag_total');
    expect(code).toContain('_pag_offset');
  });

  it('интерактивная пагинация: использует paginationOffsetVar для чтения текущего offset', () => {
    const code = generateHttpRequest(validParamsInteractivePagination);
    expect(code).toContain('"users_offset"');
  });

  it('интерактивная пагинация: сохраняет currentPage и totalPages', () => {
    const code = generateHttpRequest(validParamsInteractivePagination);
    expect(code).toContain('currentPage');
    expect(code).toContain('totalPages');
  });

  it('fetch_all: генерирует цикл сбора страниц', () => {
    const code = generateHttpRequest(validParamsFetchAll);
    expect(code).toContain('_all_items');
    expect(code).toContain('_fa_offset');
    expect(code).toContain('fetch_all');
  });

  it('fetch_all: использует paginationMaxPages как ограничитель цикла', () => {
    const code = generateHttpRequest(validParamsFetchAll);
    expect(code).toContain('_fa_max_pages');
    expect(code).toContain('10'); // paginationMaxPages
  });

  it('без пагинации: не генерирует код пагинации', () => {
    const code = generateHttpRequest(validParamsGet);
    expect(code).not.toContain('_pag_total');
    expect(code).not.toContain('_all_items');
  });

  it('интерактивная пагинация: инициализирует offsetVar в "0" если не задан', () => {
    const code = generateHttpRequest(validParamsInteractivePagination);
    expect(code).toContain('_all_vars.get("users_offset"');
    expect(code).toContain('"0"');
    // Инициализация должна быть ДО подстановки переменных в URL
    const initIdx = code.indexOf('_all_vars.get("users_offset"');
    const urlIdx = code.indexOf('replace_variables_in_text(_url');
    expect(initIdx).toBeLessThan(urlIdx);
  });

  it('nodeToHttpRequestParams: корректно читает поля пагинации из node.data', () => {
    const params = nodeToHttpRequestParams(httpRequestNodePagination);
    expect(params.enablePagination).toBe(true);
    expect(params.paginationMode).toBe('interactive');
    expect(params.paginationOffsetVar).toBe('users_offset');
    expect(params.paginationTotalField).toBe('count');
    expect(params.paginationLimit).toBe(10);
  });
});

describe('формат ответа file (base64)', () => {
  it('генерирует чтение бинарных данных через _resp.read()', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).toContain('_resp_bytes = await _resp.read()');
  });

  it('генерирует кодирование в base64', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).toContain('_b64.b64encode(_resp_bytes).decode');
  });

  it('извлекает Content-Type из заголовков ответа', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).toContain('Content-Type');
    expect(code).toContain('_resp_content_type');
  });

  it('извлекает имя файла из Content-Disposition', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).toContain('Content-Disposition');
    expect(code).toContain('_resp_filename');
  });

  it('формирует объект с полями type, data, mimeType, fileName', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).toContain('"type": "file"');
    expect(code).toContain('"data":');
    expect(code).toContain('"mimeType":');
    expect(code).toContain('"fileName":');
  });

  it('сохраняет объект в переменную export_file', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).toContain('set_user_var(user_id, "export_file", _response_data)');
  });

  it('НЕ генерирует _resp.json() для формата file', () => {
    const code = generateHttpRequest(validParamsFileFormat);
    expect(code).not.toContain('await _resp.json(');
  });
});
