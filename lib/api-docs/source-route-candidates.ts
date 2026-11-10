/** @fileoverview Статический список кандидатов HTTP-маршрутов без импорта обработчиков и подключения базы. */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** Статический кандидат регистрации, без гарантии выполнения во время запуска. */
export interface SourceRouteCandidate {
  /** Исходный файл. */
  file: string;
  /** Строка регистрации. */
  line: number;
  /** HTTP-метод либо mount. */
  method: string;
  /** Исходное выражение пути. */
  expression: string;
  /** Разрешённый литерал с параметрами OpenAPI, если удалось вычислить статически. */
  resolvedPath?: string;
}

/**
 * Собирает вызовы регистрации HTTP-методов; выражения сохраняются для проверки человеком.
 * @param directory - Каталог серверных исходников.
 * @returns Кандидаты, которые не равнозначны runtime-инвентаризации.
 */
export function sourceRouteCandidates(directory: string) {
  const candidates: SourceRouteCandidate[] = [];
  /** Читает дерево файлов, не выполняя их код. */
  function walk(folder: string): void {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { if (!['node_modules', 'swagger'].includes(entry.name)) walk(file); continue; }
      if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      /** Разрешает только литералы и локальные строковые константы, не исполняя JavaScript. */
      function resolve(node: ts.Node, scope: Map<string, string>): string | undefined {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
        if (ts.isIdentifier(node)) return scope.get(node.text);
        if (ts.isTemplateExpression(node)) {
          let value = node.head.text;
          for (const part of node.templateSpans) {
            const expression = resolve(part.expression, scope);
            if (expression === undefined) return undefined;
            value += expression + part.literal.text;
          }
          return value;
        }
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
          const left = resolve(node.left, scope), right = resolve(node.right, scope);
          return left === undefined || right === undefined ? undefined : left + right;
        }
        return undefined;
      }
      /** Находит вызовы app.get/router.post, оставляя динамический путь явным. */
      function visit(node: ts.Node, inherited: Map<string, string>): void {
        const scope = ts.isBlock(node) || ts.isSourceFile(node) ? new Map(inherited) : inherited;
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
          const value = resolve(node.initializer, scope);
          if (value !== undefined) scope.set(node.name.text, value);
        }
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          const method = node.expression.name.text;
          const receiver = node.expression.expression.getText(source);
          if (/^(app|router|.*Router)$/.test(receiver) && /^(get|post|put|patch|delete|head|all|use)$/.test(method) && node.arguments[0]) {
            const literal = resolve(node.arguments[0], scope);
            /** Нормализует переносы до обрезки, чтобы снимок совпадал на Windows и Linux. */
            const expression = node.arguments[0].getText(source).replace(/\r\n/g, '\n');
            candidates.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
              line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
              method: method.toUpperCase(), expression: expression.length > 300 ? `${expression.slice(0, 300)}…` : expression,
              ...(literal ? { resolvedPath: literal.replace(/:([A-Za-z0-9_]+)/g, '{$1}') } : {}) });
          }
        }
        ts.forEachChild(node, child => visit(child, scope));
      }
      visit(source, new Map());
    }
  }
  walk(directory);
  return candidates;
}
