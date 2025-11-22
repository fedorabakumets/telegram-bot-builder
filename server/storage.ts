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
  type InsertBotMessageMedia
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, like, or, ilike, sql } from "drizzle-orm";
import { dbManager } from "./db-utils";
import { cachedOps } from "./db-cache";

export interface IStorage {
  getBotProject(id: number): Promise<BotProject | undefined>;
  getAllBotProjects(): Promise<BotProject[]>;
  createBotProject(project: InsertBotProject): Promise<BotProject>;
  updateBotProject(id: number, project: Partial<InsertBotProject>): Promise<BotProject | undefined>;
  deleteBotProject(id: number): Promise<boolean>;
  
  // Bot instances
  getBotInstance(projectId: number): Promise<BotInstance | undefined>;
  getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined>;
  getBotInstancesByProject(projectId: number): Promise<BotInstance[]>;
  getAllBotInstances(): Promise<BotInstance[]>;
  createBotInstance(instance: InsertBotInstance): Promise<BotInstance>;
  updateBotInstance(id: number, instance: Partial<InsertBotInstance>): Promise<BotInstance | undefined>;
  deleteBotInstance(id: number): Promise<boolean>;
  stopBotInstance(projectId: number): Promise<boolean>;
  stopBotInstanceByToken(tokenId: number): Promise<boolean>;
  
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
  
