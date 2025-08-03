import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx,ts,tsx,vue}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // 油猴脚本全局变量
        GM_setValue: 'readonly',
        GM_getValue: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        unsafeWindow: 'readonly',
        // Vue 全局变量（通过 auto-import）
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',

      // TypeScript 相关规则
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 通用规则
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
];