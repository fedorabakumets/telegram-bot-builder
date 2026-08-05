/**
 * @fileoverview Тесты isSkipAuthEnabled
 * @module auth/utils/isSkipAuthEnabled.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { isSkipAuthEnabled } from './isSkipAuthEnabled';

describe('isSkipAuthEnabled', () => {
  const original = process.env.SKIP_AUTH;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.SKIP_AUTH;
    } else {
      process.env.SKIP_AUTH = original;
    }
  });

  it('по умолчанию true если переменная не задана', () => {
    delete process.env.SKIP_AUTH;
    expect(isSkipAuthEnabled()).toBe(true);
  });

  it('false только при SKIP_AUTH=false', () => {
    process.env.SKIP_AUTH = 'false';
    expect(isSkipAuthEnabled()).toBe(false);
  });

  it('true при SKIP_AUTH=true', () => {
    process.env.SKIP_AUTH = 'true';
    expect(isSkipAuthEnabled()).toBe(true);
  });
});
