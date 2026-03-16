/**
 * @fileoverview Тесты для reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.test
 */

import { describe, it, expect } from 'vitest';
import { generateReplyButtonHandlers } from './reply-button-handlers.renderer';
import {
  replyButtonHandlersFixture,
  emptyNodesFixture,
  noReplyNodesFixture,
  multiSelectFixture,
} from './reply-button-handlers.fixture';

describe('generateReplyButtonHandlers', () => {
  it('должен генерировать обработчики для reply кнопок', () => {
    const result = generateReplyButtonHandlers(replyButtonHandlersFixture);
    
    expect(result).toContain('@dp.message(lambda message: message.text == "Опция 1")');
    expect(result).toContain('@dp.message(lambda message: message.text == "Опция 2")');
    expect(result).toContain('async def handle_reply_btn1');
    expect(result).toContain('async def handle_reply_btn2');
  });

  it('должен генерировать пустую строку для пустых узлов', () => {
    const result = generateReplyButtonHandlers(emptyNodesFixture);
    
    expect(result).toBe('');
  });

  it('должен генерировать пустую строку для узлов без reply кнопок', () => {
    const result = generateReplyButtonHandlers(noReplyNodesFixture);
    
    expect(result).toBe('');
  });

  it('должен генерировать обработчики с поддержкой multi-select', () => {
    const result = generateReplyButtonHandlers(multiSelectFixture);
    
    expect(result).toContain('multi_select_node');
    expect(result).toContain('multi_select_type');
  });
});