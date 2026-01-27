/**
 * Unit тесты для MainLoopGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MainLoopGenerator } from '../Generators/MainLoopGenerator';
import { GenerationContext } from '../Core/types';
import { BotData, Node } from '../../../../shared/schema';

describe('MainLoopGenerator', () => {
  let generator: MainLoopGenerator;
  let mockContext: GenerationContext;

  beforeEach(() => {
    generator = new MainLoopGenerator();
    
    // Создаем базовый контекст для тестов
    mockContext = {
      botData: {} as BotData,
      botName: 'TestBot',
      groups: [],
      userDatabaseEnabled: false,
      projectId: null,
      enableLogging: false,
      nodes: [],
      connections: [],
      mediaVariablesMap: new Map(),
      allNodeIds: []
    };
  });

  describe('generateMainFunction', () => {
    it('should generate basic main function without database', () => {
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).toContain('async def main():');
      expect(result).toContain('signal.signal(signal.SIGTERM, signal_handler)');
      expect(result).toContain('signal.signal(signal.SIGINT, signal_handler)');
      expect(result).toContain('await dp.start_polling(bot)');
      expect(result).toContain('await bot.session.close()');
      expect(result).not.toContain('global db_pool');
      expect(result).not.toContain('await init_database()');
    });

    it('should generate main function with database support', () => {
      mockContext.userDatabaseEnabled = true;
      
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).toContain('global db_pool');
      expect(result).toContain('await init_database()');
      expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).toContain('if db_pool:');
      expect(result).toContain('await db_pool.close()');
    });

    it('should register callback_query middleware when inline buttons exist', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'test-node',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Test Button', action: 'callback' }]
          }
        } as Node
      ];
      
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).toContain('dp.callback_query.middleware(callback_query_logging_middleware)');
    });

    it('should not register callback_query middleware when no inline buttons', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'test-node',
          type: 'message',
          data: {
            keyboardType: 'reply',
            buttons: [{ text: 'Test Button', action: 'message' }]
          }
        } as Node
      ];
      
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).not.toContain('dp.callback_query.middleware(callback_query_logging_middleware)');
    });
  });

  describe('generateBotStartup', () => {
    it('should generate bot startup code', () => {
      const result = generator.generateBotStartup(mockContext);
      
      expect(result).toContain('print("🤖 Бот запущен и готов к работе!")');
      expect(result).toContain('await dp.start_polling(bot)');
    });
  });

  describe('generateBotShutdown', () => {
    it('should generate basic shutdown code without database', () => {
      const result = generator.generateBotShutdown(mockContext);
      
      expect(result).toContain('finally:');
      expect(result).toContain('await bot.session.close()');
      expect(result).toContain('print("🔌 Сессия бота закрыта")');
      expect(result).toContain('print("✅ Бот корректно завершил работу")');
      expect(result).not.toContain('if db_pool:');
    });

    it('should generate shutdown code with database cleanup', () => {
      mockContext.userDatabaseEnabled = true;
      
      const result = generator.generateBotShutdown(mockContext);
      
      expect(result).toContain('if db_pool:');
      expect(result).toContain('await db_pool.close()');
      expect(result).toContain('print("🔌 Соединение с базой данных закрыто")');
    });
  });

  describe('generateEntryPoint', () => {
    it('should generate correct entry point', () => {
      const result = generator.generateEntryPoint();
      
      expect(result).toContain('if __name__ == "__main__":');
      expect(result).toContain('asyncio.run(main())');
    });
  });

  describe('integration tests', () => {
    it('should generate complete main function structure', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'inline-node',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Inline Button', action: 'callback' }]
          }
        } as Node,
        {
          id: 'reply-node',
          type: 'message',
          data: {
            keyboardType: 'reply',
            buttons: [{ text: 'Reply Button', action: 'message' }]
          }
        } as Node
      ];
      
      const result = generator.generateMainFunction(mockContext);
      
      // Проверяем структуру функции
      expect(result).toMatch(/async def main\(\):/);
      expect(result).toMatch(/global db_pool/);
      expect(result).toMatch(/def signal_handler\(signum, frame\):/);
      expect(result).toMatch(/signal\.signal\(signal\.SIGTERM, signal_handler\)/);
      expect(result).toMatch(/try:/);
      expect(result).toMatch(/await init_database\(\)/);
      expect(result).toMatch(/dp\.message\.middleware\(message_logging_middleware\)/);
      expect(result).toMatch(/dp\.callback_query\.middleware\(callback_query_logging_middleware\)/);
      expect(result).toMatch(/await dp\.start_polling\(bot\)/);
      expect(result).toMatch(/except KeyboardInterrupt:/);
      expect(result).toMatch(/except SystemExit:/);
      expect(result).toMatch(/except Exception as e:/);
      expect(result).toMatch(/finally:/);
      expect(result).toMatch(/await bot\.session\.close\(\)/);
    });

    it('should generate minimal main function for simple bot', () => {
      // Простой бот без базы данных и inline кнопок
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).toContain('async def main():');
      expect(result).not.toContain('global db_pool');
      expect(result).not.toContain('await init_database()');
      expect(result).not.toContain('dp.message.middleware');
      expect(result).not.toContain('dp.callback_query.middleware');
      expect(result).toContain('await dp.start_polling(bot)');
      expect(result).toContain('await bot.session.close()');
    });
  });

  describe('error handling', () => {
    it('should handle empty nodes array', () => {
      mockContext.nodes = [];
      
      expect(() => generator.generateMainFunction(mockContext)).not.toThrow();
    });

    it('should handle null nodes', () => {
      mockContext.nodes = null as any;
      
      expect(() => generator.generateMainFunction(mockContext)).not.toThrow();
    });

    it('should handle undefined context properties gracefully', () => {
      const partialContext = {
        ...mockContext,
        userDatabaseEnabled: undefined as any,
        nodes: undefined as any
      };
      
      expect(() => generator.generateMainFunction(partialContext)).not.toThrow();
    });
  });

  describe('signal handlers', () => {
    it('should include signal handlers in main function', () => {
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).toContain('def signal_handler(signum, frame):');
      expect(result).toContain('signal.signal(signal.SIGTERM, signal_handler)');
      expect(result).toContain('signal.signal(signal.SIGINT, signal_handler)');
      expect(result).toContain('raise KeyboardInterrupt()');
    });
  });

  describe('exception handling', () => {
    it('should include proper exception handling', () => {
      const result = generator.generateMainFunction(mockContext);
      
      expect(result).toContain('except KeyboardInterrupt:');
      expect(result).toContain('except SystemExit:');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('logging.error(f"Критическая ошибка: {e}")');
    });
  });

  describe('handler registration verification', () => {
    it('should generate proper structure for handler registration', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.nodes = [
        {
          id: 'mixed-node',
          type: 'message',
          data: {
            keyboardType: 'inline',
            buttons: [{ text: 'Callback Button', action: 'callback' }]
          }
        } as Node
      ];
      
      const result = generator.generateMainFunction(mockContext);
      
      // Проверяем правильную последовательность операций
      const lines = result.split('\n');
      const initDbIndex = lines.findIndex(line => line.includes('await init_database()'));
      const messageMiddlewareIndex = lines.findIndex(line => line.includes('dp.message.middleware'));
      const callbackMiddlewareIndex = lines.findIndex(line => line.includes('dp.callback_query.middleware'));
      const startPollingIndex = lines.findIndex(line => line.includes('await dp.start_polling(bot)'));
      
      // Проверяем правильный порядок выполнения
      expect(initDbIndex).toBeGreaterThan(-1);
      expect(messageMiddlewareIndex).toBeGreaterThan(initDbIndex);
      expect(callbackMiddlewareIndex).toBeGreaterThan(messageMiddlewareIndex);
      expect(startPollingIndex).toBeGreaterThan(callbackMiddlewareIndex);
    });

    it('should generate correct initialization sequence without database', () => {
      mockContext.userDatabaseEnabled = false;
      
      const result = generator.generateMainFunction(mockContext);
      
      const lines = result.split('\n');
      const startPollingIndex = lines.findIndex(line => line.includes('await dp.start_polling(bot)'));
      
      // Проверяем, что polling запускается даже без базы данных
      expect(startPollingIndex).toBeGreaterThan(-1);
      
      // Проверяем отсутствие инициализации БД и middleware
      expect(result).not.toContain('await init_database()');
      expect(result).not.toContain('dp.message.middleware');
    });
  });
});