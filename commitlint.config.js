const { rules } = require('@commitlint/config-conventional')
const enumRules = rules['type-enum'];
enumRules[2].push('init');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': enumRules
  },
};
