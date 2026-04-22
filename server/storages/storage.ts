/**
 * @fileoverview Контракт IStorage и создание активного экземпляра server storage
 */

import {
  type BotGroup,
  type BotInstance,
  type BotLaunchHistory,
  type BotLog,
  type BotMessage,
  type BotMessageMedia,
  type BotProject,
  type BotTemplate,
  type BotToken,
  type GroupMember,
  type MediaFile,
  type TelegramUserDB,
  type UserBotData,
  type ProjectCollaborator,
} from "@shared/schema";
import { EnhancedDatabaseStorage } from "../database/EnhancedDatabaseStorage";
import type {
  StorageBotGroupInput,
  StorageBotGroupUpdate,
  StorageBotMessageInput,
  StorageBotMessageMediaInput,
  StorageBotInstanceInput,
  StorageBotInstanceUpdate,
  StorageBotLaunchHistoryInput,
  StorageBotLaunchHistoryUpdate,
  StorageBotLogInput,
  StorageBotProjectInput,
  StorageBotProjectUpdate,
  StorageBotTemplateInput,
  StorageBotTemplateUpdate,
  StorageGroupMemberInput,
  StorageGroupMemberUpdate,
  StorageBotTokenInput,
  StorageBotTokenUpdate,
  StorageMediaFileInput,
  StorageMediaFileUpdate,
  StorageTelegramUserInput,
  StorageUserBotDataInput,
  StorageUserBotDataUpdate,
} from "./storageTypes";

/**
 * Интерфейс для хранилища данных ботов
 * Определяет методы для работы с проектами, шаблонами, токенами и другими данными
 */
export interface IStorage {
  /**
   * Получить проект бота по ID
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  getBotProject(id: number): Promise<BotProject | undefined>;

  /**
   * Получить все проекты ботов
   * @returns Массив проектов ботов
   */
  getAllBotProjects(): Promise<BotProject[]>;

  /**
   * Создать новый проект бота
   * @param project - Данные для создания проекта
   * @returns Созданный проект бота
   */
  createBotProject(project: StorageBotProjectInput): Promise<BotProject>;

  /**
   * Обновить проект бота
   * @param id - ID проекта
   * @param project - Данные для обновления
   * @returns Обновленный проект бота или undefined, если не найден
   */
  updateBotProject(id: number, project: StorageBotProjectUpdate): Promise<BotProject | undefined>;

  /**
   * Переупорядочивает проекты по переданному массиву ID
   */
  reorderBotProjects(projectIds: number[]): Promise<void>;

  /**
   * Удалить проект бота
   * @param id - ID проекта
   * @returns true, если проект был удален, иначе false
   */
  deleteBotProject(id: number): Promise<boolean>;

  // Bot instances
  /**
   * Получить экземпляр бота по ID проекта
   * @param projectId - ID проекта
   * @returns Экземпляр бота или undefined, если не найден
   */
  getBotInstance(projectId: number): Promise<BotInstance | undefined>;

  /**
   * Получить экземпляр бота по ID токена
   * @param tokenId - ID токена
   * @returns Экземпляр бота или undefined, если не найден
   */
  getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined>;

  /**
   * Получить все экземпляры ботов по ID проекта
   * @param projectId - ID проекта
   * @returns Массив экземпляров ботов
   */
  getBotInstancesByProject(projectId: number): Promise<BotInstance[]>;

  /**
   * Получить все экземпляры ботов
   * @returns Массив всех экземпляров ботов
   */
  getAllBotInstances(): Promise<BotInstance[]>;

  /**
   * Создать новый экземпляр бота
   * @param instance - Данные для создания экземпляра
   * @returns Созданный экземпляр бота
   */
  createBotInstance(instance: StorageBotInstanceInput): Promise<BotInstance>;

  /**
   * Обновить экземпляр бота
   * @param id - ID экземпляра
   * @param instance - Данные для обновления
   * @returns Обновленный экземпляр бота или undefined, если не найден
   */
  updateBotInstance(id: number, instance: StorageBotInstanceUpdate): Promise<BotInstance | undefined>;

