import envSchema from 'env-schema';
import fs from 'fs';
import S from 'fluent-json-schema';

export default function loadConfig(): void {
  let envPath: string = [process.cwd(), '.env'].join('/');
  if (!fs.existsSync(envPath)) {
    envPath = [process.cwd(), 'env.sample'].join('/');
  }
  const result = require('dotenv').config({ path: envPath });
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
