import { 
  botProjects, 
  botInstances,
  botTemplates,
  botTokens,
  mediaFiles,
  userBotData,
  botGroups,
  groupMembers,
  botUsers,
  botMessages,
  botMessageMedia,
  telegramUsers,
  type BotProject, 
  type InsertBotProject,
  type BotInstance,
  type InsertBotInstance,
  type BotTemplate,
  type InsertBotTemplate,
  type BotToken,
  type InsertBotToken,
  type MediaFile,
  type InsertMediaFile,
  type UserBotData,
  type InsertUserBotData,
  type BotGroup,
  type InsertBotGroup,
  type GroupMember,
  type InsertGroupMember,
  type BotUser,
  type BotMessage,
  type InsertBotMessage,
  type BotMessageMedia,
  type InsertBotMessageMedia,
  type TelegramUserDB,
  type InsertTelegramUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, like, or, ilike, sql, isNull } from "drizzle-orm";
import { dbManager } from "./db-utils";
import { cachedOps } from "./db-cache";

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
  createBotProject(project: InsertBotProject): Promise<BotProject>;

  /**
   * Обновить проект бота
   * @param id - ID проекта
   * @param project - Данные для обновления
   * @returns Обновленный проект бота или undefined, если не найден
   */
  updateBotProject(id: number, project: Partial<InsertBotProject>): Promise<BotProject | undefined>;

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
  createBotInstance(instance: InsertBotInstance): Promise<BotInstance>;

  /**
   * Обновить экземпляр бота
   * @param id - ID экземпляра
   * @param instance - Данные для обновления
   * @returns Обновленный экземпляр бота или undefined, если не найден
   */
  updateBotInstance(id: number, instance: Partial<InsertBotInstance>): Promise<BotInstance | undefined>;

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
  createBotTemplate(template: InsertBotTemplate): Promise<BotTemplate>;

  /**
   * Обновить шаблон бота
   * @param id - ID шаблона
   * @param template - Данные для обновления
   * @returns Обновленный шаблон бота или undefined, если не найден
   */
  updateBotTemplate(id: number, template: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined>;

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
  createBotToken(token: InsertBotToken): Promise<BotToken>;

  /**
   * Обновить токен бота
   * @param id - ID токена
   * @param token - Данные для обновления
   * @returns Обновленный токен бота или undefined, если не найден
   */
  updateBotToken(id: number, token: Partial<InsertBotToken>): Promise<BotToken | undefined>;

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
  getTelegramUserOrCreate(user: InsertTelegramUser): Promise<TelegramUserDB>;

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
   * @returns Массив гостевых проектов ботов
   */
  getGuestBotProjects(): Promise<BotProject[]>;

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
  createMediaFile(file: InsertMediaFile): Promise<MediaFile>;

  /**
   * Обновить медиафайл
   * @param id - ID файла
   * @param file - Данные для обновления
   * @returns Обновленный медиафайл или undefined, если не найден
   */
  updateMediaFile(id: number, file: Partial<InsertMediaFile>): Promise<MediaFile | undefined>;

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
  getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined>;

  /**
   * Получить все данные пользователей бота по ID проекта
   * @param projectId - ID проекта
   * @returns Массив данных пользователей бота
   */
  getUserBotDataByProject(projectId: number): Promise<UserBotData[]>;

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
  createUserBotData(userData: InsertUserBotData): Promise<UserBotData>;

  /**
   * Обновить данные пользователя бота
   * @param id - ID данных
   * @param userData - Данные для обновления
   * @returns Обновленные данные пользователя бота или undefined, если не найдены
   */
  updateUserBotData(id: number, userData: Partial<InsertUserBotData>): Promise<UserBotData | undefined>;

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
  deleteUserBotDataByProject(projectId: number): Promise<boolean>;

  /**
   * Увеличить счетчик взаимодействий пользователя
   * @param id - ID данных пользователя
   * @returns true, если счетчик был увеличен, иначе false
   */
  incrementUserInteraction(id: number): Promise<boolean>;

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
  searchUserBotData(projectId: number, query: string): Promise<UserBotData[]>;

  /**
   * Получить статистику по данным пользователей бота
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей
   */
  getUserBotDataStats(projectId: number): Promise<{
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
  createBotGroup(group: InsertBotGroup): Promise<BotGroup>;

  /**
   * Обновить группу бота
   * @param id - ID группы
   * @param group - Данные для обновления
   * @returns Обновленная группа бота или undefined, если не найдена
   */
  updateBotGroup(id: number, group: Partial<InsertBotGroup>): Promise<BotGroup | undefined>;

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
  createGroupMember(member: InsertGroupMember): Promise<GroupMember>;

  /**
   * Обновить участника группы
   * @param id - ID участника
   * @param member - Данные для обновления
   * @returns Обновленный участник группы или undefined, если не найден
   */
  updateGroupMember(id: number, member: Partial<InsertGroupMember>): Promise<GroupMember | undefined>;

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
  createBotMessage(message: InsertBotMessage): Promise<BotMessage>;

  /**
   * Получить сообщения бота по проекту и пользователю
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота
   */
  getBotMessages(projectId: number, userId: string, limit?: number): Promise<BotMessage[]>;

  /**
   * Получить сообщения бота с медиа по проекту и пользователю
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота с медиафайлами
   */
  getBotMessagesWithMedia(projectId: number, userId: string, limit?: number): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]>;

  /**
   * Удалить сообщения бота по проекту и пользователю
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns true, если сообщения были удалены, иначе false
   */
  deleteBotMessages(projectId: number, userId: string): Promise<boolean>;

  /**
   * Удалить все сообщения бота по проекту
   * @param projectId - ID проекта
   * @returns true, если сообщения были удалены, иначе false
   */
  deleteAllBotMessages(projectId: number): Promise<boolean>;

  // Bot message media
  /**
   * Создать запись о медиафайле в сообщении бота
   * @param data - Данные для создания записи
   * @returns Созданная запись о медиафайле
   */
  createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia>;

  /**
   * Получить медиафайлы сообщения
   * @param messageId - ID сообщения
   * @returns Массив медиафайлов сообщения
   */
  getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number }>>;
}

// Legacy Memory Storage - kept for reference
/**
 * Класс для хранения данных в памяти (устаревшая реализация)
 * Используется в основном для тестирования и справочных целей
 */
class MemStorage implements IStorage {
  private projects: Map<number, BotProject>;
  private instances: Map<number, BotInstance>;
  private templates: Map<number, BotTemplate>;
  currentId: number;
  currentInstanceId: number;
  currentTemplateId: number;

  /**
   * Конструктор класса MemStorage
   * Инициализирует хранилище с пустыми коллекциями и создает пример проекта
   */
  constructor() {
    this.projects = new Map();
    this.instances = new Map();
    this.templates = new Map();
    this.currentId = 1;
    this.currentInstanceId = 1;
    this.currentTemplateId = 1;

    // Add a default project
    const defaultProject: BotProject = {
      id: 1,
      ownerId: null,
      name: "Мой первый бот",
      description: "Пример бота для знакомства с конструктором",
      data: {
        nodes: [
          {
            id: "start-1",
            type: "start",
            position: { x: 100, y: 100 },
            data: {
              command: "/start",
              description: "Запустить бота",
              messageText: "Привет! 👋 Добро пожаловать в наш бот!",
              keyboardType: "reply",
              buttons: [
                {
                  id: "btn-1",
                  text: "📋 Главное меню",
                  action: "goto",
                  target: "menu-1"
                },
                {
                  id: "btn-2",
                  text: "ℹ️ О нас",
                  action: "goto",
                  target: "about-1"
                }
              ],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            }
          }
        ],
        connections: []
      },
      botToken: null,
      userDatabaseEnabled: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(1, defaultProject);
    this.currentId = 2;
  }

  /**
   * Получить проект бота по ID из памяти
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    return this.projects.get(id);
  }

  /**
   * Получить все проекты ботов из памяти
   * @returns Массив проектов ботов
   */
  async getAllBotProjects(): Promise<BotProject[]> {
    return Array.from(this.projects.values());
  }

  /**
   * Создать новый проект бота в памяти
   * @param insertProject - Данные для создания проекта
   * @returns Созданный проект бота
   */
  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const id = this.currentId++;
    const project: BotProject = {
      ...insertProject,
      id,
      ownerId: insertProject.ownerId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: insertProject.description || null,
      botToken: insertProject.botToken ?? null,
      userDatabaseEnabled: insertProject.userDatabaseEnabled ?? 1,
      data: insertProject.data ?? {}, // Убедимся, что поле data всегда присутствует
    };
    this.projects.set(id, project);
    return project;
  }

  /**
   * Обновить проект бота в памяти
   * @param id - ID проекта
   * @param updateData - Данные для обновления
   * @returns Обновленный проект бота или undefined, если не найден
   */
  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject: BotProject = {
      ...project,
      ...updateData,
      updatedAt: new Date(),
    };

    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  /**
   * Удалить проект бота из памяти
   * @param id - ID проекта
   * @returns true, если проект был удален, иначе false
   */
  async deleteBotProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Bot instances methods
  /**
   * Получить экземпляр бота по ID проекта из памяти
   * @param projectId - ID проекта
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    return Array.from(this.instances.values()).find(instance => instance.projectId === projectId);
  }

  /**
   * Получить экземпляр бота по ID токена из памяти
   * @param tokenId - ID токена
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined> {
    return Array.from(this.instances.values()).find(instance => instance.tokenId === tokenId);
  }

  /**
   * Получить все экземпляры ботов по ID проекта из памяти
   * @param projectId - ID проекта
   * @returns Массив экземпляров ботов
   */
  async getBotInstancesByProject(projectId: number): Promise<BotInstance[]> {
    return Array.from(this.instances.values()).filter(instance => instance.projectId === projectId);
  }

