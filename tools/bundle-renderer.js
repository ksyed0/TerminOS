'use strict';
/**
 * Bundles the renderer TypeScript entry-point into a single self-contained IIFE
 * using esbuild.  The output replaces the tsc-compiled dist/renderer/index.js so
 * the renderer works in a sandboxed Electron context (no require/exports needed).
 */

const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.join(__dirname, '..', 'src', 'renderer', 'index.ts')],
  bundle: true,
  platform: 'browser',
  target: ['chrome120'],   // Electron 41 uses Chromium ~120
  format: 'iife',
  outfile: path.join(__dirname, '..', 'dist', 'renderer', 'index.js'),
  sourcemap: true,
  minify: false,
  external: [],            // bundle everything — no require() calls needed
}).then(() => {
  console.log('Bundled: src/renderer/index.ts → dist/renderer/index.js');
}).catch(err => {
  console.error('esbuild error:', err);
  process.exit(1);
});
