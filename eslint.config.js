import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

// 检测是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

export default [
  // 1. ESLint 推荐的基础规则
  js.configs.recommended,

  // 2. 配置文件专用规则 (例如 vite.config.ts, eslint.config.js 等)
  {
    files: ['*.config.{js,ts}', 'vite.config.{js,ts}', 'eslint.config.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 3. 源代码规则 (你的应用代码，例如 src/app.ts)
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // 油猴脚本全局变量
        GM_setValue: 'readonly',
        GM_getValue: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        'GM.xmlHttpRequest': 'readonly',
        unsafeWindow: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 相关规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的参数
          varsIgnorePattern: '^_', // 允许以下划线开头的变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的错误参数
        }
      ],
      // 生产环境严格禁止any，开发环境警告
      '@typescript-eslint/no-explicit-any': isProduction ? 'error' : 'warn',

      // 通用规则
      // 生产环境禁止console，开发环境允许
      'no-console': isProduction ? 'error' : 'off',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // 使用 TypeScript 版本，所以禁用 ESLint 自带的
      'no-undef': 'off',
    },
  },
];
