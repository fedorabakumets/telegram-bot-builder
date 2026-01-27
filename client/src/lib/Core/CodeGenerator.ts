/**
 * Главный оркестратор процесса генерации кода
 */

import {
  GenerationContext,
  GenerationResult,
  GenerationError,
  GenerationErrorType,
  ICodeGenerator,
  IImportsGenerator,
  IPythonCodeGenerator,
  IHandlerGenerator,
  IMainLoopGenerator
} from './types';

/**
 * Основной класс для генерации кода ботов
 * Использует dependency injection для композиции различных генераторов
 */
export class CodeGenerator implements ICodeGenerator {
  private readonly importsGenerator: IImportsGenerator;
  private readonly pythonCodeGenerator: IPythonCodeGenerator;
  private readonly handlerGenerator: IHandlerGenerator;
  private readonly mainLoopGenerator: IMainLoopGenerator;

  constructor(
    importsGenerator: IImportsGenerator,
    pythonCodeGenerator: IPythonCodeGenerator,
    handlerGenerator: IHandlerGenerator,
    mainLoopGenerator: IMainLoopGenerator
  ) {
    this.importsGenerator = importsGenerator;
    this.pythonCodeGenerator = pythonCodeGenerator;
    this.handlerGenerator = handlerGenerator;
    this.mainLoopGenerator = mainLoopGenerator;
  }

  /**
   * Генерирует полный код бота
   */
  generate(context: GenerationContext): GenerationResult {
    const startTime = performance.now();
    const errors: GenerationError[] = [];
    const warnings: string[] = [];
    let generatedCode = '';

    try {
      // Валидация контекста
      const validationErrors = this.validateContext(context);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors.map(e => e.message)
        };
      }

      this.log('Начинаем генерацию кода для бота:', context.botName);

      // 1. Генерация импортов и настройки кодировки
      try {
        const imports = this.importsGenerator.generateImports(context);
        const encoding = this.importsGenerator.generateEncodingSetup();
        generatedCode += encoding + '\n' + imports + '\n\n';
        this.log('✓ Импорты сгенерированы');
      } catch (error) {
        errors.push(this.createError(
          GenerationErrorType.IMPORT_ERROR,
          'Ошибка генерации импортов',
          'ImportsGenerator',
          error
        ));
      }

      // 2. Генерация базовой структуры Python кода
      try {
        const botInit = this.pythonCodeGenerator.generateBotInitialization(context);
        const globalVars = this.pythonCodeGenerator.generateGlobalVariables(context);
        const utilityFunctions = this.pythonCodeGenerator.generateUtilityFunctions(context);
        
        generatedCode += globalVars + '\n\n';
        generatedCode += botInit + '\n\n';
        generatedCode += utilityFunctions + '\n\n';
        this.log('✓ Базовая структура сгенерирована');
      } catch (error) {
        errors.push(this.createError(
          GenerationErrorType.HANDLER_GENERATION_ERROR,
          'Ошибка генерации базовой структуры',
          'PythonCodeGenerator',
          error
        ));
      }

      // 3. Генерация обработчиков
      try {
        const messageHandlers = this.handlerGenerator.generateMessageHandlers(context);
        const callbackHandlers = this.handlerGenerator.generateCallbackHandlers(context);
        const multiSelectHandlers = this.handlerGenerator.generateMultiSelectHandlers(context);
        const mediaHandlers = this.handlerGenerator.generateMediaHandlers(context);
        
        generatedCode += messageHandlers + '\n\n';
        generatedCode += callbackHandlers + '\n\n';
        generatedCode += multiSelectHandlers + '\n\n';
        generatedCode += mediaHandlers + '\n\n';
        this.log('✓ Обработчики сгенерированы');
      } catch (error) {
        errors.push(this.createError(
          GenerationErrorType.HANDLER_GENERATION_ERROR,
          'Ошибка генерации обработчиков',
          'HandlerGenerator',
          error
        ));
      }

      // 4. Генерация основного цикла
      try {
        const mainFunction = this.mainLoopGenerator.generateMainFunction(context);
        const botStartup = this.mainLoopGenerator.generateBotStartup(context);
        
        generatedCode += mainFunction + '\n\n';
        generatedCode += botStartup + '\n';
        this.log('✓ Основной цикл сгенерирован');
      } catch (error) {
        errors.push(this.createError(
          GenerationErrorType.HANDLER_GENERATION_ERROR,
          'Ошибка генерации основного цикла',
          'MainLoopGenerator',
          error
        ));
      }

      // 5. Генерация команд для BotFather (если нужно)
      try {
        const botFatherCommands = this.importsGenerator.generateBotFatherCommands(context.nodes);
        if (botFatherCommands.trim()) {
          generatedCode += '\n# Команды для BotFather:\n' + botFatherCommands + '\n';
        }
      } catch (error) {
        warnings.push('Не удалось сгенерировать команды для BotFather: ' + error);
      }

