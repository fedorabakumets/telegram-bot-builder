/**
 * @fileoverview Типы сортировки пользователей
 * @description Определяет доступные поля и направления для сортировки списка пользователей в базе данных
 * @module
 */

/**
 * Доступные поля для сортировки списка пользователей
 * @typedef SortField
 * @type {('lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName')}
 * @description Используется в компоненте UserDatabasePanel для упорядочивания списка пользователей
 * @property {'lastInteraction'} - Сортировка по дате последнего взаимодействия (входа в бот)
 * @property {'interactionCount'} - Сортировка по количеству сообщений/взаимодействий с ботом
 * @property {'createdAt'} - Сортировка по дате регистрации пользователя в боте
 * @property {'firstName'} - Сортировка по имени пользователя (алфавитный порядок)
 * @property {'userName'} - Сортировка по username (@nickname) в Telegram
 */
export type SortField = 'lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName';

/**
 * Направление сортировки списка
 * @typedef SortDirection
 * @type {('asc' | 'desc')}
 * @description Определяет порядок сортировки: возрастание или убывание
 * @property {'asc'} - Возрастание (от меньшего к большему, A-Я, старые к новым)
 * @property {'desc'} - Убывание (от большего к меньшему, Я-А, новые к старым)
 */
export type SortDirection = 'asc' | 'desc';
