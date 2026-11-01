/** @fileoverview Узкая диагностика изменённых файлов через языковой сервис TypeScript. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const changed = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }).split(/\r?\n/);
const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'client/components/editor/tables', 'server/database/bot-tables', 'server/routes/tables', 'server/services/content-table', 'shared', 'lib/tests/table-cell-edits.test.ts'], { encoding: 'utf8' }).split(/\r?\n/);
const targets = process.argv.length > 2 ? process.argv.slice(2) : [...new Set([...changed, ...added])].filter(f => /\.(ts|tsx)$/.test(f) && /tables|table-column|table-cell|content-table/.test(f));
const host = {
  getScriptFileNames: () => parsed.fileNames,
  getScriptVersion: () => '0',
  getScriptSnapshot: file => fs.existsSync(file) ? ts.ScriptSnapshot.fromString(fs.readFileSync(file, 'utf8')) : undefined,
  getCurrentDirectory: () => process.cwd(), getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists, readFile: ts.sys.readFile, readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host);
/** Возвращает диагностику только конкретного изменённого файла. */
function getDiagnostics(file) { return [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)]; }
let errors = 0;
for (const file of targets) {
  const diagnostics = getDiagnostics(path.resolve(file));
  if (!diagnostics.length) continue;
  errors += diagnostics.length;
  process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => process.cwd(), getCanonicalFileName: f => f, getNewLine: () => '\n' }));
}
console.log(JSON.stringify({ files: targets.length, errors }));
process.exitCode = errors ? 1 : 0;
