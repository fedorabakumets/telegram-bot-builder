import { 
  botProjects, 
  botInstances,
  botTemplates,
  type BotProject, 
  type InsertBotProject,
  type BotInstance,
  type InsertBotInstance,
  type BotTemplate,
  type InsertBotTemplate
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
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
}

export const storage = new MemStorage();
