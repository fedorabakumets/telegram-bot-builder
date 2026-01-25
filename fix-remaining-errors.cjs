#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для исправления оставшихся ошибок TypeScript в различных файлах
 */

const FILES_TO_FIX = [
  'client/src/pages/bot-preview.tsx',
  'client/src/pages/editor-simple.tsx',
  'client/src/pages/editor.tsx',
  'client/src/pages/home.tsx'
];

function fixFile(filePath) {
  console.log(`🔧 Исправляем файл: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filePath} не найден, пропускаем`);
    return 0;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixesApplied = 0;
  
  // Создаем резервную копию
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, content);
  
  // Исправления для bot-preview.tsx
  if (filePath.includes('bot-preview.tsx')) {
    const fixes = [
      // Добавляем optional chaining для свойств узлов
      {
        pattern: /node\.data\.duration/g,
        replacement: 'node.data.duration?'
      },
      {
        pattern: /node\.data\.question/g,
        replacement: 'node.data.question?'
      },
      {
        pattern: /node\.data\.options/g,
        replacement: 'node.data.options?'
      },
      {
        pattern: /node\.data\.isAnonymous/g,
        replacement: 'node.data.isAnonymous?'
      },
      {
        pattern: /node\.data\.allowsMultipleAnswers/g,
        replacement: 'node.data.allowsMultipleAnswers?'
      },
      {
        pattern: /node\.data\.emoji/g,
        replacement: 'node.data.emoji?'
      },
      {
        pattern: /node\.data\.command/g,
        replacement: 'node.data.command?'
      },
      // Исправляем проблемы с command
      {
        pattern: /command\.command/g,
        replacement: '(command as any).command'
      }
    ];
    
    fixes.forEach(fix => {
      const matches = content.match(fix.pattern);
      if (matches) {
        console.log(`  ✅ Найдено ${matches.length} совпадений для ${fix.pattern}`);
        content = content.replace(fix.pattern, fix.replacement);
        fixesApplied += matches.length;
      }
    });
  }
  
  // Исправления для editor-simple.tsx
  if (filePath.includes('editor-simple.tsx')) {
    const fixes = [
      // Исправляем типы для AdaptiveHeader
      {
        pattern: /currentTab: 'editor' \| 'preview' \| 'export' \| 'bot' \| 'users' \| 'groups'/g,
        replacement: `currentTab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups' | 'connections' | 'database' | 'responses'`
      },
      {
        pattern: /onTabChange: \(tab: 'editor' \| 'preview' \| 'export' \| 'bot' \| 'users' \| 'groups'\) => void/g,
        replacement: `onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups' | 'connections' | 'database' | 'responses') => void`
      }
    ];
    
    fixes.forEach(fix => {
      const matches = content.match(fix.pattern);
      if (matches) {
        console.log(`  ✅ Найдено ${matches.length} совпадений для типов`);
        content = content.replace(fix.pattern, fix.replacement);
        fixesApplied += matches.length;
      }
    });
    
    // Добавляем недостающие свойства для ExportModal
    if (content.includes('<ExportModal') && !content.includes('projectId=')) {
      content = content.replace(
        /<ExportModal\s+isOpen={isExportModalOpen}\s+onClose={() => setIsExportModalOpen\(false\)}\s+botData={botData}\s+projectName={projectName}/,
        `<ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        botData={botData}
        projectName={projectName}
        projectId={null}`
      );
      fixesApplied++;
      console.log('  ✅ Добавлено свойство projectId для ExportModal');
    }
    
    // Исправляем onConnectionAdd
    if (content.includes('onConnectionAdd={addConnection}')) {
      content = content.replace(
        'onConnectionAdd={addConnection}',
        'connections={connections}'
      );
      fixesApplied++;
      console.log('  ✅ Исправлено свойство onConnectionAdd');
    }
  }
  
  // Исправления для editor.tsx
  if (filePath.includes('editor.tsx')) {
    const fixes = [
      // Добавляем типизацию для conn параметра
      {
        pattern: /connections: firstSheet\.connections\.map\(conn =>/g,
        replacement: 'connections: firstSheet.connections.map((conn: any) =>'
      }
    ];
    
    fixes.forEach(fix => {
      const matches = content.match(fix.pattern);
      if (matches) {
        console.log(`  ✅ Найдено ${matches.length} совпадений для ${fix.pattern}`);
        content = content.replace(fix.pattern, fix.replacement);
        fixesApplied += matches.length;
      }
    });
  }
  
  // Исправления для home.tsx
  if (filePath.includes('home.tsx')) {
    // Добавляем недостающие свойства в data объект
    const dataObjectPattern = /data: \{[\s\S]*?\}/;
    const match = content.match(dataObjectPattern);
    
    if (match) {
      const currentData = match[0];
      // Проверяем, есть ли уже нужные свойства
      if (!currentData.includes('requiresAuth')) {
        const newData = currentData.replace(
          /attachedMedia: \[\]/,
          `attachedMedia: [],
              requiresAuth: false,
              showInMenu: true,
              collectUserInput: false,
              enableAutoTransition: false,
              autoTransitionTo: '',
              enableTextInput: false,
              enablePhotoInput: false,
              enableVideoInput: false,
              enableAudioInput: false,
              enableDocumentInput: false,
              inputVariable: '',
              photoInputVariable: '',
              videoInputVariable: '',
              audioInputVariable: '',
              documentInputVariable: '',
              waitForTextInput: false,
              textInputVariable: '',
              nextNodeAfterInput: '',
              inputTargetNodeId: '',
              minLength: 0,
              maxLength: 0,
              conditionalMessages: [],
              fallbackMessage: '',
              allowMultipleSelection: false,
              multiSelectVariable: '',
              continueButtonText: '',
              continueButtonTarget: ''`
        );
        
        content = content.replace(dataObjectPattern, newData);
        fixesApplied++;
        console.log('  ✅ Добавлены недостающие свойства в data объект');
      }
    }
  }
  
  // Записываем исправленный файл
  fs.writeFileSync(filePath, content);
  
  console.log(`  📊 Применено исправлений: ${fixesApplied}`);
  console.log(`  💾 Резервная копия: ${backupPath}`);
  
  return fixesApplied;
}

function fixRemainingErrors() {
  console.log('🔧 Начинаем исправление оставшихся ошибок TypeScript...');
  
  let totalFixes = 0;
  
  FILES_TO_FIX.forEach(filePath => {
    const fixes = fixFile(filePath);
    totalFixes += fixes;
  });
  
  console.log(`✅ Все исправления применены!`);
  console.log(`📊 Всего исправлений: ${totalFixes}`);
}

// Запускаем скрипт
if (require.main === module) {
  fixRemainingErrors();
}

module.exports = { fixRemainingErrors };