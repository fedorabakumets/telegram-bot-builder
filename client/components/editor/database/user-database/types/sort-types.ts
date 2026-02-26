/**
 * @fileoverview Типы сортировки пользователей
 * @description Определяет поля и направления для сортировки списка пользователей
 */

/**
 * Возможные поля для сортировки пользователей
 */
export type SortField = 'lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName';

/**
 * Направления сортировки
 */
export type SortDirection = 'asc' | 'desc';
