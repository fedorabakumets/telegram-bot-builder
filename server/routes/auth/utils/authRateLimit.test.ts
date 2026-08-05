/**
 * @fileoverview Тесты authRateLimit
 * @module auth/utils/authRateLimit.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeAuthRateLimit,
  resetAuthRateLimitBuckets,
} from "./authRateLimit";

describe("consumeAuthRateLimit", () => {
  beforeEach(() => {
    resetAuthRateLimitBuckets();
  });

  it("блокирует после max запросов", () => {
    const key = "ip:1";
    expect(consumeAuthRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(true);
    expect(consumeAuthRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(true);
    expect(consumeAuthRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(false);
  });
});
