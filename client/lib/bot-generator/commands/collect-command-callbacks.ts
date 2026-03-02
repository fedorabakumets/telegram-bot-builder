/**
 * @fileoverview Обработчики команд бота
 * Функции для сбора и генерации обработчиков командных кнопок
 */

import { Button } from '../types';
import { isLoggingEnabled } from '../core';

/**
 * Собирает все callback-идентификаторы команд из узлов бота
 * @param nodes - Массив узлов бота
 * @returns {Set<string>} Уникальные callback идентификаторы команд
 */
export const collectAllCommandCallbacksFromNodes = (nodes: any[]): Set<string> => {
  const commandButtons = new Set<string>();
  
  if (isLoggingEnabled()) {
    console.log('🎯 НАЧИНАЕМ СБОР КНОПОК КОМАНД из', nodes.length, 'узлов');
  }

  nodes.forEach(node => {
    if (isLoggingEnabled()) {
      console.log(`🔍 Проверяем узел ${node.id} (тип: ${node.type})`);
    }

    // Обычные кнопки узла
    if (node.data?.buttons) {
      if (isLoggingEnabled()) {
        console.log(`📊 Узел ${node.id} имеет ${node.data.buttons.length} кнопок`);
      }
      
      node.data.buttons.forEach((button: Button, index: number) => {
        if (isLoggingEnabled()) {
          console.log(`  🔘 Кнопка ${index}: "${button.text}" (action: ${button.action}, target: ${button.target})`);
        }
        
        if (button.action === 'goto' && button.target) {
          const commandCallback = `cmd_${button.target.replace('/', '')}`;
          if (isLoggingEnabled()) {
            console.log(`✅ НАЙДЕНА кнопка команды: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
          }
          commandButtons.add(commandCallback);
        }
      });
    } else {
      if (isLoggingEnabled()) {
        console.log(`ℹ️ Узел ${node.id} не имеет кнопок`);
      }
    }

    // Кнопки в условных сообщениях
    if (node.data?.conditionalMessages) {
      if (isLoggingEnabled()) {
        console.log(`📋 Узел ${node.id} имеет ${node.data.conditionalMessages.length} условных сообщений`);
      }
      
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            if (isLoggingEnabled()) {
              console.log(`  🔘 Условная кнопка: "${button.text}" (action: ${button.action}, target: ${button.target})`);
            }
            
            if (button.action === 'goto' && button.target) {
              const commandCallback = `cmd_${button.target.replace('/', '')}`;
              if (isLoggingEnabled()) {
                console.log(`✅ НАЙДЕНА кнопка команды в условном сообщении: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
              }
              commandButtons.add(commandCallback);
            }
          });
        }
      });
    }
  });
  
  return commandButtons;
};
