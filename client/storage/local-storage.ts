/** @fileoverview Локальное хранение проектов, токенов и шаблонов. */
import type { 
  BotProject, 
  BotToken, 
  BotTemplate,
  InsertBotProject,
  InsertBotToken,
  InsertBotTemplate 
} from "@shared/schema";
import { botSettingsToInheritOnCreate } from "@shared/bot-setting-inheritance-on-create";
import { LOCAL_RECORD_KEYS, readLocalRecord, serializeLocalRecord } from './local-storage-credentials';

const STORAGE_KEYS = {
  ...LOCAL_RECORD_KEYS,
  NEXT_PROJECT_ID: 'botcraft_next_project_id',
  NEXT_TOKEN_ID: 'botcraft_next_token_id',
  NEXT_TEMPLATE_ID: 'botcraft_next_template_id',
} as const;

// Stored types with ISO date strings
type StoredProject = Omit<
  BotProject,
  | 'createdAt'
  | 'updatedAt'
  | 'botToken'
  | 'sessionId'
  | 'restartOnUpdate'
  | 'lastExportedAt'
  | 'lastExportedStructureAt'
  | 'lastExportedGoogleSheetId'
  | 'lastExportedGoogleSheetUrl'
  | 'lastExportedStructureSheetId'
  | 'lastExportedStructureSheetUrl'
> & {
  createdAt: string;
  updatedAt: string;
  restartOnUpdate?: boolean;
};
/** Метаданные токена без его учётных данных и секретов. */
type StoredToken = Omit<BotToken, 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'ownerId' | 'token'
  | 'webhookSecretToken' | 'userbotApiHash' | 'userbotSessionString'> & {
  /** Дата создания в формате ISO. */ createdAt: string;
  /** Дата обновления в формате ISO. */ updatedAt: string;
  /** Дата последнего использования в формате ISO, если она есть. */ lastUsedAt: string | null;
  /** Владелец записи. */ ownerId: number | null;
};
type StoredTemplate = Omit<BotTemplate, 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'ownerId'> & { createdAt: string; updatedAt: string; lastUsedAt: string | null; ownerId: number | null };

// Define partial versions for updates
type PartialStoredProject = Partial<Pick<StoredProject, 'name' | 'description' | 'data' | 'userDatabaseEnabled' | 'ownerId' | 'restartOnUpdate'>>;

