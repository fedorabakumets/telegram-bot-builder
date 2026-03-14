/**
 * @fileoverview Тесты для проверки синтаксиса Python кода
 * 
 * Проверяет сгенерированный Python код на распространённые синтаксические ошибки:
 * - Отсутствие перевода строки между операторами
 * - Отсутствие выражения после конструкции
 * - Другие синтаксические проблемы
 * 
 * @module tests/unit/validation/python-syntax-validation
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  generateNavigateToNodeCall,
  generateNavigateToNodeWithText,
  generateNavigateToNodeWithVars,
} from '../../../bot-generator/transitions/generate-node-navigation';

describe('PythonSyntaxValidation', () => {
  describe('Проверка завершающих символов новой строки', () => {
    describe('generateNavigateToNodeCall', () => {
      it('должен добавлять символ новой строки в конце', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(result.endsWith('\n'), 'Функция должна добавлять \\n в конце');
      });

      it('должен добавлять символ новой строки с кастомными параметрами', () => {
        const result = generateNavigateToNodeCall('_test_node_', 'msg', '    ');
        assert.ok(result.endsWith('\n'), 'Функция должна добавлять \\n в конце с кастомными параметрами');
      });
    });

    describe('generateNavigateToNodeWithText', () => {
      it('должен добавлять символ новой строки в конце', () => {
        const result = generateNavigateToNodeWithText('_test_node_', 'text');
        assert.ok(result.endsWith('\n'), 'Функция должна добавлять \\n в конце');
      });

      it('должен добавлять символ новой строки с кастомными параметрами', () => {
        const result = generateNavigateToNodeWithText('_test_node_', 'text', 'msg', '    ');
        assert.ok(result.endsWith('\n'), 'Функция должна добавлять \\n в конце с кастомными параметрами');
      });
    });

    describe('generateNavigateToNodeWithVars', () => {
      it('должен добавлять символ новой строки в конце', () => {
        const result = generateNavigateToNodeWithVars('_test_node_', 'vars');
        assert.ok(result.endsWith('\n'), 'Функция должна добавлять \\n в конце');
      });

      it('должен добавлять символ новой строки с кастомными параметрами', () => {
        const result = generateNavigateToNodeWithVars('_test_node_', 'vars', 'msg', '    ');
        assert.ok(result.endsWith('\n'), 'Функция должна добавлять \\n в конце с кастомными параметрами');
      });
    });
  });

  describe('Проверка на отсутствие синтаксических ошибок', () => {
    describe('Операторы должны быть разделены символами перевода строки', () => {
      it('не должен содержать операторы без перевода строки перед else', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        // Проверяем что нет паттерна "...)else:" без перевода строки
        assert.ok(
          !result.match(/\)\s*else:/),
          'Не должно быть оператора else без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед if', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        // Проверяем что нет паттерна "...)if" без перевода строки
        assert.ok(
          !result.match(/\)\s*if\s+/),
          'Не должно быть оператора if без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед elif', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*elif\s+/),
          'Не должно быть оператора elif без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед for', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*for\s+/),
          'Не должно быть оператора for без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед while', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*while\s+/),
          'Не должно быть оператора while без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед try', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*try\s*:/),
          'Не должно быть оператора try без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед except', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*except\s+/),
          'Не должно быть оператора except без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед with', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*with\s+/),
          'Не должно быть оператора with без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед def', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*def\s+/),
          'Не должно быть оператора def без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед class', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*class\s+/),
          'Не должно быть оператора class без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед return', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*return\s+/),
          'Не должно быть оператора return без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед raise', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*raise\s+/),
          'Не должно быть оператора raise без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед import', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*import\s+/),
          'Не должно быть оператора import без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед from', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*from\s+/),
          'Не должно быть оператора from без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед pass', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*pass\s*;/),
          'Не должно быть оператора pass без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед break', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*break\s*;/),
          'Не должно быть оператора break без перевода строки'
        );
      });

      it('не должен содержать операторы без перевода строки перед continue', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        assert.ok(
          !result.match(/\)\s*continue\s*;/),
          'Не должно быть оператора continue без перевода строки'
        );
      });
    });

    describe('Ожидается выражение', () => {
      it('не должен содержать незавершённые конструкции', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        // Проверяем что нет паттернов которые указывают на незавершённые конструкции
        assert.ok(
          !result.match(/=\s*\n\s*(?:else|elif|if|for|while)/),
          'Не должно быть незавершённых присваиваний'
        );
      });

      it('не должен содержать двоеточие без последующего блока', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        // Проверяем что после двоеточия есть перевод строки
        const lines = result.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          if (lines[i].trim().endsWith(':')) {
            // После строки с : следующая строка должна быть с отступом или пустой
            const nextLine = lines[i + 1];
            assert.ok(
              nextLine === '' || nextLine.match(/^\s+/) || nextLine.trim().match(/^(?:else|elif|except|finally|if|for|while|def|class|with|try|return|raise|import|from|pass|break|continue)/),
              `После двоеточия ожидается блок кода. Строка ${i}: ${lines[i]}`
            );
          }
        }
      });

      it('не должен содержать несколько операторов на одной строке без точки с запятой', () => {
        const result = generateNavigateToNodeCall('_test_node_');
        const lines = result.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          // Игнорируем комментарии и пустые строки
          if (trimmed === '' || trimmed.startsWith('#')) {
            continue;
          }
          // Проверяем что нет нескольких операторов на одной строке
          // (за исключением случаев с точкой с запятой)
          const operatorCount = (trimmed.match(/\b(?:await|return|if|for|while|def|class|import|from|with|try|except|raise|pass|break|continue)\b/g) || []).length;
          if (operatorCount > 1 && !trimmed.includes(';')) {
            assert.fail(`Несколько операторов на одной строке без точки с запятой: ${trimmed}`);
          }
        }
      });
    });
  });

  describe('Интеграционные тесты синтаксиса', () => {
    it('должен генерировать код который можно использовать в if блоке', () => {
      const callCode = generateNavigateToNodeCall('_test_node_', 'message', '');
      const fullCode = `if next_node_id == "_test_node_":
    text = "Hello"
    ${callCode}else:
    pass`;
      
      // Проверяем что есть перевод строки перед else (правильный синтаксис)
      assert.ok(
        fullCode.match(/\)\n\s*else:/),
        'Должен быть перевод строки перед else'
      );
    });

    it('должен генерировать код который можно использовать в elif блоке', () => {
      const callCode = generateNavigateToNodeWithText('_test_node_', 'text', 'message', '');
      const fullCode = `if condition1:
    pass
elif next_node_id == "_test_node_":
    ${callCode}elif condition2:
    pass`;
      
      assert.ok(
        fullCode.match(/\)\n\s*elif\s+/),
        'Должен быть перевод строки перед elif'
      );
    });

    it('должен генерировать код который можно использовать в try блоке', () => {
      const callCode = generateNavigateToNodeWithVars('_test_node_', 'vars', 'message', '');
      const fullCode = `try:
    ${callCode}except Exception as e:
    pass`;
      
      assert.ok(
        fullCode.match(/\)\n\s*except\s+/),
        'Должен быть перевод строки перед except'
      );
    });

    it('должен генерировать код который можно использовать в for цикле', () => {
      const callCode = generateNavigateToNodeCall('_test_node_', 'message', '');
      const fullCode = `for node_id in node_ids:
    ${callCode}print("Done")`;
      
      assert.ok(
        fullCode.match(/\)\n\s*print/),
        'Должен быть перевод строки перед print'
      );
    });

    it('должен генерировать код который можно использовать в while цикле', () => {
      const callCode = generateNavigateToNodeCall('_test_node_', 'message', '');
      const fullCode = `while has_nodes:
    ${callCode}break`;
      
      assert.ok(
        fullCode.match(/\)\n\s*break/),
        'Должен быть перевод строки перед break'
      );
    });

    it('должен генерировать код который можно использовать в with блоке', () => {
      const callCode = generateNavigateToNodeCall('_test_node_', 'message', '');
      const fullCode = `with open('file.txt') as f:
    ${callCode}f.write('done')`;
      
      assert.ok(
        fullCode.match(/\)\n\s*f\.write/),
        'Должен быть перевод строки перед f.write'
      );
    });
  });

  describe('Проверка на распространённые ошибки Pylance', () => {
    const pylanceErrorPatterns = [
      { name: 'Операторы без перевода строки перед else', pattern: /\)\s*else:/ },
      { name: 'Операторы без перевода строки перед elif', pattern: /\)\s*elif\s+/ },
      { name: 'Операторы без перевода строки перед if', pattern: /\)\s*if\s+/ },
      { name: 'Операторы без перевода строки перед for', pattern: /\)\s*for\s+/ },
      { name: 'Операторы без перевода строки перед while', pattern: /\)\s*while\s+/ },
      { name: 'Операторы без перевода строки перед try', pattern: /\)\s*try\s*:/ },
      { name: 'Операторы без перевода строки перед except', pattern: /\)\s*except\s+/ },
      { name: 'Операторы без перевода строки перед with', pattern: /\)\s*with\s+/ },
      { name: 'Операторы без перевода строки перед def', pattern: /\)\s*def\s+/ },
    ];

    for (const { name, pattern } of pylanceErrorPatterns) {
      it(`не должен содержать ошибку: ${name}`, () => {
        const callResult = generateNavigateToNodeCall('_test_node_');
        const withTextResult = generateNavigateToNodeWithText('_test_node_', 'text');
        const withVarsResult = generateNavigateToNodeWithVars('_test_node_', 'vars');

        assert.ok(
          !pattern.test(callResult),
          `generateNavigateToNodeCall: ${name}`
        );
        assert.ok(
          !pattern.test(withTextResult),
          `generateNavigateToNodeWithText: ${name}`
        );
        assert.ok(
          !pattern.test(withVarsResult),
          `generateNavigateToNodeWithVars: ${name}`
        );
      });
    }
  });
});
