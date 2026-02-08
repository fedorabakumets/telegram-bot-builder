import fs from 'fs';
import path from 'path';

// Функция для поиска и исправления асинхронных функций с проблемами возврата
function fixAsyncFunctionReturns(content) {
  let fixedContent = content;
  let hasChanges = false;
  
  // Регулярное выражение для поиска асинхронных функций с try-catch блоками
  // которое находит случаи, где в catch блоке нет return перед res.json() или res.status().json()
  const regex = /(catch\s*\([^)]*\)\s*\{(?:\s*\/\/.*\n)*\s*(?:[^{}]*(?:\{[^{}]*\}[^{}]*)*[^{}]*)*)(res\.(?:json|status\([^)]+\)\.json))/g;
  
  let match;
  while ((match = regex.exec(fixedContent)) !== null) {
    const catchBlock = match[1];
    const resCall = match[2];
    const fullMatch = match[0];
    const matchIndex = match.index;
    
    // Проверяем, есть ли уже return перед вызовом res
    const lastReturnIndex = catchBlock.lastIndexOf('return ');
    const lastResIndex = catchBlock.lastIndexOf(resCall);
    
    if (lastReturnIndex < lastResIndex || lastReturnIndex === -1) {
      // Нужно добавить return перед res вызовом
      const resCallPosition = matchIndex + catchBlock.length;
      const resCallMatch = new RegExp(resCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).exec(fixedContent.substring(resCallPosition));
      
      if (resCallMatch) {
        const actualResCallPosition = resCallPosition + resCallMatch.index;
        fixedContent = 
          fixedContent.substring(0, actualResCallPosition) + 
          'return ' + 
          fixedContent.substring(actualResCallPosition);
        hasChanges = true;
        // Обновляем content для следующей итерации
        content = fixedContent;
        regex.lastIndex = 0; // Сброс для повторного поиска с начала
        break; // Прерываем и начинаем заново, чтобы избежать проблем с индексами
      }
    }
  }
  
  return { fixedContent, hasChanges };
}

// Функция для поиска всех асинхронных функций, которые могут содержать проблему
function fixMissingReturnsInAsyncFunctions(content) {
  let fixedContent = content;
  let hasChanges = false;
  
  // Регулярное выражение для поиска асинхронных функций
  const asyncFuncRegex = /async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}/g;
  
  let funcMatch;
  while ((funcMatch = asyncFuncRegex.exec(fixedContent)) !== null) {
    const fullFunc = funcMatch[0];
    const funcBody = funcMatch[1];
    const funcStartIndex = funcMatch.index;
    
    // Проверяем, есть ли в теле функции try-catch блок
    if (funcBody.includes('try') && funcBody.includes('catch')) {
      // Находим все catch блоки внутри функции
      const catchRegex = /(catch\s*\([^)]*\)\s*\{(?:\s*\/\/.*\n)*\s*(?:[^{}]*(?:\{[^{}]*\}[^{}]*)*[^{}]*)*)(res\.(?:json|status\([^)]+\)\.json))/g;
      
      let catchMatch;
      while ((catchMatch = catchRegex.exec(funcBody)) !== null) {
        const catchBlock = catchMatch[1];
        const resCall = catchMatch[2];
        const fullCatchMatch = catchMatch[0];
        const catchMatchIndex = funcStartIndex + 1 + catchMatch.index; // +1 для учета открывающей скобки =>
        
        // Проверяем, есть ли return перед res вызовом в этом catch блоке
        const lastReturnIndex = catchBlock.lastIndexOf('return ');
        const lastResIndex = catchBlock.lastIndexOf(resCall);
        
        if (lastReturnIndex < lastResIndex || lastReturnIndex === -1) {
          // Нужно добавить return перед res вызовом
          const resCallPosition = catchMatchIndex + catchBlock.length;
          const resCallMatch = new RegExp(resCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).exec(fixedContent.substring(resCallPosition));
          
          if (resCallMatch) {
            const actualResCallPosition = resCallPosition + resCallMatch.index;
            fixedContent = 
              fixedContent.substring(0, actualResCallPosition) + 
              'return ' + 
              fixedContent.substring(actualResCallPosition);
            hasChanges = true;
            
            // Обновляем content для следующей итерации
            content = fixedContent;
            asyncFuncRegex.lastIndex = 0; // Сброс для повторного поиска с начала
            break; // Прерываем внутренний цикл и начинаем заново
          }
        }
      }
      
      if (hasChanges) {
        break; // Прерываем внешний цикл и начинаем заново
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
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      
      // Применяем оба метода исправления
      let result1 = fixAsyncFunctionReturns(content);
      if (result1.hasChanges) {
        content = result1.fixedContent;
        hasChanges = true;
      }
      
      let result2 = fixMissingReturnsInAsyncFunctions(content);
      if (result2.hasChanges) {
        content = result2.fixedContent;
        hasChanges = true;
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
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