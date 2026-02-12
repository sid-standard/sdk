import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM and CJS builds
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      };
    },
  },
  // UMD build for browser script tag usage
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'SIDRuntime',
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    outExtension() {
      return {
        js: '.umd.js',
      };
    },
    platform: 'browser',
    footer: {
      // Ensure the global is properly exposed
      js: 'if (typeof window !== "undefined") { window.SIDRuntime = SIDRuntime; }',
    },
  },
]);
