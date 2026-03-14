/**
 * @fileoverview Тесты для Zod схем валидации параметров шаблонов
 * Проверяют корректность валидации всех схем параметров
 */

import { describe, it, expect } from 'vitest';
import {
  importsParamsSchema,
  configParamsSchema,
  botParamsSchema,
  headerParamsSchema,
  databaseParamsSchema,
  utilsParamsSchema,
  mainParamsSchema,
} from '../schemas';

describe('Zod схемы валидации', () => {
  describe('importsParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const validParams = {
        userDatabaseEnabled: true,
        hasInlineButtons: false,
        hasAutoTransitions: false,
        hasMediaNodes: true,
        hasUploadImages: false,
      };

      const result = importsParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const emptyParams = {};

      const result = importsParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
        expect(result.data.hasInlineButtons).toBe(false);
      }
    });

    it('должен отклонять невалидные типы', () => {
      const invalidParams = {
        userDatabaseEnabled: 'true',
      };

      const result = importsParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('configParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const validParams = {
        userDatabaseEnabled: true,
        projectId: 123,
      };

      const result = configParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен принимать null projectId', () => {
      const validParams = {
        userDatabaseEnabled: false,
        projectId: null,
      };

      const result = configParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const emptyParams = {};

      const result = configParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
        expect(result.data.projectId).toBe(null);
      }
    });

    it('должен отклонять невалидный projectId', () => {
      const invalidParams = {
        projectId: '123',
      };

      const result = configParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('botParamsSchema', () => {
    it('должен принимать валидные параметры бота', () => {
      const validParams = {
        botName: 'TestBot',
        nodes: [{ name: 'Start', command: '/start' }],
        userDatabaseEnabled: true,
        projectId: 456,
        enableComments: true,
        enableLogging: true,
      };

      const result = botParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const minimalParams = {
        botName: 'TestBot',
        nodes: [],
      };

      const result = botParamsSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
        expect(result.data.enableComments).toBe(true);
        expect(result.data.enableLogging).toBe(true);
      }
    });

    it('должен отклонять пустое имя бота', () => {
      const invalidParams = {
        botName: '',
        nodes: [],
      };

      const result = botParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('должен отклонять невалидные узлы', () => {
      const invalidParams = {
        botName: 'TestBot',
        nodes: [{ name: 123 }],
      };

      const result = botParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('headerParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const validParams = {
        userDatabaseEnabled: true,
        hasInlineButtons: false,
        hasMediaNodes: true,
      };

      const result = headerParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const emptyParams = {};

      const result = headerParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
      }
    });
  });

  describe('databaseParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const validParams = {
        userDatabaseEnabled: true,
      };

      const result = databaseParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const emptyParams = {};

      const result = databaseParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
      }
    });

    it('должен отклонять невалидный тип', () => {
      const invalidParams = {
        userDatabaseEnabled: 'true',
      };

      const result = databaseParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('utilsParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const validParams = {
        userDatabaseEnabled: true,
      };

      const result = utilsParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const emptyParams = {};

      const result = utilsParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
      }
    });
  });

  describe('mainParamsSchema', () => {
    it('должен принимать валидные параметры', () => {
      const validParams = {
        userDatabaseEnabled: true,
      };

      const result = mainParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('должен использовать значения по умолчанию', () => {
      const emptyParams = {};

      const result = mainParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userDatabaseEnabled).toBe(false);
      }
    });

    it('должен отклонять невалидный тип', () => {
      const invalidParams = {
        userDatabaseEnabled: 'yes',
      };

      const result = mainParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});
