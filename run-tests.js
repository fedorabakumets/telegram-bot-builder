import { spawn } from 'child_process';
import { basename } from 'path';

const tests = [
  'client/src/lib/tests/stripHtmlTags.test.js',
  'client/src/lib/tests/validateCommand.test.js',
  'client/src/lib/tests/escapeForPython.test.js',
  'client/src/lib/tests/toPythonBoolean.test.js',
  'client/src/lib/tests/createSafeFunctionName.test.js',
  'client/src/lib/tests/validateBotStructure.test.js',
  'client/src/lib/tests/generateBotCommandsSetup.test.js',
  'client/src/lib/tests/cn.test.js',
  'client/src/lib/tests/hasInlineButtons.test.js',
  'client/src/lib/tests/newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation.test.js',
  'client/src/lib/tests/newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation.test.js',
  'client/src/lib/tests/generatePinMessageHandler.test.js',
  'client/src/lib/tests/generateCompleteBotScriptFromNodeGraphWithDependencies.test.js',
  'client/src/lib/tests/getCommandSuggestions.test.js',
  'client/src/lib/tests/parseCommandFromText.test.js',
  'client/src/lib/tests/checkAutoTransition.test.js',
  'client/src/lib/tests/checkAutoTransitionComprehensive.test.js',
  'client/src/lib/tests/collectMediaVariablesInputValidation.test.js',
  'client/src/lib/tests/hasAutoTransitions.test.js',
  'client/src/lib/tests/hasMediaNodes.test.js',
  'client/src/lib/tests/hasLocationFeatures.test.js',
  'client/src/lib/tests/generateBotFatherCommands.test.js',
  'client/src/lib/tests/generateUtilityFunctions.test.js',
  'client/src/lib/tests/getParseMode.test.js',
  'client/src/lib/tests/generateUniqueShortId.test.js',
  'client/src/lib/tests/generateRequirementsTxt.test.js',
  'client/src/lib/tests/generateReadme.test.js',
  'client/src/lib/tests/generateDockerfile.test.js',
  'client/src/lib/tests/findMediaVariablesInText.test.js',
  'client/src/lib/tests/generateReadmeInputValidation.test.js',
  'client/src/lib/tests/generateReadmeZeroValuesDebug.test.js',
  'client/src/lib/tests/validateBotStructureInputValidation.test.js',
  'client/src/lib/tests/hasMediaNodesInputValidation.test.js',
  'client/src/lib/tests/findMediaVariablesInTextInputValidation.test.js',
  'client/src/lib/tests/generateUtilityFunctionsInputValidation.test.js'
];

async function runTests() {
  console.log('Running all tests...\n');

  for (const test of tests) {
    console.log(`Testing ${basename(test)}...`);

    await new Promise((resolve, reject) => {
      const child = spawn('npx', ['tsx', '--tsconfig', 'tsconfig.json', test], {
        stdio: 'inherit',
        cwd: process.cwd(),
        shell: true  // Используем оболочку для запуска npx
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`${basename(test)} tests passed!\n`);
          resolve();
        } else {
          console.error(`${basename(test)} tests failed with code ${code}\n`);
          reject(new Error(`Test failed with code ${code}`));
        }
      });
    });
  }

  console.log('All tests completed!');
}

runTests().catch(error => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});