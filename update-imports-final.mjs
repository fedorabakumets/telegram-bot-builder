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
  }
  
  // Получаем абсолютный путь к целевому файлу внутри lib
  const toAbsolutePath = path.resolve(libDir, toImport);
  
  // Получаем относительный путь от fromDir к toAbsolutePath
  let relativePath = path.relative(fromDir, toAbsolutePath);
  
  // Заменяем обратные слэши на обычные (для Windows)
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Если путь не начинается с '..', значит нужно подняться на уровень выше
  if (!relativePath.startsWith('../')) {
    if (relativePath.startsWith('/')) {
      relativePath = '.' + relativePath;
    } else {
      relativePath = './' + relativePath;
    }
  }
  
  // Убираем расширение .ts или .js, если оно есть
  if (relativePath.endsWith('.ts') || relativePath.endsWith('.js')) {
    relativePath = relativePath.slice(0, -3);
  }
  
  return relativePath;
}

// Рекурсивная функция для обработки всех файлов в директории
function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Рекурсивно обрабатываем поддиректории
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      // Обрабатываем только TS и JS файлы
      processFile(fullPath);
    }
  }
}

// Функция для обработки одного файла
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Регулярное выражение для поиска импортов с '@/lib/'
  const importRegex = /(from\s+["'])@(\/lib\/[^"']*)(["'])/g;
  
  let updatedContent = content;
  let match;
  
  // Проверяем, содержит ли файл импорты '@/lib/'
  const hasLibImports = importRegex.test(content);
  if (!hasLibImports) {
    return; // Нет импортов '@/lib/', пропускаем файл
  }
  
  // Сбрасываем lastIndex регулярного выражения
  importRegex.lastIndex = 0;
  
  // Заменяем все импорты '@/lib/' на относительные пути
  while ((match = importRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const fromPart = match[1];
    const importPath = match[2];
    const toPart = match[3];
    
    // Пропускаем импорты, содержащие '@shared/schema'
    if (importPath.includes('@shared/schema')) {
      continue;
    }
    
    const relativePath = getRelativePath(filePath, importPath);
    const newImport = fromPart + relativePath + toPart;
    
    // Заменяем вхождение в контенте
    updatedContent = updatedContent.replace(fullMatch, newImport);
  }
  
  // Если контент изменился, записываем его обратно в файл
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Откатываем изменения для проверки работы нового скрипта
const changedFiles = [
  'client/src/lib/collect/collectConditionalMessageButtons.ts',
  'client/src/lib/format/generateAttachedMediaSendCode.ts',
  'client/src/lib/generate/generate-reply-button-handlers.ts',
  'client/src/lib/has/hasCommandButtons.ts',
  'client/src/lib/validate/validateBotStructure.ts'
];

for (const file of changedFiles) {
  if (fs.existsSync(file)) {
    const originalContent = fs.readFileSync(file, 'utf8');
    const revertedContent = originalContent.replace(/from\s+"(\.\.\/)+lib\//g, 'from "@/lib/');
    if (originalContent !== revertedContent) {
      fs.writeFileSync(file, revertedContent, 'utf8');
    }
  }
}

// Запускаем обработку
processDirectory(libDir);

console.log('Import update process completed.');