const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Путь к файлу с настройками
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

// Путь к файлу логов
const LOG_FILE = path.join(app.getPath('userData'), 'app.log');

/**
 * @brief Записывает сообщение в лог-файл
 * @param {string} level - Уровень лога (INFO, WARN, ERROR)
 * @param {string} message - Сообщение для логирования
 */
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Пишем в файл
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (e) {
    // Игнорируем ошибки записи логов
  }
  
  // Пишем в консоль
  console.log(logMessage);
}

let mainWindow;

// Загрузка конфигурации
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return { databaseUrl: '' };
}

// Сохранение конфигурации
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    title: 'Telegram Bot Builder',
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  log('INFO', `Запуск приложения (dev режим: ${isDev})`);

  if (isDev) {
    // В разработке загружаем с dev-сервера
    log('INFO', 'Загрузка с dev-сервера http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // В production загружаем статический файл
    log('INFO', 'Загрузка статического файла');
    mainWindow.loadFile(path.join(__dirname, '../dist/client/index.html'));
  }

  mainWindow.on('closed', () => {
    log('INFO', 'Окно закрыто');
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  log('INFO', 'Приложение готово к работе');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log('INFO', 'Создание нового окна (activate)');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('INFO', 'Все окна закрыты');
  if (process.platform !== 'darwin') {
    log('INFO', 'Выход из приложения (Windows/Linux)');
    app.quit();
  }
});

app.on('before-quit', () => {
  log('INFO', 'Приложение завершает работу');
});

// IPC обработчики
ipcMain.handle('get-config', () => {
  log('INFO', 'Запрос конфигурации');
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  log('INFO', 'Сохранение конфигурации');
  return saveConfig(config);
});

ipcMain.handle('select-file', async (event, options) => {
  log('INFO', 'Открытие диалога выбора файла');
  const result = await dialog.showOpenDialog(mainWindow, options);
  log('INFO', `Выбран файл: ${result.filePaths?.[0] || 'отменено'}`);
  return result;
});

ipcMain.handle('save-file', async (event, options) => {
  log('INFO', 'Открытие диалога сохранения файла');
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Глобальная обработка ошибок
process.on('uncaughtException', (error) => {
  log('ERROR', `Необработанная ошибка: ${error.message}`);
  console.error(error);
});

process.on('unhandledRejection', (reason) => {
  log('ERROR', `Необработанное обещание: ${reason}`);
  console.error(reason);
});

module.exports = { loadConfig, saveConfig };