  // User bot data
  getUserBotData(id: number): Promise<UserBotData | undefined>;
  getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined>;
  getUserBotDataByProject(projectId: number): Promise<UserBotData[]>;
  getAllUserBotData(): Promise<UserBotData[]>;
  createUserBotData(userData: InsertUserBotData): Promise<UserBotData>;
  updateUserBotData(id: number, userData: Partial<InsertUserBotData>): Promise<UserBotData | undefined>;
  deleteUserBotData(id: number): Promise<boolean>;
  deleteUserBotDataByProject(projectId: number): Promise<boolean>;
  incrementUserInteraction(id: number): Promise<boolean>;
  updateUserState(id: number, state: string): Promise<boolean>;
  searchUserBotData(projectId: number, query: string): Promise<UserBotData[]>;
  getUserBotDataStats(projectId: number): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }>;
  
  // Bot groups
  getBotGroup(id: number): Promise<BotGroup | undefined>;
  getBotGroupsByProject(projectId: number): Promise<BotGroup[]>;
  getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined>;
  createBotGroup(group: InsertBotGroup): Promise<BotGroup>;
  updateBotGroup(id: number, group: Partial<InsertBotGroup>): Promise<BotGroup | undefined>;
  deleteBotGroup(id: number): Promise<boolean>;
  
  // Group members
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  createGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  updateGroupMember(id: number, member: Partial<InsertGroupMember>): Promise<GroupMember | undefined>;
  deleteGroupMember(id: number): Promise<boolean>;
  
  // Bot messages
  createBotMessage(message: InsertBotMessage): Promise<BotMessage>;
  getBotMessages(projectId: number, userId: string, limit?: number): Promise<BotMessage[]>;
  getBotMessagesWithMedia(projectId: number, userId: string, limit?: number): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]>;
  deleteBotMessages(projectId: number, userId: string): Promise<boolean>;
  deleteAllBotMessages(projectId: number): Promise<boolean>;
  
  // Bot message media
  createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia>;
  getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number }>>;
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
      userDatabaseEnabled: 1,
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

  async getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined> {
    return Array.from(this.instances.values()).find(instance => instance.tokenId === tokenId);
  }

  async getBotInstancesByProject(projectId: number): Promise<BotInstance[]> {
    return Array.from(this.instances.values()).filter(instance => instance.projectId === projectId);
  }

  async getAllBotInstances(): Promise<BotInstance[]> {
    return Array.from(this.instances.values());
  }

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

  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const instance = await this.getBotInstanceByToken(tokenId);
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

  // Media Files (Memory implementation - not supported)
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    return undefined;
  }

  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return [];
  }

  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return [];
  }

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

  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    return undefined;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    return false;
  }

  async incrementMediaFileUsage(id: number): Promise<boolean> {
    return false;
  }

  async searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]> {
    return [];
  }

  // User Bot Data (Memory implementation - not supported)
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    return undefined;
  }

  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    return undefined;
  }

  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return [];
  }

  async getAllUserBotData(): Promise<UserBotData[]> {
    return [];
  }

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

  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    return undefined;
  }

  async deleteUserBotData(id: number): Promise<boolean> {
    return false;
  }

  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    return false;
  }

  async incrementUserInteraction(id: number): Promise<boolean> {
    return false;
  }

  async updateUserState(id: number, state: string): Promise<boolean> {
    return false;
  }

  async searchUserBotData(projectId: number, query: string): Promise<UserBotData[]> {
    return [];
  }

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
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    return undefined;
  }

  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return [];
  }

  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    return undefined;
  }

  async createBotGroup(group: InsertBotGroup): Promise<BotGroup> {
    throw new Error("MemStorage does not support groups");
  }

  async updateBotGroup(id: number, group: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    return undefined;
  }

  async deleteBotGroup(id: number): Promise<boolean> {
    return false;
  }

  // Group members stubs
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return [];
  }

  async createGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    throw new Error("MemStorage does not support group members");
  }

  async updateGroupMember(id: number, member: Partial<InsertGroupMember>): Promise<GroupMember | undefined> {
    return undefined;
  }

  async deleteGroupMember(id: number): Promise<boolean> {
    return false;
  }

  // Bot messages stubs
  async createBotMessage(message: InsertBotMessage): Promise<BotMessage> {
    throw new Error("MemStorage does not support bot messages");
  }

  async getBotMessages(projectId: number, userId: string, limit?: number): Promise<BotMessage[]> {
    return [];
  }

  async getBotMessagesWithMedia(projectId: number, userId: string, limit?: number): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number }> })[]> {
    return [];
  }

  async deleteBotMessages(projectId: number, userId: string): Promise<boolean> {
    return false;
  }

  async deleteAllBotMessages(projectId: number): Promise<boolean> {
    return false;
  }

  async createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia> {
    throw new Error("MemStorage does not support bot message media");
  }

  async getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number }>> {
    return [];
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  protected db = db;
  
  // Bot Projects
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const [project] = await this.db.select().from(botProjects).where(eq(botProjects.id, id));
    return project || undefined;
  }

  async getAllBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await this.db
      .insert(botProjects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const [project] = await this.db
      .update(botProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteBotProject(id: number): Promise<boolean> {
    const result = await this.db.delete(botProjects).where(eq(botProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  async getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.tokenId, tokenId));
    return instance || undefined;
  }

  async getBotInstancesByProject(projectId: number): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
  }

  async getAllBotInstances(): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await this.db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await this.db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await this.db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.tokenId, tokenId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    return template || undefined;
  }

  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const [template] = await this.db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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

  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

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
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await this.db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

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

  async deleteBotToken(id: number): Promise<boolean> {
    const result = await this.db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    await this.db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

    const result = await this.db.update(botTokens)
      .set({ isDefault: 1 })
      .where(eq(botTokens.id, tokenId));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await this.db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(eq(mediaFiles.projectId, projectId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.fileType, fileType)))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const [file] = await this.db
      .insert(mediaFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [file] = await this.db
      .update(mediaFiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file || undefined;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    return userData || undefined;
  }

  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData)
      .where(and(eq(userBotData.projectId, projectId), eq(userBotData.userId, userId)));
    return userData || undefined;
  }

  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId))
      .orderBy(desc(userBotData.lastInteraction));
  }

  async getAllUserBotData(): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData).orderBy(desc(userBotData.lastInteraction));
  }

  async createUserBotData(insertUserData: InsertUserBotData): Promise<UserBotData> {
    const [userData] = await this.db
      .insert(userBotData)
      .values(insertUserData)
      .returning();
    return userData;
  }

  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    const [userData] = await this.db
      .update(userBotData)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userBotData.id, id))
      .returning();
    return userData || undefined;
  }

  async deleteUserBotData(id: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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

  async createBotGroup(insertGroup: InsertBotGroup): Promise<BotGroup> {
    const [group] = await this.db
      .insert(botGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async updateBotGroup(id: number, updateData: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [group] = await this.db
      .update(botGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return group || undefined;
  }

  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Group members
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await this.db.select().from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(desc(groupMembers.joinedAt));
  }

  async createGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await this.db
      .insert(groupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateGroupMember(id: number, updateData: Partial<InsertGroupMember>): Promise<GroupMember | undefined> {
    const [member] = await this.db
      .update(groupMembers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(groupMembers.id, id))
      .returning();
    return member || undefined;
  }

  async deleteGroupMember(id: number): Promise<boolean> {
    const result = await this.db.delete(groupMembers).where(eq(groupMembers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot messages
  async createBotMessage(insertMessage: InsertBotMessage): Promise<BotMessage> {
    const [message] = await this.db
      .insert(botMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

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

  async deleteBotMessages(projectId: number, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteAllBotMessages(projectId: number): Promise<boolean> {
    const result = await this.db
      .delete(botMessages)
      .where(eq(botMessages.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot message media
  async createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia> {
    const [media] = await this.db
      .insert(botMessageMedia)
      .values(data)
      .returning();
    return media;
  }

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

// Оптимизированная версия с кэшированием
export class OptimizedDatabaseStorage extends DatabaseStorage {
  private templateCache: Map<number, BotTemplate> = new Map();
  private projectCache: Map<number, BotProject> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут
  
  // Bot Projects (с кэшированием)
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

  async getAllBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await this.db
      .insert(botProjects)
      .values(insertProject)
      .returning();
    this.projectCache.set(project.id, project);
    return project;
  }

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

  async deleteBotProject(id: number): Promise<boolean> {
    const result = await this.db.delete(botProjects).where(eq(botProjects.id, id));
    this.projectCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances (простая реализация)
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  async getAllBotInstances(): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await this.db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await this.db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await this.db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.tokenId, tokenId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates (с кэшированием)
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

  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    this.templateCache.set(template.id, template);
    return template;
  }

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

  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    this.templateCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Упрощенные методы для счетчиков
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTemplates.id, id));
    this.templateCache.delete(id); // Очищаем кэш
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const result = await this.db
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
    return await this.db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

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
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await this.db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

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

  async deleteBotToken(id: number): Promise<boolean> {
    const result = await this.db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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

  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await this.db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files (simplified implementation)
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(eq(mediaFiles.projectId, projectId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.fileType, fileType)))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const [file] = await this.db
      .insert(mediaFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [file] = await this.db
      .update(mediaFiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file || undefined;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementMediaFileUsage(id: number): Promise<boolean> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    if (!file) return false;
    
    const result = await this.db
      .update(mediaFiles)
      .set({ usageCount: (file.usageCount || 0) + 1 })
      .where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    return userData || undefined;
  }

  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData)
      .where(and(eq(userBotData.projectId, projectId), eq(userBotData.userId, userId)));
    return userData || undefined;
  }

  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId))
      .orderBy(desc(userBotData.lastInteraction));
  }

  async getAllUserBotData(): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .orderBy(desc(userBotData.lastInteraction));
  }

  async createUserBotData(insertUserData: InsertUserBotData): Promise<UserBotData> {
    const [userData] = await this.db
      .insert(userBotData)
      .values(insertUserData)
      .returning();
    return userData;
  }

  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    const [userData] = await this.db
      .update(userBotData)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userBotData.id, id))
      .returning();
    return userData || undefined;
  }

  async deleteUserBotData(id: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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

  async updateUserState(id: number, state: string): Promise<boolean> {
    const result = await this.db
      .update(userBotData)
      .set({ currentState: state, updatedAt: new Date() })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

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

  async createBotGroup(insertGroup: InsertBotGroup): Promise<BotGroup> {
    const [group] = await this.db
      .insert(botGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async updateBotGroup(id: number, updateData: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [group] = await this.db
      .update(botGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return group || undefined;
  }

  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

// Enhanced Database Storage with caching and monitoring
export class EnhancedDatabaseStorage extends DatabaseStorage {
  // Override methods to add caching and monitoring
  
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
}

// Используем EnhancedDatabaseStorage для продвинутого управления базой данных
let storageInstance: EnhancedDatabaseStorage | null = null;

function initStorage(): EnhancedDatabaseStorage {
  if (!storageInstance) {
    storageInstance = new EnhancedDatabaseStorage();
  }
  return storageInstance;
}

// Export storage instance directly
export const storage = new EnhancedDatabaseStorage();
