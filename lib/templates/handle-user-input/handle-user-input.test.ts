/**
 * @fileoverview Тесты для шаблона runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateHandleUserInput } from './handle-user-input.renderer';
import {
  validParamsDefault,
  validParamsCustomIndent,
  validParamsNoIndent,
} from './handle-user-input.fixture';
import { handleUserInputParamsSchema } from './handle-user-input.schema';

// ─── generateHandleUserInput() ───────────────────────────────────────────────

describe('generateHandleUserInput()', () => {

  describe('проверка состояния waiting_for_input', () => {
    it('генерирует проверку has_waiting_state', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]'));
    });

    it('генерирует DEBUG лог с текстом сообщения', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('logging.info(f"DEBUG: Получен текст {message.text}'));
    });

    it('генерирует if-блок проверки waiting_for_input', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('if user_id in user_data and "waiting_for_input" in user_data[user_id]:'));
    });

    it('генерирует проверку пустого waiting_config', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('if not waiting_config:'));
      assert.ok(r.includes('return  # Состояние ожидания пустое, игнорируем'));
    });
  });

  describe('извлечение конфигурации', () => {
    it('извлекает waiting_node_id', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('waiting_node_id = waiting_config.get("node_id")'));
    });

    it('извлекает input_type с дефолтом text', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('input_type = waiting_config.get("type", "text")'));
    });

    it('извлекает variable_name с дефолтом user_response', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('variable_name = waiting_config.get("variable", "user_response")'));
    });

    it('извлекает min_length и max_length', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('min_length = waiting_config.get("min_length", 0)'));
      assert.ok(r.includes('max_length = waiting_config.get("max_length", 0)'));
    });

    it('извлекает next_node_id и appendVariable', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('next_node_id = waiting_config.get("next_node_id")'));
      assert.ok(r.includes('appendVariable = waiting_config.get("appendVariable", False)'));
    });
  });

  describe('проверка медиа-типа', () => {
    it('генерирует проверку медиа-типов', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('if input_type in ["photo", "video", "audio", "document"]:'));
    });

    it('возвращает return при медиа-типе', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('ожидается медиа ({input_type})'));
      assert.ok(r.includes('return'));
    });
  });

  describe('валидация длины', () => {
    it('генерирует проверку минимальной длины', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('if min_length > 0 and len(user_text) < min_length:'));
      assert.ok(r.includes('Слишком короткий ответ (минимум {min_length} символов)'));
    });

    it('генерирует проверку максимальной длины', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('if max_length > 0 and len(user_text) > max_length:'));
      assert.ok(r.includes('Слишком длинный ответ (максимум {max_length} символов)'));
    });

    it('использует retry_message из конфига', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")'));
    });
  });

  describe('валидация типа ввода', () => {
    it('генерирует валидацию email', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('if input_type == "email":'));
      assert.ok(r.includes('email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+'));
      assert.ok(r.includes('Неверный формат email'));
    });

    it('генерирует валидацию number', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('elif input_type == "number":'));
      assert.ok(r.includes('float(user_text)'));
      assert.ok(r.includes('Введите корректное число'));
    });

    it('генерирует валидацию phone', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('elif input_type == "phone":'));
      assert.ok(r.includes('phone_pattern = r"^[+]?[0-9'));
      assert.ok(r.includes('Неверный формат телефона'));
    });
  });

  describe('очистка состояния', () => {
    it('удаляет waiting_for_input после обработки', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('del user_data[user_id]["waiting_for_input"]'));
    });

    it('логирует успешный переход', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('✅ Переход к следующему узлу выполнен успешно'));
    });

    it('логирует полученный ввод', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('Получен пользовательский ввод: {variable_name} = {user_text}'));
    });
  });

  describe('отступы', () => {
    it('дефолтный отступ — 4 пробела', () => {
      const r = generateHandleUserInput(validParamsDefault);
      assert.ok(r.includes('    has_waiting_state'));
    });

    it('кастомный отступ — 8 пробелов', () => {
      const r = generateHandleUserInput(validParamsCustomIndent);
      assert.ok(r.includes('        has_waiting_state'));
    });

    it('пустой отступ — без пробелов', () => {
      const r = generateHandleUserInput(validParamsNoIndent);
      assert.ok(r.includes('has_waiting_state'));
      assert.ok(!r.startsWith('    '));
    });
  });
});

// ─── handleUserInputParamsSchema ─────────────────────────────────────────────

describe('handleUserInputParamsSchema', () => {
  it('принимает пустой объект', () => {
    assert.ok(handleUserInputParamsSchema.safeParse({}).success);
  });

  it('принимает indentLevel', () => {
    assert.ok(handleUserInputParamsSchema.safeParse({ indentLevel: '    ' }).success);
  });

  it('отклоняет числовой indentLevel', () => {
    assert.ok(!handleUserInputParamsSchema.safeParse({ indentLevel: 4 }).success);
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateHandleUserInput: быстрее 10ms', () => {
    const start = Date.now();
    generateHandleUserInput(validParamsDefault);
    assert.ok(Date.now() - start < 10);
  });
});
