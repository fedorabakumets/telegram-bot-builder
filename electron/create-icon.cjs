const sharp = require('sharp');

// Создаём SVG иконку
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Фон (Telegram blue) -->
  <rect width="512" height="512" fill="#2AABEE" rx="60"/>
  
  <!-- Белая рамка -->
  <rect x="10" y="10" width="492" height="492" fill="none" stroke="white" stroke-width="20" rx="50"/>
  
  <!-- Буква T -->
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="400" font-weight="bold" fill="white" text-anchor="middle">T</text>
</svg>
`;

async function createIcon() {
  await sharp(Buffer.from(svg))
    .png()
    .toFile('electron/icon.png');
  
  console.log('✅ Иконка создана: electron/icon.png');
}

createIcon().catch(console.error);
