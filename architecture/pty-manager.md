# pty-manager.md — PTY Manager Architecture

> The PTY manager is the sole owner of the shell process. All terminal I/O goes through it.
> The AI layer never touches the PTY directly — commands are only written after user confirmation.

---

## Responsibilities

| Responsibility | Method |
|---------------|--------|
| Spawn shell process | `PtyManager.spawn(shell, cwd, cols, rows)` |
| Write data to shell | `PtyManager.write(data)` |
| Resize terminal | `PtyManager.resize(cols, rows)` |
| Kill shell process | `PtyManager.kill()` |
| Stream output to renderer | `PtyManager.onData(callback)` |
| Notify exit | `PtyManager.onExit(callback)` |
| Detect default shell | `PtyManager.getDefaultShell()` |

---

## Shell Detection

```
Platform     Default Shell Source
darwin       $SHELL env var → /bin/zsh → /bin/bash
linux        $SHELL env var → /bin/bash → /bin/sh
win32        $COMSPEC env var → cmd.exe → powershell.exe
```

The `shell` value is always read from AppConfig first — the above is only the fallback when config has no shell set.

---

## Resize Protocol

Every resize event (window resize, pane splitter move, font zoom) must call `PtyManager.resize(cols, rows)`.

This sends `SIGWINCH` to the shell process, which lets interactive programs (vim, htop, etc.) know the terminal dimensions changed.

Font zoom changes terminal dimensions because the number of visible characters changes:
- Larger font → fewer cols/rows → must resize PTY down
- Smaller font → more cols/rows → must resize PTY up

The renderer calculates new cols/rows using:
```
cols = Math.floor(terminalPaneWidth / charWidth)
rows = Math.floor(terminalPaneHeight / charHeight)
```

xterm.js `FitAddon.fit()` performs this calculation automatically. After fit, the renderer sends `terminal:resize` to main, which calls `PtyManager.resize(cols, rows)`.

---

## Multi-Tab PTY Management

Each tab owns exactly one PTY instance. The main process maintains a `Map<tabId, PtyManager>`.

- **New tab:** spawn new PtyManager, add to map
- **Switch tab:** renderer switches active xterm instance; main tracks active tabId
- **Close tab:** kill PtyManager, remove from map
- **Splitter mode:** both panes are visible simultaneously; both PTYs remain alive and active

When the Electron window is closed, ALL active PtyManagers are killed before `app.quit()`.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| spawn() fails | Throw `E_PTY_SPAWN`, renderer shows error in terminal pane |
| PTY exits with code 0 | Normal — send `terminal:exit { exitCode: 0 }` |
| PTY exits with non-zero | Send `terminal:exit { exitCode, signal }` — renderer shows banner |
| write() called on dead PTY | Log `E_PTY_WRITE`, discard data, attempt reconnect |
| resize() fails | Log `E_PTY_RESIZE` WARN, continue — non-fatal |

---

## Invariants

1. PTY is **never** spawned until the renderer is ready (`did-finish-load`)
2. Commands from AI are **never** written to PTY without prior user confirmation — `ai:execute` is the only write path for AI-generated commands
3. PTY output is forwarded to renderer as raw strings — no filtering or modification
4. Each PtyManager instance owns exactly one child process — no sharing between tabs
