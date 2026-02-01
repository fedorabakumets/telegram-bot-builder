import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Преобразуем URL в путь к файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к папке lib
const libDir = path.join(__dirname, 'client', 'src', 'lib');

// Функция для получения относительного пути
function getRelativePath(fromFile, toImport) {
  // Получаем директорию исходного файла
  const fromDir = path.dirname(fromFile);
  
  // Если импорт начинается с '@/lib/', удаляем этот префикс
  if (toImport.startsWith('@/lib/')) {
    toImport = toImport.substring(6); // Удаляем '@/lib/'
    
    // Убираем начальный слеш, если он есть (чтобы путь не был абсолютным)
    if (toImport.startsWith('/')) {
      toImport = toImport.substring(1);
    }
  }
  
  // Определяем, является ли это файлом или директорией
  let toAbsolutePath;
  if (fs.existsSync(path.resolve(libDir, toImport + '.ts'))) {
    toAbsolutePath = path.resolve(libDir, toImport + '.ts');
  } else if (fs.existsSync(path.resolve(libDir, toImport + '.js'))) {
    toAbsolutePath = path.resolve(libDir, toImport + '.js');
  } else if (fs.existsSync(path.resolve(libDir, toImport, 'index.ts'))) {
    toAbsolutePath = path.resolve(libDir, toImport, 'index.ts');
  } else if (fs.existsSync(path.resolve(libDir, toImport, 'index.js'))) {
    toAbsolutePath = path.resolve(libDir, toImport, 'index.js');
  } else {
    // Если ничего не найдено, просто используем путь как есть
    toAbsolutePath = path.resolve(libDir, toImport);
  }

  // Получаем относительный путь от fromDir к toAbsolutePath
  let relativePath = path.relative(fromDir, toAbsolutePath);
  
  // Заменяем обратные слэши на обычные (для Windows)
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Если путь не начинается с '..', значит нужно подняться на уровень выше
  if (!relativePath.startsWith('../') && relativePath !== '' && !relativePath.startsWith('./')) {
    relativePath = './' + relativePath;
  }
  
  // Убираем расширение .ts или .js, если оно есть
  if (relativePath.endsWith('.ts')) {
    relativePath = relativePath.slice(0, -3);
  } else if (relativePath.endsWith('.js')) {
    relativePath = relativePath.slice(0, -3);
  }
  
  return relativePath;
}

// Обработка одного файла для тестирования
const filePath = path.join(__dirname, 'client', 'src', 'lib', 'collect', 'collectConditionalMessageButtons.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Возвращаем файл к исходному состоянию
fs.writeFileSync(filePath, 'import { Button } from "@/lib/bot-generator";\nimport { Node } from "@shared/schema";\n\n/**\n * Интерфейс условной кнопки сообщения\n */\ninterface ConditionalMessageButton {\n  action: string;\n  label: string;\n  [key: string]: unknown;\n}\n\n/**\n * Интерфейс условного сообщения\n */\ninterface ConditionalMessage {\n  condition: string;\n  message: string;\n  buttons?: Button[];\n  [key: string]: unknown;\n}\n\n/**\n * Интерфейс данных узла\n */\ninterface NodeData {\n  conditionalMessageButtons?: ConditionalMessageButton[];\n  conditionalMessages?: ConditionalMessage[];\n  [key: string]: unknown;\n}\n\n\n/**\n * Вспомогательная функция для сбора кнопок из условных сообщений\n * @param {Node[]} nodes - Массив узлов для извлечения кнопок\n * @param {Set<string>} allConditionalButtons - Множество кнопок для обновления\n */\n\nexport function collectConditionalMessageButtons(nodes: Node[], allConditionalButtons: Set<string>): void {\n  // Собираем кнопки из условных сообщений\n  (nodes || []).forEach((node: Node) => {\n    if (node.data.conditionalMessages) {\n      node.data.conditionalMessages.forEach((condition: any) => {\n        if (condition.buttons) {\n          condition.buttons.forEach((button: Button) => {\n            if (button.action === \'goto\' && button.target) {\n              allConditionalButtons.add(button.target);\n            }\n          });\n        }\n      });\n    }\n  });\n}\n');

// Регулярное выражение для поиска импортов с '@/lib/' - теперь с тремя группами
const importRegex = /(from\s+["'])(@(\/lib\/[^"']*))(["'])/g;

let updatedContent = content;
let match;

// Проверяем, содержит ли файл импорты '@/lib/'
const hasLibImports = importRegex.test(content);

if (hasLibImports) {
  // Сбрасываем lastIndex регулярного выражения
  importRegex.lastIndex = 0;
  
  // Заменяем все импорты '@/lib/' на относительные пути
  while ((match = importRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const fromPart = match[1];  // например, 'from "'
    const importPath = match[2];  // например, '@/lib/bot-generator'
    const quote = match[3];  // например, '"'
    
    // Пропускаем импорты, содержащие '@shared/schema'
    if (importPath.includes('@shared/schema')) {
      continue;
    }
    
    const relativePath = getRelativePath(filePath, importPath);
    const newImport = fromPart + relativePath + quote;
    
    // Заменяем вхождение в контенте
    updatedContent = updatedContent.replace(fullMatch, newImport);
  }
  
  // Если контент изменился, записываем его обратно в файл
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

console.log('Processing completed.');