/**
 * @fileoverview Тесты для модуля управления настройками комментариев
 * @module client/utils/tests/comments-settings.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { areCommentsEnabled, setCommentsEnabled } from '../comments-settings';

describe('comments-settings', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    setCommentsEnabled(true);
  });

  it('по умолчанию комментарии включены', () => {
    expect(areCommentsEnabled()).toBe(true);
  });

  it('setCommentsEnabled(false) отключает комментарии', () => {
    setCommentsEnabled(false);
    expect(areCommentsEnabled()).toBe(false);
  });

  it('setCommentsEnabled(true) включает комментарии', () => {
    setCommentsEnabled(false);
    setCommentsEnabled(true);
    expect(areCommentsEnabled()).toBe(true);
  });

  it('повторный вызов setCommentsEnabled(true) не меняет состояние', () => {
    setCommentsEnabled(true);
    setCommentsEnabled(true);
    expect(areCommentsEnabled()).toBe(true);
  });

  it('повторный вызов setCommentsEnabled(false) не меняет состояние', () => {
    setCommentsEnabled(false);
    setCommentsEnabled(false);
    expect(areCommentsEnabled()).toBe(false);
  });
});
