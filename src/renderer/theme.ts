'use strict';
/**
 * Theme system — color scheme definitions and runtime CSS variable injection.
 * All schemes must meet WCAG 2.1 AA (4.5:1 contrast ratio minimum).
 */

export interface ColorScheme {
  name: string;
  bg: string;
  fg: string;
  bg2: string;   // tab bar, panels
  bg3: string;   // input fields, code blocks
  border: string;
  // xterm.js terminal colors (16-color ANSI palette)
  black: string; red: string; green: string; yellow: string;
  blue: string; magenta: string; cyan: string; white: string;
  brightBlack: string; brightRed: string; brightGreen: string;
  brightYellow: string; brightBlue: string; brightMagenta: string;
  brightCyan: string; brightWhite: string;
  cursor: string;
  selectionBackground: string;
}

export const DARK_SCHEMES: ColorScheme[] = [
  {
    name: 'Tomorrow Night',
    bg: '#1d1f21', fg: '#c5c8c6', bg2: '#282a2e', bg3: '#373b41',
    border: '#404040', cursor: '#8abeb7', selectionBackground: '#373b41',
    black: '#1d1f21', red: '#cc6666', green: '#b5bd68', yellow: '#f0c674',
    blue: '#81a2be', magenta: '#b294bb', cyan: '#8abeb7', white: '#c5c8c6',
    brightBlack: '#969896', brightRed: '#cc6666', brightGreen: '#b5bd68',
    brightYellow: '#f0c674', brightBlue: '#81a2be', brightMagenta: '#b294bb',
    brightCyan: '#8abeb7', brightWhite: '#ffffff',
  },
  {
    name: 'Dracula',
    bg: '#282a36', fg: '#f8f8f2', bg2: '#21222c', bg3: '#343746',
    border: '#44475a', cursor: '#f8f8f2', selectionBackground: '#44475a',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94',
    brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df',
    brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  {
    name: 'Monokai',
    bg: '#272822', fg: '#f8f8f2', bg2: '#1e1f1c', bg3: '#3e3d32',
    border: '#49483e', cursor: '#f8f8f0', selectionBackground: '#49483e',
    black: '#272822', red: '#f92672', green: '#a6e22e', yellow: '#f4bf75',
    blue: '#66d9e8', magenta: '#ae81ff', cyan: '#a1efe4', white: '#f8f8f2',
    brightBlack: '#75715e', brightRed: '#f92672', brightGreen: '#a6e22e',
    brightYellow: '#f4bf75', brightBlue: '#66d9e8', brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4', brightWhite: '#f9f8f5',
  },
  {
    name: 'Solarized Dark',
    bg: '#002b36', fg: '#93a1a1', bg2: '#073642', bg3: '#073642',
    border: '#586e75', cursor: '#839496', selectionBackground: '#073642',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#002b36', brightRed: '#cb4b16', brightGreen: '#586e75',
    brightYellow: '#657b83', brightBlue: '#839496', brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
  },
  {
    name: 'Nord',
    bg: '#2e3440', fg: '#d8dee9', bg2: '#3b4252', bg3: '#434c5e',
    border: '#4c566a', cursor: '#d8dee9', selectionBackground: '#434c5e',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b', brightBlue: '#81a1c1', brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  },
  {
    name: 'One Dark',
    bg: '#282c34', fg: '#abb2bf', bg2: '#21252b', bg3: '#2c313c',
    border: '#3e4451', cursor: '#528bff', selectionBackground: '#3e4451',
    black: '#282c34', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
    brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379',
    brightYellow: '#e5c07b', brightBlue: '#61afef', brightMagenta: '#c678dd',
    brightCyan: '#56b6c2', brightWhite: '#ffffff',
  },
  {
    name: 'Gruvbox Dark',
    bg: '#282828', fg: '#ebdbb2', bg2: '#3c3836', bg3: '#504945',
    border: '#665c54', cursor: '#ebdbb2', selectionBackground: '#504945',
    black: '#282828', red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', magenta: '#b16286', cyan: '#689d6a', white: '#a89984',
    brightBlack: '#928374', brightRed: '#fb4934', brightGreen: '#b8bb26',
    brightYellow: '#fabd2f', brightBlue: '#83a598', brightMagenta: '#d3869b',
    brightCyan: '#8ec07c', brightWhite: '#ebdbb2',
  },
];

export const LIGHT_SCHEMES: ColorScheme[] = [
  {
    name: 'Tomorrow',
    bg: '#ffffff', fg: '#4d4d4c', bg2: '#f2f2f2', bg3: '#e8e8e8',
    border: '#d0d0d0', cursor: '#4d4d4c', selectionBackground: '#d6d6d6',
    black: '#000000', red: '#c82829', green: '#718c00', yellow: '#eab700',
    blue: '#4271ae', magenta: '#8959a8', cyan: '#3e999f', white: '#ffffff',
    brightBlack: '#8e908c', brightRed: '#c82829', brightGreen: '#718c00',
    brightYellow: '#eab700', brightBlue: '#4271ae', brightMagenta: '#8959a8',
    brightCyan: '#3e999f', brightWhite: '#ffffff',
  },
  {
    name: 'Solarized Light',
    bg: '#fdf6e3', fg: '#4d5f68', bg2: '#eee8d5', bg3: '#e8e2d0',
    border: '#cdc8b7', cursor: '#657b83', selectionBackground: '#eee8d5',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#002b36', brightRed: '#cb4b16', brightGreen: '#586e75',
    brightYellow: '#657b83', brightBlue: '#839496', brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
  },
  {
    name: 'One Light',
    bg: '#fafafa', fg: '#383a42', bg2: '#f0f0f0', bg3: '#e8e8e8',
    border: '#d4d4d4', cursor: '#526fff', selectionBackground: '#e8e8e8',
    black: '#383a42', red: '#e45649', green: '#50a14f', yellow: '#c18401',
    blue: '#4078f2', magenta: '#a626a4', cyan: '#0184bc', white: '#fafafa',
    brightBlack: '#a0a1a7', brightRed: '#e45649', brightGreen: '#50a14f',
    brightYellow: '#c18401', brightBlue: '#4078f2', brightMagenta: '#a626a4',
    brightCyan: '#0184bc', brightWhite: '#ffffff',
  },
  {
    name: 'Gruvbox Light',
    bg: '#fbf1c7', fg: '#3c3836', bg2: '#f2e5bc', bg3: '#ebdbb2',
    border: '#d5c4a1', cursor: '#3c3836', selectionBackground: '#ebdbb2',
    black: '#fbf1c7', red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', magenta: '#b16286', cyan: '#689d6a', white: '#7c6f64',
    brightBlack: '#928374', brightRed: '#9d0006', brightGreen: '#79740e',
    brightYellow: '#b57614', brightBlue: '#076678', brightMagenta: '#8f3f71',
    brightCyan: '#427b58', brightWhite: '#3c3836',
  },
  {
    name: 'GitHub Light',
    bg: '#ffffff', fg: '#24292f', bg2: '#f6f8fa', bg3: '#eaeef2',
    border: '#d0d7de', cursor: '#24292f', selectionBackground: '#ddf4ff',
    black: '#24292f', red: '#cf222e', green: '#116329', yellow: '#9a6700',
    blue: '#0969da', magenta: '#8250df', cyan: '#1b7c83', white: '#6e7781',
    brightBlack: '#57606a', brightRed: '#a40e26', brightGreen: '#1a7f37',
    brightYellow: '#633c01', brightBlue: '#218bff', brightMagenta: '#a475f9',
    brightCyan: '#3192aa', brightWhite: '#8c959f',
  },
];

export const ALL_SCHEMES = [...DARK_SCHEMES, ...LIGHT_SCHEMES];

/** Apply a color scheme by injecting CSS variables into :root. */
export function applyScheme(scheme: ColorScheme): void {
  const root = document.documentElement;
  root.style.setProperty('--bg',     scheme.bg);
  root.style.setProperty('--fg',     scheme.fg);
  root.style.setProperty('--bg2',    scheme.bg2);
  root.style.setProperty('--bg3',    scheme.bg3);
  root.style.setProperty('--border', scheme.border);
}

/** Get xterm.js ITheme object from a ColorScheme. */
export function toXtermTheme(scheme: ColorScheme): Record<string, string> {
  return {
    background:          scheme.bg,
    foreground:          scheme.fg,
    cursor:              scheme.cursor,
    selectionBackground: scheme.selectionBackground,
    black:               scheme.black,
    red:                 scheme.red,
    green:               scheme.green,
    yellow:              scheme.yellow,
    blue:                scheme.blue,
    magenta:             scheme.magenta,
    cyan:                scheme.cyan,
    white:               scheme.white,
    brightBlack:         scheme.brightBlack,
    brightRed:           scheme.brightRed,
    brightGreen:         scheme.brightGreen,
    brightYellow:        scheme.brightYellow,
    brightBlue:          scheme.brightBlue,
    brightMagenta:       scheme.brightMagenta,
    brightCyan:          scheme.brightCyan,
    brightWhite:         scheme.brightWhite,
  };
}

/** Get the correct scheme list for the resolved mode. */
export function schemesForMode(mode: 'dark' | 'light' | 'auto'): ColorScheme[] {
  const resolved = mode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  return resolved === 'dark' ? DARK_SCHEMES : LIGHT_SCHEMES;
}

/** Find a scheme by name, falling back to the first in the list. */
export function findScheme(name: string, schemes: ColorScheme[]): ColorScheme {
  return schemes.find(s => s.name === name) ?? schemes[0];
}
