import { 
  botProjects, 
  botInstances,
  botTemplates,
  botTokens,
  mediaFiles,
  type BotProject, 
  type InsertBotProject,
  type BotInstance,
  type InsertBotInstance,
  type BotTemplate,
  type InsertBotTemplate,
  type BotToken,
  type InsertBotToken,
  type MediaFile,
  type InsertMediaFile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, like, or, ilike } from "drizzle-orm";

export interface IStorage {
  getBotProject(id: number): Promise<BotProject | undefined>;
  getAllBotProjects(): Promise<BotProject[]>;
  createBotProject(project: InsertBotProject): Promise<BotProject>;
  updateBotProject(id: number, project: Partial<InsertBotProject>): Promise<BotProject | undefined>;
  deleteBotProject(id: number): Promise<boolean>;
  
  // Bot instances
  getBotInstance(projectId: number): Promise<BotInstance | undefined>;
  getAllBotInstances(): Promise<BotInstance[]>;
  createBotInstance(instance: InsertBotInstance): Promise<BotInstance>;
  updateBotInstance(id: number, instance: Partial<InsertBotInstance>): Promise<BotInstance | undefined>;
  deleteBotInstance(id: number): Promise<boolean>;
  stopBotInstance(projectId: number): Promise<boolean>;
  
  // Bot templates
  getBotTemplate(id: number): Promise<BotTemplate | undefined>;
  getAllBotTemplates(): Promise<BotTemplate[]>;
  createBotTemplate(template: InsertBotTemplate): Promise<BotTemplate>;
  updateBotTemplate(id: number, template: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined>;
  deleteBotTemplate(id: number): Promise<boolean>;
  incrementTemplateUseCount(id: number): Promise<boolean>;
  incrementTemplateViewCount(id: number): Promise<boolean>;
  incrementTemplateDownloadCount(id: number): Promise<boolean>;
  toggleTemplateLike(id: number, liked: boolean): Promise<boolean>;
  toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean>;
  rateTemplate(id: number, rating: number): Promise<boolean>;
  getFeaturedTemplates(): Promise<BotTemplate[]>;
  getTemplatesByCategory(category: string): Promise<BotTemplate[]>;
  searchTemplates(query: string): Promise<BotTemplate[]>;
  
  // Bot tokens
  getBotToken(id: number): Promise<BotToken | undefined>;
  getBotTokensByProject(projectId: number): Promise<BotToken[]>;
  getDefaultBotToken(projectId: number): Promise<BotToken | undefined>;
  createBotToken(token: InsertBotToken): Promise<BotToken>;
  updateBotToken(id: number, token: Partial<InsertBotToken>): Promise<BotToken | undefined>;
  deleteBotToken(id: number): Promise<boolean>;
  setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean>;
  markTokenAsUsed(id: number): Promise<boolean>;
  
  // Media files
  getMediaFile(id: number): Promise<MediaFile | undefined>;
  getMediaFilesByProject(projectId: number): Promise<MediaFile[]>;
  getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]>;
  createMediaFile(file: InsertMediaFile): Promise<MediaFile>;
  updateMediaFile(id: number, file: Partial<InsertMediaFile>): Promise<MediaFile | undefined>;
  deleteMediaFile(id: number): Promise<boolean>;
  incrementMediaFileUsage(id: number): Promise<boolean>;
  searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]>;
}

