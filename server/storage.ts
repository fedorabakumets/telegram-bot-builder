import { botProjects, type BotProject, type InsertBotProject } from "@shared/schema";

export interface IStorage {
  getBotProject(id: number): Promise<BotProject | undefined>;
  getAllBotProjects(): Promise<BotProject[]>;
  createBotProject(project: InsertBotProject): Promise<BotProject>;
  updateBotProject(id: number, project: Partial<InsertBotProject>): Promise<BotProject | undefined>;
  deleteBotProject(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, BotProject>;
  currentId: number;

  constructor() {
    this.projects = new Map();
    this.currentId = 1;
    
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
}

export const storage = new MemStorage();
