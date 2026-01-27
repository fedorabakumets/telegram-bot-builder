/**
 * Модуль Core - основные компоненты системы генерации кода
 */

// Экспорт типов и интерфейсов
export * from './types';

// Экспорт классов для работы с контекстом генерации
export { 
  GenerationContextBuilder, 
  GenerationContextFactory 
} from './GenerationContext';

// Экспорт основного генератора кода
export { 
  CodeGenerator, 
  CodeGeneratorFactory 
} from './CodeGenerator';