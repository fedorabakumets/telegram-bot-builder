/**
 * @fileoverview Тестовые данные для шаблона заголовка
 * @module templates/header/header.fixture
 */

import type { HeaderTemplateParams } from './header.params';

/** Валидные параметры: все включено */
export const validParamsAllEnabled: HeaderTemplateParams = {
  userDatabaseEnabled: true,
  hasInlineButtons: true,
  hasMediaNodes: true,
};

/** Валидные параметры: всё выключено */
export const validParamsAllDisabled: HeaderTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasMediaNodes: false,
};

/** Валидные параметры: только БД */
export const validParamsDatabaseOnly: HeaderTemplateParams = {
  userDatabaseEnabled: true,
  hasInlineButtons: false,
  hasMediaNodes: false,
};

/** Валидные параметры: только медиа */
export const validParamsMediaOnly: HeaderTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasMediaNodes: true,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};

/** Ожидаемый вывод: стандартный заголовок */
export const expectedOutputStandard = `
# -*- coding: utf-8 -*-
import os
import sys

# Устанавливаем UTF-8 кодировку для вывода
if sys.platform.startswith("win"):
    # Для Windows устанавливаем UTF-8 кодировку
    os.environ["PYTHONIOENCODING"] = "utf-8"
    try:
        import codecs
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, UnicodeError):
        # Fallback для старых версий Python
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())
`.trim();
