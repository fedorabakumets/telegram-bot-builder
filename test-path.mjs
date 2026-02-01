import path from 'path';

// Пример: 
// fromFile: client/src/lib/collect/collectConditionalMessageButtons.ts
// toImport: @/lib/bot-generator (which should become ../bot-generator)

const libDir = 'c:/Users/1/Desktop/telegram-bot-builder/client/src/lib';
const fromFile = 'c:/Users/1/Desktop/telegram-bot-builder/client/src/lib/collect/collectConditionalMessageButtons.ts';
const toImport = '@/lib/bot-generator';

console.log('libDir:', libDir);
console.log('fromFile:', fromFile);
console.log('fromDir (dirname):', path.dirname(fromFile));

// Удаляем '@/lib/' префикс
let targetPath = toImport.substring(6); // Удаляем '@/lib/'
console.log('targetPath after removing prefix:', targetPath);

// Получаем абсолютный путь к целевому файлу
const toAbsolutePath = path.resolve(libDir, targetPath + '.ts');
console.log('toAbsolutePath:', toAbsolutePath);

// Получаем относительный путь
const relativePath = path.relative(path.dirname(fromFile), toAbsolutePath);
console.log('relativePath:', relativePath);

// Заменяем обратные слэши
const normalizedPath = relativePath.replace(/\\/g, '/');
console.log('normalizedPath:', normalizedPath);

// Проверяем, начинается ли с '../'
if (!normalizedPath.startsWith('../')) {
  if (normalizedPath.startsWith('/')) {
    console.log('Final path with ./ prefix:', '.' + normalizedPath);
  } else {
    console.log('Final path with ./ prefix:', './' + normalizedPath);
  }
} else {
  console.log('Final path (already starts with ../):', normalizedPath);
}