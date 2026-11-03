/** @fileoverview Проверки локального сохранения проектов, токенов и дат. */
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageService } from './local-storage';

describe('LocalStorageService', () => {
  beforeEach(() => localStorage.clear());

  it('сохраняет настройки проекта и токена, включая нулевые значения', () => {
    const project = LocalStorageService.saveProject({ name: 'Проект', data: {}, sortOrder: 3, adminIds: '42', sessionId: 'session' });
    expect(project).toMatchObject({ sortOrder: 3, adminIds: '42', sessionId: 'session' });
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
});
