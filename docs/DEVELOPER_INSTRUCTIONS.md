# Developer Instructions for AI Mutation Engine

## Overview

The AI Mutation Testing extension now captures **developer context and instructions** to guide the Ollama AI engine (or any configured AI provider) in generating more focused, relevant mutations. This significantly improves the quality of generated mutations and helps developers achieve specific testing goals.

## Why Developer Instructions?

**Problem**: Generic mutation generation without context can produce mutations that:
- Don't align with the code's intent or critical paths
- Miss important edge cases or boundary conditions
- Generate too many low-value mutations
- Waste resources on irrelevant test scenarios

**Solution**: Developers provide instructions, focus areas, and test strategies that guide the AI engine to generate higher-quality, more targeted mutations.

---

## How to Use

### 1. **Set Developer Instructions**

Before generating mutations, provide context-specific guidance to the AI engine.

**Command**: `mutation.setDeveloperInstructions`

**Via VS Code Command Palette**:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
2. Search for: **"Set Developer Instructions for Mutation"**
3. Enter your instructions

**Example Instructions**:
```
Focus on boundary conditions for array indexing. Check off-by-one errors, 
negative indices, and array bounds. Especially test the slicing logic in 
the process_data() function.
```

```
This function handles payment processing. Generate mutations that test:
- Zero and negative amount handling
- Currency conversion edge cases
- Rounding errors in decimal arithmetic
```

```
Critical security function. Test all input validation paths and boundary 
conditions. Focus on potential integer overflow and null pointer dereferences.
```

### 2. **Set Focus Area** (Optional)

Define the mutation testing focus area to guide mutation operator selection.

**Command**: `mutation.setFocusArea`

**Via VS Code Command Palette**:
1. Press `Ctrl+Shift+P`
2. Search for: **"Set Mutation Focus Area"**
3. Choose from:
   - **Edge Cases**: Focus on boundary conditions and edge cases
   - **Performance**: Generate mutations testing performance implications
   - **Logic**: Focus on logical operators and conditionals
   - **Return Values**: Mutations involving return value modifications
   - **All**: Generate all types of mutations

### 3. **Set Test Strategy** (Optional)

Define the mutation testing strategy to align with your test coverage goals.

**Command**: `mutation.setTestStrategy`

**Via VS Code Command Palette**:
1. Press `Ctrl+Shift+P`
2. Search for: **"Set Test Strategy"**
3. Choose from:
   - **Branch Coverage**: Generate mutations targeting branch coverage
   - **Statement Coverage**: Generate mutations for statement coverage
   - **Path Coverage**: Generate mutations for path coverage
   - **Comprehensive**: Comprehensive mutation testing strategy

### 4. **Generate Mutations**

After setting instructions, generate mutations as usual.

**Command**: `mutation.generate`

**Via VS Code Command Palette**:
1. Press `Ctrl+Shift+P`
2. Search for: **"Generate Mutations"**
3. Select target files and mutation operators
4. The AI engine will use your instructions to generate focused mutations

**Output**: The Output panel shows what instructions were used:
```
=================================================
🧬 Initiating AST Scan for Files: hello.py
   • Operators: relational_operator_replacement, boolean_inversion
   • AI Prioritizer: ollama
   • Developer Instructions: "Focus on boundary conditions for array indexing..."
   • Focus Area: Edge Cases
   • Test Strategy: Branch Coverage
=================================================
```

---

## API Integration

### How Developer Instructions Flow

```
Developer (VS Code Extension)
         ↓
    [User Input]
         ↓
Extensions captures:
  - developerInstructions (string)
  - focusArea (string)
  - testStrategy (string)
         ↓
/api/v1/projects/default/mutations/generate
         ↓
Backend includes instructions in AI Engine prompt:
  - Ollama (local LLM)
  - OpenAI GPT
  - Anthropic Claude
         ↓
AI Engine generates better-aligned mutations
         ↓
VS Code displays results with developer context
```

### Backend API Schema

The mutation generation endpoint now accepts:

