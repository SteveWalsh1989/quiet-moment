import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'

const appFiles = ['src/**/*.{ts,vue}']

export default [
  { ignores: ['dist/**', 'node_modules/**', '.openai/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: appFiles })),
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { globals: { module: 'readonly' } },
  },
  {
    rules: {
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
]
