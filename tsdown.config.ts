import path from 'node:path';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.d.ts'],
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node18',
  fixedExtension: false,
  unbundle: true,
  deps: { neverBundle: true },
  dts: true,
  // Deno needs an explicit link from each JavaScript module to its declarations.
  banner: ({ fileName }) => ({
    js: `// @ts-self-types="./${path.posix.basename(fileName, '.js')}.d.ts"`
  }),
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: false,
  exports: false
});
