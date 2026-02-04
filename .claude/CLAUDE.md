# AI Assistant Operational Rules (LLM-Optimized)

This document defines **decision rules**, **failure handling**, and **research requirements**.
Follow rules in **priority order**.

---

## 0. GLOBAL PRIORITIES (Highest Authority)

When rules conflict, follow this order:

1. Do not repeat a failing approach
2. Do not guess when information is unknown
3. Investigate root cause before modifying code
4. Use tools before asking the user
5. Maintain project formatting standards

---

## 1. FAILURE LOOP PREVENTION

**Definition: Same approach = same method, tool, or fix strategy category**

| Condition | Required Action |
|----------|-----------------|
| Approach failed once | Re-evaluate assumptions and environment |
| Same approach failed twice | **Prohibited** from retrying variations |
| After 2 failures | Must switch to investigation mode |

**Investigation Mode Requires:**
- WebSearch (documentation, known issues)
- Codebase search (Read/Grep)
- Logs / system state analysis
- Dependency or environment checks

---

## 2. ROOT CAUSE RULE

Before implementing a fix, the assistant must confirm at least one:

- Identified source of failure
- Verified incorrect assumption
- Located failing component
- Found documentation-supported solution

If none are confirmed → continue investigation.

---

## 3. UNKNOWN INFORMATION RULE

When required information is missing:

| Situation | Action |
|-----------|--------|
| Documentation exists | Use WebSearch |
| Project-specific data needed | Use MCP servers |
| Code behavior unclear | Read files / search codebase |
| After all tools used and still unclear | State uncertainty and explain attempts |

**Guessing is not allowed.**

---

## 4. ERROR HANDLING LOGIC

When an error occurs:

**Mandatory automated checks (in order):**

1. Type errors
2. Syntax errors
3. Lint issues
4. Dependency mismatches
5. Related module failures

**User clarification is allowed ONLY if:**
- The error is runtime-context dependent
- The issue cannot be detected programmatically

---

## 5. EXAMPLE INTERPRETATION RULE

If user uses phrases:
- "for example"
- "like"
- "such as"

Then:
- Extract the **principle**
- Do **not** copy the literal example
- Apply the pattern to the real context

---

## 6. CODE MODIFICATION STANDARDS

All edits must follow:

| Rule | Requirement |
|------|-------------|
| Indentation | Tabs only (`\t`), width = 4 |
| Line width | Max 120 chars |
| Formatting | Run project formatter after changes |
| Style | Match surrounding file exactly |
| Code quality | Prefer clarity over cleverness |

---

## 7. PRE-ACTION CHECK (Lightweight Gate)

Before making changes, confirm:

- This method has not already failed twice
- Required information is confirmed
- Root cause is identified
- Example inputs are not literal requirements

If any condition is false → switch to investigation.

---

## 8. TOOL USAGE TRIGGERS

| Tool | Use When |
|------|----------|
| WebSearch | Documentation, version behavior, libraries |
| MCP servers | Documentation, Authenticated/project-bound data |
| Read/Grep | Codebase structure or logic |
| Logs | Runtime/system issues |

---

## 9. BEHAVIORAL CONSTRAINTS

- Do not repeat ineffective strategies
- Do not assume undocumented behavior
- Do not skip investigation steps
- Do not change code before understanding failure

---

## 10. CONTEXT IMPORT

Project-specific rules are defined in:

```
@../AGENTS.md
```

This file provides general operational logic. Project rules override only where explicitly stated.
