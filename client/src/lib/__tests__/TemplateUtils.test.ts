import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateUtils, templates, pythonTemplates } from '../Templates';

describe('TemplateUtils', () => {
  beforeEach(() => {
    // Очищаем кэши перед каждым тестом
    TemplateUtils.clearAllCaches();
  });

  afterEach(() => {
    // Очищаем кэши после каждого теста
    TemplateUtils.clearAllCaches();
  });

  describe('replacePlaceholders', () => {
    it('должен заменять простые плейсхолдеры', () => {
      const template = 'Hello {name}, welcome to {place}!';
      const replacements = {
        name: 'John',
        place: 'our bot'
      };

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('Hello John, welcome to our bot!');
    });

    it('должен заменять множественные вхождения одного плейсхолдера', () => {
      const template = '{name} said: "Hello {name}!"';
      const replacements = {
        name: 'Alice'
      };

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('Alice said: "Hello Alice!"');
    });

    it('должен игнорировать плейсхолдеры без замены', () => {
      const template = 'Hello {name}, your {age} is not specified';
      const replacements = {
        name: 'Bob'
      };

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('Hello Bob, your {age} is not specified');
    });

    it('должен работать с пустыми заменами', () => {
      const template = 'Hello {name}!';
      const replacements = {};

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('Hello {name}!');
    });

    it('должен работать с пустым шаблоном', () => {
      const template = '';
      const replacements = { name: 'John' };

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('');
    });

    it('должен заменять плейсхолдеры с специальными символами', () => {
      const template = 'Command: {command}, Response: {response_text}';
      const replacements = {
        command: '/start',
        response_text: 'Welcome! Use /help for more info.'
      };

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('Command: /start, Response: Welcome! Use /help for more info.');
    });

    it('должен корректно обрабатывать регулярные выражения в заменах', () => {
      const template = 'Pattern: {pattern}';
      const replacements = {
        pattern: '\\d+\\.\\d+'
      };

      const result = TemplateUtils.replacePlaceholders(template, replacements);
      expect(result).toBe('Pattern: \\d+\\.\\d+');
    });
  });

  describe('clearAllCaches', () => {
    it('должен очищать все кэши шаблонов', () => {
      // Заполняем кэши
      pythonTemplates.getEncodingTemplate();
      pythonTemplates.getImportsTemplate();
      
      expect(pythonTemplates.getCacheSize()).toBeGreaterThan(0);
      
      // Очищаем все кэши
      TemplateUtils.clearAllCaches();
      
      expect(pythonTemplates.getCacheSize()).toBe(0);
    });
  });

  describe('getCacheInfo', () => {
    it('должен возвращать информацию о размерах кэшей', () => {
      const initialInfo = TemplateUtils.getCacheInfo();
      expect(initialInfo).toEqual({ python: 0 });
      
      // Заполняем кэш
      pythonTemplates.getEncodingTemplate();
      pythonTemplates.getImportsTemplate();
      
      const updatedInfo = TemplateUtils.getCacheInfo();
      expect(updatedInfo.python).toBe(2);
    });
  });

  describe('validateTemplate', () => {
    it('должен возвращать пустой массив для валидного шаблона', () => {
      const template = 'Hello {name}, your command is {command}';
      const required = ['name', 'command'];

      const missing = TemplateUtils.validateTemplate(template, required);
      expect(missing).toEqual([]);
    });

    it('должен возвращать отсутствующие плейсхолдеры', () => {
      const template = 'Hello {name}';
      const required = ['name', 'command', 'response'];

      const missing = TemplateUtils.validateTemplate(template, required);
      expect(missing).toEqual(['command', 'response']);
    });

    it('должен работать с пустым списком обязательных плейсхолдеров', () => {
      const template = 'Hello {name}';
      const required: string[] = [];

      const missing = TemplateUtils.validateTemplate(template, required);
      expect(missing).toEqual([]);
    });

    it('должен работать с пустым шаблоном', () => {
      const template = '';
      const required = ['name', 'command'];

      const missing = TemplateUtils.validateTemplate(template, required);
      expect(missing).toEqual(['name', 'command']);
    });

    it('должен корректно обрабатывать плейсхолдеры с подчеркиваниями', () => {
      const template = 'Handler: {handler_name}, Type: {message_type}';
      const required = ['handler_name', 'message_type'];

      const missing = TemplateUtils.validateTemplate(template, required);
      expect(missing).toEqual([]);
    });
  });

  describe('extractPlaceholders', () => {
    it('должен извлекать все плейсхолдеры из шаблона', () => {
      const template = 'Hello {name}, your {age} years old and live in {city}';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual(['name', 'age', 'city']);
    });

    it('должен возвращать уникальные плейсхолдеры', () => {
      const template = '{name} said: "Hello {name}!" to {friend}';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual(['name', 'friend']);
    });

    it('должен возвращать пустой массив для шаблона без плейсхолдеров', () => {
      const template = 'Hello world!';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual([]);
    });

    it('должен работать с пустым шаблоном', () => {
      const template = '';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual([]);
    });

    it('должен извлекать плейсхолдеры с подчеркиваниями и цифрами', () => {
      const template = 'Handler: {handler_name}, ID: {node_id_123}';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual(['handler_name', 'node_id_123']);
    });

    it('должен извлекать плейсхолдеры, игнорируя пустые', () => {
      const template = 'Valid: {name}, Invalid: { space }, Empty: {}';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual(['name', ' space ']);
    });

    it('должен обрабатывать простые случаи с фигурными скобками', () => {
      const template = 'Code: {function_name}';

      const placeholders = TemplateUtils.extractPlaceholders(template);
      expect(placeholders).toEqual(['function_name']);
    });
  });

  describe('интеграция с реальными шаблонами', () => {
    it('должен корректно заменять плейсхолдеры в шаблоне команды', () => {
      const commandTemplate = pythonTemplates.getHandlerTemplate('command');
      const replacements = {
        command: 'help',
        response_text: 'This is help message'
      };

      const result = TemplateUtils.replacePlaceholders(commandTemplate, replacements);
      
      expect(result).toContain('@dp.message(Command("help"))');
      expect(result).toContain('async def handle_help_command');
      expect(result).toContain('await message.answer("This is help message")');
    });

    it('должен извлекать плейсхолдеры из шаблона callback', () => {
      const callbackTemplate = pythonTemplates.getHandlerTemplate('callback');
      const placeholders = TemplateUtils.extractPlaceholders(callbackTemplate);

      expect(placeholders).toContain('callback_data');
      expect(placeholders).toContain('callback_name');
      expect(placeholders).toContain('response_text');
    });

    it('должен валидировать шаблон сообщения', () => {
      const messageTemplate = pythonTemplates.getHandlerTemplate('message');
      const required = ['trigger_text', 'message_name', 'response_text'];

      const missing = TemplateUtils.validateTemplate(messageTemplate, required);
      expect(missing).toEqual([]);
    });
  });
});

describe('templates объект', () => {
  it('должен предоставлять доступ к pythonTemplates', () => {
    expect(templates.python).toBe(pythonTemplates);
  });

  it('должен предоставлять доступ к botStructureTemplate', () => {
    expect(templates.structure).toBeDefined();
    expect(typeof templates.structure.getSimpleBotStructure).toBe('function');
  });
});