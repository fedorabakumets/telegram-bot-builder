/**
 * @fileoverview Сервис валидации
 *
 * Валидация API credentials и других данных.
 *
 * @module ValidationService
 */

import type { ApiCredentials } from '../types';

/** Ошибки валидации */
export interface ValidationErrors {
  apiId?: string;
  apiHash?: string;
}

/** Валидировать API credentials */
export function validateApiCredentials(credentials: ApiCredentials): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!credentials.apiId?.trim()) {
    errors.apiId = 'API ID обязателен';
  } else if (!/^\d+$/.test(credentials.apiId)) {
    errors.apiId = 'API ID должен быть числом';
  }

  if (!credentials.apiHash?.trim()) {
    errors.apiHash = 'API Hash обязателен';
  } else if (!/^[a-f0-9]{32}$/i.test(credentials.apiHash)) {
    errors.apiHash = 'API Hash должен быть 32-символьной hex строкой';
  }

  return errors;
}

/** Проверить валидность credentials */
export function isValidCredentials(credentials: ApiCredentials): boolean {
  return Object.keys(validateApiCredentials(credentials)).length === 0;
}