/** Преобразует дату записи в формат JSON, сохраняя отсутствие значения. */
function serializeDate(value: Date | string | null | undefined): string | null | undefined {
  return value instanceof Date ? value.toISOString() : value;
}

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
      return readLocalRecord(localStorage, key, defaultValue);
    } catch (e) {
      console.error(`Error reading from localStorage (${key}):`, e);
      return defaultValue;
    }
  }

  private static safeSetItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, serializeLocalRecord(value));
    } catch (e) {
      console.error(`Error writing to localStorage (${key}):`, e);
    }
  }

  private static updateNextIdCounter(items: { id: number }[], counterKey: string): void {
    if (items.length === 0) return;
    
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

  private static safeRemoveItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from localStorage (${key}):`, e);
    }
  }

  private static reviveProject(stored: StoredProject): BotProject {
    return {
      ...stored,
      /** Локальная копия проекта не является источником учётных данных. */
      botToken: null,
      sessionId: null,
      /** Ревизия старых локальных проектов до её появления в схеме. */
      revision: stored.revision ?? 0,
      /** Значения старых локальных проектов до появления наследуемых настроек. */
      defaultLaunchMode: stored.defaultLaunchMode ?? 'polling',
      defaultSleepMode: stored.defaultSleepMode ?? null,
      defaultAutoRestart: stored.defaultAutoRestart ?? 0,
      defaultMaxRestartAttempts: stored.defaultMaxRestartAttempts ?? 3,
      /** Старые локальные проекты используют стандартные значения. */
      botSettingDefaults: stored.botSettingDefaults ?? {},
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
      lastExportedAt: null,
      lastExportedGoogleSheetId: null,
      lastExportedGoogleSheetUrl: null,
      lastExportedStructureAt: null,
      lastExportedStructureSheetId: null,
      lastExportedStructureSheetUrl: null,
    };
  }

  private static reviveToken(stored: StoredToken): BotToken {
    return {
      ...stored,
      /** Локальная запись восстанавливает метаданные без учётных данных. */
      token: '',
      webhookSecretToken: null,
      userbotApiHash: null,
      userbotSessionString: null,
      /** Старые локальные токены сохраняют индивидуальные настройки. */
      inheritLaunchMode: stored.inheritLaunchMode ?? false,
      inheritSleepMode: stored.inheritSleepMode ?? false,
      inheritAutoRestart: stored.inheritAutoRestart ?? false,
      inheritMaxRestartAttempts: stored.inheritMaxRestartAttempts ?? false,
      /** Старые записи сохраняют индивидуальные значения дополнительных настроек. */
      inheritBotSettings: stored.inheritBotSettings ?? [],
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
      /** Начальная ревизия нового локального проекта. */
      revision: data.revision ?? 0,
      ownerId: null,
      name: data.name,
      description: data.description || null,
      data: data.data,
      userDatabaseEnabled: data.userDatabaseEnabled ?? 1,
      /** Наследуемые настройки нового локального проекта. */
      defaultLaunchMode: data.defaultLaunchMode ?? 'polling',
      defaultSleepMode: data.defaultSleepMode ?? null,
      defaultAutoRestart: data.defaultAutoRestart ?? 0,
      defaultMaxRestartAttempts: data.defaultMaxRestartAttempts ?? 3,
      /** Переопределения общих настроек нового проекта. */
      botSettingDefaults: data.botSettingDefaults ?? {},
      sortOrder: data.sortOrder ?? 0,
      adminIds: data.adminIds ?? '',
      createdAt: now,
      updatedAt: now,
    };

    storedProjects.push(stored);
    this.safeSetItem(STORAGE_KEYS.PROJECTS, storedProjects);
    return this.reviveProject(stored);
  }

  static updateProject(id: number, data: PartialStoredProject): BotProject | undefined {
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
      isDefault: data.isDefault ?? 0,
      isActive: data.isActive ?? 1,
      /** Новый локальный токен ещё не имеет подтверждённого отказа Telegram. */
      authorizationError: null,
      description: data.description || null,
      botFirstName: data.botFirstName || null,
      botUsername: data.botUsername || null,
      botDescription: data.botDescription || null,
      botShortDescription: data.botShortDescription || null,
      botPhotoUrl: data.botPhotoUrl || null,
      botCanJoinGroups: data.botCanJoinGroups ?? null,
      botCanReadAllGroupMessages: data.botCanReadAllGroupMessages ?? null,
      botSupportsInlineQueries: data.botSupportsInlineQueries ?? null,
      botHasMainWebApp: data.botHasMainWebApp ?? null,
      lastUsedAt: null,
      trackExecutionTime: data.trackExecutionTime ?? 0,
      totalExecutionSeconds: data.totalExecutionSeconds ?? 0,
      autoRestart: data.autoRestart ?? 0,
      maxRestartAttempts: data.maxRestartAttempts ?? 3,
      logLevel: data.logLevel ?? 'DEBUG',
      protectContent: data.protectContent ?? 0,
      saveIncomingMedia: data.saveIncomingMedia ?? 0,
      messagesRetentionDays: data.messagesRetentionDays ?? 0,
      catchAllHandlers: data.catchAllHandlers ?? 1,
      trackUserBlocks: data.trackUserBlocks ?? 1,
      trackGroupMembership: data.trackGroupMembership ?? 1,
      contentCache: data.contentCache ?? 0,
      launchMode: data.launchMode ?? 'polling',
      /** Новый локальный токен наследует настройки без явных переопределений. */
      inheritLaunchMode: data.inheritLaunchMode ?? (data.launchMode == null),
      inheritSleepMode: data.inheritSleepMode ?? true,
      inheritAutoRestart: data.inheritAutoRestart ?? (data.autoRestart == null),
      inheritMaxRestartAttempts: data.inheritMaxRestartAttempts ?? (data.maxRestartAttempts == null),
      /** Сохраняем только разрешённые ключи наследуемых настроек. */
      inheritBotSettings: botSettingsToInheritOnCreate(data, data.inheritBotSettings),
      webhookBaseUrl: data.webhookBaseUrl ?? null,
      userbotEnabled: data.userbotEnabled ?? 0,
      userbotApiId: data.userbotApiId ?? null,
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
      createdAt: serializeDate(data.createdAt) ?? storedTokens[index].createdAt,
      lastUsedAt: data.lastUsedAt === undefined ? storedTokens[index].lastUsedAt : serializeDate(data.lastUsedAt) ?? null,
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
      createdAt: serializeDate(data.createdAt) ?? storedTemplates[index].createdAt,
      lastUsedAt: data.lastUsedAt === undefined ? storedTemplates[index].lastUsedAt : serializeDate(data.lastUsedAt) ?? null,
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
