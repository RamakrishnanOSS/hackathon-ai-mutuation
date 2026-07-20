# Enhanced Developer Context UI

## Visual Overview

The VS Code extension now provides **first-class UI support** for developer instructions and mutation guidance, making it easier for developers to control mutation generation directly from the sidebar.

### UI Components

#### 1. **Mutation Explorer Sidebar - Developer Context Section**

```
📁 Mutation Testing (Sidebar)
├─ ⚙️ Developer Context: [📝 Instructions: "Focus on array boundaries..." • 🎯 Focus: Edge Cases • 📊 Strategy: Branch Coverage]
│  ├─ 📝 Instructions: Focus on array boundaries and off-by-one errors
│  ├─ 🎯 Focus Area: Edge Cases  
│  └─ 📊 Test Strategy: Branch Coverage
├─ 🧪 Baseline Tests: [Not Executed]
├─ 🔍 Generated Mutants: [No Nominees]
└─ 🧬 Mutation Testing Runs: [No Runs Evaluated]
```

#### 2. **Quick Access Buttons in View Title**

In the Mutation Explorer view title bar, four quick-access buttons appear:

```
[✏️] [🎯] [📊] [🗑️] [🧪] [🔍] [▶️] [📊] [📊] [📄] [📊]
```

**From left to right (inline group):**
- **✏️ Edit Instructions** — `mutation.setDeveloperInstructions`
- **🎯 Set Focus Area** — `mutation.setFocusArea`
- **📊 Set Strategy** — `mutation.setTestStrategy`
- **🗑️ Clear Context** — `mutation.clearDeveloperContext`

**Then navigation buttons:**
- 🧪 Run Baseline
- 🔍 Generate Mutants
- ▶️ Execute Runs
- 📊 Dashboard
- And more...

### Workflow Example

#### Step 1: Click Edit Instructions Button
Click the **✏️** button in the Mutation Explorer title bar:

```
Input Box appears:
┌─ Developer Instructions for AI Mutation Engine ──────┐
│ Provide instructions to guide mutation generation      │
│ (Ollama will use this context):                        │
│                                                        │
│ [Focus on array boundary mutations, especially off-   │
│  by-one errors in loop conditions. Test i < length   │
│  vs i <= length patterns.]                            │
│                                                        │
│ [OK]  [Cancel]                                         │
└────────────────────────────────────────────────────────┘
```

#### Step 2: Click Focus Area Button
Click the **🎯** button:

```
Quick Pick Menu:
┌─ Select Focus Area ────────────────────┐
│ > Edge Cases                           │
│   Performance                          │
│   Logic                                │
│   Return Values                        │
│   All                                  │
└────────────────────────────────────────┘
```

#### Step 3: Click Strategy Button
Click the **📊** button:

```
Quick Pick Menu:
┌─ Select Test Strategy ─────────────────┐
│ > Branch Coverage                      │
│   Statement Coverage                   │
│   Path Coverage                        │
│   Comprehensive                        │
└────────────────────────────────────────┘
```

#### Step 4: View Updated Sidebar

After setting context, the Developer Context section updates immediately:

```
⚙️ Developer Context: [📝 "Focus on array bound..." • 🎯 Edge Cases • 📊 Branch Coverage]
   ├─ 📝 Instructions: Focus on array boundary mutations, especially off-by-one errors...
   ├─ 🎯 Focus Area: Edge Cases
   └─ 📊 Test Strategy: Branch Coverage
```

#### Step 5: Generate Mutations
Click the **🔍** (Generate Mutants) button. The developer context automatically flows into the mutation generation request.

**Output panel shows:**
```
=================================================
🧬 Initiating AST Scan for Files: hello.py
   • Operators: relational_operator_replacement, boolean_inversion
   • AI Prioritizer: ollama
   • Developer Instructions: "Focus on array boundary mutations..."
   • Focus Area: Edge Cases
   • Test Strategy: Branch Coverage
=================================================
✅ In-editor mutation analysis completed: 5 candidate(s) found.
```

---

## Key Features

### ✅ **Always Visible**
- Developer context is displayed in a dedicated tree section
- No need to open the output panel to see what context is active
- Clear summary in the section header: Shows truncated instructions + focus area + strategy

