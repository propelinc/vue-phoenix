module.exports = {
  root: true,
  plugins: [
    '@typescript-eslint',
    'no-only-tests',
  ],
  extends: [
    'plugin:vue/essential',
    'plugin:vue/strongly-recommended',
    'plugin:vue/recommended',
    '@vue/standard',
    '@vue/typescript',
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/typescript',
  ],
  rules: {
    'import/no-unresolved': ['error'],
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'unknown'],
      'pathGroups': [
        {
          pattern: '@/less/**',
          group: 'unknown',
        },
        {
          pattern: '@/**',
          group: 'internal',
        },
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc' },
    }],
    'no-only-tests/no-only-tests': 'error',
    'object-curly-spacing': ['error', 'always'],
    'brace-style': ['error', '1tbs'],
    'quote-props': ['error', 'consistent-as-needed'],
    'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'indent': ['error', 2],
    'no-restricted-syntax': ['error', "CallExpression[callee.name='Error']"],
    'no-console': ['error', { allow: ['info', 'error'] }],
    'no-debugger': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'no-unused-vars': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-useless-constructor': 'error',
    'eqeqeq': ['error', 'always'],
    'semi': ['error', 'always'],
    'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    }],
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: {
        max: 1,
        allowFirstLine: false,
      },
    }],
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
};
