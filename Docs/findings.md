## WCAG AA Contrast Audit (US-0006, 2026-03-17)

| Scheme | fg/bg ratio | fg/bg2 ratio | Passes 4.5:1? |
|--------|-------------|--------------|---------------|
| Tomorrow Night | 9.80 | 8.52 | ✅ |
| Dracula | 13.36 | 14.81 | ✅ |
| Monokai | 13.94 | 15.54 | ✅ |
| Solarized Dark | 5.61 | 4.86 | ✅ |
| Nord | 9.25 | 7.45 | ✅ |
| One Dark | 6.57 | 7.22 | ✅ |
| Gruvbox Dark | 10.75 | 8.45 | ✅ |
| Tomorrow | 8.46 | 7.56 | ✅ |
| Solarized Light | 6.18 | 5.44 | ✅ |
| One Light | 10.86 | 9.95 | ✅ |
| Gruvbox Light | 10.22 | 9.23 | ✅ |
| GitHub Light | 14.65 | 13.76 | ✅ |

**Notes:**
- Solarized Dark fg adjusted from `#839496` (base0) to `#93a1a1` (base1) to meet WCAG AA on bg2 (#073642). Previous ratio: 4.11 on bg2.
- Solarized Light fg adjusted from `#657b83` (base00) to `#4d5f68` to meet WCAG AA on both bg (#fdf6e3) and bg2 (#eee8d5). Previous ratios: 4.13 on bg, 3.64 on bg2.
- All other schemes passed WCAG AA (≥ 4.5:1) without modification.
- Tests: TC-0146 (formula correctness), TC-0147 (fg/bg audit), TC-0148 (fg/bg2 audit).
