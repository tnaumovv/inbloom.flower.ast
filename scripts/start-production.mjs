import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import nextEnv from '@next/env';

const { values } = parseArgs({ options: {
  hostname: { type: 'string', short: 'H' },
  port: { type: 'string', short: 'p' },
} });
const root = process.cwd();
process.env.NODE_ENV = 'production';
nextEnv.loadEnvConfig(root, false);
const server = resolve(root, process.env.NEXT_DIST_DIR || '.next', 'standalone/server.js');
try {
  await access(server);
} catch {
  console.error('Сборка не найдена. Сначала выполните npm run build.');
  process.exit(1);
}
const port = values.port || process.env.PORT || '3000';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error('Порт должен быть целым числом от 1 до 65535.');
  process.exit(1);
}
process.env.PORT = port;
process.env.HOSTNAME = values.hostname || process.env.HOSTNAME || '127.0.0.1';
await import(pathToFileURL(server).href);
