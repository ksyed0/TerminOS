'use strict';
/**
 * Renderer theme unit tests.
 * DOM globals (document, window) are mocked — no browser required.
 */

// Mock DOM globals required by theme.js before loading the module
const mockSetProperty = jest.fn();
global.document = {
  documentElement: {
    style: { setProperty: mockSetProperty },
  },
};

const mockMatchMedia = jest.fn();
global.window = {
  matchMedia: mockMatchMedia,
};

const {
  DARK_SCHEMES,
  LIGHT_SCHEMES,
  ALL_SCHEMES,
  applyScheme,
  toXtermTheme,
  schemesForMode,
  findScheme,
} = require('../../../src/renderer/theme.js');

// ── Data exports ─────────────────────────────────────────────────────────────

describe('DARK_SCHEMES', () => {
  test('contains 7 built-in dark themes', () => {
    expect(DARK_SCHEMES).toHaveLength(7);
  });

  test('includes expected theme names', () => {
    const names = DARK_SCHEMES.map((s) => s.name);
    expect(names).toContain('Tomorrow Night');
    expect(names).toContain('Dracula');
    expect(names).toContain('Monokai');
    expect(names).toContain('Nord');
    expect(names).toContain('One Dark');
    expect(names).toContain('Gruvbox Dark');
    expect(names).toContain('Solarized Dark');
  });

  test('every dark scheme has all required color properties', () => {
    const required = [
      'name', 'bg', 'fg', 'bg2', 'bg3', 'border', 'cursor', 'selectionBackground',
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
    ];
    for (const scheme of DARK_SCHEMES) {
      for (const prop of required) {
        expect(scheme).toHaveProperty(prop);
      }
    }
  });
});

describe('LIGHT_SCHEMES', () => {
  test('contains 5 built-in light themes', () => {
    expect(LIGHT_SCHEMES).toHaveLength(5);
  });

  test('includes expected theme names', () => {
    const names = LIGHT_SCHEMES.map((s) => s.name);
    expect(names).toContain('Tomorrow');
    expect(names).toContain('Solarized Light');
    expect(names).toContain('GitHub Light');
    expect(names).toContain('One Light');
    expect(names).toContain('Gruvbox Light');
  });

  test('every light scheme has all required color properties', () => {
    const required = [
      'name', 'bg', 'fg', 'bg2', 'bg3', 'border', 'cursor', 'selectionBackground',
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
    ];
    for (const scheme of LIGHT_SCHEMES) {
      for (const prop of required) {
        expect(scheme).toHaveProperty(prop);
      }
    }
  });
});