  /**
   * Удалить экземпляр бота
   * @param id - ID экземпляра
   * @returns true, если экземпляр был удален, иначе false
   */
  deleteBotInstance(id: number): Promise<boolean>;

  /**
   * Остановить экземпляр бота по ID проекта
   * @param projectId - ID проекта
   * @returns true, если экземпляр был остановлен, иначе false
   */
  stopBotInstance(projectId: number): Promise<boolean>;

  /**
   * Остановить экземпляр бота по ID токена
   * @param tokenId - ID токена
   * @returns true, если экземпляр был остановлен, иначе false
   */
  stopBotInstanceByToken(tokenId: number): Promise<boolean>;

  // Bot templates
  /**
   * Получить шаблон бота по ID
   * @param id - ID шаблона
   * @returns Шаблон бота или undefined, если не найден
   */
  getBotTemplate(id: number): Promise<BotTemplate | undefined>;

  /**
   * Получить все шаблоны ботов
   * @returns Массив шаблонов ботов
   */
  getAllBotTemplates(): Promise<BotTemplate[]>;

  /**
   * Создать новый шаблон бота
   * @param template - Данные для создания шаблона
   * @returns Созданный шаблон бота
   */
  createBotTemplate(template: StorageBotTemplateInput): Promise<BotTemplate>;

  /**
   * Обновить шаблон бота
   * @param id - ID шаблона
   * @param template - Данные для обновления
   * @returns Обновленный шаблон бота или undefined, если не найден
   */
  updateBotTemplate(id: number, template: StorageBotTemplateUpdate): Promise<BotTemplate | undefined>;

  /**
   * Удалить шаблон бота
   * @param id - ID шаблона
   * @returns true, если шаблон был удален, иначе false
   */
  deleteBotTemplate(id: number): Promise<boolean>;

  /**
   * Увеличить счетчик использования шаблона
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementTemplateUseCount(id: number): Promise<boolean>;

  /**
   * Увеличить счетчик просмотров шаблона
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementTemplateViewCount(id: number): Promise<boolean>;

  /**
   * Увеличить счетчик загрузок шаблона
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementTemplateDownloadCount(id: number): Promise<boolean>;

  /**
   * Переключить лайк шаблона
   * @param id - ID шаблона
   * @param liked - true для лайка, false для анлайка
   * @returns true, если статус лайка был изменен, иначе false
   */
  toggleTemplateLike(id: number, liked: boolean): Promise<boolean>;

  /**
   * Переключить закладку шаблона
   * @param id - ID шаблона
   * @param bookmarked - true для добавления в закладки, false для удаления
   * @returns true, если статус закладки был изменен, иначе false
   */
  toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean>;

  /**
   * Оценить шаблон
   * @param id - ID шаблона
   * @param rating - Оценка (обычно от 1 до 5)
   * @returns true, если оценка была сохранена, иначе false
   */
  rateTemplate(id: number, rating: number): Promise<boolean>;

  /**
   * Получить рекомендуемые шаблоны
   * @returns Массив рекомендованных шаблонов
   */
  getFeaturedTemplates(): Promise<BotTemplate[]>;

  /**
   * Получить шаблоны по категории
   * @param category - Категория шаблонов
   * @returns Массив шаблонов указанной категории
   */
  getTemplatesByCategory(category: string): Promise<BotTemplate[]>;

  /**
   * Поиск шаблонов по запросу
   * @param query - Поисковый запрос
   * @returns Массив найденных шаблонов
   */
  searchTemplates(query: string): Promise<BotTemplate[]>;

  // Bot tokens
  /**
   * Получить токен бота по ID
   * @param id - ID токена
   * @returns Токен бота или undefined, если не найден
   */
  getBotToken(id: number): Promise<BotToken | undefined>;

  /**
   * Получить токены ботов по ID проекта
   * @param projectId - ID проекта
   * @returns Массив токенов ботов
   */
  getBotTokensByProject(projectId: number): Promise<BotToken[]>;

