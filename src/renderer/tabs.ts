'use strict';
/**
 * Tab management utilities — pure functions testable in Node without a browser.
 */

/** CSS class applied to pane container when in vertical split mode */
export const SPLIT_VERTICAL_CLASS = 'split-vertical';

/**
 * Reorder: moves the DOM element for draggedId to before the DOM element for targetId.
 * Also reorders the entries in tabsMap to reflect the new visual order.
 */
export function reorderTab(
  draggedId: string,
  targetId: string,
  tabsMap: Map<string, { tabEl: HTMLElement; [key: string]: unknown }>,
  tabBarEl: HTMLElement,
): void {
  if (draggedId === targetId) return;
  const draggedTab = tabsMap.get(draggedId);
  const targetTab = tabsMap.get(targetId);
  if (!draggedTab || !targetTab) return;
  tabBarEl.insertBefore(draggedTab.tabEl, targetTab.tabEl);
}

/**
 * Returns the tab ID at the given 0-based index in the Map's insertion order.
 * Returns undefined if index is out of range.
 */
export function getTabAtIndex(
  index: number,
  tabsMap: Map<string, unknown>,
): string | undefined {
  return [...tabsMap.keys()][index];
}

/**
 * Returns true if the tab's PTY is active (i.e., the tab has an entry in ptyMap).
 * Used to determine whether a close-confirmation dialog should be shown.
 */
export function shouldConfirmClose(
  tabId: string,
  ptyMap: Map<string, unknown>,
): boolean {
  return ptyMap.has(tabId);
}
