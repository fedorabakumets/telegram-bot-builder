/**
 * Unit тесты для PythonCodeGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PythonCodeGenerator } from '../Generators/PythonCodeGenerator';
import { GenerationContext } from '../Core/types';

describe('PythonCodeGenerator', () => {
  let generator: PythonCodeGenerator;
  let mockContext: GenerationContext;

  beforeEach(() => {
    generator = new PythonCodeGenerator();
    mockContext = {
      botData: {} as any,
      botName: 'TestBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: 123,
      enableLogging: true,
      nodes: [],
      connections: [],
      mediaVariablesMap: new Map(),
      allNodeIds: []
    };
  });

  describe('generateBotInitialization', () => {
    it('should generate bot token configuration', () => {
      const result = generator.generateBotInitialization(mockContext);
      
      expect(result).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(result).toContain('# Токен вашего бота (получите у @BotFather)');
    });

    it('should generate logging configuration', () => {
      const result = generator.generateBotInitialization(mockContext);
      
      expect(result).toContain('logging.basicConfig(');
      expect(result).toContain('level=logging.INFO');
      expect(result).toContain('format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"');
      expect(result).toContain('logging.StreamHandler(sys.stdout)');
    });

    it('should generate bot and dispatcher creation', () => {
      const result = generator.generateBotInitialization(mockContext);
      
      expect(result).toContain('bot = Bot(token=BOT_TOKEN)');
      expect(result).toContain('dp = Dispatcher()');
      expect(result).toContain('# Создание бота и диспетчера');
    });
  });

  describe('generateGlobalVariables', () => {
    it('should generate admin IDs configuration', () => {
      const result = generator.generateGlobalVariables(mockContext);
      
      expect(result).toContain('ADMIN_IDS = [123456789]');
      expect(result).toContain('# Список администраторов');
    });

    it('should generate API configuration when database is enabled', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.projectId = 456;
      
      const result = generator.generateGlobalVariables(mockContext);
      
      expect(result).toContain('API_BASE_URL = os.getenv("API_BASE_URL"');
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "456"))');
      expect(result).toContain('# API configuration для сохранения сообщений');
    });

    it('should not generate API configuration when database is disabled', () => {
      mockContext.userDatabaseEnabled = false;
      
      const result = generator.generateGlobalVariables(mockContext);
      
      expect(result).not.toContain('API_BASE_URL');
      expect(result).not.toContain('PROJECT_ID');
    });

    it('should handle null projectId', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.projectId = null;
      
      const result = generator.generateGlobalVariables(mockContext);
      
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "0"))');
    });
  });

  describe('generateUtilityFunctions', () => {
    it('should generate utility helper functions', () => {
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).toContain('async def is_admin(user_id: int) -> bool:');
      expect(result).toContain('return user_id in ADMIN_IDS');
      expect(result).toContain('async def is_private_chat(message: types.Message) -> bool:');
      expect(result).toContain('return message.chat.type == "private"');
    });

    it('should generate save message function when database is enabled', () => {
      mockContext.userDatabaseEnabled = true;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).toContain('async def save_message_to_api(');
      expect(result).toContain('# Функция для сохранения сообщений в базу данных через API');
      expect(result).toContain('api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"');
    });

    it('should generate message logging middleware when database is enabled', () => {
      mockContext.userDatabaseEnabled = true;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).toContain('async def message_logging_middleware(');
      expect(result).toContain('# Middleware для сохранения входящих сообщений');
      expect(result).toContain('"""Middleware для автоматического сохранения входящих сообщений от пользователей"""');
    });

    it('should generate safe_edit_or_send when nodes have inline buttons', () => {
      // Мокаем узлы с inline кнопками
      mockContext.nodes = [
        {
          id: 'test',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Test', action: 'callback' }]
          }
        }
      ] as any;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).toContain('async def safe_edit_or_send(');
      expect(result).toContain('# Safe helper for editing messages with fallback to new message');
      expect(result).toContain('Безопасное редактирование сообщения с fallback на новое сообщение');
    });

    it('should not generate database functions when database is disabled', () => {
      mockContext.userDatabaseEnabled = false;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).not.toContain('save_message_to_api');
      expect(result).not.toContain('message_logging_middleware');
      expect(result).not.toContain('callback_query_logging_middleware');
    });
  });

  describe('conditional generation based on node configuration', () => {
    it('should generate callback query middleware only when inline buttons exist', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'test',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Test', action: 'callback' }]
          }
        }
      ] as any;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).toContain('async def callback_query_logging_middleware(');
      expect(result).toContain('# Middleware для сохранения нажатий на кнопки');
    });

    it('should not generate callback query middleware when no inline buttons', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'test',
          type: 'message',
          data: {
            keyboardType: 'reply',
            buttons: [{ text: 'Test', action: 'message' }]
          }
        }
      ] as any;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).not.toContain('callback_query_logging_middleware');
    });
  });

  describe('integration with database saving', () => {
    it('should include database saving in safe_edit_or_send when database is enabled', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'test',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Test', action: 'callback' }]
          }
        }
      ] as any;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).toContain('# Сохраняем отправленное сообщение в базу данных');
      expect(result).toContain('await save_message_to_api(');
      expect(result).toContain('message_type="bot"');
    });

    it('should not include database saving in safe_edit_or_send when database is disabled', () => {
      mockContext.userDatabaseEnabled = false;
      mockContext.nodes = [
        {
          id: 'test',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Test', action: 'callback' }]
          }
        }
      ] as any;
      
      const result = generator.generateUtilityFunctions(mockContext);
      
      expect(result).not.toContain('# Сохраняем отправленное сообщение в базу данных');
      expect(result).not.toContain('await save_message_to_api(');
    });
  });
});