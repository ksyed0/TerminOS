'use strict';
/**
 * Copies static renderer assets (HTML, CSS) from src/renderer/ to dist/renderer/
 * so that the compiled index.js and the HTML/CSS are co-located.
 * Run after tsc as part of the build step.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'renderer');
const DST = path.join(__dirname, '..', 'dist', 'renderer');

fs.mkdirSync(DST, { recursive: true });

for (const file of ['index.html', 'styles.css']) {
  fs.copyFileSync(path.join(SRC, file), path.join(DST, file));
  console.log(`Copied: ${file} → dist/renderer/${file}`);
}
