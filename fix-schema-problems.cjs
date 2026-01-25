const fs = require('fs');
const path = require('path');

console.log('🗄️ Исправляем проблемы со схемой базы данных...');

const schemaPath = 'shared/schema.ts';

if (!fs.existsSync(schemaPath)) {
    console.log('❌ Файл schema.ts не найден');
    process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf8');
let changes = 0;

console.log('📊 Проверяем и исправляем схему...');

// 1. Проверяем наличие buttonSchema
if (!content.includes('export const buttonSchema')) {
    console.log('⚠️ buttonSchema не найден в экспортах');
    
    // Добавляем экспорт buttonSchema если его нет
    const buttonSchemaExport = `
// Экспорт buttonSchema для использования в других модулях
export { buttonSchema };
`;
    
    content += buttonSchemaExport;
    changes++;
    console.log('✅ Добавлен экспорт buttonSchema');
}

// 2. Проверяем корректность buttonSchema
const buttonSchemaRegex = /export const buttonSchema = z\.object\(\{[\s\S]*?\}\);/;
const buttonSchemaMatch = content.match(buttonSchemaRegex);

if (buttonSchemaMatch) {
    const buttonSchemaContent = buttonSchemaMatch[0];
    
    // Проверяем, что buttonType имеет default значение
    if (!buttonSchemaContent.includes('.default(')) {
        const fixedButtonSchema = buttonSchemaContent.replace(
            /buttonType: z\.enum\(\['normal', 'option', 'complete'\]\)/,
            "buttonType: z.enum(['normal', 'option', 'complete']).default('normal')"
        );
        
        if (fixedButtonSchema !== buttonSchemaContent) {
            content = content.replace(buttonSchemaContent, fixedButtonSchema);
            changes++;
            console.log('✅ Добавлено значение по умолчанию для buttonType');
        }
    }
} else {
    console.log('⚠️ buttonSchema не найден или имеет неправильный формат');
}

// 3. Проверяем nodeSchema
const nodeSchemaRegex = /export const nodeSchema = z\.object\(\{[\s\S]*?\}\);/;
const nodeSchemaMatch = content.match(nodeSchemaRegex);

if (nodeSchemaMatch) {
    const nodeSchemaContent = nodeSchemaMatch[0];
    
    // Добавляем недостающие поля в data объект
    const missingFields = [
        'variableValue: z.string().optional()',
        'successMessage: z.string().optional()',
        'buttonType: z.enum([\'reply\', \'inline\', \'none\']).default(\'none\')',
        'inputPrompt: z.string().optional()',
        'inputVariable: z.string().optional()',
        'collectUserInput: z.boolean().default(false)',
        'enableTextInput: z.boolean().default(false)',
        'enablePhotoInput: z.boolean().default(false)',
        'enableVideoInput: z.boolean().default(false)',
        'enableAudioInput: z.boolean().default(false)',
        'enableDocumentInput: z.boolean().default(false)',
        'allowMultipleSelection: z.boolean().default(false)',
        'multiSelectVariable: z.string().optional()',
        'continueButtonTarget: z.string().optional()',
        'continueButtonText: z.string().optional()',
        'responseType: z.enum([\'text\', \'buttons\', \'media\']).optional()',
        'responseOptions: z.array(z.object({ id: z.string(), text: z.string(), value: z.string().optional() })).default([])',
        'conditionalMessages: z.array(z.any()).default([])'
    ];
    
    let updatedNodeSchema = nodeSchemaContent;
    
    missingFields.forEach(field => {
        const fieldName = field.split(':')[0];
        if (!updatedNodeSchema.includes(fieldName + ':')) {
            // Добавляем поле перед закрывающей скобкой data объекта
            updatedNodeSchema = updatedNodeSchema.replace(
                /(\s+)(\/\/ Поддержка различных картографических сервисов[\s\S]*?)(\s+\}\))/,
                `$1$2$1${field},$3`
            );
            changes++;
            console.log(`✅ Добавлено поле ${fieldName} в nodeSchema`);
        }
    });
    
    if (updatedNodeSchema !== nodeSchemaContent) {
        content = content.replace(nodeSchemaContent, updatedNodeSchema);
    }
} else {
    console.log('⚠️ nodeSchema не найден');
}

// 4. Добавляем недостающие типы
const missingTypes = `
// Дополнительные типы для bot-generator
export type ButtonType = z.infer<typeof buttonSchema>;
export type NodeType = z.infer<typeof nodeSchema>;

// Интерфейс для условных сообщений
export interface ConditionalMessage {
  id: string;
  condition: 'user_data_exists' | 'user_data_equals' | 'user_data_not_exists' | 'user_data_contains' | 'first_time' | 'returning_user';
  variableName?: string;
  variableNames: string[];
  logicOperator: 'AND' | 'OR';
  expectedValue?: string;
  messageText: string;
  formatMode: 'text' | 'markdown' | 'html';
  keyboardType: 'reply' | 'inline' | 'none';
  buttons: ButtonType[];
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  collectUserInput: boolean;
  enableTextInput: boolean;
  enablePhotoInput: boolean;
  enableVideoInput: boolean;
  enableAudioInput: boolean;
  enableDocumentInput: boolean;
  inputVariable?: string;
  photoInputVariable?: string;
  videoInputVariable?: string;
  audioInputVariable?: string;
  documentInputVariable?: string;
  waitForTextInput: boolean;
  textInputVariable?: string;
  nextNodeAfterInput?: string;
  priority: number;
}

// Интерфейс для опций ответа
export interface ResponseOption {
  id: string;
  text: string;
  value?: string;
  action?: string;
  target?: string;
  url?: string;
}
`;

if (!content.includes('export interface ConditionalMessage')) {
    content += missingTypes;
    changes++;
    console.log('✅ Добавлены недостающие типы и интерфейсы');
}

// Сохраняем исправленный файл
if (changes > 0) {
    // Создаем резервную копию
    const backupPath = schemaPath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, fs.readFileSync(schemaPath, 'utf8'));
    console.log(`📋 Создана резервная копия: ${backupPath}`);
    
    // Сохраняем исправленный файл
    fs.writeFileSync(schemaPath, content);
    console.log(`✅ Схема исправлена! Внесено изменений: ${changes}`);
} else {
    console.log('ℹ️ Схема не требует изменений');
}

console.log('🎉 Исправление схемы базы данных завершено!');