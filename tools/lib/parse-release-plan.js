'use strict';

/**
 * Extracts all fenced code blocks (``` ... ```) from markdown text.
 * Returns array of block content strings.
 */
function extractCodeBlocks(md) {
  const blocks = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)) !== null) blocks.push(m[1]);
  return blocks;
}

/**
 * Parse "None" or comma-separated IDs into an array.
 */
function parseDeps(val) {
  if (!val || val.trim() === 'None' || val.trim() === '') return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse a single epic block into an object.
 */
function parseEpicBlock(text) {
  const idTitle = text.match(/^(EPIC-\d{4}):\s*(.+)/m);
  if (!idTitle) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`^${key}:[ \\t]*(.+)`, 'm'));
    return m ? m[1].trim() : '';
  };
  return {
    id: idTitle[1],
    title: idTitle[2].trim(),
    description: get('Description'),
    releaseTarget: get('Release Target'),
    status: get('Status'),
    dependencies: parseDeps(get('Dependencies')),
  };
}

/**
 * Parse acceptance criteria lines.
 * Format: `  - [ ] AC-XXXX: Text` or `  - [x] AC-XXXX: Text`
 */
function parseACs(text) {
  const acs = [];
  const re = /- \[( |x)\] (AC-\d{4}|AC-TBD):\s*(.+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    acs.push({ id: m[2], text: m[3].trim(), done: m[1] === 'x' });
  }
  return acs;
}

/**
 * Parse a single user story block.
 */
function parseStoryBlock(text) {
  const header = text.match(/^(US-\d{4})\s*\((EPIC-\d{4})\):\s*(.+)/m);
  if (!header) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`^${key}:[ \\t]*(.*)`, 'm'));
    return m ? m[1].trim() : '';
  };
  const priority = get('Priority').match(/\((P\d)\)/);
  return {
    id: header[1],
    epicId: header[2],
    title: header[3].trim(),
    priority: priority ? priority[1] : get('Priority'),
    estimate: get('Estimate'),
    status: get('Status'),
    branch: get('Branch'),
    acs: parseACs(text),
    dependencies: parseDeps(get('Dependencies')),
  };
}

/**
 * Parse a single task block.
 */
function parseTaskBlock(text) {
  const header = text.match(/^(TASK-\d{4})\s*\((US-\d{4})\):\s*(.+)/m);
  if (!header) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`^${key}:[ \\t]*(.*)`, 'm'));
    return m ? m[1].trim() : '';
  };
  return {
    id: header[1],
    storyId: header[2],
    title: header[3].trim(),
    type: get('Type'),
    assignee: get('Assignee'),
    status: get('Status'),
    branch: get('Branch'),
    notes: get('Notes'),
  };
}

/**
 * Split a code block into per-record chunks by detecting lines that begin a
 * new EPIC / US / TASK record. This preserves internal blank lines within a
 * record (e.g. between Description and Priority, or before Acceptance Criteria)
 * while still correctly separating multiple records in the same fenced block.
 */
function splitBlockIntoRecords(block) {
  const recordStart = /^(EPIC-\d{4}:|US-\d{4}\s*\(EPIC-|TASK-\d{4}\s*\(US-)/;
  const lines = block.split('\n');
  const records = [];
  let current = [];
  for (const line of lines) {
    if (recordStart.test(line) && current.length > 0) {
      records.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) records.push(current.join('\n'));
  return records.map(r => r.trim()).filter(Boolean);
}

/**
 * Main parser. Returns { epics, stories, tasks }.
 */
function parseReleasePlan(markdown) {
  const blocks = extractCodeBlocks(markdown);
  const epics = [], stories = [], tasks = [];

  for (const block of blocks) {
    for (const chunk of splitBlockIntoRecords(block)) {
      if (/^EPIC-\d{4}:/.test(chunk)) {
        const e = parseEpicBlock(chunk);
        if (e) epics.push(e);
      } else if (/^US-\d{4}\s*\(EPIC-/.test(chunk)) {
        const s = parseStoryBlock(chunk);
        if (s) stories.push(s);
      } else if (/^TASK-\d{4}\s*\(US-/.test(chunk)) {
        const t = parseTaskBlock(chunk);
        if (t) tasks.push(t);
      }
    }
  }

  return { epics, stories, tasks };
}

module.exports = { parseReleasePlan };
