import type { 
  BotProject, 
  BotToken, 
  BotTemplate,
  InsertBotProject,
  InsertBotToken,
  InsertBotTemplate 
} from "@shared/schema";

const STORAGE_KEYS = {
  PROJECTS: 'botcraft_projects',
  TOKENS: 'botcraft_tokens',
  TEMPLATES: 'botcraft_templates',
  NEXT_PROJECT_ID: 'botcraft_next_project_id',
  NEXT_TOKEN_ID: 'botcraft_next_token_id',
  NEXT_TEMPLATE_ID: 'botcraft_next_template_id',
} as const;

type StoredProject = Omit<BotProject, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
type StoredToken = Omit<BotToken, 'createdAt' | 'updatedAt' | 'lastUsedAt'> & { createdAt: string; updatedAt: string; lastUsedAt: string | null };
type StoredTemplate = Omit<BotTemplate, 'createdAt' | 'updatedAt' | 'lastUsedAt'> & { createdAt: string; updatedAt: string; lastUsedAt: string | null };

export class LocalStorageService {
  private static getNextId(key: string): number {
    try {
      const current = localStorage.getItem(key);
      const nextId = current ? parseInt(current) : 1;
      const newId = nextId + 1;
      
      try {
        localStorage.setItem(key, String(newId));
      } catch (setError) {
        console.error(`Error persisting ID counter (${key}):`, setError);
      }
      
      return nextId;
    } catch (e) {
      console.error(`Error managing ID counter (${key}):`, e);
      const fallbackId = Date.now();
      
      try {
        localStorage.setItem(key, String(fallbackId + 1));
      } catch (setError) {
        console.error(`Error persisting fallback counter (${key}):`, setError);
      }
      
      return fallbackId;
    }
  }

