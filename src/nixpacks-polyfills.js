// Специализированный полифилл для Nixpacks среды
// Этот файл будет использоваться только в Nixpacks сборке

// Для Node.js среды в Nixpacks
if (typeof global !== 'undefined' && !global.crypto) {
  try {
    // Попытка использовать встроенный модуль crypto
    const nodeCrypto = require('crypto');
    global.crypto = {
      getRandomValues: function(array) {
        if (typeof array === 'object' && array !== null) {
          // Для Uint8Array и других типизированных массивов
          if (array.buffer && array.buffer instanceof ArrayBuffer) {
            const buffer = nodeCrypto.randomBytes(array.length);
            for (let i = 0; i < array.length; i++) {
              array[i] = buffer[i];
            }
            return array;
          }
          // Для обычных массивов
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
        }
        return array;
      }
    };
  } catch (e) {
    // Резервная реализация, если crypto недоступен
    global.crypto = {
      getRandomValues: function(array) {
        if (typeof array === 'object' && array !== null) {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
        }
        return array;
      }
    };
  }
}

// Для совместимости с globalThis
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
  globalThis.crypto = global.crypto;
}

// Экспорт для использования в модулях (ESM совместимый)
export {};