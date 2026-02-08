@echo off
echo Running all tests...

echo.
echo Testing stripHtmlTags...
npx tsx --tsconfig tsconfig.json client/src/lib/tests/stripHtmlTags.test.js

echo.
echo Testing validateCommand...
npx tsx --tsconfig tsconfig.json client/src/lib/tests/validateCommand.test.js

echo.
echo Testing escapeForPython...
npx tsx --tsconfig tsconfig.json client/src/lib/tests/escapeForPython.test.js

echo.
echo Testing toPythonBoolean...
npx tsx --tsconfig tsconfig.json client/src/lib/tests/toPythonBoolean.test.js

echo.
echo Testing createSafeFunctionName...
npx tsx --tsconfig tsconfig.json client/src/lib/tests/createSafeFunctionName.test.js

echo.
echo All tests completed!