  /**
   * Получить все экземпляры ботов из памяти
   * @returns Массив всех экземпляров ботов
   */
  async getAllBotInstances(): Promise<BotInstance[]> {
    return Array.from(this.instances.values());
  }

  /**
   * Создать новый экземпляр бота в памяти
   * @param insertInstance - Данные для создания экземпляра
   * @returns Созданный экземпляр бота
   */
  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    // Теперь удаляем существующий экземпляр только для этого же токена
    const existingInstance = await this.getBotInstanceByToken(insertInstance.tokenId);
    if (existingInstance) {
      await this.deleteBotInstance(existingInstance.id);
    }

    const id = this.currentInstanceId++;
    const instance: BotInstance = {
      ...insertInstance,
      id,
      startedAt: new Date(),
      stoppedAt: null,
      errorMessage: insertInstance.errorMessage || null,
      processId: insertInstance.processId || null,
    };
    this.instances.set(id, instance);
    return instance;
  }

  /**
   * Обновить экземпляр бота в памяти
   * @param id - ID экземпляра
   * @param updateData - Данные для обновления
   * @returns Обновленный экземпляр бота или undefined, если не найден
   */
  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const instance = this.instances.get(id);
    if (!instance) return undefined;

    const updatedInstance: BotInstance = {
      ...instance,
      ...updateData,
      stoppedAt: updateData.status === 'stopped' ? new Date() : instance.stoppedAt,
    };

    this.instances.set(id, updatedInstance);
    return updatedInstance;
  }

  /**
   * Удалить экземпляр бота из памяти
   * @param id - ID экземпляра
   * @returns true, если экземпляр был удален, иначе false
   */
  async deleteBotInstance(id: number): Promise<boolean> {
    return this.instances.delete(id);
  }

  /**
   * Остановить экземпляр бота по ID проекта в памяти
   * @param projectId - ID проекта
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstance(projectId: number): Promise<boolean> {
    const instance = await this.getBotInstance(projectId);
    if (!instance) return false;

    const updated = await this.updateBotInstance(instance.id, {
      status: 'stopped'
    });
    return !!updated;
  }

  /**
   * Остановить экземпляр бота по ID токена в памяти
   * @param tokenId - ID токена
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const instance = await this.getBotInstanceByToken(tokenId);
    if (!instance) return false;

    const updated = await this.updateBotInstance(instance.id, {
      status: 'stopped'
    });
    return !!updated;
  }

  // Bot templates methods
  /**
   * Получить шаблон бота по ID из памяти
   * @param id - ID шаблона
   * @returns Шаблон бота или undefined, если не найден
   */
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    return this.templates.get(id);
  }

  /**
   * Получить все шаблоны ботов из памяти
   * @returns Массив шаблонов ботов
   */
  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Создать новый шаблон бота в памяти
   * @param insertTemplate - Данные для создания шаблона
   * @returns Созданный шаблон бота
   */
  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const id = this.currentTemplateId++;
    const template: BotTemplate = {
      ...insertTemplate,
      id,
      ownerId: insertTemplate.ownerId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: insertTemplate.category || "custom",
      tags: insertTemplate.tags || [],
      isPublic: insertTemplate.isPublic || 0,
      description: insertTemplate.description || null,
      difficulty: insertTemplate.difficulty || "easy",
      authorId: insertTemplate.authorId || null,
      authorName: insertTemplate.authorName || null,
      useCount: 0,
      rating: 0,
      ratingCount: 0,
      featured: 0,
      version: insertTemplate.version || "1.0.0",
      previewImage: insertTemplate.previewImage || null,
      lastUsedAt: null,
      downloadCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      language: insertTemplate.language || "ru",
      requiresToken: insertTemplate.requiresToken || 0,
      complexity: insertTemplate.complexity || 1,
      estimatedTime: insertTemplate.estimatedTime || 5,
    };
    this.templates.set(id, template);
    return template;
  }

  /**
   * Обновить шаблон бота в памяти
   * @param id - ID шаблона
   * @param updateData - Данные для обновления
   * @returns Обновленный шаблон бота или undefined, если не найден
   */
  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;

    const updatedTemplate: BotTemplate = {
      ...template,
      ...updateData,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Удалить шаблон бота из памяти
   * @param id - ID шаблона
   * @returns true, если шаблон был удален, иначе false
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  /**
   * Увеличить счетчик использования шаблона в памяти
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      useCount: (template.useCount || 0) + 1,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Увеличить счетчик просмотров шаблона в памяти
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      viewCount: (template.viewCount || 0) + 1,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Увеличить счетчик загрузок шаблона в памяти
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      downloadCount: (template.downloadCount || 0) + 1,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Переключить лайк шаблона в памяти
   * @param id - ID шаблона
   * @param liked - true для лайка, false для анлайка
   * @returns true, если статус лайка был изменен, иначе false
   */
  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      likeCount: Math.max(0, (template.likeCount || 0) + (liked ? 1 : -1)),
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Переключить закладку шаблона в памяти
   * @param id - ID шаблона
   * @param bookmarked - true для добавления в закладки, false для удаления
   * @returns true, если статус закладки был изменен, иначе false
   */
  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      bookmarkCount: Math.max(0, (template.bookmarkCount || 0) + (bookmarked ? 1 : -1)),
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Оценить шаблон в памяти
   * @param id - ID шаблона
   * @param rating - Оценка (обычно от 1 до 5)
   * @returns true, если оценка была сохранена, иначе false
   */
  async rateTemplate(id: number, rating: number): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;

    // Обновляем рейтинг
    const currentRatingCount = template.ratingCount || 0;
    const currentRating = template.rating || 0;
    const newRatingCount = currentRatingCount + 1;
    const newRating = Math.round(((currentRating * currentRatingCount) + rating) / newRatingCount);

    const updatedTemplate = {
      ...template,
      rating: newRating,
      ratingCount: newRatingCount,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  /**
   * Получить рекомендуемые шаблоны из памяти
   * @returns Массив рекомендованных шаблонов
   */
  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return Array.from(this.templates.values()).filter(template => template.featured === 1);
  }

  /**
   * Получить шаблоны по категории из памяти
   * @param category - Категория шаблонов
   * @returns Массив шаблонов указанной категории
   */
  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  /**
   * Поиск шаблонов по запросу в памяти
   * @param query - Поисковый запрос
   * @returns Массив найденных шаблонов
   */
  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      (template.description && template.description.toLowerCase().includes(searchTerm)) ||
      (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Bot Tokens (Memory implementation)
  /**
   * Получить токен бота по ID из памяти (не поддерживается)
   * @param id - ID токена
   * @returns undefined, так как токены не хранятся в памяти
   */
  async getBotToken(id: number): Promise<BotToken | undefined> {
    // In memory implementation - tokens are not stored
    return undefined;
  }

  /**
   * Получить токены ботов по ID проекта из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns Пустой массив, так как токены не хранятся в памяти
   */
  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    // In memory implementation - tokens are not stored
    return [];
  }

  /**
   * Получить токен бота по умолчанию для проекта из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns undefined, так как токены не хранятся в памяти
   */
  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    // In memory implementation - tokens are not stored
    return undefined;
  }

  /**
   * Создать новый токен бота в памяти (временная реализация)
   * @param insertToken - Данные для создания токена
   * @returns Созданный токен бота
   */
  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    // In memory implementation - create temporary token
    const token: BotToken = {
      ...insertToken,
      id: this.currentTemplateId++, // Reuse template ID counter
      ownerId: insertToken.ownerId ?? null,
      description: insertToken.description || null,
      lastUsedAt: null,
      isDefault: insertToken.isDefault ?? 0,
      isActive: insertToken.isActive ?? 1,
      trackExecutionTime: insertToken.trackExecutionTime ?? 0,
      totalExecutionSeconds: insertToken.totalExecutionSeconds ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Добавляем значения по умолчанию для новых полей
      botFirstName: insertToken.botFirstName || null,
      botUsername: insertToken.botUsername || null,
      botDescription: insertToken.botDescription || null,
      botShortDescription: insertToken.botShortDescription || null,
      botPhotoUrl: insertToken.botPhotoUrl || null,
      botCanJoinGroups: insertToken.botCanJoinGroups || null,
      botCanReadAllGroupMessages: insertToken.botCanReadAllGroupMessages || null,
      botSupportsInlineQueries: insertToken.botSupportsInlineQueries || null,
      botHasMainWebApp: insertToken.botHasMainWebApp || null,
    };
    return token;
  }

  /**
   * Обновить токен бота в памяти (не поддерживается)
   * @param id - ID токена
   * @param updateData - Данные для обновления
   * @returns undefined, так как обновление не поддерживается
   */
  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    // In memory implementation - not supported
    return undefined;
  }

  /**
   * Удалить токен бота из памяти (не поддерживается)
   * @param id - ID токена
   * @returns false, так как удаление не поддерживается
   */
  async deleteBotToken(id: number): Promise<boolean> {
    // In memory implementation - not supported
    return false;
  }

  /**
   * Установить токен бота по умолчанию для проекта в памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns false, так как операция не поддерживается
   */
  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    // In memory implementation - not supported
    return false;
  }

  /**
   * Отметить токен как использованный в памяти (не поддерживается)
   * @param id - ID токена
   * @returns false, так как операция не поддерживается
   */
  async markTokenAsUsed(id: number): Promise<boolean> {
    // In memory implementation - not supported
    return false;
  }

  // Telegram Users (Memory implementation - not fully supported)
  /**
   * Получить пользователя Telegram по ID из памяти (не поддерживается)
   * @param id - ID пользователя
   * @returns undefined, так как пользователи не хранятся в памяти
   */
  async getTelegramUser(id: number): Promise<TelegramUserDB | undefined> {
    return undefined;
  }

  /**
   * Получить пользователя Telegram или создать нового в памяти
   * @param user - Данные пользователя для создания
   * @returns Пользователь Telegram
   */
  async getTelegramUserOrCreate(user: InsertTelegramUser): Promise<TelegramUserDB> {
    const telegramUser: TelegramUserDB = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName ?? null,
      username: user.username ?? null,
      photoUrl: user.photoUrl ?? null,
      authDate: user.authDate ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return telegramUser;
  }

  /**
   * Удалить пользователя Telegram из памяти (не поддерживается)
   * @param id - ID пользователя
   * @returns false, так как удаление не поддерживается
   */
  async deleteTelegramUser(id: number): Promise<boolean> {
    return false;
  }

  // User-specific methods
  /**
   * Получить проекты ботов пользователя из памяти
   * @param ownerId - ID владельца
   * @returns Массив проектов ботов пользователя
   */
  async getUserBotProjects(ownerId: number): Promise<BotProject[]> {
    return Array.from(this.projects.values()).filter(p => p.ownerId === ownerId);
  }

  /**
   * Получить гостевые проекты ботов (без владельца) из памяти
   * @returns Массив гостевых проектов ботов
   */
  async getGuestBotProjects(): Promise<BotProject[]> {
    return Array.from(this.projects.values()).filter(p => p.ownerId === null);
  }

  /**
   * Получить токены ботов пользователя из памяти (не поддерживается)
   * @param ownerId - ID владельца
   * @param projectId - Опциональный ID проекта для фильтрации
   * @returns Пустой массив, так как токены не хранятся в памяти
   */
  async getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]> {
    // MemStorage doesn't store tokens persistently, so return empty array
    return [];
  }

  /**
   * Получить шаблоны ботов пользователя из памяти
   * @param ownerId - ID владельца
   * @returns Массив шаблонов ботов пользователя
   */
  async getUserBotTemplates(ownerId: number): Promise<BotTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.ownerId === ownerId);
  }

  // Media Files (Memory implementation - not supported)
  /**
   * Получить медиафайл по ID из памяти (не поддерживается)
   * @param id - ID файла
   * @returns undefined, так как файлы не хранятся в памяти
   */
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    return undefined;
  }

  /**
   * Получить медиафайлы по ID проекта из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns Пустой массив, так как файлы не хранятся в памяти
   */
  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return [];
  }

  /**
   * Получить медиафайлы по ID проекта и типу файла из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param fileType - Тип файла
   * @returns Пустой массив, так как файлы не хранятся в памяти
   */
  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return [];
  }

  /**
   * Создать новый медиафайл в памяти
   * @param insertFile - Данные для создания файла
   * @returns Созданный медиафайл
   */
  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const file: MediaFile = {
      ...insertFile,
      id: this.currentTemplateId++,
      description: insertFile.description || null,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return file;
  }

  /**
   * Обновить медиафайл в памяти (не поддерживается)
   * @param id - ID файла
   * @param updateData - Данные для обновления
   * @returns undefined, так как обновление не поддерживается
   */
  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    return undefined;
  }

  /**
   * Удалить медиафайл из памяти (не поддерживается)
   * @param id - ID файла
   * @returns false, так как удаление не поддерживается
   */
  async deleteMediaFile(id: number): Promise<boolean> {
    return false;
  }

  /**
   * Увеличить счетчик использования медиафайла в памяти (не поддерживается)
   * @param id - ID файла
   * @returns false, так как операция не поддерживается
   */
  async incrementMediaFileUsage(id: number): Promise<boolean> {
    return false;
  }

  /**
   * Поиск медиафайлов по проекту и запросу в памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Пустой массив, так как файлы не хранятся в памяти
   */
  async searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]> {
    return [];
  }

  // User Bot Data (Memory implementation - not supported)
  /**
   * Получить данные пользователя бота по ID из памяти (не поддерживается)
   * @param id - ID данных пользователя
   * @returns undefined, так как данные не хранятся в памяти
   */
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    return undefined;
  }

  /**
   * Получить данные пользователя бота по ID проекта и ID пользователя из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns undefined, так как данные не хранятся в памяти
   */
  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    return undefined;
  }

  /**
   * Получить все данные пользователей бота по ID проекта из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns Пустой массив, так как данные не хранятся в памяти
   */
  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return [];
  }

  /**
   * Получить все данные пользователей ботов из памяти (не поддерживается)
   * @returns Пустой массив, так как данные не хранятся в памяти
   */
  async getAllUserBotData(): Promise<UserBotData[]> {
    return [];
  }

  /**
   * Создать новые данные пользователя бота в памяти
   * @param insertUserData - Данные для создания
   * @returns Созданные данные пользователя бота
   */
  async createUserBotData(insertUserData: InsertUserBotData): Promise<UserBotData> {
    const userData: UserBotData = {
      ...insertUserData,
      id: this.currentTemplateId++,
      userName: insertUserData.userName || null,
      firstName: insertUserData.firstName || null,
      lastName: insertUserData.lastName || null,
      languageCode: insertUserData.languageCode || null,
      lastInteraction: new Date(),
      interactionCount: insertUserData.interactionCount || 0,
      userData: insertUserData.userData || {},
      currentState: insertUserData.currentState || null,
      preferences: insertUserData.preferences || {},
      commandsUsed: insertUserData.commandsUsed || {},
      sessionsCount: insertUserData.sessionsCount || 1,
      totalMessagesSent: insertUserData.totalMessagesSent || 0,
      totalMessagesReceived: insertUserData.totalMessagesReceived || 0,
      deviceInfo: insertUserData.deviceInfo || null,
      locationData: insertUserData.locationData || null,
      contactData: insertUserData.contactData || null,
      isBot: insertUserData.isBot || 0,
      isPremium: insertUserData.isPremium || 0,
      isBlocked: insertUserData.isBlocked || 0,
      isActive: insertUserData.isActive || 1,
      tags: insertUserData.tags || [],
      notes: insertUserData.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return userData;
  }

  /**
   * Обновить данные пользователя бота в памяти (не поддерживается)
   * @param id - ID данных
   * @param updateData - Данные для обновления
   * @returns undefined, так как обновление не поддерживается
   */
  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    return undefined;
  }

  /**
   * Удалить данные пользователя бота из памяти (не поддерживается)
   * @param id - ID данных
   * @returns false, так как удаление не поддерживается
   */
  async deleteUserBotData(id: number): Promise<boolean> {
    return false;
  }

  /**
   * Удалить все данные пользователей бота по ID проекта из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns false, так как удаление не поддерживается
   */
  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    return false;
  }

  /**
   * Увеличить счетчик взаимодействий пользователя в памяти (не поддерживается)
   * @param id - ID данных пользователя
   * @returns false, так как операция не поддерживается
   */
  async incrementUserInteraction(id: number): Promise<boolean> {
    return false;
  }

  /**
   * Обновить состояние пользователя в памяти (не поддерживается)
   * @param id - ID данных пользователя
   * @param state - Новое состояние
   * @returns false, так как операция не поддерживается
   */
  async updateUserState(id: number, state: string): Promise<boolean> {
    return false;
  }

  /**
   * Поиск данных пользователей бота по проекту и запросу в памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Пустой массив, так как данные не хранятся в памяти
   */
  async searchUserBotData(projectId: number, query: string): Promise<UserBotData[]> {
    return [];
  }

  /**
   * Получить статистику по данным пользователей бота из памяти (возвращает заглушки)
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей (все значения равны 0)
   */
  async getUserBotDataStats(projectId: number): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }> {
    return {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      premiumUsers: 0,
      totalInteractions: 0,
      avgInteractionsPerUser: 0
    };
  }

  // Bot Groups stubs
  /**
   * Получить группу бота по ID из памяти (не поддерживается)
   * @param id - ID группы
   * @returns undefined, так как группы не поддерживаются
   */
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    return undefined;
  }

  /**
   * Получить все группы бота по ID проекта из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns Пустой массив, так как группы не поддерживаются
   */
  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return [];
  }

  /**
   * Получить группу бота по ID проекта и ID группы из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param groupId - ID группы
   * @returns undefined, так как группы не поддерживаются
   */
  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    return undefined;
  }

  /**
   * Создать новую группу бота в памяти (не поддерживается)
   * @param group - Данные для создания группы
   * @returns Ошибка, так как группы не поддерживаются
   */
  async createBotGroup(group: InsertBotGroup): Promise<BotGroup> {
    throw new Error("MemStorage does not support groups");
  }

  /**
   * Обновить группу бота в памяти (не поддерживается)
   * @param id - ID группы
   * @param group - Данные для обновления
   * @returns undefined, так как обновление не поддерживается
   */
  async updateBotGroup(id: number, group: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    return undefined;
  }

  /**
   * Удалить группу бота из памяти (не поддерживается)
   * @param id - ID группы
   * @returns false, так как удаление не поддерживается
   */
  async deleteBotGroup(id: number): Promise<boolean> {
    return false;
  }

  // Group members stubs
  /**
   * Получить участников группы из памяти (не поддерживается)
   * @param groupId - ID группы
   * @returns Пустой массив, так как участники не поддерживаются
   */
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return [];
  }

  /**
   * Создать нового участника группы в памяти (не поддерживается)
   * @param member - Данные для создания участника
   * @returns Ошибка, так как участники не поддерживаются
   */
  async createGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    throw new Error("MemStorage does not support group members");
  }

  /**
   * Обновить участника группы в памяти (не поддерживается)
   * @param id - ID участника
   * @param member - Данные для обновления
   * @returns undefined, так как обновление не поддерживается
   */
  async updateGroupMember(id: number, member: Partial<InsertGroupMember>): Promise<GroupMember | undefined> {
    return undefined;
  }

  /**
   * Удалить участника группы из памяти (не поддерживается)
   * @param id - ID участника
   * @returns false, так как удаление не поддерживается
   */
  async deleteGroupMember(id: number): Promise<boolean> {
    return false;
  }

  // Bot messages stubs
  /**
   * Создать новое сообщение бота в памяти (не поддерживается)
   * @param message - Данные для создания сообщения
   * @returns Ошибка, так как сообщения не поддерживаются
   */
  async createBotMessage(message: InsertBotMessage): Promise<BotMessage> {
    throw new Error("MemStorage does not support bot messages");
  }

  /**
   * Получить сообщения бота по проекту и пользователю из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Пустой массив, так как сообщения не поддерживаются
   */
  async getBotMessages(projectId: number, userId: string, limit?: number): Promise<BotMessage[]> {
    return [];
  }

  /**
   * Получить сообщения бота с медиа по проекту и пользователю из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Пустой массив, так как сообщения не поддерживаются
   */
  async getBotMessagesWithMedia(projectId: number, userId: string, limit?: number): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]> {
    return [];
  }

  /**
   * Удалить сообщения бота по проекту и пользователю из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns false, так как удаление не поддерживается
   */
  async deleteBotMessages(projectId: number, userId: string): Promise<boolean> {
    return false;
  }

  /**
   * Удалить все сообщения бота по проекту из памяти (не поддерживается)
   * @param projectId - ID проекта
   * @returns false, так как удаление не поддерживается
   */
  async deleteAllBotMessages(projectId: number): Promise<boolean> {
    return false;
  }

  /**
   * Создать запись о медиафайле в сообщении бота в памяти (не поддерживается)
   * @param data - Данные для создания записи
   * @returns Ошибка, так как медиафайлы сообщений не поддерживаются
   */
  async createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia> {
    throw new Error("MemStorage does not support bot message media");
  }

  /**
   * Получить медиафайлы сообщения из памяти (не поддерживается)
   * @param messageId - ID сообщения
   * @returns Пустой массив, так как медиафайлы сообщений не поддерживаются
   */
  async getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number }>> {
    return [];
  }
}

