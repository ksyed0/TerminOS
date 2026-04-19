'use strict';
const path = require('path');
const fs = require('fs');
const { parseCostLog, aggregateCostByBranch } = require('../../tools/lib/parse-cost-log');

const fixture = fs.readFileSync(
  path.join(__dirname, '../../docs/AI_COST_LOG.md'), 'utf8'
);

describe('parseCostLog', () => {
  let rows;
  beforeAll(() => { rows = parseCostLog(fixture); });

  it('parses rows', () => expect(rows).toHaveLength(4));
  it('parses date', () => expect(rows[0].date).toBe('2026-03-26'));
  it('parses sessionId', () => expect(rows[0].sessionId).toBe('c74ef942-9648-470a-a7b8-ccac3a325613'));
  it('parses branch', () => expect(rows[0].branch).toBe('develop'));
  it('parses inputTokens as number', () => expect(rows[0].inputTokens).toBe(63));
  it('parses outputTokens as number', () => expect(rows[0].outputTokens).toBe(5111));
  it('parses cacheReadTokens as number', () => expect(rows[0].cacheReadTokens).toBe(3565686));
  it('parses costUsd as number', () => expect(rows[0].costUsd).toBeCloseTo(2.2087));
});

describe('aggregateCostByBranch', () => {
  let agg;
  beforeAll(() => { agg = aggregateCostByBranch(parseCostLog(fixture)); });

  it('aggregates develop branch', () => {
    expect(agg['develop'].costUsd).toBeGreaterThan(0);
  });
});
