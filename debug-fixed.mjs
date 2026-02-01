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
  console.log(`getRelativePath called with: fromFile=${fromFile}, toImport=${toImport}`);
  
  // Получаем директорию исходного файла
  const fromDir = path.dirname(fromFile);
  console.log(`fromDir: ${fromDir}`);
  
  // Если импорт начинается с '@/lib/', удаляем этот префикс
  if (toImport.startsWith('@/lib/')) {
    toImport = toImport.substring(6); // Удаляем '@/lib/'
    console.log(`Removed '@/lib/' prefix, toImport now: ${toImport}`);
    
    // Убираем начальный слеш, если он есть (чтобы путь не был абсолютным)
    if (toImport.startsWith('/')) {
      toImport = toImport.substring(1);
      console.log(`Removed leading '/', toImport now: ${toImport}`);
    }
  }
  
  // Определяем, является ли это файлом или директорией
  let toAbsolutePath;
  if (fs.existsSync(path.resolve(libDir, toImport + '.ts'))) {
    toAbsolutePath = path.resolve(libDir, toImport + '.ts');
    console.log(`Found .ts file: ${toAbsolutePath}`);
  } else if (fs.existsSync(path.resolve(libDir, toImport + '.js'))) {
    toAbsolutePath = path.resolve(libDir, toImport + '.js');
    console.log(`Found .js file: ${toAbsolutePath}`);
  } else if (fs.existsSync(path.resolve(libDir, toImport, 'index.ts'))) {
    toAbsolutePath = path.resolve(libDir, toImport, 'index.ts');
    console.log(`Found index.ts file: ${toAbsolutePath}`);
  } else if (fs.existsSync(path.resolve(libDir, toImport, 'index.js'))) {
    toAbsolutePath = path.resolve(libDir, toImport, 'index.js');
    console.log(`Found index.js file: ${toAbsolutePath}`);
  } else {
    // Если ничего не найдено, просто используем путь как есть
    toAbsolutePath = path.resolve(libDir, toImport);
    console.log(`Using raw path: ${toAbsolutePath}`);
  }

  // Получаем относительный путь от fromDir к toAbsolutePath
  let relativePath = path.relative(fromDir, toAbsolutePath);
  console.log(`Relative path: ${relativePath}`);
  
  // Заменяем обратные слэши на обычные (для Windows)
  relativePath = relativePath.replace(/\\/g, '/');
  console.log(`Normalized path: ${relativePath}`);
  
  // Если путь не начинается с '..', значит нужно подняться на уровень выше
  if (!relativePath.startsWith('../') && relativePath !== '' && !relativePath.startsWith('./')) {
    relativePath = './' + relativePath;
    console.log(`Added './' prefix: ${relativePath}`);
  }
  
  // Убираем расширение .ts или .js, если оно есть
  if (relativePath.endsWith('.ts')) {
    relativePath = relativePath.slice(0, -3);
    console.log(`Removed .ts extension: ${relativePath}`);
  } else if (relativePath.endsWith('.js')) {
    relativePath = relativePath.slice(0, -3);
    console.log(`Removed .js extension: ${relativePath}`);
  }
  
  console.log(`Final relative path: ${relativePath}`);
  return relativePath;
}

// Обработка одного файла для тестирования
const filePath = path.join(__dirname, 'client', 'src', 'lib', 'collect', 'collectConditionalMessageButtons.ts');
const content = fs.readFileSync(filePath, 'utf8');

console.log(`Processing file: ${filePath}`);

// Регулярное выражение для поиска импортов с '@/lib/'
const importRegex = /(from\s+["'])@(\/lib\/[^"']*)(["'])/g;

let updatedContent = content;
let match;

// Проверяем, содержит ли файл импорты '@/lib/'
const hasLibImports = importRegex.test(content);
console.log(`File has '@/lib/' imports: ${hasLibImports}`);

if (hasLibImports) {
  // Сбрасываем lastIndex регулярного выражения
  importRegex.lastIndex = 0;
  
  // Заменяем все импорты '@/lib/' на относительные пути
  while ((match = importRegex.exec(content)) !== null) {
    console.log(`Found match: ${JSON.stringify(match)}`);
    
    const fullMatch = match[0];
    const fromPart = match[1];
    const importPath = match[2];
    const toPart = match[3];
    
    // Пропускаем импорты, содержащие '@shared/schema'
    if (importPath.includes('@shared/schema')) {
      console.log('Skipping @shared/schema import');
      continue;
    }
    
    const relativePath = getRelativePath(filePath, importPath);
    const newImport = fromPart + relativePath + toPart;
    
    console.log(`Replacing: ${fullMatch} -> ${newImport}`);
    
    // Заменяем вхождение в контенте
    updatedContent = updatedContent.replace(fullMatch, newImport);
  }
  
  // Если контент изменился, записываем его обратно в файл
  if (updatedContent !== content) {
    console.log('Content changed, writing back to file');
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  }
}

console.log('Processing completed.');