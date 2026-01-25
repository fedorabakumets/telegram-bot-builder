@echo off
echo 🧪 ТЕСТ: Генерация бота через API...

curl -X POST http://localhost:5000/api/projects/1/bot/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"botData\":{\"nodes\":[{\"id\":\"start-1\",\"type\":\"start\",\"position\":{\"x\":100,\"y\":100},\"data\":{\"messageText\":\"Привет! Это тестовый бот после рефакторинга.\",\"keyboardType\":\"none\",\"buttons\":[],\"resizeKeyboard\":true,\"oneTimeKeyboard\":false,\"markdown\":false,\"formatMode\":\"none\",\"synonyms\":[],\"isPrivateOnly\":false,\"adminOnly\":false,\"isStart\":true,\"command\":\"/start\",\"description\":\"Стартовая команда\",\"options\":[],\"messageIdSource\":\"none\",\"disableNotification\":false,\"userIdSource\":\"none\",\"mapService\":\"google\",\"attachedMedia\":[],\"waitForTextInput\":false}}],\"connections\":[]},\"botName\":\"RefactoredTestBot\",\"groups\":[],\"userDatabaseEnabled\":false,\"projectId\":1,\"enableLogging\":true}" ^
  --max-time 30

echo.
echo ✅ Тест завершен
pause