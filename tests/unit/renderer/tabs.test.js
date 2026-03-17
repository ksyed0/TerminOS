'use strict';
/**
 * TC-0155–TC-0160 — Tab management unit tests.
 * tabs.ts functions accept explicit refs — no browser required.
 */

const { reorderTab, getTabAtIndex, shouldConfirmClose, SPLIT_VERTICAL_CLASS } = require('../../../dist/renderer/tabs.js');

// Helper: create a simple mock tabEl
function makeTabEl(id) {
  return { dataset: { tabId: id }, parentNode: null };
}

// Helper: create a mock tabBar that tracks insertBefore calls
function makeTabBar(elements) {
  const order = [...elements]; // array of tabEl objects
  return {
    get children() { return order; },
    insertBefore(node, ref) {
      const from = order.indexOf(node);
      if (from !== -1) order.splice(from, 1);
      const to = order.indexOf(ref);
      if (to !== -1) order.splice(to, 0, node);
    },
  };
}

// TC-0155: reorderTab moves dragged tab before target
test('TC-0155: reorderTab moves tab-a DOM element before tab-b', () => {
  const tabA = makeTabEl('a');
  const tabB = makeTabEl('b');
  const tabC = makeTabEl('c');
  const tabBar = makeTabBar([tabA, tabB, tabC]);
  const tabsMap = new Map([
    ['a', { tabEl: tabA }],
    ['b', { tabEl: tabB }],
    ['c', { tabEl: tabC }],
  ]);

  reorderTab('c', 'b', tabsMap, tabBar);

  // After reorder, c should be before b
  expect(tabBar.children.indexOf(tabC)).toBeLessThan(tabBar.children.indexOf(tabB));
});

// TC-0156: getTabAtIndex returns correct tab by insertion order
test('TC-0156: getTabAtIndex(2, tabsMap) returns the 3rd tab by insertion order', () => {
  const tabsMap = new Map([['a', {}], ['b', {}], ['c', {}]]);
  expect(getTabAtIndex(2, tabsMap)).toBe('c');
});

// TC-0157: shouldConfirmClose returns true when PTY exists
test('TC-0157: shouldConfirmClose returns true when PTY exists for tabId', () => {
  const ptyMap = new Map([['tab-1', true]]);
  expect(shouldConfirmClose('tab-1', ptyMap)).toBe(true);
  expect(shouldConfirmClose('tab-2', ptyMap)).toBe(false);
});

// TC-0158: getTabAtIndex with Cmd+3 selects the 3rd tab (index 2)
test('TC-0158: getTabAtIndex(2) for Cmd+3 keyboard shortcut returns 3rd tab', () => {
  const tabsMap = new Map([['tab-1', {}], ['tab-2', {}], ['tab-3', {}]]);
  // Cmd+3 → key '3' → index = parseInt('3', 10) - 1 = 2
  const key = '3';
  const index = parseInt(key, 10) - 1;
  expect(getTabAtIndex(index, tabsMap)).toBe('tab-3');
});

// TC-0159: SPLIT_VERTICAL_CLASS constant matches expected CSS class name
test('TC-0159: SPLIT_VERTICAL_CLASS constant is the expected CSS class name', () => {
  expect(SPLIT_VERTICAL_CLASS).toBe('split-vertical');
});

// TC-0160: shouldConfirmClose false when PTY not in map (tab has no active process)
test('TC-0160: shouldConfirmClose returns false when no PTY for tabId', () => {
  const ptyMap = new Map();
  expect(shouldConfirmClose('any-tab', ptyMap)).toBe(false);
});