  private static safeGetItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading from localStorage (${key}):`, e);
      return defaultValue;
    }
  }

  private static safeSetItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing to localStorage (${key}):`, e);
    }
  }

  private static normalizeDatesInPartial(data: any): any {
    const normalized: any = {};
    
    for (const key in data) {
      const value = data[key];
      if (value instanceof Date) {
        normalized[key] = value.toISOString();
      } else {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }

  private static updateNextIdCounter(items: { id: number }[], counterKey: string): void {
    try {
      const currentCounter = localStorage.getItem(counterKey);
      const currentCounterValue = currentCounter ? parseInt(currentCounter) : 1;
      
      if (items.length === 0) {
        try {
          localStorage.setItem(counterKey, String(currentCounterValue));
        } catch (setError) {
          console.error(`Error persisting counter (${counterKey}):`, setError);
        }
        return;
      }
      
      const maxId = Math.max(...items.map(item => item.id));
      const nextId = String(Math.max(currentCounterValue, maxId + 1));
      
      try {
        localStorage.setItem(counterKey, nextId);
      } catch (setError) {
        console.error(`Error persisting counter update (${counterKey}):`, setError);
      }
    } catch (e) {
      console.error(`Error updating ID counter (${counterKey}):`, e);
    }
  }

  private static safeRemoveItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from localStorage (${key}):`, e);
    }
  }

  private static reviveDates<T extends StoredProject>(item: T): BotProject;
  private static reviveDates(item: StoredProject): BotProject {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    } as BotProject;
  }

  private static reviveDatesWithLastUsed<T extends StoredToken>(item: T): BotToken;
  private static reviveDatesWithLastUsed<T extends StoredTemplate>(item: T): BotTemplate;
  private static reviveDatesWithLastUsed(item: StoredToken | StoredTemplate): BotToken | BotTemplate {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      lastUsedAt: item.lastUsedAt ? new Date(item.lastUsedAt) : null,
    } as BotToken | BotTemplate;
  }

  static getProjects(): BotProject[] {
    const stored = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    return stored.map(p => this.reviveDates(p));
  }

  static getProject(id: number): BotProject | undefined {
    const projects = this.getProjects();
    return projects.find(p => p.id === id);
  }

  static saveProject(data: InsertBotProject): BotProject {
    const storedProjects = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    const now = new Date();
    const nowISO = now.toISOString();
    
    const newStoredProject: StoredProject = {
      id: this.getNextId(STORAGE_KEYS.NEXT_PROJECT_ID),
      ownerId: null,
      name: data.name,
      description: data.description || null,
      data: data.data,
      botToken: data.botToken || null,
      userDatabaseEnabled: data.userDatabaseEnabled ?? 1,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    
    storedProjects.push(newStoredProject);
    this.safeSetItem(STORAGE_KEYS.PROJECTS, storedProjects);
    return this.reviveDates(newStoredProject);
  }

  static updateProject(id: number, data: Partial<InsertBotProject>): BotProject | undefined {
    const storedProjects = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    const index = storedProjects.findIndex(p => p.id === id);
    
    if (index === -1) return undefined;
    
    const normalizedData = this.normalizeDatesInPartial(data);
    
    const updated: StoredProject = {
      ...storedProjects[index],
      ...normalizedData,
      updatedAt: new Date().toISOString(),
    };
    
    storedProjects[index] = updated;
    this.safeSetItem(STORAGE_KEYS.PROJECTS, storedProjects);
    return this.reviveDates(updated);
  }

  static deleteProject(id: number): boolean {
    const storedProjects = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    const filtered = storedProjects.filter(p => p.id !== id);
    
    if (filtered.length === storedProjects.length) return false;
    
    this.safeSetItem(STORAGE_KEYS.PROJECTS, filtered);
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const filteredTokens = storedTokens.filter(t => t.projectId !== id);
    this.safeSetItem(STORAGE_KEYS.TOKENS, filteredTokens);
    return true;
  }

  static getTokens(projectId?: number): BotToken[] {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const tokens = storedTokens.map(t => this.reviveDatesWithLastUsed(t));
    return projectId ? tokens.filter(t => t.projectId === projectId) : tokens;
  }

  static getToken(id: number): BotToken | undefined {
    const tokens = this.getTokens();
    return tokens.find(t => t.id === id);
  }

  static saveToken(data: InsertBotToken): BotToken {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const nowISO = new Date().toISOString();
    
    const newStoredToken: StoredToken = {
      id: this.getNextId(STORAGE_KEYS.NEXT_TOKEN_ID),
      projectId: data.projectId,
      ownerId: null,
      name: data.name,
      token: data.token,
      isDefault: data.isDefault ?? 0,
      isActive: data.isActive ?? 1,
      description: data.description || null,
      botFirstName: data.botFirstName || null,
      botUsername: data.botUsername || null,
      botDescription: data.botDescription || null,
      botShortDescription: data.botShortDescription || null,
      botPhotoUrl: data.botPhotoUrl || null,
      botCanJoinGroups: data.botCanJoinGroups || null,
      botCanReadAllGroupMessages: data.botCanReadAllGroupMessages || null,
      botSupportsInlineQueries: data.botSupportsInlineQueries || null,
      botHasMainWebApp: data.botHasMainWebApp || null,
      lastUsedAt: null,
      trackExecutionTime: data.trackExecutionTime ?? 0,
      totalExecutionSeconds: data.totalExecutionSeconds ?? 0,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    
    storedTokens.push(newStoredToken);
    this.safeSetItem(STORAGE_KEYS.TOKENS, storedTokens);
    return this.reviveDatesWithLastUsed(newStoredToken);
  }

  static updateToken(id: number, data: Partial<InsertBotToken>): BotToken | undefined {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const index = storedTokens.findIndex(t => t.id === id);
    
    if (index === -1) return undefined;
    
    const normalizedData = this.normalizeDatesInPartial(data);
    
    const updated: StoredToken = {
      ...storedTokens[index],
      ...normalizedData,
      updatedAt: new Date().toISOString(),
    };
    
    storedTokens[index] = updated;
    this.safeSetItem(STORAGE_KEYS.TOKENS, storedTokens);
    return this.reviveDatesWithLastUsed(updated);
  }

  static deleteToken(id: number): boolean {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const filtered = storedTokens.filter(t => t.id !== id);
    
    if (filtered.length === storedTokens.length) return false;
    
    this.safeSetItem(STORAGE_KEYS.TOKENS, filtered);
    return true;
  }

  static getTemplates(): BotTemplate[] {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    return storedTemplates.map(t => this.reviveDatesWithLastUsed(t));
  }

  static getTemplate(id: number): BotTemplate | undefined {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id);
  }

  static saveTemplate(data: InsertBotTemplate): BotTemplate {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const nowISO = new Date().toISOString();
    
    const newStoredTemplate: StoredTemplate = {
      id: this.getNextId(STORAGE_KEYS.NEXT_TEMPLATE_ID),
      ownerId: null,
      name: data.name,
      description: data.description || null,
      data: data.data,
      category: data.category || "custom",
      tags: data.tags || null,
      isPublic: data.isPublic ?? 0,
      difficulty: data.difficulty || "easy",
      authorId: data.authorId || null,
      authorName: data.authorName || null,
      useCount: 0,
      rating: 0,
      ratingCount: 0,
      featured: data.featured ?? 0,
      version: data.version || "1.0.0",
      previewImage: data.previewImage || null,
      lastUsedAt: null,
      downloadCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      language: data.language || "ru",
      requiresToken: data.requiresToken ?? 0,
      complexity: data.complexity ?? 1,
      estimatedTime: data.estimatedTime ?? 5,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    
    storedTemplates.push(newStoredTemplate);
    this.safeSetItem(STORAGE_KEYS.TEMPLATES, storedTemplates);
    return this.reviveDatesWithLastUsed(newStoredTemplate);
  }

  static updateTemplate(id: number, data: Partial<InsertBotTemplate>): BotTemplate | undefined {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const index = storedTemplates.findIndex(t => t.id === id);
    
    if (index === -1) return undefined;
    
    const normalizedData = this.normalizeDatesInPartial(data);
    
    const updated: StoredTemplate = {
      ...storedTemplates[index],
      ...normalizedData,
      updatedAt: new Date().toISOString(),
    };
    
    storedTemplates[index] = updated;
    this.safeSetItem(STORAGE_KEYS.TEMPLATES, storedTemplates);
    return this.reviveDatesWithLastUsed(updated);
  }

  static deleteTemplate(id: number): boolean {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const filtered = storedTemplates.filter(t => t.id !== id);
    
    if (filtered.length === storedTemplates.length) return false;
    
    this.safeSetItem(STORAGE_KEYS.TEMPLATES, filtered);
    return true;
  }

  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.safeRemoveItem(key);
    });
  }

  static exportData(): {
    projects: BotProject[];
    tokens: BotToken[];
    templates: BotTemplate[];
  } {
    return {
      projects: this.getProjects(),
      tokens: this.getTokens(),
      templates: this.getTemplates(),
    };
  }

  static importData(data: {
    projects?: BotProject[];
    tokens?: BotToken[];
    templates?: BotTemplate[];
  }): void {
    if (data.projects) {
      const storedProjects: StoredProject[] = data.projects.map(p => {
        const normalized = this.normalizeDatesInPartial(p);
        return {
          ...normalized,
          createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : (p.createdAt || new Date().toISOString()),
          updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : (p.updatedAt || new Date().toISOString()),
        };
      });
      this.safeSetItem(STORAGE_KEYS.PROJECTS, storedProjects);
      this.updateNextIdCounter(data.projects, STORAGE_KEYS.NEXT_PROJECT_ID);
    }
    if (data.tokens) {
      const storedTokens: StoredToken[] = data.tokens.map(t => {
        const normalized = this.normalizeDatesInPartial(t);
        return {
          ...normalized,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : (t.createdAt || new Date().toISOString()),
          updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : (t.updatedAt || new Date().toISOString()),
          lastUsedAt: t.lastUsedAt instanceof Date ? t.lastUsedAt.toISOString() : (t.lastUsedAt || null),
        };
      });
      this.safeSetItem(STORAGE_KEYS.TOKENS, storedTokens);
      this.updateNextIdCounter(data.tokens, STORAGE_KEYS.NEXT_TOKEN_ID);
    }
    if (data.templates) {
      const storedTemplates: StoredTemplate[] = data.templates.map(t => {
        const normalized = this.normalizeDatesInPartial(t);
        return {
          ...normalized,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : (t.createdAt || new Date().toISOString()),
          updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : (t.updatedAt || new Date().toISOString()),
          lastUsedAt: t.lastUsedAt instanceof Date ? t.lastUsedAt.toISOString() : (t.lastUsedAt || null),
        };
      });
      this.safeSetItem(STORAGE_KEYS.TEMPLATES, storedTemplates);
      this.updateNextIdCounter(data.templates, STORAGE_KEYS.NEXT_TEMPLATE_ID);
    }
  }
}
