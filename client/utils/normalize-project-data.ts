/**
 * @file normalize-project-data.ts
 * @brief Утилита для нормализации данных проекта
 *
 * Этот файл содержит функции для нормализации данных проекта,
 * добавляя все необходимые поля условных сообщений в каждый узел,
 * даже если они не используются в данный момент.
 */

import { BotDataWithSheets } from '@shared/schema';

/**
 * Нормализует кнопку, конвертируя устаревшие поля
 * @param button Объект кнопки для нормализации
 * @returns Нормализованная кнопка
 */
function normalizeButton(button: any): any {
  // Конвертируем buttonType в action
  if (button.buttonType) {
    if (button.buttonType === 'complete' && !button.action) {
      button.action = 'complete';
    } else if (button.buttonType === 'option' && !button.action) {
      button.action = 'selection';
    }
    // Удаляем устаревшее поле buttonType
    delete button.buttonType;
  }
  
  // Устанавливаем значения по умолчанию
  if (button.skipDataCollection === undefined) {
    button.skipDataCollection = false;
  }
  if (button.hideAfterClick === undefined) {
    button.hideAfterClick = false;
  }
  
  return button;
}

/**
 * Нормализует массив кнопок
 * @param buttons Массив кнопок для нормализации
 * @returns Нормализованный массив кнопок
 */
function normalizeButtons(buttons: any[]): any[] {
  if (!Array.isArray(buttons)) return [];
  return buttons.map(normalizeButton);
}

/**
 * Нормализует данные проекта, добавляя все возможные поля условных сообщений
 * в каждый узел, чтобы они были доступны для использования
 * 
 * @param projectData Данные проекта для нормализации
 * @returns Нормализованные данные проекта с дополненными полями
 */
