const { createCanvas } = require('canvas');

const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Фон (Telegram blue)
ctx.fillStyle = '#2AABEE';
ctx.fillRect(0, 0, 512, 512);

// Белая рамка
ctx.strokeStyle = '#FFFFFF';
ctx.lineWidth = 20;
ctx.strokeRect(10, 10, 492, 492);

// Буква T (Telegram style)
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 400px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('T', 256, 280);

// Сохраняем
const fs = require('fs');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./electron/icon.png', buffer);

console.log('✅ Иконка создана: electron/icon.png');
