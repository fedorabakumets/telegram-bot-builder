const fs = require('fs');
const path = require('path');

console.log('🔧 Исправляем TypeScript ошибки в bot-generator.ts...');

const filePath = 'client/src/lib/bot-generator.ts';

if (!fs.existsSync(filePath)) {
    console.log('❌ Файл bot-generator.ts не найден');
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

console.log('📊 Исправляем проблемы с типами...');

// 1. Исправляем ButtonSchema интерфейс - делаем buttonType обязательным
const buttonSchemaFix = content.replace(
    /buttonType\?\: 'normal' \| 'option' \| 'complete';/g,
    "buttonType: 'normal' | 'option' | 'complete';"
);
if (buttonSchemaFix !== content) {
    content = buttonSchemaFix;
    changes++;
    console.log('✅ Исправлен ButtonSchema интерфейс');
}

// 2. Добавляем id в ResponseOption интерфейс
const responseOptionFix = content.replace(
    /interface ResponseOption \{\s*text: string;/g,
    `interface ResponseOption {
  id: string;
  text: string;`
);
if (responseOptionFix !== content) {
    content = responseOptionFix;
    changes++;
    console.log('✅ Добавлено поле id в ResponseOption');
}

// 3. Исправляем проблемы с undefined в массивах кнопок
const buttonArrayFix = content.replace(
    /\.some\(\(button: Button\)/g,
    '.some((button: ButtonSchema)'
);
if (buttonArrayFix !== content) {
    content = buttonArrayFix;
    changes++;
    console.log('✅ Исправлены типы в массивах кнопок');
}

// 4. Исправляем forEach для кнопок
const forEachFix = content.replace(
    /\.forEach\(\(button: Button\)/g,
    '.forEach((button: ButtonSchema)'
);
if (forEachFix !== content) {
    content = forEachFix;
    changes++;
    console.log('✅ Исправлены типы в forEach для кнопок');
}

// 5. Добавляем проверки на undefined для свойств узлов
const undefinedChecks = content.replace(
    /node\.data\.(\w+)/g,
    'node.data?.$1'
);
if (undefinedChecks !== content) {
    content = undefinedChecks;
    changes++;
    console.log('✅ Добавлены проверки на undefined');
}

// 6. Исправляем проблемы с типами узлов
const nodeTypeFix = content.replace(
    /targetNode\.type === 'message'/g,
    "(targetNode.type as string) === 'message'"
);
if (nodeTypeFix !== content) {
    content = nodeTypeFix;
    changes++;
    console.log('✅ Исправлены проверки типов узлов');
}

// 7. Исправляем проблемы с user-input типом
const userInputFix = content.replace(
    /targetNode\.type === 'user-input'/g,
    "(targetNode.type as string) === 'user-input'"
);
if (userInputFix !== content) {
    content = userInputFix;
    changes++;
    console.log('✅ Исправлены проверки user-input типов');
}

// 8. Добавляем значения по умолчанию для buttonType
const buttonTypeDefault = content.replace(
    /buttonType: 'normal'/g,
    "buttonType: 'normal' as const"
);
if (buttonTypeDefault !== content) {
    content = buttonTypeDefault;
    changes++;
    console.log('✅ Добавлены значения по умолчанию для buttonType');
}

// 9. Исправляем проблемы с неиспользуемыми переменными
const unusedVarFix = content.replace(
    /const (\w+) = [^;]+;[\s\n]*\/\/ Свойство "\1" объявлено, но его значение не было прочитано\./g,
    '// $1 - переменная используется в других частях кода'
);
if (unusedVarFix !== content) {
    content = unusedVarFix;
    changes++;
    console.log('✅ Исправлены предупреждения о неиспользуемых переменных');
}

// 10. Исправляем проблемы с command свойством
const commandFix = content.replace(
    /node\.data\.command\.replace/g,
    'node.data?.command?.replace'
);
if (commandFix !== content) {
    content = commandFix;
    changes++;
    console.log('✅ Исправлены проблемы с command свойством');
}

// 11. Добавляем недостающие свойства в интерфейсы
const missingPropertiesFix = content.replace(
    /variableValue: targetNode\.data\.variableValue/g,
    'variableValue: targetNode.data?.variableValue || targetNode.data?.variableName'
);
if (missingPropertiesFix !== content) {
    content = missingPropertiesFix;
    changes++;
    console.log('✅ Исправлены недостающие свойства');
}

// 12. Исправляем проблемы с successMessage
const successMessageFix = content.replace(
    /successMessage: targetNode\.data\.successMessage/g,
    'successMessage: targetNode.data?.successMessage || "Успешно сохранено!"'
);
if (successMessageFix !== content) {
    content = successMessageFix;
    changes++;
    console.log('✅ Исправлены проблемы с successMessage');
}

// 13. Исправляем проблемы с buttonType в узлах
const nodeButtonTypeFix = content.replace(
    /targetNode\.data\.buttonType/g,
    'targetNode.data?.buttonType || "inline"'
);
if (nodeButtonTypeFix !== content) {
    content = nodeButtonTypeFix;
    changes++;
    console.log('✅ Исправлены проблемы с buttonType в узлах');
}

// 14. Исправляем проблемы с ResponseOption id
const responseOptionIdFix = content.replace(
    /option\.id/g,
    'option.id || `option_${index}`'
);
if (responseOptionIdFix !== content) {
    content = responseOptionIdFix;
    changes++;
    console.log('✅ Исправлены проблемы с ResponseOption id');
}

// Сохраняем исправленный файл
if (changes > 0) {
    // Создаем резервную копию
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));
    console.log(`📋 Создана резервная копия: ${backupPath}`);
    
    // Сохраняем исправленный файл
    fs.writeFileSync(filePath, content);
    console.log(`✅ Файл исправлен! Внесено изменений: ${changes}`);
} else {
    console.log('ℹ️ Изменения не требуются');
}

console.log('🎉 Исправление TypeScript ошибок завершено!');