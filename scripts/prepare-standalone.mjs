import { access, cp } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, process.env.NEXT_DIST_DIR || '.next');
const standalone = resolve(dist, 'standalone');
await access(resolve(standalone, 'server.js'));
await cp(resolve(root, 'public'), resolve(standalone, 'public'), { recursive: true });
await cp(resolve(dist, 'static'), resolve(standalone, '.next/static'), { recursive: true });
console.log('Standalone-сборка готова: изображения, шрифты и static-файлы скопированы.');
