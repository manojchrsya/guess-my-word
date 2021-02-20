const { rules } = require('@commitlint/config-conventional')
const enumRules = rules['type-enum'][2].push('init');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': enumRules
  },
};
