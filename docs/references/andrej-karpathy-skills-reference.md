# Andrej Karpathy Skills Reference

Source repo:
- https://github.com/forrestchang/andrej-karpathy-skills
- local snapshot: /Users/brendy/.tmp/andrej-karpathy-skills

Purpose:
A condensed markdown reference of the repo so its ideas can be reused while working in this project or elsewhere.

## Core idea
The repo packages Karpathy-inspired behavioral rules for coding agents, mainly to reduce:
- silent bad assumptions
- unnecessary complexity
- broad collateral edits
- weak/non-verifiable execution

The guidance is framed as four operating principles.

## 1. Think Before Coding
Goal:
Prevent the model from silently choosing assumptions and charging ahead.

Rules:
- State assumptions explicitly.
- If multiple interpretations exist, present them instead of choosing silently.
- If a simpler or safer approach exists, say so.
- If something is unclear, stop and ask.

Good use cases:
- ambiguous specs
- UI requests with multiple possible interpretations
- risky edits where scope is unclear
- data import / business-rule changes with hidden edge cases

Short working prompt:
- Before coding, list assumptions, ambiguities, and the simplest viable interpretation.

## 2. Simplicity First
Goal:
Prevent overengineering and speculative abstractions.

Rules:
- No features beyond what was asked.
- No abstractions for one-off usage.
- No speculative flexibility/configurability.
- No unnecessary error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

Heuristic:
- Ask: “Would a senior engineer say this is overcomplicated?”

Good use cases:
- dashboard widgets
- importer flows
- small parser fixes
- one-off UI components

Short working prompt:
- Implement the minimum code that solves the stated problem and nothing extra.

## 3. Surgical Changes
Goal:
Keep diffs tightly scoped to the actual request.

Rules:
- Touch only what is necessary.
- Do not refactor adjacent code just because you noticed it.
- Match existing style unless the task requires otherwise.
- Mention unrelated dead code, but do not remove it unless asked.
- Remove only the unused code caused by your own change.

Heuristic:
- Every changed line should trace back to the request.

Good use cases:
- production bugfixes
- rules engine tweaks
- dashboard metric corrections
- imports/parsers in live codebases

Short working prompt:
- Make the smallest change that fixes the issue; avoid unrelated cleanup.

## 4. Goal-Driven Execution
Goal:
Turn vague implementation work into verifiable success criteria.

Rules:
- Convert tasks into checks.
- Prefer tests or explicit verification conditions.
- For multi-step tasks, define step -> verification pairs.

Example pattern:
1. Reproduce the issue -> verify with failing check
2. Implement fix -> verify behavior or test passes
3. Run build/tests -> verify no regressions

Good use cases:
- bugfixes
- import reconciliation
- analytics corrections
- rule/preset additions

Short working prompt:
- Define success in a way that can be verified, then iterate until the verification passes.

## Notable repo files
- README.md
  - overview, motivation, install options, key insight
- CLAUDE.md
  - concise version for root instruction files
- skills/karpathy-guidelines/SKILL.md
  - reusable skill-packaged version of the same rules
- CURSOR.md
  - how to use the guidance with Cursor rules
- EXAMPLES.md
  - examples of wrong vs correct behavior across the four principles

## High-value examples from EXAMPLES.md

### Think Before Coding
Bad pattern:
- user asks for export
- model silently decides export format, scope, fields, and destination

Preferred pattern:
- clarify scope, format, fields, and volume first

### Simplicity First
Bad pattern:
- request for simple discount function turns into full strategy/abstraction framework

Preferred pattern:
- add a tiny function first
- abstract later only if the requirement appears

### Surgical Changes
Bad pattern:
- fix one validator bug and also refactor comments, variable names, and surrounding logic

Preferred pattern:
- patch only the crashing condition
- do not opportunistically rewrite neighboring code

### Goal-Driven Execution
Bad pattern:
- “fix the bug” without a reproducible check

Preferred pattern:
- create a reproduction condition first
- implement until that condition passes
- verify with build/tests

## How I can use this going forward
Useful translation for future work in this chat:
- For ambiguous product/UI work: ask before assuming.
- For code changes: prefer minimal diffs.
- For business rules and imports: define source-of-truth and verification first.
- For bugfixes: reproduce -> patch -> build/verify.

## Best distilled operating checklist
Before changing code:
1. What assumptions am I making?
2. Is there ambiguity that should be surfaced?
3. What is the simplest implementation that solves only this request?
4. Which lines truly need to change?
5. How will I verify success?

## Suggested reuse snippet
If you want to reuse this guidance in other projects, this is the shortest practical summary:

- Think before coding: state assumptions, surface ambiguity, ask when unclear.
- Simplicity first: solve the problem with the least code possible.
- Surgical changes: touch only what the request requires.
- Goal-driven execution: define verifiable success criteria and loop until satisfied.

## Notes
- This repo is designed primarily for Claude/Cursor workflows, but the principles are tool-agnostic.
- The most useful part for our work is not the installation format; it is the four-principle operating model.
- This is especially relevant for dashboard metrics, prop-rule logic, and import reconciliation work.