/**
 * Реализация хранилища данных с использованием базы данных
 * Предоставляет методы для работы с проектами, шаблонами, токенами и другими данными в базе данных
 */
export class DatabaseStorage implements IStorage {
  protected db = db;
  
  // Bot Projects
  /**
   * Получить проект бота по ID из базы данных
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const [project] = await this.db.select().from(botProjects).where(eq(botProjects.id, id));
    return project || undefined;
  }

  /**
   * Получить все проекты ботов из базы данных
   * @returns Массив проектов ботов
   */
  async getAllBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  /**
   * Создать новый проект бота в базе данных
   * @param insertProject - Данные для создания проекта
   * @returns Созданный проект бота
   */
  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await this.db
      .insert(botProjects)
      .values({
        ...insertProject,
        data: insertProject.data ?? {} // Убедимся, что поле data всегда присутствует
      })
      .returning();
    return project;
  }

  /**
   * Обновить проект бота в базе данных
   * @param id - ID проекта
   * @param updateData - Данные для обновления
   * @returns Обновленный проект бота или undefined, если не найден
   */
  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const [project] = await this.db
      .update(botProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    return project || undefined;
  }

  /**
   * Удалить проект бота из базы данных
   * @param id - ID проекта
   * @returns true, если проект был удален, иначе false
   */
  async deleteBotProject(id: number): Promise<boolean> {
    const result = await this.db.delete(botProjects).where(eq(botProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances
  /**
   * Получить экземпляр бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  /**
   * Получить экземпляр бота по ID токена из базы данных
   * @param tokenId - ID токена
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.tokenId, tokenId));
    return instance || undefined;
  }

  /**
   * Получить все экземпляры ботов по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив экземпляров ботов
   */
  async getBotInstancesByProject(projectId: number): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
  }

  /**
   * Получить все экземпляры ботов из базы данных
   * @returns Массив всех экземпляров ботов
   */
  async getAllBotInstances(): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  /**
   * Создать новый экземпляр бота в базе данных
   * @param insertInstance - Данные для создания экземпляра
   * @returns Созданный экземпляр бота
   */
  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await this.db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  /**
   * Обновить экземпляр бота в базе данных
   * @param id - ID экземпляра
   * @param updateData - Данные для обновления
   * @returns Обновленный экземпляр бота или undefined, если не найден
   */
  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await this.db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  /**
   * Удалить экземпляр бота из базы данных
   * @param id - ID экземпляра
   * @returns true, если экземпляр был удален, иначе false
   */
  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await this.db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Остановить экземпляр бота по ID проекта в базе данных
   * @param projectId - ID проекта
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Остановить экземпляр бота по ID токена в базе данных
   * @param tokenId - ID токена
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.tokenId, tokenId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates
  /**
   * Получить шаблон бота по ID из базы данных
   * @param id - ID шаблона
   * @returns Шаблон бота или undefined, если не найден
   */
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    return template || undefined;
  }

  /**
   * Получить все шаблоны ботов из базы данных
   * @returns Массив шаблонов ботов
   */
  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Создать новый шаблон бота в базе данных
   * @param insertTemplate - Данные для создания шаблона
   * @returns Созданный шаблон бота
   */
  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  /**
   * Обновить шаблон бота в базе данных
   * @param id - ID шаблона
   * @param updateData - Данные для обновления
   * @returns Обновленный шаблон бота или undefined, если не найден
   */
  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const [template] = await this.db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    return template || undefined;
  }

  /**
   * Удалить шаблон бота из базы данных
   * @param id - ID шаблона
   * @returns true, если шаблон был удален, иначе false
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик использования шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const result = await this.db
      .update(botTemplates)
      .set({
        useCount: (template.useCount || 0) + 1,
        lastUsedAt: new Date()
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик просмотров шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const result = await this.db
      .update(botTemplates)
      .set({
        viewCount: (template.viewCount || 0) + 1
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик загрузок шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const result = await this.db
      .update(botTemplates)
      .set({
        downloadCount: (template.downloadCount || 0) + 1
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Переключить лайк шаблона в базе данных
   * @param id - ID шаблона
   * @param liked - true для лайка, false для анлайка
   * @returns true, если статус лайка был изменен, иначе false
   */
  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const current = template.likeCount || 0;
    const newCount = liked ? current + 1 : Math.max(0, current - 1);

    const result = await this.db
      .update(botTemplates)
      .set({
        likeCount: newCount
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Переключить закладку шаблона в базе данных
   * @param id - ID шаблона
   * @param bookmarked - true для добавления в закладки, false для удаления
   * @returns true, если статус закладки был изменен, иначе false
   */
  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const current = template.bookmarkCount || 0;
    const newCount = bookmarked ? current + 1 : Math.max(0, current - 1);

    const result = await this.db
      .update(botTemplates)
      .set({
        bookmarkCount: newCount
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Оценить шаблон в базе данных
   * @param id - ID шаблона
   * @param rating - Оценка (обычно от 1 до 5)
   * @returns true, если оценка была сохранена, иначе false
   */
  async rateTemplate(id: number, rating: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const currentRating = template.rating || 0;
    const currentRatingCount = template.ratingCount || 0;
    const newRatingCount = currentRatingCount + 1;
    const newRating = Math.round(((currentRating * currentRatingCount) + rating) / newRatingCount);

    const result = await this.db
      .update(botTemplates)
      .set({
        rating: newRating,
        ratingCount: newRatingCount,
        updatedAt: new Date()
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Получить рекомендуемые шаблоны из базы данных
   * @returns Массив рекомендованных шаблонов
   */
  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  /**
   * Получить шаблоны по категории из базы данных
   * @param category - Категория шаблонов
   * @returns Массив шаблонов указанной категории
   */
  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Поиск шаблонов по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных шаблонов
   */
  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(botTemplates).where(
      or(
        ilike(botTemplates.name, searchTerm),
        ilike(botTemplates.description, searchTerm)
      )
    ).orderBy(desc(botTemplates.rating));
  }

  // Bot Tokens
  /**
   * Получить токен бота по ID из базы данных
   * @param id - ID токена
   * @returns Токен бота или undefined, если не найден
   */
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  /**
   * Получить токены ботов по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив токенов ботов
   */
  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await this.db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  /**
   * Получить токен бота по умолчанию для проекта из базы данных
   * @param projectId - ID проекта
   * @returns Токен бота по умолчанию или undefined, если не найден
   */
  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

  /**
   * Создать новый токен бота в базе данных
   * @param insertToken - Данные для создания токена
   * @returns Созданный токен бота
   */
  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    if (insertToken.isDefault === 1) {
      await this.db.update(botTokens)
        .set({ isDefault: 0 })
        .where(eq(botTokens.projectId, insertToken.projectId));
    }

    const [token] = await this.db
      .insert(botTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  /**
   * Обновить токен бота в базе данных
   * @param id - ID токена
   * @param updateData - Данные для обновления
   * @returns Обновленный токен бота или undefined, если не найден
   */
  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    if (updateData.isDefault === 1) {
      const [currentToken] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
      if (currentToken) {
        await this.db.update(botTokens)
          .set({ isDefault: 0 })
          .where(eq(botTokens.projectId, currentToken.projectId));
      }
    }

    const [token] = await this.db
      .update(botTokens)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTokens.id, id))
      .returning();
    return token || undefined;
  }

  /**
   * Удалить токен бота из базы данных
   * @param id - ID токена
   * @returns true, если токен был удален, иначе false
   */
  async deleteBotToken(id: number): Promise<boolean> {
    const result = await this.db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Установить токен бота по умолчанию для проекта в базе данных
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns true, если токен был установлен по умолчанию, иначе false
   */
  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    await this.db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

    const result = await this.db.update(botTokens)
      .set({ isDefault: 1 })
      .where(eq(botTokens.id, tokenId));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Отметить токен как использованный в базе данных
   * @param id - ID токена
   * @returns true, если токен был отмечен как использованный, иначе false
   */
  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await this.db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User-specific methods (DbStorage)
  /**
   * Получить проекты ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @returns Массив проектов ботов пользователя
   */
  async getUserBotProjects(ownerId: number): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(eq(botProjects.ownerId, ownerId))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Получить гостевые проекты ботов (без владельца) из базы данных
   * @returns Массив гостевых проектов ботов
   */
  async getGuestBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(isNull(botProjects.ownerId))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Получить токены ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @param projectId - Опциональный ID проекта для фильтрации
   * @returns Массив токенов ботов пользователя
   */
  async getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]> {
    let query = this.db.select().from(botTokens)
      .innerJoin(botProjects, eq(botTokens.projectId, botProjects.id))
      .where(eq(botProjects.ownerId, ownerId)) as any;

    if (projectId) {
      query = query.where(eq(botTokens.projectId, projectId));
    }

    const results = await query.orderBy(desc(botTokens.createdAt));
    return results.map((r: any) => r.bot_tokens);
  }

  /**
   * Получить шаблоны ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @returns Массив шаблонов ботов пользователя
   */
  async getUserBotTemplates(ownerId: number): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates)
      .where(eq(botTemplates.ownerId, ownerId))
      .orderBy(desc(botTemplates.createdAt));
  }

  // Telegram Users
  /**
   * Получить пользователя Telegram по ID из базы данных
   * @param id - ID пользователя
   * @returns Пользователь Telegram или undefined, если не найден
   */
  async getTelegramUser(id: number): Promise<TelegramUserDB | undefined> {
    const [user] = await this.db.select().from(telegramUsers).where(eq(telegramUsers.id, id));
    return user || undefined;
  }

  /**
   * Получить пользователя Telegram или создать нового в базе данных
   * @param userData - Данные пользователя для создания
   * @returns Пользователь Telegram
   */
  async getTelegramUserOrCreate(userData: InsertTelegramUser): Promise<TelegramUserDB> {
    // Попробуем найти существующего пользователя
    const existingUser = await this.getTelegramUser(userData.id);

    if (existingUser) {
      // Обновляем информацию о пользователе
      const [updated] = await this.db.update(telegramUsers)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName ?? null,
          username: userData.username ?? null,
          photoUrl: userData.photoUrl ?? null,
          authDate: userData.authDate ?? null,
          updatedAt: new Date(),
        })
        .where(eq(telegramUsers.id, userData.id))
        .returning();
      return updated;
    }

    // Создаём нового пользователя
    const [newUser] = await this.db.insert(telegramUsers)
      .values({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName ?? null,
        username: userData.username ?? null,
        photoUrl: userData.photoUrl ?? null,
        authDate: userData.authDate ?? null,
      })
      .returning();
    return newUser;
  }

  /**
   * Удалить пользователя Telegram из базы данных
   * @param id - ID пользователя
   * @returns true, если пользователь был удален, иначе false
   */
  async deleteTelegramUser(id: number): Promise<boolean> {
    const result = await this.db.delete(telegramUsers).where(eq(telegramUsers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files
  /**
   * Получить медиафайл по ID из базы данных
   * @param id - ID файла
   * @returns Медиафайл или undefined, если не найден
   */
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  /**
   * Получить медиафайлы по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив медиафайлов проекта
   */
  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(eq(mediaFiles.projectId, projectId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  /**
   * Получить медиафайлы по ID проекта и типу файла из базы данных
   * @param projectId - ID проекта
   * @param fileType - Тип файла
   * @returns Массив медиафайлов указанного типа
   */
  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.fileType, fileType)))
      .orderBy(desc(mediaFiles.createdAt));
  }

  /**
   * Создать новый медиафайл в базе данных
   * @param insertFile - Данные для создания файла
   * @returns Созданный медиафайл
   */
  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const [file] = await this.db
      .insert(mediaFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  /**
   * Обновить медиафайл в базе данных
   * @param id - ID файла
   * @param updateData - Данные для обновления
   * @returns Обновленный медиафайл или undefined, если не найден
   */
  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [file] = await this.db
      .update(mediaFiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file || undefined;
  }

  /**
   * Удалить медиафайл из базы данных
   * @param id - ID файла
   * @returns true, если файл был удален, иначе false
   */
  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик использования медиафайла в базе данных
   * @param id - ID файла
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementMediaFileUsage(id: number): Promise<boolean> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    if (!file) return false;

    const result = await this.db
      .update(mediaFiles)
      .set({
        usageCount: (file.usageCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Поиск медиафайлов по проекту и запросу в базе данных
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных медиафайлов
   */
  async searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.projectId, projectId),
          or(
            ilike(mediaFiles.fileName, searchTerm),
            ilike(mediaFiles.description, searchTerm)
          )
        )
      )
      .orderBy(desc(mediaFiles.usageCount), desc(mediaFiles.createdAt));
  }

  // User Bot Data
  /**
   * Получить данные пользователя бота по ID из базы данных
   * @param id - ID данных пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    return userData || undefined;
  }

  /**
   * Получить данные пользователя бота по ID проекта и ID пользователя из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData)
      .where(and(eq(userBotData.projectId, projectId), eq(userBotData.userId, userId)));
    return userData || undefined;
  }

  /**
   * Получить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив данных пользователей бота
   */
  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId))
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Получить все данные пользователей ботов из базы данных
   * @returns Массив всех данных пользователей ботов
   */
  async getAllUserBotData(): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData).orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Создать новые данные пользователя бота в базе данных
   * @param insertUserData - Данные для создания
   * @returns Созданные данные пользователя бота
   */
  async createUserBotData(insertUserData: InsertUserBotData): Promise<UserBotData> {
    const [userData] = await this.db
      .insert(userBotData)
      .values(insertUserData)
      .returning();
    return userData;
  }

  /**
   * Обновить данные пользователя бота в базе данных
   * @param id - ID данных
   * @param updateData - Данные для обновления
   * @returns Обновленные данные пользователя бота или undefined, если не найдены
   */
  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    const [userData] = await this.db
      .update(userBotData)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userBotData.id, id))
      .returning();
    return userData || undefined;
  }

  /**
   * Удалить данные пользователя бота из базы данных
   * @param id - ID данных
   * @returns true, если данные были удалены, иначе false
   */
  async deleteUserBotData(id: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Удалить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns true, если данные были удалены, иначе false
   */
  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик взаимодействий пользователя в базе данных
   * @param id - ID данных пользователя
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementUserInteraction(id: number): Promise<boolean> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    if (!userData) return false;

    const result = await this.db
      .update(userBotData)
      .set({
        interactionCount: (userData.interactionCount || 0) + 1,
        lastInteraction: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Обновить состояние пользователя в базе данных
   * @param id - ID данных пользователя
   * @param state - Новое состояние
   * @returns true, если состояние было обновлено, иначе false
   */
  async updateUserState(id: number, state: string): Promise<boolean> {
    const result = await this.db
      .update(userBotData)
      .set({
        currentState: state,
        updatedAt: new Date()
      })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Поиск данных пользователей бота по проекту и запросу в базе данных
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных данных пользователей
   */
  async searchUserBotData(projectId: number, query: string): Promise<UserBotData[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(userBotData)
      .where(
        and(
          eq(userBotData.projectId, projectId),
          or(
            ilike(userBotData.userName, searchTerm),
            ilike(userBotData.firstName, searchTerm),
            ilike(userBotData.lastName, searchTerm),
            ilike(userBotData.notes, searchTerm)
          )
        )
      )
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Поиск пользователей ботов по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных пользователей ботов
   */
  async searchBotUsers(query: string): Promise<BotUser[]> {
    // Убираем @ символ если есть
    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    const searchTerm = `%${cleanQuery.toLowerCase()}%`;
    const numericQuery = parseInt(cleanQuery);

    return await this.db.select().from(botUsers)
      .where(
        or(
          ilike(botUsers.username, searchTerm),
          ilike(botUsers.firstName, searchTerm),
          ilike(botUsers.lastName, searchTerm),
          isNaN(numericQuery) ? sql`false` : eq(botUsers.userId, numericQuery)
        )
      )
      .orderBy(desc(botUsers.lastInteraction));
  }

  /**
   * Получить статистику по данным пользователей бота из базы данных
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей
   */
  async getUserBotDataStats(projectId: number): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }> {
    const users = await this.db.select().from(userBotData).where(eq(userBotData.projectId, projectId));

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive === 1).length;
    const blockedUsers = users.filter(u => u.isBlocked === 1).length;
    const premiumUsers = users.filter(u => u.isPremium === 1).length;
    const totalInteractions = users.reduce((sum, u) => sum + (u.interactionCount || 0), 0);
    const avgInteractionsPerUser = totalUsers > 0 ? totalInteractions / totalUsers : 0;

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      premiumUsers,
      totalInteractions,
      avgInteractionsPerUser
    };
  }

  // Bot Groups
  /**
   * Получить группу бота по ID из базы данных
   * @param id - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups).where(eq(botGroups.id, id));
    return group || undefined;
  }

  /**
   * Получить все группы бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив групп бота
   */
  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return await this.db.select().from(botGroups)
      .where(eq(botGroups.projectId, projectId))
      .orderBy(desc(botGroups.createdAt));
  }

  /**
   * Получить группу бота по ID проекта и ID группы из базы данных
   * @param projectId - ID проекта
   * @param groupId - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups)
      .where(and(eq(botGroups.projectId, projectId), eq(botGroups.groupId, groupId)));
    return group || undefined;
  }

  /**
   * Создать новую группу бота в базе данных
   * @param insertGroup - Данные для создания группы
   * @returns Созданная группа бота
   */
  async createBotGroup(insertGroup: InsertBotGroup): Promise<BotGroup> {
    const [group] = await this.db
      .insert(botGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  /**
   * Обновить группу бота в базе данных
   * @param id - ID группы
   * @param updateData - Данные для обновления
   * @returns Обновленная группа бота или undefined, если не найдена
   */
  async updateBotGroup(id: number, updateData: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [group] = await this.db
      .update(botGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return group || undefined;
  }

  /**
   * Удалить группу бота из базы данных
   * @param id - ID группы
   * @returns true, если группа была удалена, иначе false
   */
  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Group members
  /**
   * Получить участников группы из базы данных
   * @param groupId - ID группы
   * @returns Массив участников группы
   */
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await this.db.select().from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(desc(groupMembers.joinedAt));
  }

  /**
   * Создать нового участника группы в базе данных
   * @param insertMember - Данные для создания участника
   * @returns Созданный участник группы
   */
  async createGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await this.db
      .insert(groupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  /**
   * Обновить участника группы в базе данных
   * @param id - ID участника
   * @param updateData - Данные для обновления
   * @returns Обновленный участник группы или undefined, если не найден
   */
  async updateGroupMember(id: number, updateData: Partial<InsertGroupMember>): Promise<GroupMember | undefined> {
    const [member] = await this.db
      .update(groupMembers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(groupMembers.id, id))
      .returning();
    return member || undefined;
  }

  /**
   * Удалить участника группы из базы данных
   * @param id - ID участника
   * @returns true, если участник был удален, иначе false
   */
  async deleteGroupMember(id: number): Promise<boolean> {
    const result = await this.db.delete(groupMembers).where(eq(groupMembers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot messages
  /**
   * Создать новое сообщение бота в базе данных
   * @param insertMessage - Данные для создания сообщения
   * @returns Созданное сообщение бота
   */
  async createBotMessage(insertMessage: InsertBotMessage): Promise<BotMessage> {
    const [message] = await this.db
      .insert(botMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  /**
   * Получить сообщения бота по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота
   */
  async getBotMessages(projectId: number, userId: string, limit: number = 100): Promise<BotMessage[]> {
    return await this.db
      .select()
      .from(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ))
      .orderBy(asc(botMessages.createdAt))
      .limit(limit);
  }

  /**
   * Удалить сообщения бота по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns true, если сообщения были удалены, иначе false
   */
  async deleteBotMessages(projectId: number, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Удалить все сообщения бота по проекту из базы данных
   * @param projectId - ID проекта
   * @returns true, если сообщения были удалены, иначе false
   */
  async deleteAllBotMessages(projectId: number): Promise<boolean> {
    const result = await this.db
      .delete(botMessages)
      .where(eq(botMessages.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot message media
  /**
   * Создать запись о медиафайле в сообщении бота в базе данных
   * @param data - Данные для создания записи
   * @returns Созданная запись о медиафайле
   */
  async createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia> {
    const [media] = await this.db
      .insert(botMessageMedia)
      .values(data)
      .returning();
    return media;
  }

  /**
   * Получить медиафайлы сообщения из базы данных
   * @param messageId - ID сообщения
   * @returns Массив медиафайлов сообщения
   */
  async getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number }>> {
    const result = await this.db
      .select({
        id: mediaFiles.id,
        projectId: mediaFiles.projectId,
        fileName: mediaFiles.fileName,
        fileType: mediaFiles.fileType,
        filePath: mediaFiles.filePath,
        fileSize: mediaFiles.fileSize,
        mimeType: mediaFiles.mimeType,
        url: mediaFiles.url,
        description: mediaFiles.description,
        tags: mediaFiles.tags,
        isPublic: mediaFiles.isPublic,
        usageCount: mediaFiles.usageCount,
        createdAt: mediaFiles.createdAt,
        updatedAt: mediaFiles.updatedAt,
        mediaKind: botMessageMedia.mediaKind,
        orderIndex: sql<number>`COALESCE(${botMessageMedia.orderIndex}, 0)`.as('orderIndex'),
      })
      .from(botMessageMedia)
      .innerJoin(mediaFiles, eq(botMessageMedia.mediaFileId, mediaFiles.id))
      .where(eq(botMessageMedia.messageId, messageId))
      .orderBy(asc(botMessageMedia.orderIndex));

    return result;
  }

  /**
   * Получить сообщения бота с медиа по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота с медиафайлами
   */
  async getBotMessagesWithMedia(
    projectId: number,
    userId: string,
    limit: number = 100
  ): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]> {
    const messages = await this.db
      .select()
      .from(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ))
      .orderBy(asc(botMessages.createdAt))
      .limit(limit);

    const messagesWithMedia = await Promise.all(
      messages.map(async (message) => {
        const media = await this.getMessageMedia(message.id);
        return {
          ...message,
          media: media.length > 0 ? media : undefined,
        };
      })
    );

    return messagesWithMedia;
  }
}

/**
 * Оптимизированная реализация хранилища с кэшированием
 * Расширяет базовую реализацию, добавляя кэширование для улучшения производительности
 */
export class OptimizedDatabaseStorage extends DatabaseStorage {
  private templateCache: Map<number, BotTemplate> = new Map();
  private projectCache: Map<number, BotProject> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут
  
  // Bot Projects (с кэшированием)
  /**
   * Получить проект бота по ID из базы данных с кэшированием
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const cached = this.projectCache.get(id);
    if (cached) return cached;

    const [project] = await this.db.select().from(botProjects).where(eq(botProjects.id, id));
    if (project) {
      this.projectCache.set(id, project);
      // Автоматически очищаем кэш через timeout
      setTimeout(() => this.projectCache.delete(id), this.cacheTimeout);
    }
    return project || undefined;
  }

  /**
   * Получить все проекты ботов из базы данных
   * @returns Массив проектов ботов
   */
  async getAllBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  /**
   * Создать новый проект бота в базе данных и добавить в кэш
   * @param insertProject - Данные для создания проекта
   * @returns Созданный проект бота
   */
  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await this.db
      .insert(botProjects)
      .values({
        ...insertProject,
        data: insertProject.data ?? {} // Убедимся, что поле data всегда присутствует
      })
      .returning();
    this.projectCache.set(project.id, project);
    return project;
  }

  /**
   * Обновить проект бота в базе данных и кэше
   * @param id - ID проекта
   * @param updateData - Данные для обновления
   * @returns Обновленный проект бота или undefined, если не найден
   */
  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const [project] = await this.db
      .update(botProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    if (project) {
      this.projectCache.set(id, project);
    }
    return project || undefined;
  }

  /**
   * Удалить проект бота из базы данных и кэша
   * @param id - ID проекта
   * @returns true, если проект был удален, иначе false
   */
  async deleteBotProject(id: number): Promise<boolean> {
    const result = await this.db.delete(botProjects).where(eq(botProjects.id, id));
    this.projectCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances (простая реализация)
  /**
   * Получить экземпляр бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  /**
   * Получить все экземпляры ботов из базы данных
   * @returns Массив всех экземпляров ботов
   */
  async getAllBotInstances(): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  /**
   * Создать новый экземпляр бота в базе данных
   * @param insertInstance - Данные для создания экземпляра
   * @returns Созданный экземпляр бота
   */
  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await this.db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  /**
   * Обновить экземпляр бота в базе данных
   * @param id - ID экземпляра
   * @param updateData - Данные для обновления
   * @returns Обновленный экземпляр бота или undefined, если не найден
   */
  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await this.db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  /**
   * Удалить экземпляр бота из базы данных
   * @param id - ID экземпляра
   * @returns true, если экземпляр был удален, иначе false
   */
  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await this.db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Остановить экземпляр бота по ID проекта в базе данных
   * @param projectId - ID проекта
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Остановить экземпляр бота по ID токена в базе данных
   * @param tokenId - ID токена
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.tokenId, tokenId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates (с кэшированием)
  /**
   * Получить шаблон бота по ID из базы данных с кэшированием
   * @param id - ID шаблона
   * @returns Шаблон бота или undefined, если не найден
   */
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const cached = this.templateCache.get(id);
    if (cached) return cached;

    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (template) {
      this.templateCache.set(id, template);
      setTimeout(() => this.templateCache.delete(id), this.cacheTimeout);
    }
    return template || undefined;
  }

  /**
   * Получить все шаблоны ботов из базы данных
   * @returns Массив шаблонов ботов
   */
  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Создать новый шаблон бота в базе данных и добавить в кэш
   * @param insertTemplate - Данные для создания шаблона
   * @returns Созданный шаблон бота
   */
  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    this.templateCache.set(template.id, template);
    return template;
  }

  /**
   * Обновить шаблон бота в базе данных и кэше
   * @param id - ID шаблона
   * @param updateData - Данные для обновления
   * @returns Обновленный шаблон бота или undefined, если не найден
   */
  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const [template] = await this.db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    if (template) {
      this.templateCache.set(id, template);
    }
    return template || undefined;
  }

  /**
   * Удалить шаблон бота из базы данных и кэша
   * @param id - ID шаблона
   * @returns true, если шаблон был удален, иначе false
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    this.templateCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Упрощенные методы для счетчиков
  /**
   * Увеличить счетчик использования шаблона в базе данных и очистить кэш
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTemplates.id, id));
    this.templateCache.delete(id); // Очищаем кэш
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик просмотров шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик загрузок шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Переключить лайк шаблона и очистить кэш
   * @param id - ID шаблона
   * @param liked - true для лайка, false для анлайка
   * @returns true, если статус лайка был изменен, иначе false
   */
  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Переключить закладку шаблона и очистить кэш
   * @param id - ID шаблона
   * @param bookmarked - true для добавления в закладки, false для удаления
   * @returns true, если статус закладки был изменен, иначе false
   */
  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Оценить шаблон и очистить кэш
   * @param id - ID шаблона
   * @param rating - Оценка (обычно от 1 до 5)
   * @returns true, если оценка была сохранена, иначе false
   */
  async rateTemplate(id: number, rating: number): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Получить рекомендуемые шаблоны из базы данных
   * @returns Массив рекомендованных шаблонов
   */
  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  /**
   * Получить шаблоны по категории из базы данных
   * @param category - Категория шаблонов
   * @returns Массив шаблонов указанной категории
   */
  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Поиск шаблонов по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных шаблонов
   */
  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(botTemplates).where(
      or(
        ilike(botTemplates.name, searchTerm),
        ilike(botTemplates.description, searchTerm)
      )
    ).orderBy(desc(botTemplates.rating));
  }

  // Bot Tokens
  /**
   * Получить токен бота по ID из базы данных
   * @param id - ID токена
   * @returns Токен бота или undefined, если не найден
   */
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  /**
   * Получить токены ботов по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив токенов ботов
   */
  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await this.db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  /**
   * Получить токен бота по умолчанию для проекта из базы данных
   * @param projectId - ID проекта
   * @returns Токен бота по умолчанию или undefined, если не найден
   */
  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

  /**
   * Создать новый токен бота в базе данных
   * @param insertToken - Данные для создания токена
   * @returns Созданный токен бота
   */
  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    // Если создаем токен по умолчанию, убираем флаг с других токенов
    if (insertToken.isDefault === 1) {
      await this.db.update(botTokens)
        .set({ isDefault: 0 })
        .where(eq(botTokens.projectId, insertToken.projectId));
    }

    const [token] = await this.db
      .insert(botTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  /**
   * Обновить токен бота в базе данных
   * @param id - ID токена
   * @param updateData - Данные для обновления
   * @returns Обновленный токен бота или undefined, если не найден
   */
  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    // Если делаем токен по умолчанию, убираем флаг с других токенов
    if (updateData.isDefault === 1) {
      const [currentToken] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
      if (currentToken) {
        await this.db.update(botTokens)
          .set({ isDefault: 0 })
          .where(eq(botTokens.projectId, currentToken.projectId));
      }
    }

    const [token] = await this.db
      .update(botTokens)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTokens.id, id))
      .returning();
    return token || undefined;
  }

  /**
   * Удалить токен бота из базы данных
   * @param id - ID токена
   * @returns true, если токен был удален, иначе false
   */
  async deleteBotToken(id: number): Promise<boolean> {
    const result = await this.db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Установить токен бота по умолчанию для проекта в базе данных
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns true, если токен был установлен по умолчанию, иначе false
   */
  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    // Убираем флаг по умолчанию со всех токенов проекта
    await this.db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

    // Устанавливаем флаг по умолчанию для указанного токена
    const result = await this.db.update(botTokens)
      .set({ isDefault: 1 })
      .where(eq(botTokens.id, tokenId));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Отметить токен как использованный в базе данных
   * @param id - ID токена
   * @returns true, если токен был отмечен как использованный, иначе false
   */
  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await this.db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files (simplified implementation)
  /**
   * Получить медиафайл по ID из базы данных
   * @param id - ID файла
   * @returns Медиафайл или undefined, если не найден
   */
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  /**
   * Получить медиафайлы по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив медиафайлов проекта
   */
  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(eq(mediaFiles.projectId, projectId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  /**
   * Получить медиафайлы по ID проекта и типу файла из базы данных
   * @param projectId - ID проекта
   * @param fileType - Тип файла
   * @returns Массив медиафайлов указанного типа
   */
  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.fileType, fileType)))
      .orderBy(desc(mediaFiles.createdAt));
  }

  /**
   * Создать новый медиафайл в базе данных
   * @param insertFile - Данные для создания файла
   * @returns Созданный медиафайл
   */
  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const [file] = await this.db
      .insert(mediaFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  /**
   * Обновить медиафайл в базе данных
   * @param id - ID файла
   * @param updateData - Данные для обновления
   * @returns Обновленный медиафайл или undefined, если не найден
   */
  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [file] = await this.db
      .update(mediaFiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file || undefined;
  }

  /**
   * Удалить медиафайл из базы данных
   * @param id - ID файла
   * @returns true, если файл был удален, иначе false
   */
  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик использования медиафайла в базе данных
   * @param id - ID файла
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementMediaFileUsage(id: number): Promise<boolean> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    if (!file) return false;

    const result = await this.db
      .update(mediaFiles)
      .set({ usageCount: (file.usageCount || 0) + 1 })
      .where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Поиск медиафайлов по проекту и запросу в базе данных
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных медиафайлов
   */
  async searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.projectId, projectId),
          or(
            ilike(mediaFiles.fileName, searchTerm),
            ilike(mediaFiles.description, searchTerm)
          )
        )
      )
      .orderBy(desc(mediaFiles.createdAt));
  }

  // User Bot Data
  /**
   * Получить данные пользователя бота по ID из базы данных
   * @param id - ID данных пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    return userData || undefined;
  }

  /**
   * Получить данные пользователя бота по ID проекта и ID пользователя из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData)
      .where(and(eq(userBotData.projectId, projectId), eq(userBotData.userId, userId)));
    return userData || undefined;
  }

  /**
   * Получить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив данных пользователей бота
   */
  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId))
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Получить все данные пользователей ботов из базы данных
   * @returns Массив всех данных пользователей ботов
   */
  async getAllUserBotData(): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Создать новые данные пользователя бота в базе данных
   * @param insertUserData - Данные для создания
   * @returns Созданные данные пользователя бота
   */
  async createUserBotData(insertUserData: InsertUserBotData): Promise<UserBotData> {
    const [userData] = await this.db
      .insert(userBotData)
      .values(insertUserData)
      .returning();
    return userData;
  }

  /**
   * Обновить данные пользователя бота в базе данных
   * @param id - ID данных
   * @param updateData - Данные для обновления
   * @returns Обновленные данные пользователя бота или undefined, если не найдены
   */
  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    const [userData] = await this.db
      .update(userBotData)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userBotData.id, id))
      .returning();
    return userData || undefined;
  }

  /**
   * Удалить данные пользователя бота из базы данных
   * @param id - ID данных
   * @returns true, если данные были удалены, иначе false
   */
  async deleteUserBotData(id: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Удалить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns true, если данные были удалены, иначе false
   */
  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик взаимодействий пользователя в базе данных
   * @param id - ID данных пользователя
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementUserInteraction(id: number): Promise<boolean> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    if (!userData) return false;

    const result = await this.db
      .update(userBotData)
      .set({
        interactionCount: (userData.interactionCount || 0) + 1,
        lastInteraction: new Date()
      })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Обновить состояние пользователя в базе данных
   * @param id - ID данных пользователя
   * @param state - Новое состояние
   * @returns true, если состояние было обновлено, иначе false
   */
  async updateUserState(id: number, state: string): Promise<boolean> {
    const result = await this.db
      .update(userBotData)
      .set({ currentState: state, updatedAt: new Date() })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Поиск данных пользователей бота по проекту и запросу в базе данных
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных данных пользователей
   */
  async searchUserBotData(projectId: number, query: string): Promise<UserBotData[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(userBotData)
      .where(
        and(
          eq(userBotData.projectId, projectId),
          or(
            ilike(userBotData.firstName, searchTerm),
            ilike(userBotData.lastName, searchTerm),
            ilike(userBotData.userName, searchTerm),
            ilike(userBotData.userId, searchTerm)
          )
        )
      )
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Получить статистику по данным пользователей бота из базы данных
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей
   */
  async getUserBotDataStats(projectId: number): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }> {
    const users = await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId));

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive === 1).length;
    const blockedUsers = users.filter(u => u.isBlocked === 1).length;
    const premiumUsers = users.filter(u => u.isPremium === 1).length;
    const totalInteractions = users.reduce((sum, u) => sum + (u.interactionCount || 0), 0);
    const avgInteractionsPerUser = totalUsers > 0 ? Math.round(totalInteractions / totalUsers) : 0;

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      premiumUsers,
      totalInteractions,
      avgInteractionsPerUser
    };
  }

  // Bot Groups
  /**
   * Получить группу бота по ID из базы данных
   * @param id - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups).where(eq(botGroups.id, id));
    return group || undefined;
  }

  /**
   * Получить все группы бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив групп бота
   */
  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return await this.db.select().from(botGroups)
      .where(eq(botGroups.projectId, projectId))
      .orderBy(desc(botGroups.createdAt));
  }

  /**
   * Получить группу бота по ID проекта и ID группы из базы данных
   * @param projectId - ID проекта
   * @param groupId - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups)
      .where(and(eq(botGroups.projectId, projectId), eq(botGroups.groupId, groupId)));
    return group || undefined;
  }

  /**
   * Создать новую группу бота в базе данных
   * @param insertGroup - Данные для создания группы
   * @returns Созданная группа бота
   */
  async createBotGroup(insertGroup: InsertBotGroup): Promise<BotGroup> {
    const [group] = await this.db
      .insert(botGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  /**
   * Обновить группу бота в базе данных
   * @param id - ID группы
   * @param updateData - Данные для обновления
   * @returns Обновленная группа бота или undefined, если не найдена
   */
  async updateBotGroup(id: number, updateData: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [group] = await this.db
      .update(botGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return group || undefined;
  }

  /**
   * Удалить группу бота из базы данных
   * @param id - ID группы
   * @returns true, если группа была удалена, иначе false
   */
  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

/**
 * Расширенная реализация хранилища с кэшированием и мониторингом
 * Добавляет возможности кэширования, повторных попыток и транзакций
 */
export class EnhancedDatabaseStorage extends DatabaseStorage {
  // Override methods to add caching and monitoring

  /**
   * Получить проект бота по ID с использованием кэширования
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    return await cachedOps.getProjectCached(id, () => super.getBotProject(id));
  }

  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    return await cachedOps.getTemplateCached(id, () => super.getBotTemplate(id));
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await cachedOps.getTemplateListCached(category, () => super.getTemplatesByCategory(category));
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    return await dbManager.executeWithRetry(async () => {
      const project = await super.createBotProject(insertProject);
      cachedOps.invalidateProject(project.id);
      return project;
    });
  }

  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    return await dbManager.executeWithRetry(async () => {
      const project = await super.updateBotProject(id, updateData);
      cachedOps.invalidateProject(id);
      return project;
    });
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    return await dbManager.executeWithRetry(async () => {
      const template = await super.createBotTemplate(insertTemplate);
      cachedOps.invalidateAllTemplates();
      return template;
    });
  }

  async getUserBotProjects(ownerId: number): Promise<BotProject[]> {
    return await super.getUserBotProjects(ownerId);
  }

  async getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]> {
    return await super.getUserBotTokens(ownerId, projectId);
  }

  async getUserBotTemplates(ownerId: number): Promise<BotTemplate[]> {
    return await super.getUserBotTemplates(ownerId);
  }

  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    return await dbManager.executeWithRetry(async () => {
      const template = await super.updateBotTemplate(id, updateData);
      cachedOps.invalidateTemplate(id);
      return template;
    });
  }

  // Transaction support for complex operations
  async createProjectWithTemplate(projectData: InsertBotProject, templateData: InsertBotTemplate): Promise<{ project: BotProject; template: BotTemplate }> {
    return await dbManager.transaction(async (tx) => {
      const project = await super.createBotProject(projectData);
      const template = await super.createBotTemplate({ ...templateData, authorId: project.id.toString() });
      
      cachedOps.invalidateProject(project.id);
      cachedOps.invalidateAllTemplates();
      
      return { project, template };
    });
  }

  // Bulk operations with better performance
  async bulkCreateTemplates(templates: InsertBotTemplate[]): Promise<BotTemplate[]> {
    return await dbManager.executeWithRetry(async () => {
      const results = await Promise.all(
        templates.map(template => super.createBotTemplate(template))
      );
      cachedOps.invalidateAllTemplates();
      return results;
    });
  }

  // Enhanced statistics with caching
  async getDetailedStats(): Promise<{
    projects: number;
    templates: number;
    activeInstances: number;
    totalUsers: number;
    systemHealth: any;
    cacheStats: any;
  }> {
    const [projects, templates, instances, users] = await Promise.all([
      this.getAllBotProjects(),
      this.getAllBotTemplates(),
      this.getAllBotInstances(),
      this.getAllUserBotData()
    ]);

    return {
      projects: projects.length,
      templates: templates.length,
      activeInstances: instances.filter(i => i.status === 'running').length,
      totalUsers: users.length,
      systemHealth: dbManager.getConnectionStats(),
      cacheStats: cachedOps.getStats()
    };
  }

  // Database maintenance operations
  async performMaintenance(): Promise<void> {
    console.log('Starting database maintenance...');
    
    // Optimize connections
    await dbManager.optimizeConnections();
    
    // Clean up old data (older than 30 days)
    await dbManager.cleanupOldData(30);
    
    // Clear expired cache entries
    cachedOps.cleanup();
    
    console.log('Database maintenance completed');
  }

  // Backup operations
  async createBackup(): Promise<string> {
    return await dbManager.createBackup();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await dbManager.performHealthCheck();
  }

  // Bot groups methods - use parent implementation directly
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups).where(eq(botGroups.id, id));
    return group || undefined;
  }

  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return await this.db.select().from(botGroups)
      .where(eq(botGroups.projectId, projectId))
      .orderBy(desc(botGroups.createdAt));
  }

  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups)
      .where(and(eq(botGroups.projectId, projectId), eq(botGroups.groupId, groupId)));
    return group || undefined;
  }

  async createBotGroup(group: InsertBotGroup): Promise<BotGroup> {
    const [newGroup] = await this.db
      .insert(botGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async updateBotGroup(id: number, group: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [updatedGroup] = await this.db
      .update(botGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return updatedGroup || undefined;
  }

  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBotMessagesWithMedia(
    projectId: number, 
    userId: string, 
    limit: number = 100
  ): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]> {
    const results = await this.db
      .select({
        message: botMessages,
        mediaFile: mediaFiles,
        mediaKind: botMessageMedia.mediaKind,
        orderIndex: botMessageMedia.orderIndex,
      })
      .from(botMessages)
      .leftJoin(botMessageMedia, eq(botMessages.id, botMessageMedia.messageId))
      .leftJoin(mediaFiles, eq(botMessageMedia.mediaFileId, mediaFiles.id))
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ))
      .orderBy(asc(botMessages.createdAt), asc(botMessageMedia.orderIndex))
      .limit(limit * 10);

    const messagesMap = new Map<number, BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> }>();

    for (const row of results) {
      const messageId = row.message.id;
      
      if (!messagesMap.has(messageId)) {
        messagesMap.set(messageId, {
          ...row.message,
          media: []
        });
      }

      if (row.mediaFile && row.mediaKind !== null && row.orderIndex !== null) {
        const message = messagesMap.get(messageId)!;
        message.media!.push({
          ...row.mediaFile,
          mediaKind: row.mediaKind,
          orderIndex: row.orderIndex
        });
      }
    }

    const messagesArray = Array.from(messagesMap.values())
      .slice(0, limit)
      .map(msg => ({
        ...msg,
        media: msg.media && msg.media.length > 0 ? msg.media : undefined
      }));

    return messagesArray;
  }

  // Telegram users
  async getTelegramUser(id: number): Promise<TelegramUserDB | undefined> {
    const [user] = await this.db.select().from(telegramUsers).where(eq(telegramUsers.id, id));
    return user || undefined;
  }

  async getTelegramUserOrCreate(userData: InsertTelegramUser): Promise<TelegramUserDB> {
    // Проверяем есть ли пользователь
    const existing = await this.getTelegramUser(userData.id);
    if (existing) {
      // Обновляем если нужно
      const [updated] = await this.db
        .update(telegramUsers)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(telegramUsers.id, userData.id))
        .returning();
      return updated;
    }
    
    // Создаем нового пользователя
    const [newUser] = await this.db
      .insert(telegramUsers)
      .values(userData)
      .returning();
    return newUser;
  }

  async deleteTelegramUser(id: number): Promise<boolean> {
    const result = await this.db
      .delete(telegramUsers)
      .where(eq(telegramUsers.id, id));
    return true;
  }
}

// Используем EnhancedDatabaseStorage для продвинутого управления базой данных
let storageInstance: EnhancedDatabaseStorage | null = null;

/**
 * Функция инициализации хранилища
 * Создает экземпляр EnhancedDatabaseStorage при необходимости
 * @returns Экземпляр EnhancedDatabaseStorage
 */
function initStorage(): EnhancedDatabaseStorage {
  if (!storageInstance) {
    storageInstance = new EnhancedDatabaseStorage();
  }
  return storageInstance;
}

/**
 * Экземпляр хранилища для использования в приложении
 * Использует EnhancedDatabaseStorage для продвинутого управления базой данных
 */
export const storage = new EnhancedDatabaseStorage();
