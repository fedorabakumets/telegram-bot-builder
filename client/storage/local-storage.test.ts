/** @fileoverview Проверки локального сохранения проектов, токенов и дат. */
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageService } from './local-storage';
import { LOCAL_RECORD_KEYS, scrubLegacyLocalRecords } from './local-storage-credentials';

describe('LocalStorageService', () => {
  beforeEach(() => localStorage.clear());

  it('сохраняет настройки проекта и токена, включая нулевые значения', () => {
    const project = LocalStorageService.saveProject({ name: 'Проект', data: {}, sortOrder: 3, adminIds: '42', sessionId: 'session' });
    expect(project).toMatchObject({ sortOrder: 3, adminIds: '42', sessionId: null });
    const token = LocalStorageService.saveToken({ projectId: project.id, name: 'Бот', token: 'token', catchAllHandlers: 0, autoRestart: 1, userbotApiId: '123', botCanJoinGroups: 0 });
    expect(token).toMatchObject({ catchAllHandlers: 0, autoRestart: 1, userbotApiId: '123', botCanJoinGroups: 0, maxRestartAttempts: 3, trackUserBlocks: 1 });
    expect(LocalStorageService.getToken(token.id)).toMatchObject({ catchAllHandlers: 0, autoRestart: 1, userbotApiId: '123' });
  });

  it('сохраняет даты при обновлении токена и шаблона', () => {
    const token = LocalStorageService.saveToken({ projectId: 1, name: 'Бот', token: 'token' });
    const template = LocalStorageService.saveTemplate({ name: 'Шаблон', data: {} });
    const date = new Date('2024-03-01T12:00:00.000Z');
    expect(LocalStorageService.updateToken(token.id, { lastUsedAt: date })?.lastUsedAt).toEqual(date);
    expect(LocalStorageService.updateTemplate(template.id, { lastUsedAt: date })?.lastUsedAt).toEqual(date);
    expect(LocalStorageService.getToken(token.id)?.lastUsedAt).toEqual(date);
    expect(LocalStorageService.getTemplate(template.id)?.lastUsedAt).toEqual(date);
    expect(LocalStorageService.updateToken(token.id, { lastUsedAt: null })?.lastUsedAt).toBeNull();
  });

  it('сохраняет настройки и даты без учётных данных проекта и бота', () => {
    const project = LocalStorageService.saveProject({ name: 'Проект', data: { apiSecretToken: 'secret-node', text: 'Привет' },
      botToken: 'secret-project', sessionId: 'secret-session' });
    const token = LocalStorageService.saveToken({ projectId: project.id, name: 'Бот', token: 'secret-token',
      webhookSecretToken: 'secret-webhook', userbotApiHash: 'secret-hash', userbotSessionString: 'secret-userbot' });
    LocalStorageService.updateToken(token.id, { token: 'secret-updated', webhookSecretToken: 'secret-other', autoRestart: 1 });

    const copied = LocalStorageService.exportData();
    expect(copied.projects[0].data).toEqual({ text: 'Привет' });
    expect(LocalStorageService.getToken(token.id)).toMatchObject({ token: '', webhookSecretToken: null, autoRestart: 1 });
    expect(localStorage.getItem(LOCAL_RECORD_KEYS.PROJECTS)).not.toContain('secret-');
    expect(localStorage.getItem(LOCAL_RECORD_KEYS.TOKENS)).not.toContain('secret-');
    expect(JSON.stringify(copied)).not.toContain('secret-');
  });

  it('очищает старые копии и импорт, сохраняя безопасные данные', () => {
    const project = LocalStorageService.saveProject({ name: 'Проект', data: {} });
    const token = LocalStorageService.saveToken({ projectId: project.id, name: 'Бот', token: 'secret-token' });
    const template = LocalStorageService.saveTemplate({ name: 'Сценарий', data: {} });
    const saved = LocalStorageService.exportData();
    const imported = {
      projects: [{ ...saved.projects[0], sessionId: 'secret-session' }],
      tokens: [{ ...saved.tokens[0], webhook_secret_token: 'secret-legacy' }],
      templates: [{ ...saved.templates[0], data: { message: 'Текст', invoiceProviderToken: 'secret-payment' } }],
    };
    localStorage.setItem(LOCAL_RECORD_KEYS.PROJECTS, JSON.stringify(imported.projects));
    localStorage.setItem(LOCAL_RECORD_KEYS.TOKENS, JSON.stringify(imported.tokens));
    localStorage.setItem(LOCAL_RECORD_KEYS.TEMPLATES, JSON.stringify(imported.templates));
    localStorage.setItem('unrelated', 'keep');
    scrubLegacyLocalRecords();
    for (const key of Object.values(LOCAL_RECORD_KEYS)) expect(localStorage.getItem(key)).not.toContain('secret-');
    expect(localStorage.getItem('unrelated')).toBe('keep');

    LocalStorageService.importData(imported);
    for (const key of Object.values(LOCAL_RECORD_KEYS)) expect(localStorage.getItem(key)).not.toContain('secret-');
    expect(LocalStorageService.getProject(project.id)?.name).toBe('Проект');
    expect(LocalStorageService.getToken(token.id)?.name).toBe('Бот');
    expect(LocalStorageService.getTemplate(template.id)?.data).toEqual({ message: 'Текст' });
  });
});
