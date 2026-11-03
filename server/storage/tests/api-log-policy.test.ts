/** @fileoverview Проверка защиты временных ссылок в журнале HTTP API. */
import { describe, expect, it } from 'vitest';
import { apiLogPath, mayLogApiResponse } from '../../utils/api-log-policy';

describe('Журнал API', () => {
  it('не записывает тело ответа со ссылкой и удаляет подпись из адреса доступа', () => {
    const issuePath = apiLogPath('/api/runtime/media/invoice-link?projectId=7');
    expect(mayLogApiResponse(issuePath)).toBe(false);
    expect(apiLogPath('/api/runtime/media/invoice/7/4?expires=123&signature=secret')).toBe('/api/runtime/media/invoice/7/4');
    expect(mayLogApiResponse('/api/auth/agent/login')).toBe(false);
    expect(mayLogApiResponse('/api/projects/7')).toBe(true);
  });
});
