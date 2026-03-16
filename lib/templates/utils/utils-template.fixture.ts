/**
 * @fileoverview Тестовые данные для шаблона утилит
 * @module templates/utils/utils-template.fixture
 */

import type { UtilsTemplateParams } from './utils-template.params';

/** Валидные параметры: БД включена */
export const validParamsEnabled: UtilsTemplateParams = {
  userDatabaseEnabled: true,
};

/** Валидные параметры: БД выключена */
export const validParamsDisabled: UtilsTemplateParams = {
  userDatabaseEnabled: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};

/** Ожидаемый вывод: БД включена */
export const expectedOutputEnabled = `
# Утилитарные функции
from aiogram import types

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"


def get_user_variables(user_id):
    """Получает все переменные пользователя из локального хранилища

    Args:
        user_id (int): ID пользователя Telegram

    Returns:
        dict: Словарь с переменными пользователя или пустой словарь если пользователь не найден
    """
    # Возвращаем переменные пользователя из локального хранилища или пустой словарь
    return user_data.get(user_id, {})


async def check_auth(user_id: int) -> bool:
    # Проверяем наличие пользователя в БД или локальном хранилище
    if db_pool:
        user = await get_user_from_db(user_id)
        return user is not None
    return user_id in user_data


# Функции для сохранения в таблицы БД
# Здесь будут функции для сохранения в таблицы
# generateSaveHelperFunctions будет добавлен отдельно
`.trim();

/** Ожидаемый вывод: БД выключена */
export const expectedOutputDisabled = `
# Утилитарные функции
from aiogram import types

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"


def get_user_variables(user_id):
    """Получает все переменные пользователя из локального хранилища

    Args:
        user_id (int): ID пользователя Telegram

    Returns:
        dict: Словарь с переменными пользователя или пустой словарь если пользователь не найден
    """
    # Возвращаем переменные пользователя из локального хранилища или пустой словарь
    return user_data.get(user_id, {})


async def check_auth(user_id: int) -> bool:
    return user_id in user_data
`.trim();
