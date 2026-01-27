import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  pythonTemplates, 
  botStructureTemplate, 
  TemplateUtils, 
  templates 
} from '../Templates';
import { GenerationContext } from '../Core/types';

describe('Templates Integration Tests', () => {
  let mockContext: GenerationContext;

  beforeEach(() => {
    mockContext = {
      botData: {} as any,
      botName: 'IntegrationTestBot',
      groups: [],
      userDatabaseEnabled: true,
      projectId: 999,
      enableLogging: true,
      nodes: [
        {
          id: 'start-node',
          type: 'start',
          data: {
            command: '/start',
            description: 'Запустить бота'
          }
        },
        {
          id: 'help-node',
          type: 'command',
          data: {
            command: '/help',
            description: 'Показать справку'
          }
        }
      ] as any,
      connections: [],
      mediaVariablesMap: new Map(),
      allNodeIds: ['start-node', 'help-node']
    };
    
    TemplateUtils.clearAllCaches();
  });

  afterEach(() => {
    TemplateUtils.clearAllCaches();
  });

  describe('полная генерация бота с БД', () => {
    it('должен генерировать полную структуру бота с базой данных', () => {
      const structure = botStructureTemplate.getDatabaseBotStructure(mockContext);
      
      // Проверяем основные компоненты
      expect(structure).toContain('# Структура бота с базой данных');
      expect(structure).toContain('API_BASE_URL = os.getenv');
      expect(structure).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "999"))');
      expect(structure).toContain('dp.message.middleware(message_logging_middleware)');
      expect(structure).toContain('await dp.start_polling(bot)');
      
      // Проверяем плейсхолдер для обработчиков
      expect(structure).toContain('# [HANDLERS_PLACEHOLDER]');
    });

    it('должен заменять плейсхолдер обработчиков на реальные обработчики', () => {
      let structure = botStructureTemplate.getDatabaseBotStructure(mockContext);
      
      // Генерируем обработчики
      const startHandler = TemplateUtils.replacePlaceholders(
        pythonTemplates.getHandlerTemplate('command'),
        {
          command: 'start',
          response_text: 'Добро пожаловать!'
        }
      );
      
      const helpHandler = TemplateUtils.replacePlaceholders(
        pythonTemplates.getHandlerTemplate('command'),
        {
          command: 'help',
          response_text: 'Справка по боту'
        }
      );
      
      // Заменяем плейсхолдер
      const handlers = startHandler + '\n' + helpHandler;
      structure = structure.replace('# [HANDLERS_PLACEHOLDER]', handlers);
      
      // Проверяем результат
      expect(structure).toContain('@dp.message(Command("start"))');
      expect(structure).toContain('async def handle_start_command');
      expect(structure).toContain('await message.answer("Добро пожаловать!")');
      expect(structure).toContain('@dp.message(Command("help"))');
      expect(structure).toContain('async def handle_help_command');
      expect(structure).toContain('await message.answer("Справка по боту")');
    });
  });

  describe('генерация различных типов ботов', () => {
    it('должен генерировать простого бота без БД', () => {
      mockContext.userDatabaseEnabled = false;
      const structure = botStructureTemplate.getSimpleBotStructure(mockContext);
      
      expect(structure).toContain('# Простая структура бота');
      expect(structure).not.toContain('API_BASE_URL');
      expect(structure).not.toContain('message_logging_middleware');
      expect(structure).toContain('Запуск простого бота');
    });

    it('должен генерировать админ-бота с правильными middleware', () => {
      const structure = botStructureTemplate.getAdminBotStructure(mockContext);
      
      expect(structure).toContain('# Структура бота с админ-панелью');
      expect(structure).toContain('SUPER_ADMIN_IDS = [123456789]');
      expect(structure).toContain('admin_access_middleware');
      expect(structure).toContain('dp.message.middleware(admin_access_middleware)');
      
      // Должен включать БД middleware так как userDatabaseEnabled = true
      expect(structure).toContain('dp.message.middleware(message_logging_middleware)');
    });

    it('должен генерировать медиа-бота с обработкой файлов', () => {
      const structure = botStructureTemplate.getMediaBotStructure(mockContext);
      
      expect(structure).toContain('# Структура бота с медиа-обработкой');
      expect(structure).toContain('MAX_FILE_SIZE = 50 * 1024 * 1024');
      expect(structure).toContain('ALLOWED_MEDIA_TYPES = [');
      expect(structure).toContain('media_processing_middleware');
      expect(structure).toContain('if event.photo:');
      expect(structure).toContain('file_size > MAX_FILE_SIZE');
    });

    it('должен генерировать бота с множественным выбором', () => {
      const structure = botStructureTemplate.getMultiSelectBotStructure(mockContext);
      
      expect(structure).toContain('# Структура бота с множественным выбором');
      expect(structure).toContain('user_selections = {}');
      expect(structure).toContain('def get_user_selections');
      expect(structure).toContain('def add_user_selection');
      expect(structure).toContain('def remove_user_selection');
      expect(structure).toContain('def format_user_selections');
    });
  });

  describe('композиция шаблонов', () => {
    it('должен комбинировать различные шаблоны в полный бот', () => {
      // Начинаем с базовой структуры
      let botCode = pythonTemplates.getEncodingTemplate();
      botCode += pythonTemplates.getImportsTemplate();
      botCode += pythonTemplates.getBotInitTemplate();
      
      // Добавляем глобальные переменные
      botCode += botStructureTemplate.getGlobalVariablesTemplate(mockContext);
      
      // Добавляем утилитарные функции
      botCode += pythonTemplates.getSaveMessageTemplate();
      botCode += pythonTemplates.getMiddlewareTemplate();
      botCode += pythonTemplates.getSafeEditOrSendTemplate();
      botCode += pythonTemplates.getUtilityFunctionsTemplate();
      
      // Добавляем обработчики
      const startHandler = TemplateUtils.replacePlaceholders(
        pythonTemplates.getHandlerTemplate('command'),
        {
          command: 'start',
          response_text: 'Привет! Я бот.'
        }
      );
      botCode += startHandler;
      
      // Добавляем основную функцию
      botCode += pythonTemplates.getMainFunctionTemplate();
      
      // Проверяем, что все компоненты присутствуют
      expect(botCode).toContain('# -*- coding: utf-8 -*-');
      expect(botCode).toContain('from aiogram import Bot, Dispatcher');
      expect(botCode).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(botCode).toContain('API_BASE_URL = os.getenv');
      expect(botCode).toContain('async def save_message_to_api');
      expect(botCode).toContain('async def message_logging_middleware');
      expect(botCode).toContain('async def safe_edit_or_send');
      expect(botCode).toContain('async def is_admin');
      expect(botCode).toContain('@dp.message(Command("start"))');
      expect(botCode).toContain('async def main():');
      expect(botCode).toContain('if __name__ == "__main__":');
    });

    it('должен правильно обрабатывать условную генерацию', () => {
      // Тест с БД
      mockContext.userDatabaseEnabled = true;
      let importsGenerator = new (class {
        generateImports(context: any): string {
          let code = '';
          code += 'import asyncio\n';
          code += 'import logging\n';
          if (context.userDatabaseEnabled) {
            code += 'import asyncpg\n';
          }
          return code;
        }
      })();
      
      let botCodeWithDB = importsGenerator.generateImports(mockContext);
      botCodeWithDB += botStructureTemplate.getGlobalVariablesTemplate(mockContext);
      
      expect(botCodeWithDB).toContain('import asyncpg');
      expect(botCodeWithDB).toContain('API_BASE_URL = os.getenv');
      
      // Тест без БД
      mockContext.userDatabaseEnabled = false;
      let botCodeWithoutDB = importsGenerator.generateImports(mockContext);
      botCodeWithoutDB += botStructureTemplate.getGlobalVariablesTemplate(mockContext);
      
      expect(botCodeWithoutDB).not.toContain('import asyncpg');
      expect(botCodeWithoutDB).not.toContain('API_BASE_URL = os.getenv');
    });
  });

  describe('валидация и извлечение плейсхолдеров', () => {
    it('должен корректно валидировать все шаблоны обработчиков', () => {
      const handlerTypes = ['command', 'callback', 'message', 'media'];
      
      handlerTypes.forEach(type => {
        const template = pythonTemplates.getHandlerTemplate(type);
        const placeholders = TemplateUtils.extractPlaceholders(template);
        
        expect(placeholders.length).toBeGreaterThan(0);
        
        // Каждый тип должен иметь определенные плейсхолдеры
        if (type === 'command') {
          expect(placeholders).toContain('command');
          expect(placeholders).toContain('response_text');
        } else if (type === 'callback') {
          expect(placeholders).toContain('callback_data');
          expect(placeholders).toContain('callback_name');
        }
      });
    });

    it('должен находить отсутствующие плейсхолдеры в пользовательских шаблонах', () => {
      const customTemplate = 'Hello {name}, your command is {command}';
      const required = ['name', 'command', 'missing_placeholder'];
      
      const missing = TemplateUtils.validateTemplate(customTemplate, required);
      expect(missing).toEqual(['missing_placeholder']);
    });
  });

  describe('производительность и кэширование', () => {
    it('должен эффективно кэшировать шаблоны при множественных вызовах', () => {
      const iterations = 100;
      
      // Первый прогон - заполняем кэш
      const startTime1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        pythonTemplates.getEncodingTemplate();
        pythonTemplates.getImportsTemplate();
        pythonTemplates.getBotInitTemplate();
      }
      const endTime1 = performance.now();
      
      // Проверяем, что кэш заполнен
      expect(pythonTemplates.getCacheSize()).toBe(3);
      
      // Второй прогон - используем кэш
      const startTime2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        pythonTemplates.getEncodingTemplate();
        pythonTemplates.getImportsTemplate();
        pythonTemplates.getBotInitTemplate();
      }
      const endTime2 = performance.now();
      
      // Кэшированные вызовы должны быть быстрее
      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;
      
      // Кэшированные вызовы должны быть значительно быстрее
      expect(time2).toBeLessThan(time1);
    });

    it('должен корректно управлять памятью при очистке кэша', () => {
      // Заполняем кэш
      pythonTemplates.getEncodingTemplate();
      pythonTemplates.getImportsTemplate();
      pythonTemplates.getBotInitTemplate();
      pythonTemplates.getMainFunctionTemplate();
      
      expect(pythonTemplates.getCacheSize()).toBe(4);
      
      // Очищаем кэш
      TemplateUtils.clearAllCaches();
      
      expect(pythonTemplates.getCacheSize()).toBe(0);
      
      // Проверяем, что шаблоны все еще работают
      const template = pythonTemplates.getEncodingTemplate();
      expect(template).toContain('# -*- coding: utf-8 -*-');
      expect(pythonTemplates.getCacheSize()).toBe(1);
    });
  });

  describe('глобальный объект templates', () => {
    it('должен предоставлять единый интерфейс для всех шаблонов', () => {
      expect(templates.python).toBe(pythonTemplates);
      expect(templates.structure).toBe(botStructureTemplate);
    });

    it('должен работать через глобальный объект', () => {
      const encoding = templates.python.getEncodingTemplate();
      const structure = templates.structure.getSimpleBotStructure(mockContext);
      
      expect(encoding).toContain('# -*- coding: utf-8 -*-');
      expect(structure).toContain('# Простая структура бота');
    });
  });

  describe('реальные сценарии использования', () => {
    it('должен генерировать рабочий код бота для production', () => {
      // Симулируем реальный сценарий генерации
      const productionContext: GenerationContext = {
        ...mockContext,
        botName: 'ProductionBot',
        userDatabaseEnabled: true,
        projectId: 12345,
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            data: {
              command: '/start',
              description: 'Запустить бота',
              message: 'Добро пожаловать в наш бот!'
            }
          },
          {
            id: 'help-1',
            type: 'command',
            data: {
              command: '/help',
              description: 'Получить помощь',
              message: 'Доступные команды: /start, /help'
            }
          }
        ] as any
      };
      
      // Генерируем полный код бота
      let fullBotCode = '';
      
      // Кодировка и импорты
      fullBotCode += pythonTemplates.getEncodingTemplate();
      fullBotCode += pythonTemplates.getImportsTemplate();
      
      // Инициализация и переменные
      fullBotCode += pythonTemplates.getBotInitTemplate();
      fullBotCode += botStructureTemplate.getGlobalVariablesTemplate(productionContext);
      
      // Утилитарные функции
      fullBotCode += pythonTemplates.getSaveMessageTemplate();
      fullBotCode += pythonTemplates.getMiddlewareTemplate();
      fullBotCode += pythonTemplates.getUtilityFunctionsTemplate();
      
      // Обработчики
      const startHandler = TemplateUtils.replacePlaceholders(
        pythonTemplates.getHandlerTemplate('command'),
        {
          command: 'start',
          response_text: 'Добро пожаловать в наш бот!'
        }
      );
      
      const helpHandler = TemplateUtils.replacePlaceholders(
        pythonTemplates.getHandlerTemplate('command'),
        {
          command: 'help',
          response_text: 'Доступные команды: /start, /help'
        }
      );
      
      fullBotCode += startHandler + helpHandler;
      
      // Основная функция
      fullBotCode += pythonTemplates.getMainFunctionTemplate();
      
      // Проверяем, что код содержит все необходимые элементы
      expect(fullBotCode).toContain('# -*- coding: utf-8 -*-');
      expect(fullBotCode).toContain('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
      expect(fullBotCode).toContain('PROJECT_ID = int(os.getenv("PROJECT_ID", "12345"))');
      expect(fullBotCode).toContain('async def save_message_to_api');
      expect(fullBotCode).toContain('@dp.message(Command("start"))');
      expect(fullBotCode).toContain('@dp.message(Command("help"))');
      expect(fullBotCode).toContain('async def main():');
      expect(fullBotCode).toContain('asyncio.run(main())');
      
      // Проверяем, что код не содержит плейсхолдеров
      expect(fullBotCode).not.toContain('{command}');
      expect(fullBotCode).not.toContain('{response_text}');
      
      // Проверяем синтаксическую корректность (базовые проверки)
      expect(fullBotCode.split('async def').length).toBeGreaterThan(3); // Несколько async функций
      expect(fullBotCode.split('await ').length).toBeGreaterThan(5); // Несколько await вызовов
    });
  });
});