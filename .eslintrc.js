module.exports = {
  root: true,
  extends: ['@propelinc'],
  globals: {
    // NOTE(mohan): ESLint's no-undef rule doesn't always work great with Typescript.
    // Adding this here, so it doesn't complain about the EventListener type.
    // We should consider turning the rule off in the future to match the recommended config.
    // https://github.com/typescript-eslint/typescript-eslint/issues/2477#issuecomment-686892459
    EventListener: 'readonly',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
