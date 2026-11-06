// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'scripts/.cache/**',
      'public/data/**', // generated JSON
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    plugins: { 'react-hooks': reactHooks },
    files: ['**/*.tsx', '**/*.jsx', 'src/**/*.ts'],
    rules:
      reactHooks.configs?.['recommended-latest']?.rules ?? reactHooks.configs.recommended.rules,
  },
  {
    files: ['scripts/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['src/**/*.{ts,tsx,astro}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'astro/no-deprecated-astro-canonicalurl': 'warn',
    },
  },
  eslintConfigPrettier,
);
