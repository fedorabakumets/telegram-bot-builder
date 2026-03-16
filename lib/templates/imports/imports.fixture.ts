/**
 * @fileoverview Тестовые данные для шаблона импортов
 * @module templates/imports/imports.fixture
 */

import type { ImportsTemplateParams } from './imports.params';

/** Валидные параметры: все включено */
export const validParamsAllEnabled: ImportsTemplateParams = {
  userDatabaseEnabled: true,
  hasInlineButtons: true,
  hasAutoTransitions: true,
  hasMediaNodes: true,
  hasUploadImages: true,
  hasParseModeNodes: true,
  hasMediaGroups: true,
  hasUrlImages: true,
  hasDatetimeNodes: true,
  hasTimezoneNodes: true,
};

/** Валидные параметры: всё выключено */
export const validParamsAllDisabled: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только БД */
export const validParamsDatabaseOnly: ImportsTemplateParams = {
  userDatabaseEnabled: true,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только медиа */
export const validParamsMediaOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: true,
  hasUploadImages: true,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только inline кнопки */
export const validParamsInlineOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: true,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только автопереходы */
export const validParamsAutoTransitionsOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: true,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только ParseMode */
export const validParamsParseModeOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: true,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только MediaGroups */
export const validParamsMediaGroupsOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: true,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только UrlImages */
export const validParamsUrlImagesOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: true,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
};

/** Валидные параметры: только Datetime */
export const validParamsDatetimeOnly: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: true,
  hasTimezoneNodes: false,
};

/** Валидные параметры: Datetime + Timezone */
export const validParamsDatetimeWithTimezone: ImportsTemplateParams = {
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: true,
  hasTimezoneNodes: true,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true', // должно быть boolean
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  hasInlineButtons: true,
  // отсутствует userDatabaseEnabled
};

/** Ожидаемый вывод: все включено */
export const expectedOutputAllEnabled = `
import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher, types, F
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional

from dotenv import load_dotenv
from aiogram.filters import CommandStart

import asyncpg
import json

from aiogram.exceptions import TelegramBadRequest

import aiohttp
from aiohttp import TCPConnector

from aiogram.enums import ParseMode

from aiogram.types import InputMediaPhoto, InputMediaVideo, InputMediaAudio, InputMediaDocument

from aiogram.types import URLInputFile

from datetime import datetime, timezone

import re
`.trim();

/** Ожидаемый вывод: всё выключено */
export const expectedOutputAllDisabled = `
import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher, types, F
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional

from dotenv import load_dotenv
from aiogram.filters import CommandStart

import re
`.trim();

/** Ожидаемый вывод: только БД */
export const expectedOutputDatabaseOnly = `
import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher, types, F
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional

from dotenv import load_dotenv
from aiogram.filters import CommandStart

import asyncpg
import json

import re
`.trim();
