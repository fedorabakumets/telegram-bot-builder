import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Преобразуем URL в путь к файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к папке lib
const libDir = path.join(__dirname, 'client', 'src', 'lib');

// Тестируем конкретный случай
const fromFile = path.join(__dirname, 'client', 'src', 'lib', 'collect', 'collectConditionalMessageButtons.ts');
const importPath = '@/lib/bot-generator';

console.log('fromFile:', fromFile);
console.log('dirname(fromFile):', path.dirname(fromFile));
console.log('libDir:', libDir);
console.log('importPath:', importPath);

// Удаляем '@/lib/' префикс
const targetPath = importPath.substring(6); // Удаляем '@/lib/'
console.log('targetPath after removing prefix:', targetPath);

// Проверяем, существует ли файл
const tsPath = path.resolve(libDir, targetPath + '.ts');
const jsPath = path.resolve(libDir, targetPath + '.js');
const indexPath = path.resolve(libDir, targetPath, 'index.ts');
const indexJsPath = path.resolve(libDir, targetPath, 'index.js');

console.log('Checking for files:');
console.log('  tsPath:', tsPath, 'exists:', fs.existsSync(tsPath));
console.log('  jsPath:', jsPath, 'exists:', fs.existsSync(jsPath));
console.log('  indexPath:', indexPath, 'exists:', fs.existsSync(indexPath));
console.log('  indexJsPath:', indexJsPath, 'exists:', fs.existsSync(indexJsPath));

// Определяем, какой файл использовать
let toAbsolutePath;
if (fs.existsSync(tsPath)) {
  toAbsolutePath = tsPath;
  console.log('Using ts file');
} else if (fs.existsSync(jsPath)) {
  toAbsolutePath = jsPath;
  console.log('Using js file');
} else if (fs.existsSync(indexPath)) {
  toAbsolutePath = indexPath;
  console.log('Using index.ts file');
} else if (fs.existsSync(indexJsPath)) {
  toAbsolutePath = indexJsPath;
  console.log('Using index.js file');
} else {
  // Если ничего не найдено, просто используем путь как есть
  toAbsolutePath = path.resolve(libDir, targetPath);
  console.log('Using raw path');
}

console.log('toAbsolutePath:', toAbsolutePath);

// Получаем относительный путь
const relativePath = path.relative(path.dirname(fromFile), toAbsolutePath);
console.log('relativePath:', relativePath);

// Заменяем обратные слэши
const normalizedPath = relativePath.replace(/\\/g, '/');
console.log('normalizedPath:', normalizedPath);

// Убираем расширение .ts
let finalPath = normalizedPath;
if (finalPath.endsWith('.ts')) {
  finalPath = finalPath.slice(0, -3);
} else if (finalPath.endsWith('.js')) {
  finalPath = finalPath.slice(0, -3);
}

console.log('finalPath:', finalPath);