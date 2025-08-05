// Тест функциональности темной темы
console.log('🌓 Начинаю тестирование темной темы...');

// Проверка 1: Наличие ThemeProvider в DOM
setTimeout(() => {
  console.log('1. Проверка HTML структуры...');
  const html = document.documentElement;
  console.log('   HTML classes:', html.className);
  console.log('   Color scheme:', getComputedStyle(html).colorScheme);

  // Проверка 2: Наличие переключателя темы
  console.log('2. Поиск переключателя темы...');
  const themeButtons = document.querySelectorAll('button[aria-label*="тему"], button:has(svg), button[title*="тему"]');
  console.log('   Найдено кнопок переключения:', themeButtons.length);

  // Проверка 3: CSS переменные
  console.log('3. Проверка CSS переменных...');
  const computedStyle = getComputedStyle(document.documentElement);
  const bgColor = computedStyle.getPropertyValue('--background');
  const fgColor = computedStyle.getPropertyValue('--foreground');
  console.log('   --background:', bgColor);
  console.log('   --foreground:', fgColor);

  // Проверка 4: localStorage
  console.log('4. Проверка localStorage...');
  const savedTheme = localStorage.getItem('telegram-bot-builder-theme');
  console.log('   Сохраненная тема:', savedTheme);

  // Проверка 5: Симуляция переключения темы
  console.log('5. Симуляция переключения темы...');
  
  // Добавляем темный класс
  html.classList.add('dark');
  setTimeout(() => {
    const darkBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
    console.log('   Фон в темной теме:', darkBg);
    
    // Убираем темный класс
    html.classList.remove('dark');
    setTimeout(() => {
      const lightBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
      console.log('   Фон в светлой теме:', lightBg);
      
      console.log('✅ Тестирование завершено!');
      console.log('📊 Результаты:');
      console.log('   - CSS переменные работают:', !!bgColor && !!fgColor);
      console.log('   - Темные/светлые цвета различаются:', darkBg !== lightBg);
      console.log('   - localStorage поддерживается:', typeof Storage !== 'undefined');
    }, 100);
  }, 100);
  
}, 1000);