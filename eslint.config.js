// eslint.config.js
module.exports = [
  {
    files: ['src/**/*.js'],
    ignores: ['**/*.config.js', '!**/eslint.config.js', '**/dist/**'],
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