// Legacy Memory Storage - kept for reference
class MemStorage implements IStorage {
  private projects: Map<number, BotProject>;
  private instances: Map<number, BotInstance>;
  private templates: Map<number, BotTemplate>;
  currentId: number;
  currentInstanceId: number;
  currentTemplateId: number;

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
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.projects.set(1, defaultProject);
    this.currentId = 2;
  }

  async getBotProject(id: number): Promise<BotProject | undefined> {
    return this.projects.get(id);
  }

  async getAllBotProjects(): Promise<BotProject[]> {
    return Array.from(this.projects.values());
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const id = this.currentId++;
    const project: BotProject = {
      ...insertProject,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: insertProject.description || null,
      botToken: insertProject.botToken ?? null,
    };
    this.projects.set(id, project);
    return project;
  }

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

  async deleteBotProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Bot instances methods
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    return Array.from(this.instances.values()).find(instance => instance.projectId === projectId);
  }

  async getAllBotInstances(): Promise<BotInstance[]> {
    return Array.from(this.instances.values());
  }

  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    // Сначала удаляем существующий экземпляр для этого проекта
    const existingInstance = await this.getBotInstance(insertInstance.projectId);
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

  async deleteBotInstance(id: number): Promise<boolean> {
    return this.instances.delete(id);
  }

  async stopBotInstance(projectId: number): Promise<boolean> {
    const instance = await this.getBotInstance(projectId);
    if (!instance) return false;
    
    const updated = await this.updateBotInstance(instance.id, { 
      status: 'stopped'
    });
    return !!updated;
  }

  // Bot templates methods
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    return this.templates.get(id);
  }

  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return Array.from(this.templates.values());
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const id = this.currentTemplateId++;
    const template: BotTemplate = {
      ...insertTemplate,
      id,
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

  async deleteBotTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

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

  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return Array.from(this.templates.values()).filter(template => template.featured === 1);
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      (template.description && template.description.toLowerCase().includes(searchTerm)) ||
      (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Bot Tokens (Memory implementation)
  async getBotToken(id: number): Promise<BotToken | undefined> {
    // In memory implementation - tokens are not stored
    return undefined;
  }

  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    // In memory implementation - tokens are not stored
    return [];
  }

  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    // In memory implementation - tokens are not stored
    return undefined;
  }

  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    // In memory implementation - create temporary token
    const token: BotToken = {
      ...insertToken,
      id: this.currentTemplateId++, // Reuse template ID counter
      description: insertToken.description || null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return token;
  }

  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    // In memory implementation - not supported
    return undefined;
  }

  async deleteBotToken(id: number): Promise<boolean> {
    // In memory implementation - not supported
    return false;
  }

  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    // In memory implementation - not supported
    return false;
  }

  async markTokenAsUsed(id: number): Promise<boolean> {
    // In memory implementation - not supported
    return false;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Bot Projects
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const [project] = await db.select().from(botProjects).where(eq(botProjects.id, id));
    return project || undefined;
  }

  async getAllBotProjects(): Promise<BotProject[]> {
    return await db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await db
      .insert(botProjects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const [project] = await db
      .update(botProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteBotProject(id: number): Promise<boolean> {
    const result = await db.delete(botProjects).where(eq(botProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  async getAllBotInstances(): Promise<BotInstance[]> {
    return await db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    return template || undefined;
  }

  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const [template] = await db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await db.delete(botTemplates).where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;
    
    const result = await db
      .update(botTemplates)
      .set({ 
        useCount: (template.useCount || 0) + 1,
        lastUsedAt: new Date()
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;
    
    const result = await db
      .update(botTemplates)
      .set({ 
        viewCount: (template.viewCount || 0) + 1
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;
    
    const result = await db
      .update(botTemplates)
      .set({ 
        downloadCount: (template.downloadCount || 0) + 1
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;
    
    const current = template.likeCount || 0;
    const newCount = liked ? current + 1 : Math.max(0, current - 1);
    
    const result = await db
      .update(botTemplates)
      .set({ 
        likeCount: newCount
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;
    
    const current = template.bookmarkCount || 0;
    const newCount = bookmarked ? current + 1 : Math.max(0, current - 1);
    
    const result = await db
      .update(botTemplates)
      .set({ 
        bookmarkCount: newCount
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async rateTemplate(id: number, rating: number): Promise<boolean> {
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const currentRating = template.rating || 0;
    const currentRatingCount = template.ratingCount || 0;
    const newRatingCount = currentRatingCount + 1;
    const newRating = Math.round(((currentRating * currentRatingCount) + rating) / newRatingCount);

    const result = await db
      .update(botTemplates)
      .set({ 
        rating: newRating,
        ratingCount: newRatingCount,
        updatedAt: new Date()
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(botTemplates).where(
      or(
        ilike(botTemplates.name, searchTerm),
        ilike(botTemplates.description, searchTerm)
      )
    ).orderBy(desc(botTemplates.rating));
  }

  // Bot Tokens
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    if (insertToken.isDefault === 1) {
      await db.update(botTokens)
        .set({ isDefault: 0 })
        .where(eq(botTokens.projectId, insertToken.projectId));
    }

    const [token] = await db
      .insert(botTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    if (updateData.isDefault === 1) {
      const [currentToken] = await db.select().from(botTokens).where(eq(botTokens.id, id));
      if (currentToken) {
        await db.update(botTokens)
          .set({ isDefault: 0 })
          .where(eq(botTokens.projectId, currentToken.projectId));
      }
    }

    const [token] = await db
      .update(botTokens)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTokens.id, id))
      .returning();
    return token || undefined;
  }

  async deleteBotToken(id: number): Promise<boolean> {
    const result = await db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    await db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

    const result = await db.update(botTokens)
      .set({ isDefault: 1 })
      .where(eq(botTokens.id, tokenId));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return await db.select().from(mediaFiles)
      .where(eq(mediaFiles.projectId, projectId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return await db.select().from(mediaFiles)
      .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.fileType, fileType)))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const [file] = await db
      .insert(mediaFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [file] = await db
      .update(mediaFiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file || undefined;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementMediaFileUsage(id: number): Promise<boolean> {
    const result = await db
      .update(mediaFiles)
      .set({ 
        usageCount: db.raw('usage_count + 1'),
        updatedAt: new Date()
      })
      .where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(mediaFiles)
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
}

// Оптимизированная версия с кэшированием
export class OptimizedDatabaseStorage implements IStorage {
  private templateCache: Map<number, BotTemplate> = new Map();
  private projectCache: Map<number, BotProject> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут
  
  // Bot Projects (с кэшированием)
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const cached = this.projectCache.get(id);
    if (cached) return cached;
    
    const [project] = await db.select().from(botProjects).where(eq(botProjects.id, id));
    if (project) {
      this.projectCache.set(id, project);
      // Автоматически очищаем кэш через timeout
      setTimeout(() => this.projectCache.delete(id), this.cacheTimeout);
    }
    return project || undefined;
  }

  async getAllBotProjects(): Promise<BotProject[]> {
    return await db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await db
      .insert(botProjects)
      .values(insertProject)
      .returning();
    this.projectCache.set(project.id, project);
    return project;
  }

  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const [project] = await db
      .update(botProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    if (project) {
      this.projectCache.set(id, project);
    }
    return project || undefined;
  }

  async deleteBotProject(id: number): Promise<boolean> {
    const result = await db.delete(botProjects).where(eq(botProjects.id, id));
    this.projectCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances (простая реализация)
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  async getAllBotInstances(): Promise<BotInstance[]> {
    return await db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates (с кэшированием)
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const cached = this.templateCache.get(id);
    if (cached) return cached;
    
    const [template] = await db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (template) {
      this.templateCache.set(id, template);
      setTimeout(() => this.templateCache.delete(id), this.cacheTimeout);
    }
    return template || undefined;
  }

  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    this.templateCache.set(template.id, template);
    return template;
  }

  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const [template] = await db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    if (template) {
      this.templateCache.set(id, template);
    }
    return template || undefined;
  }

  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await db.delete(botTemplates).where(eq(botTemplates.id, id));
    this.templateCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Упрощенные методы для счетчиков
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const result = await db
      .update(botTemplates)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTemplates.id, id));
    this.templateCache.delete(id); // Очищаем кэш
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const result = await db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const result = await db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  async rateTemplate(id: number, rating: number): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(botTemplates).where(
      or(
        ilike(botTemplates.name, searchTerm),
        ilike(botTemplates.description, searchTerm)
      )
    ).orderBy(desc(botTemplates.rating));
  }

  // Bot Tokens
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    // Если создаем токен по умолчанию, убираем флаг с других токенов
    if (insertToken.isDefault === 1) {
      await db.update(botTokens)
        .set({ isDefault: 0 })
        .where(eq(botTokens.projectId, insertToken.projectId));
    }

    const [token] = await db
      .insert(botTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    // Если делаем токен по умолчанию, убираем флаг с других токенов
    if (updateData.isDefault === 1) {
      const [currentToken] = await db.select().from(botTokens).where(eq(botTokens.id, id));
      if (currentToken) {
        await db.update(botTokens)
          .set({ isDefault: 0 })
          .where(eq(botTokens.projectId, currentToken.projectId));
      }
    }

    const [token] = await db
      .update(botTokens)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTokens.id, id))
      .returning();
    return token || undefined;
  }

  async deleteBotToken(id: number): Promise<boolean> {
    const result = await db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    // Убираем флаг по умолчанию со всех токенов проекта
    await db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

    // Устанавливаем флаг по умолчанию для указанного токена
    const result = await db.update(botTokens)
      .set({ isDefault: 1 })
      .where(eq(botTokens.id, tokenId));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

// Используем DatabaseStorage для постоянного хранения шаблонов
export const storage = new DatabaseStorage();
