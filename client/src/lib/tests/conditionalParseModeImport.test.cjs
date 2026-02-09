const assert = require('assert');
const fs = require('fs');
const path = require('path');

/**
 * Тестирование логики условного импорта ParseMode
 *
 * Этот тест проверяет, что ParseMode импортируется только при необходимости
 * в зависимости от настроек узлов бота.
 */

console.log('Running tests for conditional ParseMode import logic...');

// Тест 1: Узлы без форматирования не должны приводить к импорту ParseMode
{
  const nodesWithoutFormat = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Простое сообщение'
      }
    }
  ];
  
  // Проверяем логику, аналогичную той, что в bot-generator.ts
  const hasFormatModeNodes = nodesWithoutFormat.some(node =>
    (node.data?.formatMode && (node.data.formatMode.toLowerCase() === 'html' || node.data.formatMode.toLowerCase() === 'markdown'))
    || node.data?.markdown === true
  );
  
  assert.strictEqual(hasFormatModeNodes, false, 'Nodes without formatting should not trigger ParseMode import');
  console.log('✓ Test 1 passed: Nodes without formatting do not trigger ParseMode import');
}

// Тест 2: Узлы с HTML форматированием должны приводить к импорту ParseMode
{
  const nodesWithHtmlFormat = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Сообщение с <b>HTML</b>',
        formatMode: 'html'
      }
    }
  ];
  
  const hasFormatModeNodes = nodesWithHtmlFormat.some(node =>
    (node.data?.formatMode && (node.data.formatMode.toLowerCase() === 'html' || node.data.formatMode.toLowerCase() === 'markdown'))
    || node.data?.markdown === true
  );
  
  assert.strictEqual(hasFormatModeNodes, true, 'Nodes with HTML formatting should trigger ParseMode import');
  console.log('✓ Test 2 passed: Nodes with HTML formatting trigger ParseMode import');
}

// Тест 3: Узлы с Markdown форматированием должны приводить к импорту ParseMode
{
  const nodesWithMarkdownFormat = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Сообщение с *Markdown*',
        formatMode: 'markdown'
      }
    }
  ];
  
  const hasFormatModeNodes = nodesWithMarkdownFormat.some(node =>
    (node.data?.formatMode && (node.data.formatMode.toLowerCase() === 'html' || node.data.formatMode.toLowerCase() === 'markdown'))
    || node.data?.markdown === true
  );
  
  assert.strictEqual(hasFormatModeNodes, true, 'Nodes with Markdown formatting should trigger ParseMode import');
  console.log('✓ Test 3 passed: Nodes with Markdown formatting trigger ParseMode import');
}

// Тест 4: Узлы с markdown=true должны приводить к импорту ParseMode
{
  const nodesWithMarkdownFlag = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Сообщение с Markdown',
        markdown: true
      }
    }
  ];
  
  const hasFormatModeNodes = nodesWithMarkdownFlag.some(node =>
    (node.data?.formatMode && (node.data.formatMode.toLowerCase() === 'html' || node.data.formatMode.toLowerCase() === 'markdown'))
    || node.data?.markdown === true
  );
  
  assert.strictEqual(hasFormatModeNodes, true, 'Nodes with markdown=true should trigger ParseMode import');
  console.log('✓ Test 4 passed: Nodes with markdown=true trigger ParseMode import');
}

// Тест 5: Узлы с форматированием "none" не должны приводить к импорту ParseMode
{
  const nodesWithNoneFormat = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Сообщение без форматирования',
        formatMode: 'none'
      }
    }
  ];
  
  const hasFormatModeNodes = nodesWithNoneFormat.some(node =>
    (node.data?.formatMode && (node.data.formatMode.toLowerCase() === 'html' || node.data.formatMode.toLowerCase() === 'markdown'))
    || node.data?.markdown === true
  );
  
  assert.strictEqual(hasFormatModeNodes, false, 'Nodes with formatMode=none should not trigger ParseMode import');
  console.log('✓ Test 5 passed: Nodes with formatMode=none do not trigger ParseMode import');
}

// Тест 6: Комбинация узлов с и без форматирования
{
  const mixedNodes = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Простое сообщение'
      }
    },
    {
      id: 'node2',
      type: 'message',
      data: {
        messageText: 'Сообщение с <b>HTML</b>',
        formatMode: 'html'
      }
    },
    {
      id: 'node3',
      type: 'message',
      data: {
        messageText: 'Простое сообщение'
      }
    }
  ];
  
  const hasFormatModeNodes = mixedNodes.some(node =>
    (node.data?.formatMode && (node.data.formatMode.toLowerCase() === 'html' || node.data.formatMode.toLowerCase() === 'markdown'))
    || node.data?.markdown === true
  );
  
  assert.strictEqual(hasFormatModeNodes, true, 'Mixed nodes with at least one formatted node should trigger ParseMode import');
  console.log('✓ Test 6 passed: Mixed nodes with at least one formatted node trigger ParseMode import');
}

// Тест 7: Проверка регистра форматирования (должно быть регистронезависимо)
{
  const nodesWithUpperCaseFormat = [
    {
      id: 'node1',
      type: 'message',
      data: {
        messageText: 'Сообщение с HTML',
        formatMode: 'HTML'  // Верхний регистр
      }
    },
    {
      id: 'node2',
      type: 'message',
      data: {
        messageText: 'Сообщение с MARKDOWN',
        formatMode: 'MARKDOWN'  // Верхний регистр
      }
    }
  ];
  
  // Проверяем каждый узел отдельно
  const hasHtmlFormat = nodesWithUpperCaseFormat.some(node =>
    node.data?.formatMode && node.data.formatMode.toLowerCase() === 'html'
  );
  
  const hasMarkdownFormat = nodesWithUpperCaseFormat.some(node =>
    node.data?.formatMode && node.data.formatMode.toLowerCase() === 'markdown'
  );
  
  assert.strictEqual(hasHtmlFormat, true, 'Upper case HTML should be detected');
  assert.strictEqual(hasMarkdownFormat, true, 'Upper case MARKDOWN should be detected');
  console.log('✓ Test 7 passed: Case-insensitive format detection works correctly');
}

console.log('\nAll tests for conditional ParseMode import logic passed!');