/**
 * @fileoverview Валидация сообщения рассылки по лимитам Telegram
 * @description Проверяет текст, медиа и инлайн-кнопки перед отправкой
 */

import type { Button } from '@shared/schema';
import type { NewBroadcastFormData } from '../types';
import { getPlainTextLength } from './get-plain-text-length';
import {
  TELEGRAM_MAX_BUTTONS_PER_ROW,
  TELEGRAM_MAX_CALLBACK_DATA_BYTES,
  TELEGRAM_MAX_CAPTION_LENGTH,
  TELEGRAM_MAX_COPY_TEXT_LENGTH,
  TELEGRAM_MAX_INLINE_BUTTONS,
  TELEGRAM_MAX_MEDIA_GROUP,
  TELEGRAM_MAX_TEXT_LENGTH,
  TELEGRAM_MIN_MEDIA_GROUP,
} from './telegram-limits';

/** Тип записи валидации */
export type ValidationSeverity = 'error' | 'warning';

/** Одно сообщение валидации */
export interface ValidationMessage {
  /** Уровень: ошибка блокирует отправку, предупреждение — нет */
  severity: ValidationSeverity;
  /** Текст для пользователя */
  message: string;
}

/** Результат валидации сообщения рассылки */
export interface BroadcastMessageValidation {
  /** Можно ли перейти к следующему шагу / запустить рассылку */
  isValid: boolean;
  /** Ошибки */
  errors: ValidationMessage[];
  /** Предупреждения */
  warnings: ValidationMessage[];
  /** Длина текста без HTML */
  plainTextLength: number;
  /** Актуальный лимит текста (4096 или 1024) */
  textLimit: number;
  /** Количество медиафайлов */
  mediaCount: number;
  /** Количество кнопок */
  buttonCount: number;
}

/**
 * Возвращает callback_data для кнопки (как на сервере в extractButtonsFromNode)
 * @param button - Кнопка из формы
 * @returns Строка callback_data или пустая для не-callback кнопок
 */
function resolveCallbackData(button: Button): string {
  const action = button.action ?? 'default';
  if (action === 'url' || action === 'web_app' || action === 'copy_text') return '';
  return button.customCallbackData
    || (action === 'goto' && button.target ? `node:${button.target}` : button.id);
}

/**
 * Считает длину строки в байтах UTF-8
 * @param value - Строка
 * @returns Число байт
 */
function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Проверяет раскладку кнопок по рядам
 * @param buttonCount - Число кнопок
 * @param buttonsPerRow - Кнопок в ряду (0 = все в один ряд)
 * @returns Сообщение об ошибке или null
 */
function validateButtonRows(buttonCount: number, buttonsPerRow: number): string | null {
  if (buttonCount === 0) return null;
  const perRow = buttonsPerRow > 0 ? buttonsPerRow : buttonCount;
  if (perRow > TELEGRAM_MAX_BUTTONS_PER_ROW) {
    return `В одном ряду не больше ${TELEGRAM_MAX_BUTTONS_PER_ROW} кнопок (сейчас в ряду: ${perRow}).`;
  }
  if (buttonsPerRow <= 0 && buttonCount > TELEGRAM_MAX_BUTTONS_PER_ROW) {
    return `При раскладке «Авто» все кнопки в одном ряду — максимум ${TELEGRAM_MAX_BUTTONS_PER_ROW}. Выберите «Кнопок в ряду»: 2–4.`;
  }
  return null;
}

/**
 * Валидирует сообщение рассылки по лимитам Telegram Bot API
 * @param formData - Данные формы wizard
 * @returns Результат валидации
 */
export function validateBroadcastMessage(formData: NewBroadcastFormData): BroadcastMessageValidation {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  const mediaCount = formData.mediaUrls?.length ?? 0;
  const buttons = formData.buttons ?? [];
  const buttonCount = buttons.length;
  const buttonsPerRow = formData.buttonsPerRow ?? 0;
  const hasMedia = mediaCount > 0;
  const plainTextLength = getPlainTextLength(formData.messageText);
  const textLimit = hasMedia ? TELEGRAM_MAX_CAPTION_LENGTH : TELEGRAM_MAX_TEXT_LENGTH;

  if (plainTextLength === 0 && !hasMedia) {
    errors.push({ severity: 'error', message: 'Добавьте текст сообщения или хотя бы один медиафайл.' });
  }

  if (plainTextLength > textLimit) {
    errors.push({
      severity: 'error',
      message: hasMedia
        ? `Подпись к медиа слишком длинная: ${plainTextLength} / ${textLimit} символов.`
        : `Текст сообщения слишком длинный: ${plainTextLength} / ${textLimit} символов.`,
    });
  }

  if (mediaCount > TELEGRAM_MAX_MEDIA_GROUP) {
    errors.push({
      severity: 'error',
      message: `Слишком много файлов: ${mediaCount} / ${TELEGRAM_MAX_MEDIA_GROUP} (максимум в альбоме).`,
    });
  }

  if (mediaCount >= TELEGRAM_MIN_MEDIA_GROUP && buttonCount > 0) {
    warnings.push({
      severity: 'warning',
      message: `Альбом из ${mediaCount} файлов нельзя отправить с инлайн-кнопками. Будет отправлен только первый файл с кнопками.`,
    });
  }

  if (buttonCount > TELEGRAM_MAX_INLINE_BUTTONS) {
    errors.push({
      severity: 'error',
      message: `Слишком много кнопок: ${buttonCount} / ${TELEGRAM_MAX_INLINE_BUTTONS}.`,
    });
  }

  const rowError = validateButtonRows(buttonCount, buttonsPerRow);
  if (rowError) {
    errors.push({ severity: 'error', message: rowError });
  }

  buttons.forEach((button, index) => {
    const label = button.text?.trim() || `Кнопка ${index + 1}`;

    if (button.action === 'copy_text') {
      const copyLen = button.copyText?.length ?? 0;
      if (copyLen < 1 || copyLen > TELEGRAM_MAX_COPY_TEXT_LENGTH) {
        errors.push({
          severity: 'error',
          message: `«${label}»: текст для копирования — от 1 до ${TELEGRAM_MAX_COPY_TEXT_LENGTH} символов.`,
        });
      }
    }

    if (button.action === 'web_app' && button.webAppUrl && !button.webAppUrl.startsWith('https://')) {
      errors.push({
        severity: 'error',
        message: `«${label}»: Mini App URL должен начинаться с https://`,
      });
    }

    const callbackData = resolveCallbackData(button);
    if (callbackData) {
      const bytes = utf8ByteLength(callbackData);
      if (bytes > TELEGRAM_MAX_CALLBACK_DATA_BYTES) {
        errors.push({
          severity: 'error',
          message: `«${label}»: callback_data слишком длинный (${bytes} / ${TELEGRAM_MAX_CALLBACK_DATA_BYTES} байт).`,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    plainTextLength,
    textLimit,
    mediaCount,
    buttonCount,
  };
}
