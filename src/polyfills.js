// Полифилл для crypto.getRandomValues в браузерной и серверной среде
(function() {
  // Проверяем, существует ли уже реализация
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return;
  }

  // Для Node.js среды
  if (typeof global !== 'undefined' && !global.crypto) {
    try {
      const crypto = require('crypto');
      global.crypto = {
        getRandomValues: function(array) {
          return crypto.randomFillSync(array);
        }
      };
    } catch (e) {
      // Если crypto не доступен, создаем базовую реализацию
      global.crypto = {
        getRandomValues: function(array) {
          if (array instanceof Uint8Array) {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 256);
            }
          }
          return array;
        }
      };
    }
  }

  // Для браузерной среды
  if (typeof window !== 'undefined' && window.crypto && !window.crypto.getRandomValues) {
    window.crypto.getRandomValues = function(array) {
      if (array instanceof Uint8Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
      return array;
    };
  }

  // Для совместимости с globalThis
  if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
    globalThis.crypto = typeof window !== 'undefined' ? window.crypto : global.crypto;
  }
})();