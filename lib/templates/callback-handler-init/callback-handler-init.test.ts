/**
 * @fileoverview Тесты для шаблона callback-handler-init
 * @module templates/callback-handler-init/callback-handler-init.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCallbackHandlerInit } from './callback-handler-init.renderer';
import {
  validParamsBasic,
  validParamsWithHide,
  validParamsWithFilters,
  validParamsWithIndent,
} from './callback-handler-init.fixture';
import { callbackHandlerInitParamsSchema } from './callback-handler-init.schema';

describe('generateCallbackHandlerInit()', () => {
  it('генерирует callback_query.answer()', () => {
    const result = generateCallbackHandlerInit(validParamsBasic);
    assert.ok(result.includes('await callback_query.answer()'));
  });

  it('генерирует init_user_variables', () => {
    const result = generateCallbackHandlerInit(validParamsBasic);
    assert.ok(result.includes('await init_user_variables(user_id, callback_query.from_user)'));
  });

  it('генерирует edit_reply_markup при hasHideAfterClick', () => {
    const result = generateCallbackHandlerInit(validParamsWithHide);
    assert.ok(result.includes('edit_reply_markup(reply_markup=None)'));
  });

  it('не генерирует edit_reply_markup без hasHideAfterClick', () => {
    const result = generateCallbackHandlerInit(validParamsBasic);
    assert.ok(!result.includes('edit_reply_markup'));
  });

  it('генерирует сохранение variableFilters', () => {
    const result = generateCallbackHandlerInit(validParamsWithFilters);
    assert.ok(result.includes('_variable_filters'));
  });

  it('не генерирует variableFilters без фильтров', () => {
    const result = generateCallbackHandlerInit(validParamsBasic);
    assert.ok(!result.includes('_variable_filters'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateCallbackHandlerInit(validParamsWithIndent);
    assert.ok(result.includes('        try:'));
  });

  it('генерирует try/except для answer()', () => {
    const result = generateCallbackHandlerInit(validParamsBasic);
    assert.ok(result.includes('try:'));
    assert.ok(result.includes('except Exception:'));
  });
});

describe('callbackHandlerInitParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(callbackHandlerInitParamsSchema.safeParse(validParamsBasic).success);
  });

  it('отклоняет строку вместо boolean для hasHideAfterClick', () => {
    assert.ok(!callbackHandlerInitParamsSchema.safeParse({
      nodeId: 'n',
      hasHideAfterClick: 'true',
    }).success);
  });

  it('принимает null для variableFilters', () => {
    assert.ok(callbackHandlerInitParamsSchema.safeParse({
      nodeId: 'n',
      hasHideAfterClick: false,
      variableFilters: null,
    }).success);
  });
});

describe('Производительность', () => {
  it('generateCallbackHandlerInit: быстрее 10ms', () => {
    const start = Date.now();
    generateCallbackHandlerInit(validParamsBasic);
    assert.ok(Date.now() - start < 10);
  });
});
