import { processCodeWithAutoComments, setCommentsEnabled } from '../utils/generateGeneratedComment.js';

// Тест для проверки влияния processCodeWithAutoComments на генерацию кода
console.log('Тест влияния processCodeWithAutoComments на генерацию кода...\n');

// Пример кода, который может быть сгенерирован в generateStartHandler
const sampleCodeLines = [
  '@dp.message(CommandStart())',
  'async def start_handler(message: types.Message):',
  '    # Регистрируем пользователя в системе',
  '    user_id = message.from_user.id',
  '    username = message.from_user.username',
  '    first_name = message.from_user.first_name',
  '    last_name = message.from_user.last_name',
  '',
  '    # Сохраняем пользователя в базу данных',
  '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)',
  ''
];

console.log('Тест 1: processCodeWithAutoComments с включёнными комментариями');
setCommentsEnabled(true);
const resultWithComments = processCodeWithAutoComments([...sampleCodeLines], 'generateStartHandler.ts');
console.log('Результат с комментариями:');
resultWithComments.forEach((line, index) => console.log(`${index + 1}: ${line}`));
console.log('');

console.log('Тест 2: processCodeWithAutoComments с отключёнными комментариями');
setCommentsEnabled(false);
const resultWithoutComments = processCodeWithAutoComments([...sampleCodeLines], 'generateStartHandler.ts');
console.log('Результат без комментариев:');
resultWithoutComments.forEach((line, index) => console.log(`${index + 1}: ${line}`));
console.log('');

console.log('Тест 3: Сравнение результатов');
const cleanResultWithComments = resultWithComments.filter(line => !line.includes('Код сгенерирован в'));
const cleanResultWithoutComments = resultWithoutComments;

if (JSON.stringify(cleanResultWithComments) === JSON.stringify(cleanResultWithoutComments)) {
  console.log('✓ Результаты идентичны после удаления комментариев о генерации');
} else {
  console.log('✗ Результаты различаются');
  console.log('С откл. комментариями:', cleanResultWithoutComments.length, 'строк');
  console.log('С вкл. комментариями:', cleanResultWithComments.length, 'строк');
}