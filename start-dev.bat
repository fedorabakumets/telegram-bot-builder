@echo off
chcp 65001 > nul
echo Загружаем переменные окружения...

REM Загружаем переменные из .env файла
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set "%%a=%%b"
        echo Установлена переменная: %%a
    )
)

echo.
echo Запускаем сервер разработки...
tsx server/index.ts