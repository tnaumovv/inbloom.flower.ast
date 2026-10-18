import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'prototype/**', '.frontend-workbench/**', '.tooling/**', '.superpowers/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts']),
]);
