'use strict';
/**
 * Preview panel state machine — pure functions operating on DOM refs.
 * All functions accept explicit refs so they are testable in Node (no global document).
 */

export interface PreviewRefs {
  previewCard: HTMLElement;
  previewCmd: HTMLElement;     // <pre id="preview-command">
  previewExp: HTMLElement;     // <p id="preview-explanation">
  riskBadge: HTMLElement;      // <span id="risk-badge">
  confirmDialog: HTMLElement;  // <div id="confirm-dialog">
  previewEditInput: HTMLTextAreaElement; // <textarea id="preview-edit-input">
}

export interface PreviewResponse {
  command: string;
  explanation: string;
  is_destructive: boolean;
  requires_confirmation: boolean;
  risk_level: string;
}

let _pendingCommand: { command: string; risk: string } | null = null;
let _editMode = false;

export function showPreview(refs: PreviewRefs, response: PreviewResponse): void {
  refs.previewCmd.textContent = response.command;
  refs.previewExp.textContent = response.explanation;
  refs.riskBadge.textContent = response.risk_level || 'unknown';
  refs.riskBadge.className = `risk-badge ${response.risk_level}`;
  refs.confirmDialog.classList.toggle('hidden', !response.requires_confirmation);
  _pendingCommand = { command: response.command, risk: response.risk_level };
  _editMode = false;
  refs.previewEditInput.value = '';
  refs.previewEditInput.classList.add('hidden');
  refs.previewCmd.classList.remove('hidden');
  refs.previewCard.classList.remove('hidden');
}

export function hidePreview(refs: PreviewRefs): void {
  refs.previewCard.classList.add('hidden');
  _pendingCommand = null;
  _editMode = false;
  refs.previewEditInput.value = '';
  refs.previewEditInput.classList.add('hidden');
  refs.previewCmd.classList.remove('hidden');
}

export function enterEditMode(refs: PreviewRefs): void {
  if (!_pendingCommand) return;
  _editMode = true;
  refs.previewEditInput.value = _pendingCommand.command;
  refs.previewEditInput.classList.remove('hidden');
  refs.previewCmd.classList.add('hidden');
  refs.previewEditInput.focus();
}

export function exitEditMode(refs: PreviewRefs): void {
  _editMode = false;
  refs.previewEditInput.classList.add('hidden');
  refs.previewCmd.classList.remove('hidden');
}

export function getEditedCommand(refs: PreviewRefs): string {
  return refs.previewEditInput.value;
}

export function getPendingCommand(): { command: string; risk: string } | null {
  return _pendingCommand ? { ..._pendingCommand } : null;
}

export function isEditMode(): boolean {
  return _editMode;
}