### ✅ **Quick Edit**
- Single click to edit any context field
- Quick Pick menus for structured options (Focus Area, Strategy)
- Input box for free-form developer instructions

### ✅ **Real-Time Updates**
- Tree view updates immediately when context changes
- Shows full instruction text when expanded
- Visual feedback with icons (📝 ✏️ 🎯 📊 🗑️)

### ✅ **Clear All Context**
- Single button to reset everything: `mutation.clearDeveloperContext`
- Helpful when switching between different mutation testing scenarios

### ✅ **Persistent During Session**
- Context remains active across multiple mutation runs
- Only cleared when the button is clicked or a new workspace opens
- Persists through mutant accept/reject operations

---

## Accessibility Features

### Icon Meanings
- **⚙️** — Configuration/Settings section
- **📝** — Developer instructions (text input)
- **🎯** — Focus area/target (selection)
- **📊** — Test strategy/metrics (selection)
- **🗑️** — Delete/Clear action
- **⚡** — Informational message when no context is set

### Tooltips
Each context item in the tree has a tooltip showing the full text (useful when truncated).

### Keyboard Navigation
- Press `Ctrl+Shift+P` to open Command Palette
- Search for context commands:
  - "Developer Instructions"
  - "Focus Area"
  - "Test Strategy"
  - "Clear Context"

---

## Command Palette Integration

All developer context commands are available in the Command Palette:

```
Developer Instructions for Mutation Generation
│ Category: Mutation Testing
│ Icon: $(edit)

Set Mutation Focus Area
│ Category: Mutation Testing
│ Icon: $(target)

Set Test Strategy
│ Category: Mutation Testing
│ Icon: $(checklist)

Clear Developer Context
│ Category: Mutation Testing
│ Icon: $(trash)
```

---

## Comparison: Before vs After

### BEFORE (Command Palette Only)
```
User has to:
1. Press Ctrl+Shift+P
2. Search "Developer Instructions"
3. Type instructions
4. Forget what was entered (not visible)
5. Need to check Output panel during generation
```

### AFTER (Tree View + Quick Buttons)
```
User can:
1. Click ✏️ button in Mutation Explorer title bar
2. Type instructions (visually familiar interface)
3. See full context displayed in sidebar
4. Click 🎯 and 📊 for quick selections
5. Review context before clicking Generate
6. Click 🗑️ to clear everything in one action
```

---

## Developer Experience Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Visibility** | Hidden in Command Palette | Always visible in sidebar |
| **Discoverability** | Search required | Prominent buttons in title bar |
| **Feedback** | Output panel only | Tree section + Output panel |
| **Editing** | Text input only | Input box + Quick Pick menus |
| **Clearing** | Need to re-enter empty text | Single "Clear" button |
| **Status** | Unknown if set | Visual indicators in tree |
| **Integration** | Requires knowing about feature | Natural sidebar UI |

---

## Implementation Details

### Tree View Structure
- **Section Header**: Shows summary of all current context in one line
- **Expandable**: Click to see full instruction text, focus area, and strategy
- **Status Messages**: Shows "No context set" when empty with helpful hint

### UI State Management
- Context is stored in extension scope (survives editor restarts)
- Tree view automatically refreshes when context changes
- Commands are always enabled (no conditional visibility)

### Icons & Colors
- Uses VS Code built-in icon set: $(edit), $(target), $(checklist), $(trash)
- Colors inherited from VS Code theme (respects dark/light mode)
- Inline group (group@0-3) appears before navigation buttons

---

## Future Enhancements

Potential improvements for future versions:
- 💾 **Save/Load Presets** — Store and reuse common context combinations
- 🔄 **Recent Context** — Quick access to recently used instructions
- 📌 **Pin Instructions** — Lock context to prevent accidental changes
- 🎬 **Context Templates** — Pre-built templates for common scenarios (e.g., "Security", "Performance", "Reliability")
- 🔗 **Context Sync** — Share context profiles across team members

---

See also:
- [DEVELOPER_INSTRUCTIONS.md](./DEVELOPER_INSTRUCTIONS.md) — Detailed usage guide
- [Extension Source](../vscode-extension/src/extension.ts)
- [Mutation Tree View](../vscode-extension/src/mutationTree.ts)
