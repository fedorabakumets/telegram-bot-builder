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

// Stored types with ISO date strings
type StoredProject = Omit<BotProject, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string };
type StoredToken = Omit<BotToken, 'createdAt' | 'updatedAt' | 'lastUsedAt'> & { createdAt: string; updatedAt: string; lastUsedAt: string | null };
type StoredTemplate = Omit<BotTemplate, 'createdAt' | 'updatedAt' | 'lastUsedAt'> & { createdAt: string; updatedAt: string; lastUsedAt: string | null };

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export class LocalStorageService {
  /**
   * Get storage key (no session prefix for guests - shared storage)
   * This allows all guest tabs to see the same projects
   */
  private static getKey(baseKey: string): string {
    return baseKey;
  }

  private static getNextId(baseKey: string): number {
    if (!isBrowser()) {
      return Date.now();
    }

    const key = this.getKey(baseKey);
    
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

  private static safeGetItem<T>(baseKey: string, defaultValue: T): T {
    if (!isBrowser()) {
      return defaultValue;
    }

    const key = this.getKey(baseKey);
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading from localStorage (${key}):`, e);
      return defaultValue;
    }
  }

  private static safeSetItem(baseKey: string, value: any): void {
    if (!isBrowser()) {
      return;
    }

    const key = this.getKey(baseKey);
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing to localStorage (${key}):`, e);
    }
  }

  private static updateNextIdCounter(items: { id: number }[], baseCounterKey: string): void {
    if (!isBrowser() || items.length === 0) {
      return;
    }
    
    const counterKey = this.getKey(baseCounterKey);
    
    try {
      const maxId = Math.max(...items.map(item => item.id));
      const nextId = String(maxId + 1);
      
      try {
        localStorage.setItem(counterKey, nextId);
      } catch (setError) {
        console.error(`Error persisting counter update (${counterKey}):`, setError);
      }
    } catch (e) {
      console.error(`Error updating ID counter (${counterKey}):`, e);
    }
  }

  private static safeRemoveItem(baseKey: string): void {
    if (!isBrowser()) {
      return;
    }

    const key = this.getKey(baseKey);
    
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from localStorage (${key}):`, e);
    }
  }

  private static reviveProject(stored: StoredProject): BotProject {
    return {
      ...stored,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    };
  }

  private static reviveToken(stored: StoredToken): BotToken {
    return {
      ...stored,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
      lastUsedAt: stored.lastUsedAt ? new Date(stored.lastUsedAt) : null,
    };
  }

  private static reviveTemplate(stored: StoredTemplate): BotTemplate {
    return {
      ...stored,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
      lastUsedAt: stored.lastUsedAt ? new Date(stored.lastUsedAt) : null,
    };
  }

  // Projects
  static getProjects(): BotProject[] {
    const stored = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    return stored.map(p => this.reviveProject(p));
  }

  static getProject(id: number): BotProject | undefined {
    const projects = this.getProjects();
    return projects.find(p => p.id === id);
  }

  static saveProject(data: InsertBotProject): BotProject {
    const storedProjects = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    const now = new Date().toISOString();
    
    const stored: StoredProject = {
      id: this.getNextId(STORAGE_KEYS.NEXT_PROJECT_ID),
      ownerId: null,
      name: data.name,
      description: data.description || null,
      data: data.data,
      botToken: data.botToken || null,
      userDatabaseEnabled: data.userDatabaseEnabled ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    
    storedProjects.push(stored);
    this.safeSetItem(STORAGE_KEYS.PROJECTS, storedProjects);
    return this.reviveProject(stored);
  }

  static updateProject(id: number, data: Partial<InsertBotProject>): BotProject | undefined {
    const storedProjects = this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []);
    const index = storedProjects.findIndex(p => p.id === id);
    
    if (index === -1) return undefined;
    
    const updated: StoredProject = {
      ...storedProjects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    storedProjects[index] = updated;
    this.safeSetItem(STORAGE_KEYS.PROJECTS, storedProjects);
    return this.reviveProject(updated);
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

  // Tokens
  static getTokens(projectId?: number): BotToken[] {
    const stored = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const tokens = stored.map(t => this.reviveToken(t));
    return projectId ? tokens.filter(t => t.projectId === projectId) : tokens;
  }

  static getToken(id: number): BotToken | undefined {
    const tokens = this.getTokens();
    return tokens.find(t => t.id === id);
  }

  static saveToken(data: InsertBotToken): BotToken {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const now = new Date().toISOString();
    
    const stored: StoredToken = {
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
      createdAt: now,
      updatedAt: now,
    };
    
    storedTokens.push(stored);
    this.safeSetItem(STORAGE_KEYS.TOKENS, storedTokens);
    return this.reviveToken(stored);
  }

  static updateToken(id: number, data: Partial<InsertBotToken>): BotToken | undefined {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const index = storedTokens.findIndex(t => t.id === id);
    
    if (index === -1) return undefined;
    
    const updated: StoredToken = {
      ...storedTokens[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    storedTokens[index] = updated;
    this.safeSetItem(STORAGE_KEYS.TOKENS, storedTokens);
    return this.reviveToken(updated);
  }

  static deleteToken(id: number): boolean {
    const storedTokens = this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []);
    const filtered = storedTokens.filter(t => t.id !== id);
    
    if (filtered.length === storedTokens.length) return false;
    
    this.safeSetItem(STORAGE_KEYS.TOKENS, filtered);
    return true;
  }

  // Templates
  static getTemplates(): BotTemplate[] {
    const stored = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    return stored.map(t => this.reviveTemplate(t));
  }

  static getTemplate(id: number): BotTemplate | undefined {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id);
  }

  static saveTemplate(data: InsertBotTemplate): BotTemplate {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const now = new Date().toISOString();
    
    const stored: StoredTemplate = {
      id: this.getNextId(STORAGE_KEYS.NEXT_TEMPLATE_ID),
      ownerId: null,
      name: data.name,
      description: data.description || null,
      data: data.data,
      category: (data.category || "custom") as BotTemplate['category'],
      tags: data.tags || null,
      isPublic: data.isPublic ?? 0,
      difficulty: (data.difficulty || "easy") as BotTemplate['difficulty'],
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
      language: (data.language || "ru") as BotTemplate['language'],
      requiresToken: data.requiresToken ?? 0,
      complexity: data.complexity ?? 1,
      estimatedTime: data.estimatedTime ?? 5,
      createdAt: now,
      updatedAt: now,
    };
    
    storedTemplates.push(stored);
    this.safeSetItem(STORAGE_KEYS.TEMPLATES, storedTemplates);
    return this.reviveTemplate(stored);
  }

  static updateTemplate(id: number, data: Partial<InsertBotTemplate>): BotTemplate | undefined {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const index = storedTemplates.findIndex(t => t.id === id);
    
    if (index === -1) return undefined;
    
    const updated: StoredTemplate = {
      ...storedTemplates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    storedTemplates[index] = updated;
    this.safeSetItem(STORAGE_KEYS.TEMPLATES, storedTemplates);
    return this.reviveTemplate(updated);
  }

  static deleteTemplate(id: number): boolean {
    const storedTemplates = this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const filtered = storedTemplates.filter(t => t.id !== id);
    
    if (filtered.length === storedTemplates.length) return false;
    
    this.safeSetItem(STORAGE_KEYS.TEMPLATES, filtered);
    return true;
  }

  // Utilities
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.safeRemoveItem(key);
    });
  }

  static exportData(): {
    projects: StoredProject[];
    tokens: StoredToken[];
    templates: StoredTemplate[];
  } {
    return {
      projects: this.safeGetItem<StoredProject[]>(STORAGE_KEYS.PROJECTS, []),
      tokens: this.safeGetItem<StoredToken[]>(STORAGE_KEYS.TOKENS, []),
      templates: this.safeGetItem<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []),
    };
  }

  static importData(data: {
    projects?: StoredProject[];
    tokens?: StoredToken[];
    templates?: StoredTemplate[];
  }): void {
    if (data.projects) {
      this.safeSetItem(STORAGE_KEYS.PROJECTS, data.projects);
      this.updateNextIdCounter(data.projects, STORAGE_KEYS.NEXT_PROJECT_ID);
    }
    if (data.tokens) {
      this.safeSetItem(STORAGE_KEYS.TOKENS, data.tokens);
      this.updateNextIdCounter(data.tokens, STORAGE_KEYS.NEXT_TOKEN_ID);
    }
    if (data.templates) {
      this.safeSetItem(STORAGE_KEYS.TEMPLATES, data.templates);
      this.updateNextIdCounter(data.templates, STORAGE_KEYS.NEXT_TEMPLATE_ID);
    }
  }
}
