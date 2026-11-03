/**
 * @fileoverview Расширенное хранилище поверх DatabaseStorage с кэшированием и служебными оптимизациями
 */

import { type BotGroup, botGroups, type BotInstance, botInstances, type BotMessage, type BotProject, type BotTemplate, botTemplates, type BotToken, type TelegramUserDB, telegramUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { MessageMedia } from "../storages/message-media";
import type { StorageBotGroupInput, StorageBotGroupUpdate, StorageBotProjectInput, StorageBotProjectUpdate, StorageBotTemplateInput, StorageBotTemplateUpdate, StorageTelegramUserInput } from "../storages/storageTypes";
import { DatabaseStorage } from "./DatabaseStorage";
import { cachedOps } from "./db-cache";
import { dbManager } from "./db-utils";

/**
 * Расширенная реализация хранилища с кэшированием и мониторингом
 * Добавляет возможности кэширования, повторных попыток и транзакций
 */

export class EnhancedDatabaseStorage extends DatabaseStorage {
  // Переопределение методов для добавления кэширования и мониторинга
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

  /** Создаёт проект одной попыткой, чтобы неоднозначный ответ не создавал дубликат.
   * @param insertProject - Данные создания
   * @returns Созданная строка
   */
  async createBotProject(insertProject: StorageBotProjectInput): Promise<BotProject> {
    // Нельзя повторять INSERT после неоднозначного сбоя драйвера.
    const project = await super.createBotProject(insertProject);
    cachedOps.invalidateProject(project.id);
    return project;
  }

  /** Удаляет проект одной попыткой и удаляет из кеша даже после неоднозначного сбоя.
   * @param id - Идентификатор проекта
   * @returns Признак удаления строки
   */
  async deleteBotProject(id: number): Promise<boolean> {
    try { return await super.deleteBotProject(id); }
    finally { cachedOps.invalidateProject(id); }
  }

  /** Удаляет шаблон без повторов и сбрасывает кеш.
   * @param id - Идентификатор шаблона
   * @returns Признак удаления
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    try { return await super.deleteBotTemplate(id); }
    finally { cachedOps.invalidateTemplate(id); }
  }

  /**
   * Переупорядочивает проекты одной транзакцией и сбрасывает кеш затронутых записей.
   * @param projectIds - Желаемый порядок проектов
   * @returns Завершение сохранения
   */
  async reorderBotProjects(projectIds: number[]): Promise<void> {
    try { await super.reorderBotProjects(projectIds); }
    finally { projectIds.forEach((id) => cachedOps.invalidateProject(id)); }
  }

  /**
   * Сохраняет проект атомарно и сбрасывает кеш, включая конфликт ревизии.
   * @param id - ID проекта
   * @param updateData - Поля обновления
   * @param expectedRevision - Ожидаемая ревизия
   * @returns Записанная строка либо отсутствие записи
   */
  async updateBotProject(id: number, updateData: StorageBotProjectUpdate, expectedRevision?: number): Promise<BotProject | undefined> {
    // Ошибка драйвера после commit неоднозначна: повтор может создать вторую запись.
    try { return await super.updateBotProject(id, updateData, expectedRevision); }
    finally { cachedOps.invalidateProject(id); }
  }

  /** Создаёт шаблон одной попыткой и сбрасывает кеш даже при неоднозначном исходе.
   * @param insertTemplate - Поля нового шаблона
   * @returns Созданная строка
   */
  async createBotTemplate(insertTemplate: StorageBotTemplateInput): Promise<BotTemplate> {
    // INSERT нельзя повторять при неоднозначном обрыве после commit.
    try { return await super.createBotTemplate(insertTemplate); }
    finally { cachedOps.invalidateAllTemplates(); }
  }

  /**
   * Получить проекты ботов пользователя: где он владелец или коллаборатор
   * @param ownerId - ID пользователя
   * @returns Массив проектов ботов пользователя
   */
  async getUserBotProjects(
    ownerId: number,
    options?: { archived?: boolean; ignoreArchive?: boolean },
  ): Promise<BotProject[]> {
    return await super.getUserBotProjects(ownerId, options);
  }

  async getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]> {
    return await super.getUserBotTokens(ownerId, projectId);
  }

  async getUserBotTemplates(ownerId: number): Promise<BotTemplate[]> {
    return await super.getUserBotTemplates(ownerId);
  }

  /** Обновляет шаблон без автоматического повторения записи.
   * @param id - Идентификатор шаблона
   * @param updateData - Поля обновления
   * @returns Сохранённая строка либо отсутствие записи
   */
  async updateBotTemplate(id: number, updateData: StorageBotTemplateUpdate): Promise<BotTemplate | undefined> {
    try { return await super.updateBotTemplate(id, updateData); }
    finally { cachedOps.invalidateTemplate(id); }
  }

  // Поддержка транзакций для сложных операций
  async createProjectWithTemplate(projectData: StorageBotProjectInput, templateData: StorageBotTemplateInput): Promise<{ project: BotProject; template: BotTemplate; }> {
    return await dbManager.transaction(async (_tx) => {
      const project = await super.createBotProject(projectData);
      const template = await super.createBotTemplate({ ...templateData });

      cachedOps.invalidateProject(project.id);
      cachedOps.invalidateAllTemplates();

      return { project, template };
    });
  }

  // Массовые операции с лучшей производительностью
  /** Создаёт пакет шаблонов одним атомарным INSERT без повтора.
   * @param templates - Новые шаблоны
   * @returns Созданные строки
   */
  async bulkCreateTemplates(templates: StorageBotTemplateInput[]): Promise<BotTemplate[]> {
    if (templates.length === 0) return [];
    // Один INSERT атомарен; повтор после потери ответа запрещён.
    try { return await this.db.insert(botTemplates).values(templates).returning(); }
    finally { cachedOps.invalidateAllTemplates(); }
  }

  // Методы групп ботов - использовать реализацию родителя напрямую
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups).where(eq(botGroups.id, id));
    return group || undefined;
  }

  /**
   * Получить группы проекта, опционально только для токена
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns Массив групп
   */
  async getBotGroupsByProject(projectId: number, tokenId?: number | null): Promise<BotGroup[]> {
    return super.getBotGroupsByProject(projectId, tokenId);
  }

  /**
   * Получить группу по проекту / group_id / токену
   * @param projectId - ID проекта
   * @param groupId - Telegram chat_id
   * @param tokenId - ID токена
   * @returns Группа или undefined
   */
  async getBotGroupByProjectAndGroupId(
    projectId: number,
    groupId: string,
    tokenId?: number | null,
  ): Promise<BotGroup | undefined> {
    return super.getBotGroupByProjectAndGroupId(projectId, groupId, tokenId);
  }

  async createBotGroup(group: StorageBotGroupInput): Promise<BotGroup> {
    const [newGroup] = await this.db
      .insert(botGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async updateBotGroup(id: number, group: StorageBotGroupUpdate): Promise<BotGroup | undefined> {
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

  /**
   * Получает историю сообщений пользователя с медиа с поддержкой сегментации по tokenId
   * @param projectId - Идентификатор проекта
   * @param userId - Telegram ID пользователя
   * @param limit - Максимальное число сообщений
   * @param order - Порядок сортировки по времени
   * @param messageType - Необязательный тип сообщения
   * @param tokenId - Необязательный идентификатор токена бота
   * @returns История сообщений с прикрепленными медиафайлами
   */
  async getBotMessagesWithMedia(
    projectId: number,
    userId: string,
    limit: number = 100,
    order: "asc" | "desc" = "asc",
    messageType?: "user" | "bot",
    tokenId?: number | null
  ): Promise<(BotMessage & { media?: MessageMedia[] })[]> {
    return super.getBotMessagesWithMedia(projectId, userId, limit, order, messageType, tokenId);
  }

  // Пользователи Telegram
  async getTelegramUser(id: number): Promise<TelegramUserDB | undefined> {
    const [user] = await this.db.select().from(telegramUsers).where(eq(telegramUsers.id, id));
    return user || undefined;
  }

  async getTelegramUserOrCreate(userData: StorageTelegramUserInput): Promise<TelegramUserDB> {
    // Проверяем, есть ли пользователь
    const existing = await this.getTelegramUser(userData.id);
    if (existing) {
      // Обновляем, если нужно
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

  async deleteTelegramUser(_id: number): Promise<boolean> {
    return true;
  }

  // Переопределяем метод получения экземпляра бота для обработки закрытия пула соединений
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    try {
      // Проверяем, активен ли пул соединений
      if (globalThis.__dbPoolActive === false) {
        console.log(`⚠️ Пропускаем запрос к базе данных для бота ${projectId} - пул соединений закрыт`);
        return undefined;
      }

      const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
      return instance || undefined;
    } catch (error: any) {
      // Проверяем, является ли ошибка связанной с закрытием пула
      if (error.message && error.message.includes('Cannot use a pool after calling end on the pool')) {
        console.log(`⚠️ Пропускаем обновление статуса бота в базе данных - пул соединений закрыт`);
        return undefined;
      }
      
      // Обрабатываем ошибку потери соединения
      if (error.message && error.message.includes('Connection terminated unexpectedly')) {
        console.log(`⚠️ Соединение с БД прервано при получении бота ${projectId}. Помечаем пул как неактивный.`);
        globalThis.__dbPoolActive = false;
        return undefined;
      }
      
      // Для других ошибок пробрасываем исключение
      throw error;
    }
  }
}
