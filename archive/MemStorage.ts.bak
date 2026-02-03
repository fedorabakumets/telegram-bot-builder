import type { BotProject, BotInstance, BotTemplate, InsertBotProject, InsertBotInstance, InsertBotTemplate, BotToken, InsertBotToken, TelegramUserDB, InsertTelegramUser, MediaFile, InsertMediaFile, UserBotData, InsertUserBotData, BotGroup, InsertBotGroup, GroupMember, InsertGroupMember, InsertBotMessage, BotMessage, InsertBotMessageMedia, BotMessageMedia } from "@shared/schema";
import { IStorage } from "./storage";

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
    return Array.from(this.templates.values()).filter(template => template.name.toLowerCase().includes(searchTerm) ||
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
  async getBotMessagesWithMedia(projectId: number, userId: string, limit?: number): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number; }>; })[]> {
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
  async getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number; }>> {
    return [];
  }
}