      const endTime = performance.now();
      const generationTime = endTime - startTime;

      // Подсчет метрик
      const linesGenerated = generatedCode.split('\n').length;
      const handlersCount = this.countHandlers(generatedCode);
      const nodesProcessed = context.nodes.length;

      this.log(`✓ Генерация завершена за ${generationTime.toFixed(2)}ms`);
      this.log(`  Строк кода: ${linesGenerated}`);
      this.log(`  Обработчиков: ${handlersCount}`);
      this.log(`  Узлов обработано: ${nodesProcessed}`);

      return {
        success: errors.length === 0,
        code: generatedCode,
        errors: errors.map(e => e.message),
        warnings,
        metadata: {
          linesGenerated,
          handlersCount,
          nodesProcessed
        }
      };

    } catch (error) {
      const unexpectedError = this.createError(
        GenerationErrorType.UNKNOWN_ERROR,
        'Неожиданная ошибка при генерации кода',
        'CodeGenerator',
        error
      );

      return {
        success: false,
        errors: [unexpectedError.message],
        warnings
      };
    }
  }

  /**
   * Валидирует контекст перед генерацией
   */
  private validateContext(context: GenerationContext): GenerationError[] {
    const errors: GenerationError[] = [];

    if (!context) {
      errors.push(this.createError(
        GenerationErrorType.VALIDATION_ERROR,
        'Контекст генерации не предоставлен',
        'CodeGenerator'
      ));
      return errors;
    }

    if (!context.botName || context.botName.trim() === '') {
      errors.push(this.createError(
        GenerationErrorType.VALIDATION_ERROR,
        'Имя бота не может быть пустым',
        'CodeGenerator'
      ));
    }

    if (!context.nodes || context.nodes.length === 0) {
      errors.push(this.createError(
        GenerationErrorType.VALIDATION_ERROR,
        'Бот должен содержать хотя бы один узел',
        'CodeGenerator'
      ));
    }

    // Проверяем наличие стартового узла
    const hasStartNode = context.nodes?.some(node => node.type === 'start');
    if (!hasStartNode) {
      errors.push(this.createError(
        GenerationErrorType.VALIDATION_ERROR,
        'Бот должен содержать стартовый узел',
        'CodeGenerator'
      ));
    }

    return errors;
  }

  /**
   * Создает объект ошибки
   */
  private createError(
    type: GenerationErrorType,
    message: string,
    module: string,
    context?: any
  ): GenerationError {
    return {
      type,
      message,
      module,
      context
    };
  }

  /**
   * Подсчитывает количество обработчиков в сгенерированном коде
   */
  private countHandlers(code: string): number {
    // Ищем функции-обработчики (async def handle_)
    const handlerMatches = code.match(/async def handle_\w+/g);
    return handlerMatches ? handlerMatches.length : 0;
  }

  /**
   * Логирование (если включено в контексте)
   */
  private log(...args: any[]): void {
    // В будущем можно добавить проверку на enableLogging из контекста
    console.log('[CodeGenerator]', ...args);
  }
}

/**
 * Фабрика для создания CodeGenerator с заглушками
 * Используется для тестирования до создания реальных генераторов
 */
export class CodeGeneratorFactory {
  /**
   * Создает CodeGenerator с заглушками для тестирования
   */
  static createWithMocks(): CodeGenerator {
    const mockImportsGenerator: IImportsGenerator = {
      generateImports: () => '# Mock imports',
      generateEncodingSetup: () => '# -*- coding: utf-8 -*-',
      generateBotFatherCommands: () => '# Mock BotFather commands'
    };

    const mockPythonCodeGenerator: IPythonCodeGenerator = {
      generateBotInitialization: () => '# Mock bot initialization',
      generateGlobalVariables: () => '# Mock global variables',
      generateUtilityFunctions: () => '# Mock utility functions'
    };

    const mockHandlerGenerator: IHandlerGenerator = {
      generateMessageHandlers: () => '# Mock message handlers',
      generateCallbackHandlers: () => '# Mock callback handlers',
      generateMultiSelectHandlers: () => '# Mock multiselect handlers',
      generateMediaHandlers: () => '# Mock media handlers'
    };

    const mockMainLoopGenerator: IMainLoopGenerator = {
      generateMainFunction: () => '# Mock main function',
      generateBotStartup: () => '# Mock bot startup',
      generateBotShutdown: () => '# Mock bot shutdown'
    };

    return new CodeGenerator(
      mockImportsGenerator,
      mockPythonCodeGenerator,
      mockHandlerGenerator,
      mockMainLoopGenerator
    );
  }
}