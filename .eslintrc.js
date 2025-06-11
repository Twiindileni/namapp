module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off'
  },
  ignorePatterns: ['node_modules/', '.next/', 'out/']
} 