import { describe, it, expect, beforeEach } from 'vitest';
import { BotStructureTemplate, botStructureTemplate } from '../Templates/BotStructureTemplate';
import { GenerationContext } from '../Core/types';

describe('BotStructureTemplate', () => {
  let template: BotStructureTemplate;
  let mockContext: GenerationContext;

  beforeEach(() => {
    template = new BotStructureTemplate();
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

  describe('getSimpleBotStructure', () => {
    it('должен возвращать структуру простого бота', () => {
      const result = template.getSimpleBotStructure(mockContext);
      
      expect(result).toContain('# Простая структура бота');
      expect(result).toContain('async def main():');
      expect(result).toContain('Запуск простого бота');
      expect(result).toContain('await dp.start_polling(bot)');
      expect(result).toContain('# [HANDLERS_PLACEHOLDER]');
    });

    it('должен включать глобальные переменные', () => {
      const result = template.getSimpleBotStructure(mockContext);
      
      expect(result).toContain('ADMIN_IDS = [123456789]');
    });

    it('должен включать регистрацию middleware без БД', () => {
      const result = template.getSimpleBotStructure(mockContext);
      
      expect(result).toContain('# Регистрация middleware');
      expect(result).not.toContain('message_logging_middleware');
      expect(result).not.toContain('callback_query_logging_middleware');
    });

    it('должен включать установку команд', () => {
      const result = template.getSimpleBotStructure(mockContext);
      
      expect(result).toContain('await bot.set_my_commands(commands)');
      expect(result).toContain('BotCommand(command="start", description="Запустить бота")');
    });
  });

  describe('getDatabaseBotStructure', () => {
    beforeEach(() => {
      mockContext.userDatabaseEnabled = true;
    });

    it('должен возвращать структуру бота с БД', () => {
      const result = template.getDatabaseBotStructure(mockContext);
      
      expect(result).toContain('# Структура бота с базой данных');
      expect(result).toContain('API_BASE_URL = os.getenv');
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "123"))');
      expect(result).toContain('Запуск бота с базой данных');
    });

    it('должен включать middleware для БД', () => {
      const result = template.getDatabaseBotStructure(mockContext);
      
      expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).toContain('dp.callback_query.middleware(callback_query_logging_middleware)');
    });

    it('должен использовать правильный PROJECT_ID', () => {
      mockContext.projectId = 456;
      const result = template.getDatabaseBotStructure(mockContext);
      
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "456"))');
    });

    it('должен обрабатывать null PROJECT_ID', () => {
      mockContext.projectId = null;
      const result = template.getDatabaseBotStructure(mockContext);
      
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "0"))');
    });
  });

  describe('getAdminBotStructure', () => {
    it('должен возвращать структуру админ-бота', () => {
      const result = template.getAdminBotStructure(mockContext);
      
      expect(result).toContain('# Структура бота с админ-панелью');
      expect(result).toContain('SUPER_ADMIN_IDS = [123456789]');
      expect(result).toContain('MODERATOR_IDS = []');
      expect(result).toContain('admin_access_middleware');
      expect(result).toContain('Запуск бота с админ-панелью');
    });

    it('должен включать middleware проверки прав', () => {
      const result = template.getAdminBotStructure(mockContext);
      
      expect(result).toContain('async def admin_access_middleware');
      expect(result).toContain('event.text.startswith(\'/admin\')');
      expect(result).toContain('user_id not in ADMIN_IDS');
      expect(result).toContain('dp.message.middleware(admin_access_middleware)');
    });

    it('должен включать админ команды', () => {
      const result = template.getAdminBotStructure(mockContext);
      
      expect(result).toContain('BotCommand(command="admin", description="Админ-панель")');
    });

    it('должен включать БД middleware когда включена БД', () => {
      mockContext.userDatabaseEnabled = true;
      const result = template.getAdminBotStructure(mockContext);
      
      expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).toContain('dp.callback_query.middleware(callback_query_logging_middleware)');
    });

    it('не должен включать БД middleware когда БД отключена', () => {
      mockContext.userDatabaseEnabled = false;
      const result = template.getAdminBotStructure(mockContext);
      
      expect(result).not.toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).not.toContain('dp.callback_query.middleware(callback_query_logging_middleware)');
    });
  });

  describe('getMediaBotStructure', () => {
    it('должен возвращать структуру медиа-бота', () => {
      const result = template.getMediaBotStructure(mockContext);
      
      expect(result).toContain('# Структура бота с медиа-обработкой');
      expect(result).toContain('MAX_FILE_SIZE = 50 * 1024 * 1024');
      expect(result).toContain('ALLOWED_MEDIA_TYPES = [');
      expect(result).toContain('media_processing_middleware');
      expect(result).toContain('Запуск бота с медиа-обработкой');
    });

    it('должен включать middleware обработки медиа', () => {
      const result = template.getMediaBotStructure(mockContext);
      
      expect(result).toContain('async def media_processing_middleware');
      expect(result).toContain('if event.photo:');
      expect(result).toContain('if event.video:');
      expect(result).toContain('file_size > MAX_FILE_SIZE');
      expect(result).toContain('dp.message.middleware(media_processing_middleware)');
    });

    it('должен включать проверку размера файлов', () => {
      const result = template.getMediaBotStructure(mockContext);
      
      expect(result).toContain('largest_photo = event.photo[-1]');
      expect(result).toContain('getattr(event.video, \'file_size\', None)');
      expect(result).toContain('Файл слишком большой');
    });

    it('должен логировать типы медиа', () => {
      const result = template.getMediaBotStructure(mockContext);
      
      expect(result).toContain('media_type = "unknown"');
      expect(result).toContain('if event.photo: media_type = "photo"');
      expect(result).toContain('elif event.video: media_type = "video"');
      expect(result).toContain('logging.info(f"📎 Получено медиа типа {media_type}');
    });
  });

  describe('getMultiSelectBotStructure', () => {
    it('должен возвращать структуру бота с множественным выбором', () => {
      const result = template.getMultiSelectBotStructure(mockContext);
      
      expect(result).toContain('# Структура бота с множественным выбором');
      expect(result).toContain('user_selections = {}');
      expect(result).toContain('def get_user_selections');
      expect(result).toContain('def add_user_selection');
      expect(result).toContain('Запуск бота с множественным выбором');
    });

    it('должен включать функции управления выбором', () => {
      const result = template.getMultiSelectBotStructure(mockContext);
      
      expect(result).toContain('def get_user_selections(user_id: int, node_id: str) -> list:');
      expect(result).toContain('def add_user_selection(user_id: int, node_id: str, item: str):');
      expect(result).toContain('def remove_user_selection(user_id: int, node_id: str, item: str):');
      expect(result).toContain('def clear_user_selections(user_id: int, node_id: str):');
      expect(result).toContain('def format_user_selections(user_id: int, node_id: str) -> str:');
    });

    it('должен включать логику хранения выборов', () => {
      const result = template.getMultiSelectBotStructure(mockContext);
      
      expect(result).toContain('user_selections.get(user_id, {}).get(node_id, [])');
      expect(result).toContain('if user_id not in user_selections:');
      expect(result).toContain('user_selections[user_id] = {}');
      expect(result).toContain('if item not in user_selections[user_id][node_id]:');
    });

    it('должен включать форматирование выборов', () => {
      const result = template.getMultiSelectBotStructure(mockContext);
      
      expect(result).toContain('if not selections:');
      expect(result).toContain('return "Ничего не выбрано"');
      expect(result).toContain('return "Выбрано: " + ", ".join(selections)');
    });
  });

  describe('getMiddlewareRegistrationTemplate', () => {
    it('должен возвращать базовую регистрацию middleware', () => {
      const result = template.getMiddlewareRegistrationTemplate(false);
      
      expect(result).toContain('# Регистрация middleware');
      expect(result).toContain('async def error_handling_middleware');
      expect(result).toContain('dp.message.middleware(error_handling_middleware)');
      expect(result).toContain('dp.callback_query.middleware(error_handling_middleware)');
    });

    it('должен включать БД middleware когда enableDatabase = true', () => {
      const result = template.getMiddlewareRegistrationTemplate(true);
      
      expect(result).toContain('dp.message.middleware(message_logging_middleware)');
      expect(result).toContain('dp.callback_query.middleware(callback_query_logging_middleware)');
    });

    it('не должен включать БД middleware когда enableDatabase = false', () => {
      const result = template.getMiddlewareRegistrationTemplate(false);
      
      expect(result).not.toContain('message_logging_middleware');
      expect(result).not.toContain('callback_query_logging_middleware');
    });

    it('должен включать обработку ошибок', () => {
      const result = template.getMiddlewareRegistrationTemplate(false);
      
      expect(result).toContain('try:');
      expect(result).toContain('return await handler(event, data)');
      expect(result).toContain('except Exception as e:');
      expect(result).toContain('logging.error(f"❌ Необработанная ошибка: {e}")');
    });
  });

  describe('getHandlerRegistrationTemplate', () => {
    it('должен возвращать шаблон регистрации обработчиков', () => {
      const result = template.getHandlerRegistrationTemplate();
      
      expect(result).toContain('# Регистрация обработчиков');
      expect(result).toContain('@dp.message()');
      expect(result).toContain('async def handle_unknown_message');
      expect(result).toContain('message: types.Message');
    });

    it('должен включать обработчик неизвестных сообщений', () => {
      const result = template.getHandlerRegistrationTemplate();
      
      expect(result).toContain('Извините, я не понимаю это сообщение');
      expect(result).toContain('Используйте /start для начала работы');
      expect(result).toContain('ReplyKeyboardRemove()');
    });

    it('должен включать логирование неизвестных сообщений', () => {
      const result = template.getHandlerRegistrationTemplate();
      
      expect(result).toContain('text = message.text or "[медиа]"');
      expect(result).toContain('logging.info(f"❓ Неизвестное сообщение от {user_id}: {text}")');
    });
  });

  describe('getGlobalVariablesTemplate', () => {
    it('должен возвращать базовые глобальные переменные', () => {
      const result = template.getGlobalVariablesTemplate(mockContext);
      
      expect(result).toContain('# Глобальные переменные');
      expect(result).toContain('ADMIN_IDS = [123456789]');
    });

    it('должен включать API переменные когда БД включена', () => {
      mockContext.userDatabaseEnabled = true;
      const result = template.getGlobalVariablesTemplate(mockContext);
      
      expect(result).toContain('API_BASE_URL = os.getenv');
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "123"))');
    });

    it('не должен включать API переменные когда БД отключена', () => {
      mockContext.userDatabaseEnabled = false;
      const result = template.getGlobalVariablesTemplate(mockContext);
      
      expect(result).not.toContain('API_BASE_URL');
      expect(result).not.toContain('PROJECT_ID');
    });

    it('должен использовать правильный PROJECT_ID', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.projectId = 789;
      const result = template.getGlobalVariablesTemplate(mockContext);
      
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "789"))');
    });

    it('должен обрабатывать null PROJECT_ID', () => {
      mockContext.userDatabaseEnabled = true;
      mockContext.projectId = null;
      const result = template.getGlobalVariablesTemplate(mockContext);
      
      expect(result).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "0"))');
    });
  });

  describe('глобальный экземпляр botStructureTemplate', () => {
    it('должен быть доступен как глобальный экземпляр', () => {
      expect(botStructureTemplate).toBeInstanceOf(BotStructureTemplate);
    });

    it('должен работать с методами', () => {
      const result = botStructureTemplate.getSimpleBotStructure(mockContext);
      expect(result).toContain('# Простая структура бота');
    });
  });
});