describe('ALL_SCHEMES', () => {
  test('is the concatenation of DARK_SCHEMES and LIGHT_SCHEMES', () => {
    expect(ALL_SCHEMES).toHaveLength(DARK_SCHEMES.length + LIGHT_SCHEMES.length);
    expect(ALL_SCHEMES).toEqual([...DARK_SCHEMES, ...LIGHT_SCHEMES]);
  });

  test('all scheme names are unique', () => {
    const names = ALL_SCHEMES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ── toXtermTheme() ────────────────────────────────────────────────────────────

describe('toXtermTheme()', () => {
  const scheme = DARK_SCHEMES[0]; // Tomorrow Night

  test('maps bg → background', () => {
    expect(toXtermTheme(scheme).background).toBe(scheme.bg);
  });

  test('maps fg → foreground', () => {
    expect(toXtermTheme(scheme).foreground).toBe(scheme.fg);
  });

  test('preserves cursor and selectionBackground', () => {
    const xterm = toXtermTheme(scheme);
    expect(xterm.cursor).toBe(scheme.cursor);
    expect(xterm.selectionBackground).toBe(scheme.selectionBackground);
  });

  test('includes all 8 basic ANSI colors', () => {
    const xterm = toXtermTheme(scheme);
    for (const color of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
      expect(xterm).toHaveProperty(color);
    }
  });

  test('includes all 8 bright ANSI colors', () => {
    const xterm = toXtermTheme(scheme);
    for (const color of [
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
    ]) {
      expect(xterm).toHaveProperty(color);
    }
  });

  test('does not throw for any scheme in ALL_SCHEMES', () => {
    for (const s of ALL_SCHEMES) {
      expect(() => toXtermTheme(s)).not.toThrow();
    }
  });

  test('color values match the source scheme', () => {
    const xterm = toXtermTheme(scheme);
    expect(xterm.black).toBe(scheme.black);
    expect(xterm.brightWhite).toBe(scheme.brightWhite);
  });
});

// ── schemesForMode() ──────────────────────────────────────────────────────────

describe('schemesForMode()', () => {
  beforeEach(() => mockMatchMedia.mockReset());

  test('returns DARK_SCHEMES for explicit dark mode', () => {
    expect(schemesForMode('dark')).toBe(DARK_SCHEMES);
  });

  test('returns LIGHT_SCHEMES for explicit light mode', () => {
    expect(schemesForMode('light')).toBe(LIGHT_SCHEMES);
  });

  test('returns DARK_SCHEMES for auto when system prefers dark', () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    expect(schemesForMode('auto')).toBe(DARK_SCHEMES);
  });

  test('returns LIGHT_SCHEMES for auto when system prefers light', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    expect(schemesForMode('auto')).toBe(LIGHT_SCHEMES);
  });

  test('queries the correct media feature for auto mode', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    schemesForMode('auto');
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});

// ── findScheme() ──────────────────────────────────────────────────────────────

describe('findScheme()', () => {
  test('finds a dark scheme by exact name', () => {
    expect(findScheme('Dracula', DARK_SCHEMES).name).toBe('Dracula');
  });

  test('finds a light scheme by exact name', () => {
    expect(findScheme('GitHub Light', LIGHT_SCHEMES).name).toBe('GitHub Light');
  });

  test('works when searching ALL_SCHEMES', () => {
    expect(findScheme('Nord', ALL_SCHEMES).name).toBe('Nord');
  });

  test('falls back to the first scheme when name is not found', () => {
    expect(findScheme('Nonexistent', DARK_SCHEMES)).toBe(DARK_SCHEMES[0]);
  });

  test('falls back to first light scheme when name is not found in light list', () => {
    expect(findScheme('Tomorrow Night', LIGHT_SCHEMES)).toBe(LIGHT_SCHEMES[0]);
  });

  test('returns the correct object reference, not a copy', () => {
    const result = findScheme('Monokai', DARK_SCHEMES);
    expect(result).toBe(DARK_SCHEMES.find((s) => s.name === 'Monokai'));
  });
});

// ── applyScheme() ─────────────────────────────────────────────────────────────

describe('applyScheme()', () => {
  beforeEach(() => mockSetProperty.mockReset());

  test('sets --bg CSS variable', () => {
    applyScheme(DARK_SCHEMES[0]);
    expect(mockSetProperty).toHaveBeenCalledWith('--bg', DARK_SCHEMES[0].bg);
  });

  test('sets --fg CSS variable', () => {
    applyScheme(DARK_SCHEMES[0]);
    expect(mockSetProperty).toHaveBeenCalledWith('--fg', DARK_SCHEMES[0].fg);
  });

  test('sets exactly 5 CSS variables', () => {
    applyScheme(DARK_SCHEMES[1]); // Dracula
    expect(mockSetProperty).toHaveBeenCalledTimes(5);
  });

  test('sets --bg2, --bg3, and --border', () => {
    const scheme = DARK_SCHEMES[1]; // Dracula
    applyScheme(scheme);
    expect(mockSetProperty).toHaveBeenCalledWith('--bg2', scheme.bg2);
    expect(mockSetProperty).toHaveBeenCalledWith('--bg3', scheme.bg3);
    expect(mockSetProperty).toHaveBeenCalledWith('--border', scheme.border);
  });

  test('applies correct values for a light scheme', () => {
    const scheme = LIGHT_SCHEMES[0]; // Tomorrow
    applyScheme(scheme);
    expect(mockSetProperty).toHaveBeenCalledWith('--bg', scheme.bg);
    expect(mockSetProperty).toHaveBeenCalledWith('--fg', scheme.fg);
  });
});