  /**
   * Получить токен бота по умолчанию для проекта
   * @param projectId - ID проекта
   * @returns Токен бота по умолчанию или undefined, если не найден
   */
  getDefaultBotToken(projectId: number): Promise<BotToken | undefined>;

  /**
   * Создать новый токен бота
   * @param token - Данные для создания токена
   * @returns Созданный токен бота
   */
  createBotToken(token: StorageBotTokenInput): Promise<BotToken>;

  /**
   * Обновить токен бота
   * @param id - ID токена
   * @param token - Данные для обновления
   * @returns Обновленный токен бота или undefined, если не найден
   */
  updateBotToken(id: number, token: StorageBotTokenUpdate): Promise<BotToken | undefined>;

  /**
   * Удалить токен бота
   * @param id - ID токена
   * @returns true, если токен был удален, иначе false
   */
  deleteBotToken(id: number): Promise<boolean>;

  /**
   * Установить токен бота по умолчанию для проекта
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns true, если токен был установлен по умолчанию, иначе false
   */
  setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean>;

  /**
   * Отметить токен как использованный
   * @param id - ID токена
   * @returns true, если токен был отмечен как использованный, иначе false
   */
  markTokenAsUsed(id: number): Promise<boolean>;

  // Telegram Users (authenticated users)
  /**
   * Получить пользователя Telegram по ID
   * @param id - ID пользователя
   * @returns Пользователь Telegram или undefined, если не найден
   */
  getTelegramUser(id: number): Promise<TelegramUserDB | undefined>;

  /**
   * Получить пользователя Telegram или создать нового
   * @param user - Данные пользователя для создания
   * @returns Пользователь Telegram
   */
  getTelegramUserOrCreate(user: StorageTelegramUserInput): Promise<TelegramUserDB>;

  /**
   * Удалить пользователя Telegram
   * @param id - ID пользователя
   * @returns true, если пользователь был удален, иначе false
   */
  deleteTelegramUser(id: number): Promise<boolean>;

  // User-specific methods (filtered by ownerId)
  /**
   * Получить проекты ботов пользователя
   * @param ownerId - ID владельца
   * @returns Массив проектов ботов пользователя
   */
  getUserBotProjects(ownerId: number): Promise<BotProject[]>;

  /**
   * Получить гостевые проекты ботов (без владельца)
   * Возвращает только проекты с sessionId = NULL (старые общие)
   * @returns Массив гостевых проектов ботов
   */
  getGuestBotProjects(): Promise<BotProject[]>;

  /**
   * Получить все гостевые проекты (owner_id IS NULL) независимо от sessionId
   * @returns Массив всех гостевых проектов
   */
  getAllGuestBotProjects(): Promise<BotProject[]>;

  /**
   * Получить гостевые проекты по ID сессии
   * Возвращает проекты конкретной сессии + старые общие (sessionId = NULL)
   * @param sessionId - ID сессии гостевого пользователя
   * @returns Массив гостевых проектов доступных для данной сессии
   */
  getGuestBotProjectsBySession(sessionId: string): Promise<BotProject[]>;

  /**
   * Переносит гостевые проекты сессии к авторизованному пользователю
   * @param sessionId - ID сессии гостя
   * @param ownerId - ID нового владельца
   */
  migrateGuestProjects(sessionId: string, ownerId: number): Promise<void>;

  /**
   * Переносит ВСЕ гостевые проекты (owner_id IS NULL) к пользователю.
   * Используется в dev-режиме для восстановления проектов после перезапуска.
   * @param ownerId - ID нового владельца
   */
  migrateAllGuestProjects(ownerId: number): Promise<void>;

