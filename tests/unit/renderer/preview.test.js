'use strict';
/**
 * TC-0149–TC-0154 — Preview panel unit tests.
 * preview.ts accepts DOM refs as parameters — no browser or jsdom required.
 */

const {
  showPreview, hidePreview, enterEditMode, exitEditMode,
  getEditedCommand, getPendingCommand, isEditMode,
} = require('../../../dist/renderer/preview.js');

function makeRefs(overrides = {}) {
  const classList = () => {
    const classes = new Set(['hidden']);
    return {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, force) => force !== undefined ? (force ? classes.add(c) : classes.delete(c)) : (classes.has(c) ? classes.delete(c) : classes.add(c)),
      contains: (c) => classes.has(c),
    };
  };
  return {
    previewCard:      { classList: classList(), className: '' },
    previewCmd:       { classList: classList(), className: '', textContent: '' },
    previewExp:       { classList: classList(), className: '', textContent: '' },
    riskBadge:        { classList: classList(), className: '', textContent: '' },
    confirmDialog:    { classList: classList(), className: '' },
    previewEditInput: { classList: classList(), className: '', value: '', focus: jest.fn() },
    ...overrides,
  };
}

const sampleResponse = {
  command: 'ls -la',
  explanation: 'List files with details',
  is_destructive: false,
  requires_confirmation: false,
  risk_level: 'low',
};

// TC-0149: showPreview() sets riskBadge.textContent to response.risk_level; never leaves it empty
test('TC-0149: showPreview sets riskBadge.textContent to risk_level', () => {
  const refs = makeRefs();
  showPreview(refs, sampleResponse);
  expect(refs.riskBadge.textContent).toBe('low');
  expect(refs.riskBadge.textContent).not.toBe('');
});

// TC-0150: enterEditMode() hides previewCmd, shows previewEditInput, calls focus()
test('TC-0150: enterEditMode hides previewCmd, shows textarea, and calls focus()', () => {
  const refs = makeRefs();
  showPreview(refs, sampleResponse);
  enterEditMode(refs);
  expect(refs.previewCmd.classList.contains('hidden')).toBe(true);
  expect(refs.previewEditInput.classList.contains('hidden')).toBe(false);
  expect(refs.previewEditInput.focus).toHaveBeenCalled();
});

// TC-0151: getEditedCommand() returns textarea value (not original command) after edit
test('TC-0151: getEditedCommand returns edited textarea value, not original command', () => {
  const refs = makeRefs();
  showPreview(refs, sampleResponse);
  enterEditMode(refs);
  refs.previewEditInput.value = 'ls -la --color=auto';
  const edited = getEditedCommand(refs);
  expect(edited).toBe('ls -la --color=auto');
  expect(edited).not.toBe(sampleResponse.command);
});

// TC-0152: hidePreview() adds 'hidden' to previewCard, getPendingCommand() returns null, isEditMode() returns false
test('TC-0152: hidePreview clears state — previewCard hidden, pendingCommand null, editMode false', () => {
  const refs = makeRefs();
  showPreview(refs, sampleResponse);
  hidePreview(refs);
  expect(refs.previewCard.classList.contains('hidden')).toBe(true);
  expect(getPendingCommand()).toBeNull();
  expect(isEditMode()).toBe(false);
});

// TC-0153: enterEditMode followed by hidePreview sets isEditMode() to false
test('TC-0153: hidePreview from edit mode resets isEditMode to false', () => {
  const refs = makeRefs();
  showPreview(refs, sampleResponse);
  enterEditMode(refs);
  expect(isEditMode()).toBe(true);
  hidePreview(refs);
  expect(isEditMode()).toBe(false);
});

// TC-0154: Tab order — Run tabindex=0, Edit tabindex=1, Cancel tabindex=2
test('TC-0154: preview action buttons have correct tab order in HTML', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(
    path.resolve(__dirname, '../../../src/renderer/index.html'),
    'utf-8'
  );
  // Extract tabindex values from the preview action buttons
  const runMatch = html.match(/id="preview-run-btn"[^>]*tabindex="(\d+)"/);
  const editMatch = html.match(/id="preview-edit-btn"[^>]*tabindex="(\d+)"/);
  const cancelMatch = html.match(/id="preview-cancel-btn"[^>]*tabindex="(\d+)"/);
  expect(runMatch).not.toBeNull();
  expect(editMatch).not.toBeNull();
  expect(cancelMatch).not.toBeNull();
  expect(runMatch[1]).toBe('0');
  expect(editMatch[1]).toBe('1');
  expect(cancelMatch[1]).toBe('2');
});
