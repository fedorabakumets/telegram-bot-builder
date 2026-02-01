const fs = require('fs');
const path = require('path');

// Путь к папке lib
const libDir = './client/src/lib';

// Функция для получения относительного пути
function getRelativePath(fromFile, toImport) {
  // Получаем директорию исходного файла
  const fromDir = path.dirname(fromFile);
  
  // Если импорт начинается с '@/lib/', удаляем этот префикс
  if (toImport.startsWith('@/lib/')) {
    toImport = toImport.substring(6); // Удаляем '@/lib/'
  }
  
  // Получаем абсолютный путь к целевому файлу/директории
  const toAbsolutePath = path.resolve(libDir, toImport);
  
  // Получаем относительный путь от fromDir к toAbsolutePath
  let relativePath = path.relative(fromDir, toAbsolutePath);
  
  // Если путь не начинается с '..', добавляем './'
  if (!relativePath.startsWith('../') && !relativePath.startsWith('./')) {
    relativePath = './' + relativePath;
  }
  
  // Заменяем обратные слэши на обычные (для Windows)
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Если путь указывает на файл в той же директории, добавляем './'
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
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

// Запускаем обработку
processDirectory(libDir);

console.log('Import update process completed.');