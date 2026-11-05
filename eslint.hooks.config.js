/** @fileoverview Независимая проверка правил вызова хуков React. */
import parser from '@typescript-eslint/parser';
import hooks from 'eslint-plugin-react-hooks';

export default [{
  files: ['client/**/*.{js,jsx,ts,tsx}'],
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { 'react-hooks': hooks },
  rules: { 'react-hooks/rules-of-hooks': 'error' },
}];
