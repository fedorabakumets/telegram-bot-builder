/** @fileoverview Поля и направления серверной сортировки пользователей. */
/** Поле для сортировки списка пользователей. */
export type SortField = 'lastInteraction' | 'interactionCount' | 'createdAt' | 'firstName' | 'userName' | 'incomingMessageCount' | 'buttonClickCount' | 'acquisitionSource' | 'variableCount' | 'userStatus';

/** Направление сортировки списка */
export type SortDirection = 'asc' | 'desc';