  /**
   * Получить токены ботов пользователя
   * @param ownerId - ID владельца
   * @param projectId - Опциональный ID проекта для фильтрации
   * @returns Массив токенов ботов пользователя
   */
  getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]>;

  /**
   * Получить шаблоны ботов пользователя
   * @param ownerId - ID владельца
   * @returns Массив шаблонов ботов пользователя
   */
  getUserBotTemplates(ownerId: number): Promise<BotTemplate[]>;

  // Media files
  /**
   * Получить медиафайл по ID
   * @param id - ID файла
   * @returns Медиафайл или undefined, если не найден
   */
  getMediaFile(id: number): Promise<MediaFile | undefined>;

  /**
   * Получить медиафайлы по ID проекта
   * @param projectId - ID проекта
   * @returns Массив медиафайлов проекта
   */
  getMediaFilesByProject(projectId: number): Promise<MediaFile[]>;

  /**
   * Получить медиафайлы по ID проекта и типу файла
   * @param projectId - ID проекта
   * @param fileType - Тип файла
   * @returns Массив медиафайлов указанного типа
   */
  getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]>;

  /**
   * Создать новый медиафайл
   * @param file - Данные для создания файла
   * @returns Созданный медиафайл
   */
  createMediaFile(file: StorageMediaFileInput): Promise<MediaFile>;

  /**
   * Обновить медиафайл
   * @param id - ID файла
   * @param file - Данные для обновления
   * @returns Обновленный медиафайл или undefined, если не найден
   */
  updateMediaFile(id: number, file: StorageMediaFileUpdate): Promise<MediaFile | undefined>;

  /**
   * Удалить медиафайл
   * @param id - ID файла
   * @returns true, если файл был удален, иначе false
   */
  deleteMediaFile(id: number): Promise<boolean>;

  /**
   * Увеличить счетчик использования медиафайла
   * @param id - ID файла
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementMediaFileUsage(id: number): Promise<boolean>;

  /**
   * Поиск медиафайлов по проекту и запросу
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных медиафайлов
   */
  searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]>;

  // User bot data
  /**
   * Получить данные пользователя бота по ID
   * @param id - ID данных пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  getUserBotData(id: number): Promise<UserBotData | undefined>;

  /**
   * Получить данные пользователя бота по ID проекта и ID пользователя
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  getUserBotDataByProjectAndUser(projectId: number, userId: string, tokenId?: number | null): Promise<UserBotData | undefined>;

  /**
   * Получить все данные пользователей бота по ID проекта
   * @param projectId - ID проекта
   * @returns Массив данных пользователей бота
   */
  getUserBotDataByProject(projectId: number, tokenId?: number | null): Promise<UserBotData[]>;

  /**
   * Получить все данные пользователей ботов
   * @returns Массив всех данных пользователей ботов
   */
  getAllUserBotData(): Promise<UserBotData[]>;

  /**
   * Создать новые данные пользователя бота
   * @param userData - Данные для создания
   * @returns Созданные данные пользователя бота
   */
  createUserBotData(userData: StorageUserBotDataInput): Promise<UserBotData>;

  /**
   * Обновить данные пользователя бота
   * @param id - ID данных
   * @param userData - Данные для обновления
   * @returns Обновленные данные пользователя бота или undefined, если не найдены
   */
  updateUserBotData(id: number, userData: StorageUserBotDataUpdate): Promise<UserBotData | undefined>;

  /**
   * Удалить данные пользователя бота
   * @param id - ID данных
   * @returns true, если данные были удалены, иначе false
   */
  deleteUserBotData(id: number): Promise<boolean>;

  /**
   * Удалить все данные пользователей бота по ID проекта
   * @param projectId - ID проекта
   * @returns true, если данные были удалены, иначе false
   */
  deleteUserBotDataByProject(projectId: number, tokenId?: number | null): Promise<boolean>;

  /**
   * Увеличить счетчик взаимодействий пользователя
   * @param id - ID данных пользователя
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementUserInteraction(id: number): Promise<boolean>;

  /**
   * Увеличить счетчик взаимодействий пользователя бота (bot_users)
   * @param userId - ID пользователя в Telegram
   * @param projectId - ID проекта
   * @param tokenId - ID токена бота
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementBotUserInteraction(userId: number, projectId: number, tokenId: number): Promise<boolean>;

  /**
   * Обновить состояние пользователя
   * @param id - ID данных пользователя
   * @param state - Новое состояние
   * @returns true, если состояние было обновлено, иначе false
   */
  updateUserState(id: number, state: string): Promise<boolean>;

  /**
   * Поиск данных пользователей бота по проекту и запросу
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных данных пользователей
   */
  searchUserBotData(projectId: number, query: string, tokenId?: number | null): Promise<UserBotData[]>;

  /**
   * Получить статистику по данным пользователей бота
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей
   */
  getUserBotDataStats(projectId: number, tokenId?: number | null): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }>;

  // Bot groups
  /**
   * Получить группу бота по ID
   * @param id - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  getBotGroup(id: number): Promise<BotGroup | undefined>;

  /**
   * Получить все группы бота по ID проекта
   * @param projectId - ID проекта
   * @returns Массив групп бота
   */
  getBotGroupsByProject(projectId: number): Promise<BotGroup[]>;

  /**
   * Получить группу бота по ID проекта и ID группы
   * @param projectId - ID проекта
   * @param groupId - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined>;

  /**
   * Создать новую группу бота
   * @param group - Данные для создания группы
   * @returns Созданная группа бота
   */
  createBotGroup(group: StorageBotGroupInput): Promise<BotGroup>;

  /**
   * Обновить группу бота
   * @param id - ID группы
   * @param group - Данные для обновления
   * @returns Обновленная группа бота или undefined, если не найдена
   */
  updateBotGroup(id: number, group: StorageBotGroupUpdate): Promise<BotGroup | undefined>;

  /**
   * Удалить группу бота
   * @param id - ID группы
   * @returns true, если группа была удалена, иначе false
   */
  deleteBotGroup(id: number): Promise<boolean>;

  // Group members
  /**
   * Получить участников группы
   * @param groupId - ID группы
   * @returns Массив участников группы
   */
  getGroupMembers(groupId: number): Promise<GroupMember[]>;

  /**
   * Создать нового участника группы
   * @param member - Данные для создания участника
   * @returns Созданный участник группы
   */
  createGroupMember(member: StorageGroupMemberInput): Promise<GroupMember>;

  /**
   * Обновить участника группы
   * @param id - ID участника
   * @param member - Данные для обновления
   * @returns Обновленный участник группы или undefined, если не найден
   */
  updateGroupMember(id: number, member: StorageGroupMemberUpdate): Promise<GroupMember | undefined>;

  /**
   * Удалить участника группы
   * @param id - ID участника
   * @returns true, если участник был удален, иначе false
   */
  deleteGroupMember(id: number): Promise<boolean>;

  // Bot messages
  /**
   * Создать новое сообщение бота
   * @param message - Данные для создания сообщения
   * @returns Созданное сообщение бота
   */
  createBotMessage(message: StorageBotMessageInput): Promise<BotMessage>;

  /**
   * Получить сообщения бота по проекту и пользователю
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота
   */
  getBotMessages(projectId: number, userId: string, limit?: number, tokenId?: number | null): Promise<BotMessage[]>;

  /**
   * Получить сообщения бота с медиа по проекту и пользователю
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @param order - Порядок сортировки: 'asc' или 'desc' (по умолчанию 'asc')
   * @param messageType - Тип сообщения: 'user' или 'bot' (опционально)
   * @returns Массив сообщений бота с медиафайлами
   */
  getBotMessagesWithMedia(projectId: number, userId: string, limit?: number, order?: 'asc' | 'desc', messageType?: 'user' | 'bot', tokenId?: number | null): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]>;

  /**
   * Удалить сообщения бота по проекту и пользователю
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns true, если сообщения были удалены, иначе false
   */
  deleteBotMessages(projectId: number, userId: string, tokenId?: number | null): Promise<boolean>;

  /**
   * Удалить все сообщения бота по проекту
   * @param projectId - ID проекта
   * @returns true, если сообщения были удалены, иначе false
   */
  deleteAllBotMessages(projectId: number, tokenId?: number | null): Promise<boolean>;

  // Bot message media
  /**
   * Создать запись о медиафайле в сообщении бота
   * @param data - Данные для создания записи
   * @returns Созданная запись о медиафайле
   */
  createBotMessageMedia(data: StorageBotMessageMediaInput): Promise<BotMessageMedia>;

  /**
   * Получить медиафайлы сообщения
   * @param messageId - ID сообщения
   * @returns Массив медиафайлов сообщения
   */
  getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number }>>;

  /**
   * Импортировать проекты из файлов в директории bots/
   * @returns Массив импортированных проектов
   */
  importProjectsFromFiles(): Promise<BotProject[]>;

  /**
   * Сохранить батч записей логов бота
   * @param logs - Массив записей для вставки
   * @returns Promise<void>
   */
  saveBotLogs(logs: StorageBotLogInput[]): Promise<void>;

  /**
   * Получить последние N строк логов бота
   * @param projectId - Идентификатор проекта
   * @param tokenId - Идентификатор токена
   * @param limit - Максимальное количество строк (по умолчанию 500)
   * @returns Массив записей логов
   */
  getBotLogs(projectId: number, tokenId: number, limit?: number): Promise<BotLog[]>;

  /**
   * Создать запись о запуске бота
   * @param data - Данные для создания записи
   * @returns Созданная запись истории запуска
   */
  createLaunchHistory(data: StorageBotLaunchHistoryInput): Promise<BotLaunchHistory>;

  /**
   * Обновить запись истории запуска (при остановке или ошибке)
   * @param id - ID записи
   * @param data - Данные для обновления
   * @returns Promise<void>
   */
  updateLaunchHistory(id: number, data: StorageBotLaunchHistoryUpdate): Promise<void>;

  /**
   * Получить последние N запусков для токена
   * @param tokenId - ID токена
   * @param limit - Максимальное количество записей (по умолчанию 10)
   * @returns Массив записей истории запусков
   */
  getLaunchHistory(tokenId: number, limit?: number): Promise<BotLaunchHistory[]>;

  /**
   * Получить логи конкретного запуска бота
   * @param launchId - ID записи в bot_launch_history
   * @returns Массив записей логов
   */
  getBotLogsByLaunch(launchId: number): Promise<BotLog[]>;

  /**
   * Получить активную (со статусом 'running') запись истории запуска для токена
   * @param tokenId - ID токена
   * @returns Запись истории запуска или undefined, если активного запуска нет
   */
  getActiveLaunchHistory(tokenId: number): Promise<BotLaunchHistory | undefined>;

  /**
   * Получить статистику пользователей по токену
   * @param tokenId - ID токена
   * @returns Объект со статистикой: total_users, active_24h, active_7d, new_today
   */
  getTokenUserStats(tokenId: number): Promise<{
    total_users: number;
    active_24h: number;
    active_7d: number;
    new_today: number;
  }>;

  // Коллабораторы проекта

  /**
   * Проверяет, имеет ли пользователь доступ к проекту (владелец или коллаборатор)
   * @param projectId - ID проекта
   * @param userId - ID пользователя Telegram
   * @returns true, если доступ есть
   */
  hasProjectAccess(projectId: number, userId: number): Promise<boolean>;

  /**
   * Добавляет коллаборатора к проекту
   * @param projectId - ID проекта
   * @param userId - ID пользователя Telegram
   * @param invitedBy - ID пользователя, пригласившего коллаборатора (опционально)
   */
  addCollaborator(projectId: number, userId: number, invitedBy?: number): Promise<void>;

  /**
   * Удаляет коллаборатора из проекта
   * @param projectId - ID проекта
   * @param userId - ID пользователя Telegram
   * @returns true, если коллаборатор был удалён
   */
  removeCollaborator(projectId: number, userId: number): Promise<boolean>;

  /**
   * Возвращает список коллабораторов проекта
   * @param projectId - ID проекта
   * @returns Массив записей коллабораторов
   */
  getCollaborators(projectId: number): Promise<ProjectCollaborator[]>;
}

// Используем EnhancedDatabaseStorage для продвинутого управления базой данных
export let storageInstance: EnhancedDatabaseStorage | null = null;

/**
 * Экземпляр хранилища для использования в приложении
 * Использует EnhancedDatabaseStorage для продвинутого управления базой данных
 */
export const storage = new EnhancedDatabaseStorage();
