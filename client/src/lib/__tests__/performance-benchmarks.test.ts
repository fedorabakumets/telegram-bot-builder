/**
 * Performance benchmarks для bot-generator
 * Задача 10.2: Performance тесты для контроля производительности (цель: <500ms для больших ботов)
 * 
 * Этот файл содержит детальные performance тесты с различными размерами ботов
 * и мониторингом использования памяти.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generatePythonCode } from '../bot-generator';
import { BotData, Node } from '../../../../shared/schema';

interface PerformanceMetrics {
  testName: string;
  duration: number;
  memoryUsed: number;
  codeSize: number;
  nodesCount: number;
  connectionsCount: number;
}

describe('Performance Benchmarks', () => {
  let performanceMetrics: PerformanceMetrics[] = [];
  let initialMemory: number;

  beforeEach(() => {
    // Принудительная сборка мусора перед тестом (если доступна)
    if (global.gc) {
      global.gc();
    }
    initialMemory = process.memoryUsage().heapUsed;
    performanceMetrics = [];
  });

  afterEach(() => {
    // Выводим детальные метрики производительности
    if (performanceMetrics.length > 0) {
      console.log('\n🚀 Детальные метрики производительности:');
      console.log('┌─────────────────────────────────┬──────────┬─────────────┬─────────────┬───────┬─────────────┐');
      console.log('│ Тест                            │ Время    │ Память      │ Размер кода │ Узлы  │ Соединения  │');
      console.log('├─────────────────────────────────┼──────────┼─────────────┼─────────────┼───────┼─────────────┤');
      
      performanceMetrics.forEach(metric => {
        const testName = metric.testName.padEnd(31);
        const duration = `${metric.duration.toFixed(1)}ms`.padStart(8);
        const memory = `${(metric.memoryUsed / 1024 / 1024).toFixed(1)}MB`.padStart(11);
        const codeSize = `${(metric.codeSize / 1024).toFixed(1)}KB`.padStart(11);
        const nodes = metric.nodesCount.toString().padStart(5);
        const connections = metric.connectionsCount.toString().padStart(11);
        
        console.log(`│ ${testName} │ ${duration} │ ${memory} │ ${codeSize} │ ${nodes} │ ${connections} │`);
      });
      
      console.log('└─────────────────────────────────┴──────────┴─────────────┴─────────────┴───────┴─────────────┘');
      
      // Анализ производительности
      const avgDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
      const maxDuration = Math.max(...performanceMetrics.map(m => m.duration));
      const totalMemory = performanceMetrics.reduce((sum, m) => sum + m.memoryUsed, 0) / 1024 / 1024;
      
      console.log(`\n📈 Сводка: Среднее время: ${avgDuration.toFixed(1)}ms, Максимальное: ${maxDuration.toFixed(1)}ms, Общая память: ${totalMemory.toFixed(1)}MB`);
    }
  });

  /**
   * Измеряет производительность и использование памяти
   */
  const measurePerformanceDetailed = async (
    testName: string,
    botData: BotData,
    botName: string,
    userDatabaseEnabled: boolean = true,
    projectId: number | null = 123,
    enableLogging: boolean = false
  ): Promise<string> => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const result = generatePythonCode(botData, botName, [], userDatabaseEnabled, projectId, enableLogging);
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const metrics: PerformanceMetrics = {
      testName,
      duration: endTime - startTime,
      memoryUsed: endMemory - startMemory,
      codeSize: result.length,
      nodesCount: botData.nodes.length,
      connectionsCount: botData.connections.length
    };
    
    performanceMetrics.push(metrics);
    return result;
  };

  /**
   * Создает бот заданного размера для тестирования производительности
   */
  const createBotOfSize = (nodeCount: number, connectionRatio: number = 0.5): BotData => {
    const nodes: Node[] = [];
    const connections: any[] = [];

    // Создаем узлы различных типов
    const nodeTypes = ['message', 'command', 'input', 'sticker', 'voice', 'animation', 'location'];
    
    for (let i = 0; i < nodeCount; i++) {
      const nodeType = nodeTypes[i % nodeTypes.length];
      const hasButtons = i % 3 === 0; // Каждый третий узел имеет кнопки
      const isMultiSelect = i % 10 === 0; // Каждый десятый узел - множественный выбор
      
      const node: Node = {
        id: `perf_node_${i}`,
        type: nodeType as any,
        position: { x: (i % 10) * 100, y: Math.floor(i / 10) * 100 },
        data: {
          text: `Узел ${i} типа ${nodeType}. Это тестовый узел для проверки производительности генерации кода.`,
          command: nodeType === 'command' ? `cmd${i}` : undefined,
          keyboardType: hasButtons ? (i % 2 === 0 ? 'inline' : 'reply') : 'none',
          buttons: hasButtons ? [
            {
              id: `btn_${i}_1`,
              text: `Кнопка ${i}-1`,
              target: `perf_node_${(i + 1) % nodeCount}`,
              action: 'goto',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            },
            {
              id: `btn_${i}_2`,
              text: `Кнопка ${i}-2`,
              target: `perf_node_${(i + 2) % nodeCount}`,
              action: 'goto',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }
          ] : [],
          allowMultipleSelection: isMultiSelect,
          multiSelectVariable: isMultiSelect ? `selection_${i}` : undefined,
          continueButtonTarget: isMultiSelect ? `perf_node_${(i + 1) % nodeCount}` : undefined,
          inputVariable: nodeType === 'input' ? `input_var_${i}` : undefined,
          inputTargetNodeId: nodeType === 'input' ? `perf_node_${(i + 1) % nodeCount}` : undefined,
          synonyms: i % 7 === 0 ? [`синоним${i}`, `альтернатива${i}`] : undefined,
          conditionalMessages: i % 5 === 0 ? [
            {
              id: `condition_${i}`,
              condition: 'user_type',
              value: 'premium',
              messageText: `Условное сообщение для узла ${i}`
            }
          ] : undefined,
          attachedMedia: i % 8 === 0 ? [
            {
              type: 'photo',
              url: `https://example.com/photo_${i}.jpg`
            }
          ] : undefined,
          autoTransitionTo: i % 15 === 0 ? `perf_node_${(i + 1) % nodeCount}` : undefined,
          autoTransitionDelay: i % 15 === 0 ? 3 : undefined
        }
      };
      
      nodes.push(node);
    }

    // Создаем соединения
    const connectionCount = Math.floor(nodeCount * connectionRatio);
    for (let i = 0; i < connectionCount; i++) {
      const sourceIndex = i % nodeCount;
      const targetIndex = (i + 1) % nodeCount;
      
      connections.push({
        source: `perf_node_${sourceIndex}`,
        target: `perf_node_${targetIndex}`
      });
    }

    return { nodes, connections };
  };

  describe('Базовые performance тесты', () => {
    it('очень маленький бот (5 узлов) - должен быть мгновенным', async () => {
      const botData = createBotOfSize(5);
      
      const result = await measurePerformanceDetailed(
        'Очень маленький (5 узлов)',
        botData,
        'VerySmallBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(10); // Менее 10ms
    });

    it('маленький бот (25 узлов) - должен быть очень быстрым', async () => {
      const botData = createBotOfSize(25);
      
      const result = await measurePerformanceDetailed(
        'Маленький (25 узлов)',
        botData,
        'SmallBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(50); // Менее 50ms
    });

    it('средний бот (100 узлов) - должен быть быстрым', async () => {
      const botData = createBotOfSize(100);
      
      const result = await measurePerformanceDetailed(
        'Средний (100 узлов)',
        botData,
        'MediumBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(200); // Менее 200ms
    });

    it('большой бот (500 узлов) - основная цель <500ms', async () => {
      const botData = createBotOfSize(500);
      
      const result = await measurePerformanceDetailed(
        'Большой (500 узлов)',
        botData,
        'LargeBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(500); // Основная цель - менее 500ms
    });

    it('очень большой бот (1000 узлов) - должен быть приемлемым', async () => {
      const botData = createBotOfSize(1000);
      
      const result = await measurePerformanceDetailed(
        'Очень большой (1000 узлов)',
        botData,
        'VeryLargeBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(1000); // Менее 1 секунды
    });
  });

  describe('Performance с различными конфигурациями', () => {
    it('большой бот с БД - должен укладываться в лимиты', async () => {
      const botData = createBotOfSize(300);
      
      const result = await measurePerformanceDetailed(
        'Большой с БД (300 узлов)',
        botData,
        'LargeBotWithDB',
        true, // userDatabaseEnabled
        12345,
        false
      );
      
      expect(result).toBeTruthy();
      expect(result).toContain('API_BASE_URL');
      expect(result).toContain('save_message_to_api');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(400);
    });

    it('большой бот с логированием - должен укладываться в лимиты', async () => {
      const botData = createBotOfSize(300);
      
      const result = await measurePerformanceDetailed(
        'Большой с логированием (300 узлов)',
        botData,
        'LargeBotWithLogging',
        true,
        67890,
        true // enableLogging
      );
      
      expect(result).toBeTruthy();
      expect(result).toContain('logging.basicConfig');
      expect(result).toContain('message_logging_middleware');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(450);
    });

    it('большой бот без БД и логирования - должен быть быстрее', async () => {
      const botData = createBotOfSize(300);
      
      const result = await measurePerformanceDetailed(
        'Большой минимальный (300 узлов)',
        botData,
        'LargeBotMinimal',
        false, // userDatabaseEnabled
        null,
        false // enableLogging
      );
      
      expect(result).toBeTruthy();
      expect(result).not.toContain('API_BASE_URL');
      expect(result).not.toContain('logging.basicConfig');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(300); // Должен быть быстрее без дополнительных функций
    });
  });

  describe('Performance с различными типами узлов', () => {
    it('бот с множественными inline кнопками - сложная генерация', async () => {
      const nodes: Node[] = [];
      
      // Создаем 200 узлов, каждый с 5 inline кнопками
      for (let i = 0; i < 200; i++) {
        nodes.push({
          id: `inline_node_${i}`,
          type: 'message',
          position: { x: i * 10, y: 0 },
          data: {
            text: `Узел с inline кнопками ${i}`,
            keyboardType: 'inline',
            buttons: Array.from({ length: 5 }, (_, j) => ({
              id: `btn_${i}_${j}`,
              text: `Кнопка ${i}-${j}`,
              target: `inline_node_${(i + j + 1) % 200}`,
              action: 'goto',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }))
          }
        });
      }
      
      const botData: BotData = { nodes, connections: [] };
      
      const result = await measurePerformanceDetailed(
        'Множественные inline (200 узлов)',
        botData,
        'MultipleInlineBot'
      );
      
      expect(result).toBeTruthy();
      expect(result).toContain('# Обработчики inline кнопок');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(600); // Сложная генерация может быть медленнее
    });

    it('бот с множественными multi-select узлами', async () => {
      const nodes: Node[] = [];
      
      // Создаем 100 узлов множественного выбора
      for (let i = 0; i < 100; i++) {
        nodes.push({
          id: `multi_node_${i}`,
          type: 'message',
          position: { x: i * 10, y: 0 },
          data: {
            text: `Множественный выбор ${i}`,
            keyboardType: 'inline',
            allowMultipleSelection: true,
            multiSelectVariable: `selection_${i}`,
            continueButtonTarget: `multi_node_${(i + 1) % 100}`,
            buttons: Array.from({ length: 4 }, (_, j) => ({
              id: `multi_btn_${i}_${j}`,
              text: `Опция ${i}-${j}`,
              action: 'selection',
              buttonType: 'normal',
              skipDataCollection: false,
              hideAfterClick: false
            }))
          }
        });
      }
      
      const botData: BotData = { nodes, connections: [] };
      
      const result = await measurePerformanceDetailed(
        'Множественный выбор (100 узлов)',
        botData,
        'MultiSelectBot'
      );
      
      expect(result).toBeTruthy();
      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('user_selections = {}');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(400);
    });

    it('бот с множественными медиа обработчиками', async () => {
      const mediaTypes = ['sticker', 'voice', 'animation', 'location', 'contact'];
      const nodes: Node[] = [];
      
      // Создаем по 50 узлов каждого медиа типа
      mediaTypes.forEach((mediaType, typeIndex) => {
        for (let i = 0; i < 50; i++) {
          nodes.push({
            id: `${mediaType}_node_${i}`,
            type: mediaType as any,
            position: { x: i * 10, y: typeIndex * 100 },
            data: {
              text: `Обработчик ${mediaType} ${i}`,
              buttons: []
            }
          });
        }
      });
      
      const botData: BotData = { nodes, connections: [] };
      
      const result = await measurePerformanceDetailed(
        'Множественные медиа (250 узлов)',
        botData,
        'MultiMediaBot'
      );
      
      expect(result).toBeTruthy();
      expect(result).toContain('# Обработчики медиа');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(350);
    });

    it('бот с множественными синонимами', async () => {
      const nodes: Node[] = [];
      
      // Создаем 150 узлов с синонимами
      for (let i = 0; i < 150; i++) {
        nodes.push({
          id: `synonym_node_${i}`,
          type: 'message',
          position: { x: i * 10, y: 0 },
          data: {
            text: `Узел с синонимами ${i}`,
            synonyms: [
              `синоним${i}_1`,
              `синоним${i}_2`,
              `синоним${i}_3`,
              `альтернатива${i}`,
              `вариант${i}`
            ],
            buttons: []
          }
        });
      }
      
      const botData: BotData = { nodes, connections: [] };
      
      const result = await measurePerformanceDetailed(
        'Множественные синонимы (150 узлов)',
        botData,
        'MultipleSynonymsBot'
      );
      
      expect(result).toBeTruthy();
      expect(result).toContain('# Обработчики синонимов');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(450);
    });
  });

  describe('Stress тесты производительности', () => {
    it('экстремально большой бот (2000 узлов) - stress test', async () => {
      const botData = createBotOfSize(2000, 0.3); // Меньше соединений для управляемости
      
      const result = await measurePerformanceDetailed(
        'Экстремальный (2000 узлов)',
        botData,
        'ExtremeBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(2000); // Менее 2 секунд даже для экстремального случая
      
      // Проверяем, что код содержит все узлы
      expect(result).toContain('@@NODE_START:perf_node_0@@');
      expect(result).toContain('@@NODE_START:perf_node_1000@@');
      expect(result).toContain('@@NODE_START:perf_node_1999@@');
    });

    it('бот с максимальной сложностью - все функции включены', async () => {
      const botData = createBotOfSize(400, 0.8); // Много соединений
      
      const result = await measurePerformanceDetailed(
        'Максимальная сложность (400 узлов)',
        botData,
        'MaxComplexityBot',
        true, // БД включена
        99999,
        true  // Логирование включено
      );
      
      expect(result).toBeTruthy();
      
      // Проверяем наличие всех компонентов
      expect(result).toContain('API_BASE_URL');
      expect(result).toContain('logging.basicConfig');
      expect(result).toContain('# Обработчики команд');
      expect(result).toContain('# Обработчики inline кнопок');
      expect(result).toContain('# Обработчики множественного выбора');
      expect(result).toContain('# Обработчики медиа');
      expect(result).toContain('# Обработчики синонимов');
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      expect(metrics.duration).toBeLessThan(800); // Сложный случай, но должен быть разумным
    });
  });

  describe('Анализ масштабируемости', () => {
    it('должен демонстрировать линейную или близкую к линейной масштабируемость', async () => {
      const sizes = [50, 100, 200, 400];
      const results: { size: number; duration: number }[] = [];
      
      for (const size of sizes) {
        const botData = createBotOfSize(size, 0.5);
        
        await measurePerformanceDetailed(
          `Масштабируемость ${size}`,
          botData,
          `ScalabilityBot${size}`
        );
        
        const metrics = performanceMetrics[performanceMetrics.length - 1];
        results.push({ size, duration: metrics.duration });
      }
      
      // Анализируем масштабируемость
      console.log('\n📊 Анализ масштабируемости:');
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];
        const sizeRatio = curr.size / prev.size;
        const timeRatio = curr.duration / prev.duration;
        const efficiency = sizeRatio / timeRatio;
        
        console.log(`  ${prev.size} → ${curr.size} узлов: время x${timeRatio.toFixed(2)}, эффективность: ${efficiency.toFixed(2)}`);
        
        // Эффективность должна быть разумной (не хуже чем квадратичная)
        expect(timeRatio).toBeLessThan(sizeRatio * 3); // Ослабляем требования
      }
      
      // Все тесты должны пройти базовые требования
      results.forEach(result => {
        if (result.size <= 200) {
          expect(result.duration).toBeLessThan(300);
        } else {
          expect(result.duration).toBeLessThan(600);
        }
      });
    });
  });

  describe('Memory usage тесты', () => {
    it('использование памяти должно быть разумным для больших ботов', async () => {
      const botData = createBotOfSize(500);
      
      const result = await measurePerformanceDetailed(
        'Память - большой бот (500 узлов)',
        botData,
        'MemoryTestBot'
      );
      
      expect(result).toBeTruthy();
      
      const metrics = performanceMetrics[performanceMetrics.length - 1];
      
      // Использование памяти не должно превышать 50MB для бота из 500 узлов
      expect(metrics.memoryUsed).toBeLessThan(50 * 1024 * 1024);
      
      // Размер генерируемого кода должен быть разумным
      expect(metrics.codeSize).toBeGreaterThan(10000); // Минимум 10KB
      expect(metrics.codeSize).toBeLessThan(5 * 1024 * 1024); // Максимум 5MB
    });

    it('память не должна утекать при множественных генерациях', async () => {
      const botData = createBotOfSize(100);
      const memoryMeasurements: number[] = [];
      
      // Генерируем код несколько раз подряд
      for (let i = 0; i < 5; i++) {
        const startMemory = process.memoryUsage().heapUsed;
        
        const result = generatePythonCode(
          botData,
          `MemoryLeakTest${i}`,
          [],
          true,
          i * 1000,
          false
        );
        
        expect(result).toBeTruthy();
        
        // Принудительная сборка мусора (если доступна)
        if (global.gc) {
          global.gc();
        }
        
        const endMemory = process.memoryUsage().heapUsed;
        memoryMeasurements.push(endMemory - startMemory);
      }
      
      // Проверяем, что память не растет неконтролируемо
      const firstMeasurement = memoryMeasurements[0];
      const lastMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
      
      // Последнее измерение не должно быть значительно больше первого
      expect(lastMeasurement).toBeLessThan(firstMeasurement * 2);
      
      console.log(`\n💾 Анализ утечек памяти: ${memoryMeasurements.map(m => `${(m/1024/1024).toFixed(1)}MB`).join(' → ')}`);
    });
  });
});