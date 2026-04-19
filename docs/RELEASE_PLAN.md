# RELEASE_PLAN.md

## Epics

```
EPIC-0001: Code Editing
Description: Core editor.
Release Target: MVP (v0.1)
Status: In Progress
Dependencies: None

EPIC-0002: File Management
Description: File Explorer.
Release Target: MVP (v0.1)
Status: Planned
Dependencies: EPIC-0001

EPIC-0003: SSH & Remote Connections
Description: SSH/SFTP and Mosh connections for remote servers.
Release Target: MVP (v0.1)
Status: Planned
Dependencies: None

EPIC-0004: Session Management
Description: Multiple tabs, panes, and session persistence.
Release Target: v0.2
Status: Planned
Dependencies: EPIC-0003

EPIC-0005: Productivity Features
Description: Command palette, snippets, and keyboard shortcuts.
Release Target: v0.2
Status: Planned
Dependencies: EPIC-0003

EPIC-0006: Customization
Description: Themes, fonts, and visual customization.
Release Target: v0.2
Status: Planned
Dependencies: None
```

## User Stories

### EPIC-0001: Code Editing

```
US-0001 (EPIC-0001): As a developer, I want to open a file, so that I can edit code.
Priority: High (P0)
Estimate: M
Status: In Progress
Branch: feature/US-0001-open-file
Acceptance Criteria:
  - [ ] AC-0001: File picker opens
  - [x] AC-0002: Content loads in editor
Dependencies: None
```

```
US-0002 (EPIC-0001): As a developer, I want syntax highlighting, so that I can read code.
Priority: High (P0)
Estimate: L
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0003: TypeScript highlighted correctly
  - [ ] AC-0004: JavaScript highlighted correctly
  - [ ] AC-0005: Python highlighted correctly
  - [ ] AC-0006: JSON highlighted correctly
  - [ ] AC-0007: HTML/CSS highlighted correctly
  - [ ] AC-0008: Markdown highlighted correctly (preview mode)
Dependencies: US-0001
```

### EPIC-0002: File Management

```
US-0003 (EPIC-0002): As a developer, I want to browse local files, so that I can navigate my project.
Priority: High (P0)
Estimate: M
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0009: File browser shows directory tree
  - [ ] AC-0010: Tap to open file in editor
  - [ ] AC-0011: Navigate up/down directories
  - [ ] AC-0012: Search/filter files by name
  - [ ] AC-0013: Show file metadata (size, date modified)
Dependencies: US-0001
```

```
US-0004 (EPIC-0002): As a developer, I want to manage files, so that I can organize my project.
Priority: Medium (P1)
Estimate: L
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0014: Create new file
  - [ ] AC-0015: Create new folder
  - [ ] AC-0016: Delete file (with confirmation)
  - [ ] AC-0017: Rename file
  - [ ] AC-0018: Duplicate file
Dependencies: US-0003
```

### EPIC-0003: SSH & Remote Connections

```
US-0005 (EPIC-0003): As a developer, I want to connect via SSH, so that I can access remote servers.
Priority: High (P0)
Estimate: L
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0019: Add/edit/delete SSH host configurations
  - [ ] AC-0020: Connect to SSH server with password auth
  - [ ] AC-0021: Connect to SSH server with key-based auth (ed25519, ECDSA, RSA)
  - [ ] AC-0022: Virtual keyboard with special keys (Ctrl, Esc, Tab, arrows)
  - [ ] AC-0023: Reconnect on network change
Dependencies: None
```

```
US-0006 (EPIC-0003): As a developer, I want Mosh connectivity, so that sessions survive network interruptions.
Priority: Medium (P1)
Estimate: M
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0024: Connect via Mosh protocol
  - [ ] AC-0025: Session persists after device sleep/reboot
  - [ ] AC-0026: Handle network switches gracefully
Dependencies: US-0005
```

```
US-0007 (EPIC-0003): As a developer, I want SFTP access, so that I can transfer files.
Priority: High (P0)
Estimate: M
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0027: Browse remote file system
  - [ ] AC-0028: Download file to local device
  - [ ] AC-0029: Upload file to remote server
  - [ ] AC-0030: Transfer progress indicator
  - [ ] AC-0031: Resume interrupted transfers
Dependencies: US-0005
```

### EPIC-0004: Session Management

```
US-0008 (EPIC-0004): As a developer, I want multiple terminal tabs, so that I can work on multiple sessions.
Priority: High (P0)
Estimate: M
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0032: Create new tab
  - [ ] AC-0033: Switch between tabs
  - [ ] AC-0034: Close tab (with confirmation for running processes)
  - [ ] AC-0035: Show active tab indicator
  - [ ] AC-0036: Long-press to manage tabs
Dependencies: None
```

```
US-0009 (EPIC-0004): As a developer, I want split panes, so that I can view multiple sessions at once.
Priority: Medium (P1)
Estimate: L
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0037: Split vertically
  - [ ] AC-0038: Split horizontally
  - [ ] AC-0039: Resize panes
  - [ ] AC-0040: Close pane
Dependencies: US-0008
```

### EPIC-0005: Productivity Features

```
US-0010 (EPIC-0005): As a developer, I want a command palette, so that I can quickly access features.
Priority: Medium (P1)
Estimate: S
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0041: Open command palette with keyboard shortcut
  - [ ] AC-0042: Search commands by name
  - [ ] AC-0043: Execute selected command
  - [ ] AC-0044: Show recent commands
Dependencies: None
```

```
US-0011 (EPIC-0005): As a developer, I want command snippets, so that I can run saved commands quickly.
Priority: Medium (P1)
Estimate: S
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0045: Save command as snippet
  - [ ] AC-0046: Execute snippet with tap
  - [ ] AC-0047: Edit/delete snippets
  - [ ] AC-0048: Organize snippets in folders
Dependencies: None
```

```
US-0012 (EPIC-0005): As a developer, I want command history, so that I can repeat previous commands.
Priority: High (P0)
Estimate: S
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0049: Browse command history
  - [ ] AC-0050: Search history
  - [ ] AC-0051: Re-execute from history
  - [ ] AC-0052: Clear history
Dependencies: None
```

### EPIC-0006: Customization

```
US-0013 (EPIC-0006): As a developer, I want themes, so that I can personalize my terminal.
Priority: Medium (P1)
Estimate: M
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0053: Dark theme (default)
  - [ ] AC-0054: Light theme
  - [ ] AC-0055: High-contrast theme
  - [ ] AC-0056: Custom theme colors
Dependencies: None
```

```
US-0014 (EPIC-0006): As a developer, I want customizable fonts, so that I can optimize readability.
Priority: Low (P2)
Estimate: S
Status: Planned
Branch:
Acceptance Criteria:
  - [ ] AC-0057: Adjustable font size
  - [ ] AC-0058: Font family selection
  - [ ] AC-0059: Font spacing adjustment
Dependencies: None
```

## Tasks

```
TASK-0001 (US-0001): Implement CodeMirror 6 in WebView
Type: Dev
Assignee: Agent
Status: To Do
Branch: feature/US-0001-open-file
Notes: Evaluate bundle size
```
