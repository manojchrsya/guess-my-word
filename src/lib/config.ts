import envSchema from 'env-schema';
import S from 'fluent-json-schema';

export default function loadConfig(): void {
  const result = require('dotenv').config();

  if (result.error) {
    throw new Error(result.error);
  }

  envSchema({
    data: result.parsed,
    schema: S.object()
      .prop('NODE_ENV', S.string().enum(['development', 'production']).required())
      .prop('HOST', S.string().required())
      .prop('PORT', S.string().default('3000').required())
      .prop('BASE_URL', S.string().required()),
  });
}
