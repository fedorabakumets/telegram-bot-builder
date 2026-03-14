/**
 * @fileoverview Тесты для новых функций: appendVariable, variableFilters, complete action
 * @module lib/tests/unit/features/new-features.test
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import {
  validAppendVariableNode,
  validVariableFiltersNode,
  validCompleteButtonNode,
  validAllNewFeaturesNode,
  validMessageNode,
} from '../../helpers/test-fixtures';
import { generateAppendVariableSaveCode } from '../../../bot-generator/user-input/generate-append-variable-save';
import { generateVariableFilterCode } from '../../../bot-generator/user-input/generate-variable-filters';
import { generateKeyboard } from '../../../bot-generator/Keyboard/generateKeyboard';
import { handleNodeNavigation } from '../../../bot-generator/node-navigation/handle-node-navigation';

describe('NewFeatures (appendVariable, variableFilters, complete)', () => {
  describe('appendVariable', () => {
    describe('generateAppendVariableSaveCode', () => {
      it('должен генерировать код для сохранения в массив', () => {
        // Arrange
        const node = validAppendVariableNode;
        const variableName = 'user_values';

        // Act
        const code = generateAppendVariableSaveCode(node, variableName, '    ');

        // Assert
        assert.ok(code);
        assert.ok(code.includes('# Режим \'Не перезаписывать\': сохраняем в массив'));
        assert.ok(code.includes('if user_id not in user_data:'));
        assert.ok(code.includes('user_data[user_id] = {}'));
      });

      it('должен генерировать код проверки существования переменной', () => {
        // Arrange
        const variableName = 'test_var';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, '    ');

        // Assert
        assert.ok(code.includes('if "test_var" not in user_data[user_id]:'));
        assert.ok(code.includes('# Первое значение — создаём список'));
      });

      it('должен генерировать код создания списка для первого значения', () => {
        // Arrange
        const variableName = 'new_var';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, '        ');

        // Assert
        assert.ok(code.includes('user_data[user_id]["new_var"] = [response_data]'));
        assert.ok(code.includes('logging.info(f"✅ Создан список new_var'));
      });

      it('должен генерировать код добавления в существующий список', () => {
        // Arrange
        const variableName = 'existing_var';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, '        ');

        // Assert
        assert.ok(code.includes('isinstance(existing_value, list)'));
        assert.ok(code.includes('user_data[user_id]["existing_var"].append(response_data)'));
      });

      it('должен генерировать код преобразования одиночного значения в список', () => {
        // Arrange
        const variableName = 'convert_var';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, '        ');

        // Assert
        assert.ok(code.includes('# Было одиночное значение — преобразуем в список'));
        assert.ok(code.includes('user_data[user_id]["convert_var"] = [existing_value, response_data]'));
      });

      it('должен использовать правильный отступ', () => {
        // Arrange
        const variableName = 'var';
        const indent = '            ';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, indent);

        // Assert
        const lines = code.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            assert.ok(line.startsWith(indent) || line.trim() === '');
          }
        });
      });
    });

    describe('validAppendVariableNode fixture', () => {
      it('должен иметь appendVariable = true', () => {
        // Arrange & Act & Assert
        assert.strictEqual(validAppendVariableNode.data.appendVariable, true);
      });

      it('должен иметь inputVariable', () => {
        // Arrange & Act & Assert
        assert.ok(validAppendVariableNode.data.inputVariable);
        assert.strictEqual(validAppendVariableNode.data.inputVariable, 'user_values');
      });

      it('должен иметь collectUserInput = true', () => {
        // Arrange & Act & Assert
        assert.strictEqual(validAppendVariableNode.data.collectUserInput, true);
      });

      it('должен иметь inputTargetNodeId', () => {
        // Arrange & Act & Assert
        assert.ok(validAppendVariableNode.data.inputTargetNodeId);
      });
    });
  });

  describe('variableFilters', () => {
    describe('generateVariableFilterCode', () => {
      it('должен генерировать код для фильтра join с запятой', () => {
        // Arrange
        const variableName = 'user_interests';
        const filter = '|join:", "';

        // Act
        const code = generateVariableFilterCode(variableName, filter, '    ');

        // Assert
        assert.ok(code);
        assert.ok(code.includes('# Обработка фильтра |join:", "'));
        assert.ok(code.includes('if isinstance(user_interests, list):'));
        assert.ok(code.includes('user_interests_filtered = ", ".join(str(item) for item in user_interests)'));
      });

      it('должен генерировать код для фильтра join с переводом строки', () => {
        // Arrange
        const variableName = 'user_tags';
        const filter = '|join:"\\n"';

        // Act
        const code = generateVariableFilterCode(variableName, filter, '    ');

        // Assert
        assert.ok(code);
        assert.ok(code.includes('user_tags_filtered = "\\n".join(str(item) for item in user_tags)'));
      });

      it('должен возвращать пустую строку для нераспознанного фильтра', () => {
        // Arrange
        const variableName = 'var';
        const filter = '|unknown';

        // Act
        const code = generateVariableFilterCode(variableName, filter, '    ');

        // Assert
        assert.strictEqual(code, '');
      });

      it('должен использовать правильный отступ', () => {
        // Arrange
        const variableName = 'var';
        const filter = '|join:", "';
        const indent = '        ';

        // Act
        const code = generateVariableFilterCode(variableName, filter, indent);

        // Assert
        const lines = code.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            assert.ok(line.startsWith(indent));
          }
        });
      });
    });

    describe('validVariableFiltersNode fixture', () => {
      it('должен иметь variableFilters объект', () => {
        // Arrange & Act & Assert
        assert.ok(validVariableFiltersNode.data.variableFilters);
        assert.ok(typeof validVariableFiltersNode.data.variableFilters === 'object');
      });

      it('должен иметь фильтр join для user_interests', () => {
        // Arrange & Act & Assert
        assert.strictEqual(
          validVariableFiltersNode.data.variableFilters['user_interests'],
          '|join:", "'
        );
      });

      it('должен иметь фильтр join для user_tags', () => {
        // Arrange & Act & Assert
        assert.strictEqual(
          validVariableFiltersNode.data.variableFilters['user_tags'],
          '|join:"\\n"'
        );
      });

      it('должен иметь текст с переменными и фильтрами', () => {
        // Arrange & Act & Assert
        assert.ok(validVariableFiltersNode.data.text);
        assert.ok(validVariableFiltersNode.data.text?.includes('{user_interests|join:", "}'));
      });
    });
  });

  describe('complete action', () => {
    describe('validCompleteButtonNode fixture', () => {
      it('должен иметь кнопку с action = complete', () => {
        // Arrange & Act & Assert
        const completeButton = validCompleteButtonNode.data.buttons?.find(
          btn => btn.action === 'complete'
        );
        assert.ok(completeButton);
        assert.strictEqual(completeButton?.action, 'complete');
      });

      it('должен иметь кнопку complete с текстом', () => {
        // Arrange & Act & Assert
        const completeButton = validCompleteButtonNode.data.buttons?.find(
          btn => btn.action === 'complete'
        );
        assert.ok(completeButton);
        assert.strictEqual(completeButton?.text, 'Готово');
      });

      it('должен иметь кнопку complete с target', () => {
        // Arrange & Act & Assert
        const completeButton = validCompleteButtonNode.data.buttons?.find(
          btn => btn.action === 'complete'
        );
        assert.ok(completeButton);
        assert.strictEqual(completeButton?.target, 'final_message');
      });

      it('должен иметь allowMultipleSelection = true', () => {
        // Arrange & Act & Assert
        assert.strictEqual(validCompleteButtonNode.data.allowMultipleSelection, true);
      });

      it('должен иметь кнопки selection', () => {
        // Arrange & Act & Assert
        const selectionButtons = validCompleteButtonNode.data.buttons?.filter(
          btn => btn.action === 'selection'
        );
        assert.strictEqual(selectionButtons?.length, 2);
      });
    });

    describe('generateKeyboard с complete кнопкой', () => {
      it('должен генерировать код для inline клавиатуры с complete кнопкой', { timeout: 60000 }, () => {
        // Arrange
        const node = validCompleteButtonNode;
        const allNodeIds = ['complete_1', 'final_message'];

        // Act
        const code = generateKeyboard(node, allNodeIds);

        // Assert
        assert.ok(code);
        // Проверяем что код содержит клавиатуру или кнопки
        assert.ok(code && code.length > 0);
      });

      it('должен генерировать код для reply клавиатуры с complete кнопкой', { timeout: 60000 }, () => {
        // Arrange
        const node = {
          ...validCompleteButtonNode,
          data: {
            ...validCompleteButtonNode.data,
            keyboardType: 'reply' as const,
          },
        };
        const allNodeIds = ['complete_1', 'final_message'];

        // Act
        const code = generateKeyboard(node, allNodeIds);

        // Assert
        assert.ok(code);
        assert.ok(code && code.length > 0);
      });
    });
  });

  describe('Комбинированные тесты (все новые функции вместе)', () => {
    describe('validAllNewFeaturesNode fixture', () => {
      it('должен иметь appendVariable = true', () => {
        // Arrange & Act & Assert
        assert.strictEqual(validAllNewFeaturesNode.data.appendVariable, true);
      });

      it('должен иметь variableFilters', () => {
        // Arrange & Act & Assert
        assert.ok(validAllNewFeaturesNode.data.variableFilters);
        assert.strictEqual(
          validAllNewFeaturesNode.data.variableFilters['user_values'],
          '|join:", "'
        );
      });

      it('должен иметь кнопку complete', () => {
        // Arrange & Act & Assert
        const completeButton = validAllNewFeaturesNode.data.buttons?.find(
          (btn: any) => btn.action === 'complete'
        );
        assert.ok(completeButton);
        assert.strictEqual(completeButton?.action, 'complete');
        assert.strictEqual(completeButton?.text, 'Завершить');
      });

      it('должен иметь кнопку selection', () => {
        // Arrange & Act & Assert
        const selectionButton = validAllNewFeaturesNode.data.buttons?.find(
          btn => btn.action === 'selection'
        );
        assert.ok(selectionButton);
      });

      it('должен иметь текст с фильтром переменных', () => {
        // Arrange & Act & Assert
        assert.ok(validAllNewFeaturesNode.data.text);
        assert.ok(validAllNewFeaturesNode.data.text?.includes('{user_values|join:", "}'));
      });

      it('должен иметь allowMultipleSelection = true', () => {
        // Arrange & Act & Assert
        assert.strictEqual(validAllNewFeaturesNode.data.allowMultipleSelection, true);
      });
    });

    describe('generateKeyboard с всеми новыми функциями', () => {
      it('должен генерировать код для узла со всеми функциями', () => {
        // Arrange
        const node = validAllNewFeaturesNode;
        const allNodeIds = ['all_features_1', 'final_node', 'next_node'];

        // Act
        const code = generateKeyboard(node, allNodeIds);

        // Assert
        assert.ok(code);
        assert.ok(code.length > 0);
      });
    });

    describe('handleNodeNavigation с новыми функциями', () => {
      it('должен обрабатывать узел с appendVariable', () => {
        // Arrange
        const nodes = [validAppendVariableNode];
        const allNodeIds = ['append_var_1', 'message_after_input'];

        // Act
        const code = handleNodeNavigation(nodes, '    ', '        ', allNodeIds, []);

        // Assert
        assert.ok(code);
        assert.ok(code.includes('current_node_id == "append_var_1"'));
      });

      it('должен обрабатывать узел с variableFilters', () => {
        // Arrange
        const nodes = [validVariableFiltersNode];
        const allNodeIds = ['var_filters_1'];

        // Act
        const code = handleNodeNavigation(nodes, '    ', '        ', allNodeIds, []);

        // Assert
        assert.ok(code);
        assert.ok(code.includes('current_node_id == "var_filters_1"'));
      });

      it('должен обрабатывать узел с complete кнопкой', () => {
        // Arrange
        const nodes = [validCompleteButtonNode];
        const allNodeIds = ['complete_1', 'final_message'];

        // Act
        const code = handleNodeNavigation(nodes, '    ', '        ', allNodeIds, []);

        // Assert
        assert.ok(code);
        assert.ok(code.includes('current_node_id == "complete_1"'));
      });
    });
  });

  describe('Edge cases', () => {
    describe('appendVariable edge cases', () => {
      it('должен обрабатывать пустое имя переменной', () => {
        // Arrange
        const variableName = '';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, '    ');

        // Assert
        assert.ok(code);
        assert.ok(code.includes('user_data[user_id][""]'));
      });

      it('должен обрабатывать переменную со специальными символами', () => {
        // Arrange
        const variableName = 'user_var_123';

        // Act
        const code = generateAppendVariableSaveCode(validAppendVariableNode, variableName, '    ');

        // Assert
        assert.ok(code);
        assert.ok(code.includes('user_var_123'));
      });
    });

    describe('variableFilters edge cases', () => {
      it('должен обрабатывать пустой фильтр', () => {
        // Arrange
        const variableName = 'var';
        const filter = '';

        // Act
        const code = generateVariableFilterCode(variableName, filter, '    ');

        // Assert
        assert.strictEqual(code, '');
      });

      it('должен обрабатывать фильтр без join', () => {
        // Arrange
        const variableName = 'var';
        const filter = '|upper';

        // Act
        const code = generateVariableFilterCode(variableName, filter, '    ');

        // Assert
        assert.strictEqual(code, '');
      });
    });

    describe('complete button edge cases', () => {
      it('должен обрабатывать кнопку complete без target', () => {
        // Arrange
        const node = {
          ...validCompleteButtonNode,
          data: {
            ...validCompleteButtonNode.data,
            buttons: [
              {
                id: 'complete_btn',
                text: 'Готово',
                action: 'complete' as const,
              },
            ],
          },
        };

        // Act
        const code = generateKeyboard(node, ['complete_1']);

        // Assert
        assert.ok(code);
      });

      it('должен обрабатывать узел только с complete кнопкой', () => {
        // Arrange
        const node = {
          ...validCompleteButtonNode,
          data: {
            ...validCompleteButtonNode.data,
            buttons: [
              {
                id: 'complete_btn',
                text: 'Готово',
                action: 'complete' as const,
                target: 'final',
              },
            ],
            allowMultipleSelection: false,
          },
        };

        // Act
        const code = generateKeyboard(node, ['complete_1', 'final']);

        // Assert
        assert.ok(code);
      });
    });
  });
});
