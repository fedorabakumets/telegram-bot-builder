/**
 * @fileoverview Валидация узлов EnhancedNode
 * 
 * Модуль предоставляет функции для проверки корректности узлов
 * перед генерацией Python-кода бота.
 * 
 * @module bot-generator/validation/validate-enhanced-node
 */

import type { EnhancedNode } from '../types/enhanced-node.types';

const SUPPORTED_INPUT_TYPES = new Set([
  'any',
  'text',
  'photo',
  'video',
  'audio',
  'document',
  'location',
  'contact',
]);

/**
 * Результат валидации узла
 * 
 * @example
 * const result: ValidationResult = {
 *   isValid: true,
 *   errors: [],
 *   warnings: []
 * };
 */
export interface ValidationResult {
  /** Узел валиден */
  isValid: boolean;
  /** Список ошибок */
  errors: string[];
  /** Список предупреждений */
  warnings: string[];
}

/**
 * Валидирует отдельный узел EnhancedNode
 * 
 * @param node - Узел для валидации
 * @returns Результат валидации
 * 
 * @example
 * const result = validateEnhancedNode(node);
 * if (!result.isValid) console.error(result.errors);
 */
export function validateEnhancedNode(node: EnhancedNode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка обязательных полей
  if (!node.id || node.id.trim() === '') {
    errors.push('Missing node id');
  }

  if (!node.type || node.type.trim() === '') {
    errors.push('Missing node type');
  }

  // Проверка позиции
  if (!node.position) {
    warnings.push('Missing node position');
  } else if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    errors.push('Invalid node position');
  }

  // Проверка данных узла
  if (!node.data) {
    errors.push('Missing node data');
  } else {
    // Проверка кнопок
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach((button, index) => {
        if (!button.id) {
          errors.push(`Button ${index}: missing id`);
        }
        if (!button.text) {
          errors.push(`Button ${index}: missing text`);
        }
        if (!button.action) {
          errors.push(`Button ${index}: missing action`);
        }
      });
    }

    // Проверка автоперехода
    if (node.data.enableAutoTransition && !node.data.autoTransitionTo) {
      errors.push('Auto-transition enabled but no target specified');
    }

    // Проверка legacy-сбора ввода внутри message
    if (node.data.collectUserInput && !node.data.inputTargetNodeId) {
      warnings.push('User input collection enabled but no target specified');
    }

    // Проверка dedicated input-узла
    if (node.type === 'input') {
      if (!node.data.inputVariable || String(node.data.inputVariable).trim() === '') {
        errors.push('Input node requires inputVariable');
      }

      const inputType = String(node.data.inputType || 'any');
      if (!SUPPORTED_INPUT_TYPES.has(inputType)) {
        errors.push(`Unsupported input type: ${inputType}`);
      }

      if (!node.data.inputTargetNodeId) {
        warnings.push('Input node has no target specified after saving the answer');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Валидирует массив узлов EnhancedNode
 * 
 * @param nodes - Массив узлов для валидации
 * @returns Общий результат валидации
 * 
 * @example
 * const result = validateEnhancedNodes(nodes);
 * if (!result.isValid) console.error(result.errors);
 */
export function validateEnhancedNodes(nodes: EnhancedNode[]): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  nodes.forEach((node, index) => {
    const result = validateEnhancedNode(node);
    
    result.errors.forEach((error) => {
      allErrors.push(`Node ${index} (${node.id || 'unknown'}): ${error}`);
    });
    
    result.warnings.forEach((warning) => {
      allWarnings.push(`Node ${index} (${node.id || 'unknown'}): ${warning}`);
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
