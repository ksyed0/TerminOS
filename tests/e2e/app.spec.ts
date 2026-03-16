/**
 * TermnOS — Playwright e2e tests
 *
 * Covers three scenarios:
 *   1. Electron window opens with the correct title
 *   2. xterm.js canvas element is visible in the DOM
 *   3. PTY↔xterm.js round-trip: typing `echo hello_e2e` produces output
 *
 * Run locally:  npm run test:e2e
 * Run in CI:    xvfb-run --auto-servernum npm run test:e2e
 */

import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [
      path.join(__dirname, '../../dist/main/index.js'),
      '--test-mode',
      '--no-sandbox',  // required on GitHub Actions — chrome-sandbox not setuid root
    ],
    env: { ...process.env, NODE_ENV: 'test' },
  });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app.close();
});

// ── Test 1: window title ───────────────────────────────────────────────────
test('window opens with correct title', async () => {
  const title = await page.title();
  expect(title).toBe('TermnOS');
});

// ── Test 2: xterm.js terminal renders ─────────────────────────────────────
test('terminal renders in DOM', async () => {
  // xterm.js creates a .xterm-rows element in DOM-renderer mode (used in headless/CI
  // environments where the canvas renderer falls back to the DOM renderer).
  // The .xterm-screen wrapper is present in both renderer modes.
  const screen = page.locator('.xterm-screen').first();
  await expect(screen).toBeVisible({ timeout: 8_000 });
});

// ── Test 3: PTY↔xterm.js round-trip ───────────────────────────────────────
test('PTY round-trip: echo hello_e2e produces output', async () => {
  // Install an IPC output accumulator inside the renderer context.
  // terminalAPI.onOutput() registers an ipcRenderer listener that fires
  // whenever the main process sends terminal:output events from the PTY.
  await page.evaluate(() => {
    (window as any).__e2eOutput = '';
    (window as any).terminalAPI.onOutput(
      (_tabId: string, data: string) => {
        (window as any).__e2eOutput += data;
      }
    );
  });

  // Send the echo command via keyboard events directed at the focused
  // xterm.js element.  xterm processes them via its internal key handler,
  // triggers the onData callback → terminalAPI.sendInput → IPC → PTY write.
  await page.keyboard.type('echo hello_e2e');
  await page.keyboard.press('Enter');

  // Wait for the marker string to appear in the accumulator.
  await page.waitForFunction(
    () =>
      typeof (window as any).__e2eOutput === 'string' &&
      (window as any).__e2eOutput.includes('hello_e2e'),
    { timeout: 8_000 }
  );

  const output = await page.evaluate(
    () => (window as any).__e2eOutput as string
  );
  expect(output).toContain('hello_e2e');
});

// ── Test 4: AC-0005 — scrollback buffer retains ≥1000 lines ──────────────
test('scrollback buffer retains at least 1000 lines', async () => {
  // seq 1 1100 generates 1100 lines of output — exceeds the default 500-line buffer.
  await page.keyboard.type('seq 1 1100');
  await page.keyboard.press('Enter');

  // Wait until PTY output contains the last line number
  await page.waitForFunction(
    () =>
      typeof (window as any).__e2eOutput === 'string' &&
      (window as any).__e2eOutput.includes('1100'),
    { timeout: 15_000 }
  );

  // Verify xterm.js buffer holds ≥1000 lines via the test hook
  const bufferLength = await page.evaluate(() => {
    const term = (window as any).__activeTerminal;
    return term ? term.buffer.active.length : 0;
  });

  expect(bufferLength).toBeGreaterThanOrEqual(1000);
});
