module.exports = {
  root: true,
  plugins: [
    '@propelinc',
  ],
  extends: [
    'plugin:vue/essential',
    'plugin:vue/strongly-recommended',
    'plugin:vue/recommended',
    '@vue/standard',
    '@vue/typescript',
    'eslint:recommended',
  ],
  rules: {
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
    '@propelinc/no-unused-vars': 'error',
    '@propelinc/no-explicit-any': 'error',
    'eqeqeq': ['error', 'always'],
    'semi': ['error', 'always'],
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: {
        max: 1,
        allowFirstLine: false,
      },
    }],
  },
  parserOptions: {
    parser: '@propelinc/parser',
  },
};