export function normalizeProjectData(projectData: BotDataWithSheets): BotDataWithSheets {
  // Копируем данные проекта
  const normalizedData = structuredClone ? structuredClone(projectData) : JSON.parse(JSON.stringify(projectData));

  // Проходим по всем листам
  normalizedData.sheets = normalizedData.sheets.map((sheet: any) => {
    // Проходим по всем узлам в листе
    const normalizedNodes = sheet.nodes.map((node: any) => {
      // Проверяем, есть ли у узла поле data
      if (!node.data) {
        node.data = {};
      }

      // Добавляем базовые поля условных сообщений, если их нет
      if (node.data.enableConditionalMessages === undefined) {
        node.data.enableConditionalMessages = false;
      }

      if (!node.data.conditionalMessages) {
        node.data.conditionalMessages = [];
      }

      // Нормализуем кнопки в узле
      if (Array.isArray(node.data.buttons)) {
        node.data.buttons = normalizeButtons(node.data.buttons);
      }

      // Инициализируем поля динамических кнопок, если их нет
      if (node.data.enableDynamicButtons === undefined) {
        node.data.enableDynamicButtons = false;
      }
      if (!node.data.dynamicButtons) {
        node.data.dynamicButtons = {
          variable: '',
          arrayField: '',
          textField: '',
          callbackField: '',
          styleField: '',
          columns: 2,
        };
      }

      // Конвертируем continueButtonText в кнопку с action: 'complete'
      if (node.data.allowMultipleSelection && node.data.continueButtonText) {
        const hasCompleteButton = node.data.buttons.some((btn: any) => btn.action === 'complete');
        if (!hasCompleteButton) {
          node.data.buttons.push({
            id: `complete-${Date.now()}`,
            text: node.data.continueButtonText,
            action: 'complete',
            target: node.data.continueButtonTarget || '',
            skipDataCollection: false,
            hideAfterClick: false
          });
        }
        // Удаляем устаревшие поля
        delete node.data.continueButtonText;
        delete node.data.continueButtonTarget;
      }

      // Нормализуем каждый элемент conditionalMessages
      if (Array.isArray(node.data.conditionalMessages)) {
        node.data.conditionalMessages = node.data.conditionalMessages.map((condition: any) => {
          // Убедимся, что у каждого условия есть все необходимые поля
          const normalizedCondition = {
            // Обязательные поля
            id: condition.id || `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            condition: condition.condition || 'user_data_exists',

            // Поля для переменных
            variableName: condition.variableName || '',
            variableNames: Array.isArray(condition.variableNames) ? condition.variableNames : (condition.variableName ? [condition.variableName] : []),
            logicOperator: condition.logicOperator || 'AND',

            // Поля для значений
            expectedValue: condition.expectedValue || '',

            // Поля для сообщения
            messageText: condition.messageText || '',
            formatMode: condition.formatMode || 'text',

            // Поля для клавиатуры
            keyboardType: condition.keyboardType || 'none',
            buttons: normalizeButtons(condition.buttons || []),
            resizeKeyboard: condition.resizeKeyboard !== undefined ? condition.resizeKeyboard : true,
            oneTimeKeyboard: condition.oneTimeKeyboard !== undefined ? condition.oneTimeKeyboard : false,
            
            // Поля для сбора ввода
            collectUserInput: condition.collectUserInput !== undefined ? condition.collectUserInput : false,
            enableTextInput: condition.enableTextInput !== undefined ? condition.enableTextInput : false,
            enablePhotoInput: condition.enablePhotoInput !== undefined ? condition.enablePhotoInput : false,
            enableVideoInput: condition.enableVideoInput !== undefined ? condition.enableVideoInput : false,
            enableAudioInput: condition.enableAudioInput !== undefined ? condition.enableAudioInput : false,
            enableDocumentInput: condition.enableDocumentInput !== undefined ? condition.enableDocumentInput : false,
            
            // Поля для переменных ввода
            inputVariable: condition.inputVariable || condition.textInputVariable || '',
            textInputVariable: condition.textInputVariable || condition.inputVariable || '',
            photoInputVariable: condition.photoInputVariable || '',
            videoInputVariable: condition.videoInputVariable || '',
            audioInputVariable: condition.audioInputVariable || '',
            documentInputVariable: condition.documentInputVariable || '',
            
            // Поля для навигации
            nextNodeAfterInput: condition.nextNodeAfterInput || '',
            
            // Приоритет
            priority: condition.priority || 0,
            
            // Дополнительные поля
            showCustomMessage: condition.showCustomMessage !== undefined ? condition.showCustomMessage : false,
            waitForTextInput: condition.waitForTextInput !== undefined ? condition.waitForTextInput : false,
            
            // Копируем все остальные поля
            ...condition
          };

          // Нормализуем кнопки в условном сообщении
          if (Array.isArray(normalizedCondition.buttons)) {
            normalizedCondition.buttons = normalizeButtons(normalizedCondition.buttons);
          }

          return normalizedCondition;
        });
      }

      // Также добавляем другие поля, связанные с пользовательским вводом, если их нет
      if (node.data.collectUserInput === undefined) {
        node.data.collectUserInput = false;
      }

      if (node.data.enableTextInput === undefined) {
        node.data.enableTextInput = false;
      }

      if (node.data.enablePhotoInput === undefined) {
        node.data.enablePhotoInput = false;
      }

      if (node.data.enableVideoInput === undefined) {
        node.data.enableVideoInput = false;
      }

      if (node.data.enableAudioInput === undefined) {
        node.data.enableAudioInput = false;
      }

      if (node.data.enableDocumentInput === undefined) {
        node.data.enableDocumentInput = false;
      }

      if (!node.data.inputVariable) {
        node.data.inputVariable = '';
      }

      if (!node.data.photoInputVariable) {
        node.data.photoInputVariable = '';
      }

      if (!node.data.videoInputVariable) {
        node.data.videoInputVariable = '';
      }

      if (!node.data.audioInputVariable) {
        node.data.audioInputVariable = '';
      }

      if (!node.data.documentInputVariable) {
        node.data.documentInputVariable = '';
      }

      if (node.type === 'input') {
        if (!node.data.inputType) {
          node.data.inputType = 'any';
        }
        if (node.data.inputVariable === undefined) {
          node.data.inputVariable = '';
        }
        if (node.data.inputTargetNodeId === undefined) {
          node.data.inputTargetNodeId = '';
        }
        if (node.data.appendVariable === undefined) {
          node.data.appendVariable = false;
        }
        if (node.data.saveToDatabase === undefined) {
          node.data.saveToDatabase = false;
        }
        if (node.data.inputPrompt === undefined) {
          node.data.inputPrompt = 'Введите ответ';
        }
        if (node.data.inputRequired === undefined) {
          node.data.inputRequired = true;
        }
      }

      // Возвращаем нормализованный узел
      return node;
    });

    // Возвращаем нормализованный лист
    return {
      ...sheet,
      nodes: normalizedNodes
    };
  });

  // Удаляем поле connections из всех листов (оно больше не используется)
  normalizedData.sheets = normalizedData.sheets.map((sheet: any) => {
    const { connections, ...sheetWithoutConnections } = sheet;
    return sheetWithoutConnections;
  });

  // Удаляем interSheetConnections если есть
  if ('interSheetConnections' in normalizedData) {
    const { interSheetConnections, ...dataWithoutInterSheet } = normalizedData;
    return dataWithoutInterSheet as BotDataWithSheets;
  }

  return normalizedData;
}
