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
  const importRegex = /(from\s+["'])(@(\/lib\/[^"']*))(["'])/g;
  
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
    const quote = match[4];
    
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

// Запускаем обработку
processDirectory(libDir);

console.log('Import update process completed.');