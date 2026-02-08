import fs from 'fs';
import path from 'path';

// Функция для поиска и исправления асинхронных функций с проблемами возврата
function fixAsyncFunctionReturns(content) {
  // Регулярное выражение для поиска асинхронных функций с try-catch блоками
  // которое находит случаи, где в catch блоке нет return перед res.json()
  const regex = /(catch\s*\([^)]*\)\s*\{[\s\S]*?)(res\.status\(\d+\)\.json\s*\()/g;

  let match;
  let fixedContent = content;
  let hasChanges = false;

  while ((match = regex.exec(content)) !== null) {
    const fullCatchBlock = match[0];
    const catchStart = match.index;
    const catchEnd = catchStart + fullCatchBlock.length;

    // Проверяем, есть ли уже return перед res.json() в этом catch блоке
    const beforeJsonCall = content.substring(0, catchEnd);
    const lastReturnIndex = beforeJsonCall.lastIndexOf('return ');
    const lastResJsonIndex = beforeJsonCall.lastIndexOf('res.status');

    if (lastReturnIndex < lastResJsonIndex) {
      // Нужно добавить return перед res.status
      const beforePart = fixedContent.substring(0, catchEnd - fullCatchBlock.length + match[1].length);
      const afterPart = fixedContent.substring(catchEnd - fullCatchBlock.length + match[1].length);

      // Находим, где начинается вызов res.status в catch блоке
      const resStatusMatch = /res\.status\(\d+\)\.json\s*\(/.exec(match[1]);
      if (resStatusMatch) {
        const positionToAddReturn = catchStart + resStatusMatch.index;

        fixedContent =
          fixedContent.substring(0, positionToAddReturn) +
          'return ' +
          fixedContent.substring(positionToAddReturn);

        hasChanges = true;
      }
    }
  }

  return { fixedContent, hasChanges };
}

// Функция для обработки всех TS файлов в проекте
function processFiles() {
  const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && !file.startsWith('.')) {
          walkSync(filePath, filelist);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(filePath);
      }
    });
    return filelist;
  };

  const tsFiles = walkSync('.');

  let totalFixed = 0;

  for (const filePath of tsFiles) {
    if (filePath.includes('node_modules')) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { fixedContent, hasChanges } = fixAsyncFunctionReturns(content);

      if (hasChanges) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`Исправлен файл: ${filePath}`);
        totalFixed++;
      }
    } catch (error) {
      console.error(`Ошибка при обработке файла ${filePath}:`, error.message);
    }
  }

  console.log(`Всего исправлено файлов: ${totalFixed}`);
}

processFiles();