```json
{
  "workspaceDir": "/path/to/workspace",
  "targetFiles": ["hello.py", "test_helper.cpp"],
  "operators": ["relational_operator_replacement", "boolean_inversion"],
  "aiEngineProvider": "ollama",
  "developerInstructions": "Focus on boundary conditions...",
  "focusArea": "Edge Cases",
  "testStrategy": "Branch Coverage"
}
```

All developer context fields are **optional** for backward compatibility.

---

## Best Practices

### 1. **Be Specific**
❌ Bad: "Test the function better"
✅ Good: "Generate mutations for off-by-one errors in loop conditions, especially testing i < length vs i <= length"

### 2. **Target Critical Paths**
```
This function encrypts user passwords. Focus on:
- Character set edge cases (unicode, special chars)
- Empty string and null handling
- Salt length verification
```

### 3. **Align with Test Strategy**
- Use **Branch Coverage** when you have limited test cases and want to ensure all branches are tested
- Use **Statement Coverage** for comprehensive coverage of all code statements
- Use **Path Coverage** for complex control flow with interdependent conditions

### 4. **Combine Instructions with Focus Areas**
```
Instructions: "Focus on array boundary mutations"
Focus Area: "Edge Cases"
Test Strategy: "Branch Coverage"
```

This combination tells the AI engine:
1. What to focus on (array boundaries)
2. Why (edge cases)
3. How to measure success (branch coverage)

### 5. **Iterate and Refine**
1. Generate mutations with initial instructions
2. Review the generated mutations (via Reports or Tree View)
3. Refine instructions based on results
4. Re-run generation with improved guidance

---

## Examples by Language

### Python Example
```
Focus on list and dictionary operations in process_batch():
- Check slicing mutations (start:stop:step)
- Test dict.get() with missing keys and default values
- Verify loop boundary mutations (range(len(x)) patterns)
- Test list comprehension edge cases
```

### C/C++ Example
```
Array indexing and pointer arithmetic in buffer_copy():
- Off-by-one errors in loop conditions
- Null pointer dereference paths
- Array bounds violations
- String termination mutations (strlen, strncpy edge cases)
```

### Mixed Codebase
```
In this service, focus on the C++ performance-critical path and Python API layer separately:
- C++: Optimize for correctness mutations (pointer, buffer, integer overflow)
- Python: Focus on API contract violations (type mismatches, None handling)
```

---

## Integration with Ollama

When using **Ollama** as your AI provider, developer instructions are passed to the local LLM in a structured prompt:

```
You are a mutation testing AI engine. Generate mutations for the following code:

[Code Snippet]

Developer Guidance:
- Instructions: {developerInstructions}
- Focus Area: {focusArea}
- Test Strategy: {testStrategy}

Generate mutations that:
1. Align with the developer's focus area
2. Follow the specified test strategy
3. Address the specific instructions provided
```

The Ollama engine uses this context to produce more relevant mutations.

---

## Troubleshooting

### Q: My instructions aren't being used
**A**: Check the Output panel when generating mutations. It will show which instructions were captured. Make sure you set them via the command palette before running `Generate Mutations`.

### Q: How do I clear instructions?
**A**: Run `mutation.setDeveloperInstructions` and submit an empty input (just press Enter without typing).

### Q: Can I use rich formatting in instructions?
**A**: Use plain text or Markdown. Complex formatting may not be parsed correctly by the AI engine.

### Q: Do instructions work with all AI providers?
**A**: Yes, all providers (Ollama, OpenAI, Anthropic) receive the developer context. The quality of mutations depends on the model's ability to understand and follow the instructions.

---

## Future Enhancements

Potential features for future versions:
- 📁 **Per-file instructions**: Set different instructions for different source files
- 🎯 **Mutation operator preferences**: Rank operators by relevance to your goals
- 📊 **Instruction templates**: Save and reuse instruction patterns for common scenarios
- 🔄 **Feedback loop**: Rate generated mutations to improve instruction effectiveness
- 💾 **Instruction history**: Store and review previous instructions

---

## See Also

- [Mutation Testing Architecture](./MUTATION_TESTING_ARCHITECTURE.md)
- [VS Code Extension Features](../vscode-extension/README.md)
- [Configuration Guide](../docs/devcontainer.md)
