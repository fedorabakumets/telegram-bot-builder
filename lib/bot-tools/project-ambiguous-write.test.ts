/**
 * @fileoverview Проверяет отсутствие автоматического повтора неоднозначной записи проекта.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ writes: 0, invalidations: vi.fn(), executeWithRetry: vi.fn(), revision: 7 }));
vi.mock('../../server/database/DatabaseStorage', () => ({ DatabaseStorage: class {
 /** Имитирует commit и последующий обрыв драйвера. */
 async updateBotProject() { mock.writes++; mock.revision++; throw new Error('connection after commit'); }
 /** Имитирует неоднозначное создание проекта. */
 async createBotProject() { mock.writes++; throw new Error('connection after commit'); }
 /** Имитирует неоднозначное создание шаблона. */
 async createBotTemplate() { mock.writes++; throw new Error('connection after commit'); }
 /** Имитирует неоднозначное изменение шаблона. */
 async updateBotTemplate() { mock.writes++; throw new Error('connection after commit'); }
} }));
vi.mock('../../server/database/db-cache', () => ({ cachedOps: { invalidateProject: mock.invalidations, invalidateAllTemplates: mock.invalidations, invalidateTemplate: mock.invalidations } }));
vi.mock('../../server/database/db-utils', () => ({ dbManager: { executeWithRetry: mock.executeWithRetry } }));
import { EnhancedDatabaseStorage } from '../../server/database/EnhancedDatabaseStorage';
describe('неоднозначная запись storage', () => {
 beforeEach(() => { vi.clearAllMocks(); mock.writes = 0; mock.revision = 7; });
 it('делает одну попытку и сбрасывает cache после committed-then-error', async () => {
  const storage = new EnhancedDatabaseStorage();
  await expect(storage.updateBotProject(1, { data: {} }, 7)).rejects.toThrow('connection after commit');
  expect(mock.writes).toBe(1); expect(mock.revision).toBe(8);
  expect(mock.executeWithRetry).not.toHaveBeenCalled(); expect(mock.invalidations).toHaveBeenCalledWith(1);
 });
 it('не повторяет создание проекта или операции шаблона', async () => {
  const storage = new EnhancedDatabaseStorage();
  await expect(storage.createBotProject({ name: 'Новый', data: {} })).rejects.toThrow('connection after commit');
  await expect(storage.createBotTemplate({ name: 'Шаблон' } as never)).rejects.toThrow('connection after commit');
  await expect(storage.updateBotTemplate(1, { name: 'Изменён' })).rejects.toThrow('connection after commit');
  expect(mock.writes).toBe(3); expect(mock.executeWithRetry).not.toHaveBeenCalled();
 });
});
