# AGENT OPERATING CONTRACT & STRICT DIRECTIVES (AGENTS.md)

> **CRITICAL PROTOCOL — ZERO TOLERANCE FOR DEVIATION**
> All directives below are non-negotiable hard constraints. You MUST NOT ignore, bypass, forget, or override any directive or context defined in this document under any circumstance. Speculation, hallucination, or actions outside explicit user scope are strictly prohibited.

---

## 1. CORE OPERATING PRINCIPLES & SYSTEM SAFETY

### 1.1. DIRECT EXECUTION ONLY — STRICT BAN ON UNREQUESTED PLANNING
- **NO SPONTANEOUS PLANS**: NEVER generate plans, execution outlines, step-by-step roadmaps, or speculative preparation phases unless the user explicitly requests one (e.g., via `/plan`, "create a plan", "lên kế hoạch").
- **DEFAULT TO DIRECT ACTION**: Execute the requested task immediately and directly without unnecessary conversational overhead.

### 1.2. SEAMLESS DUAL HOT-RELOAD & ZERO-RESTART GUARANTEE
- **AUTOMATIC DUAL HOT-RELOAD (PERSISTENT DAEMON)**:
  - **Frontend (`src/**`)**: Vite HMR automatically reflects UI, component, CSS, and client-side logic changes immediately (0.05s) without manual page reloads and preserves state.
  - **Backend & GraphQL (`server.ts`)**: `tsx watch` daemon automatically recompiles and hot-reloads backend endpoints and resolvers on file change (0.2s) without dropping connections.
- **ABSOLUTE BAN ON MANUAL RESTARTS IN CHAT PROMPTS**:
  - NEVER execute `npm run dev`, `fuser -k 3000`, or background server spawn commands inside chat turns. Doing so breaks the T3 Code JSON-RPC transport and causes `session/cancel` socket collisions.
- **DEFINITION OF DONE**:
  - The task is complete immediately once file modifications are applied. The persistent server automatically hot-reloads both frontend and backend seamlessly.

### 1.3. STRICT SCOPE ADHERENCE & IMMEDIATE REMEDIATION
- **EXACT SCOPE COMPLIANCE**: Delivering incorrect output, exceeding requested scope, or performing unsolicited modifications is a critical system violation.
- **IMMEDIATE HALT & REPAIR**: If any deviation or unintended modification occurs, IMMEDIATELY halt execution, assess the drift, and revert/fix the code strictly back to the original user specification.

### 1.4. PRE-EXECUTION VERIFICATION
- **PRE-ACTION AUDIT**: Before executing ANY tool, command, file edit, or code generation, verify that the action strictly matches user requirements and stays within permissible boundaries.

### 1.5. ABSOLUTE BAN ON GIT ROLLBACK / RESET
- **NO GIT RESET/REVERT**: NEVER run `git reset`, `git checkout`, `git revert`, `git restore`, or any equivalent destructive command to rollback repository state without explicit user instruction.

### 1.6. STRICT CONTEXT EXTRACTION & BOUNDARIES
- When prompted to load or extract context, only read and inspect the explicitly specified target files or endpoints.
- DO NOT modify, overwrite, cache, or store context data outside the designated scope.

### 1.7. MANDATORY SKILL ACTIVATION
- Proactively identify and activate available project skills whenever applicable to the current task.

### 1.8. CONTEXT RESET & EXPLICIT TARGET CONFIRMATION
- **CONTEXT INDEPENDENCE**: If a subsequent prompt does not reference prior context, immediately disregard and clear prior session assumptions before execution.
- **EXPLICIT TARGET CONFIRMATION (NO GUESSING)**: Target structures and modification points must be explicitly confirmed via prompt. Speculating or extrapolating code locations or structures without explicit user designation is STRICTLY PROHIBITED.

### 1.9. "FIX IS REPAIR, NOT REDESIGN" — LOCALIZED DEFECT REMEDIATION
- **LOCALIZED FIX ONLY**: When tasked with fixing or debugging, identify the exact defect location and repair ONLY that defect. "Fix" means localized remediation; NEVER alter existing layout structures, redesign components, or add/remove surrounding elements unless a major architectural flaw exists and the user explicitly requests a redesign.
- **ABSOLUTE FIDELITY TO REFERENCE SAMPLES (NO SPECULATIVE EFFECTS)**: When the user provides an image, reference code, or design pattern, adhere strictly to its exact nature. NEVER invent unrequested effects, SVG blur/glow filters, solid replacements for dashed strokes, or speculative box shadows that break layout hierarchy.
- **ZERO UI REGRESSION**: All fixes must preserve existing layout dimensions, container paddings, and display hierarchy. New styles or animations must never introduce boundary clipping (`overflow-hidden` truncation), edge bleeding, or occlusion of neighboring elements.

---

## 2. FRONTEND & UI DEVELOPMENT DIRECTIVES

1. **Logic & Algorithm Preservation**: NEVER alter underlying business logic, state machines, or algorithmic code unless explicitly instructed.
2. **UI Component & Style Boundaries**: NEVER introduce unsolicited UI components, error modals, arbitrary palette changes, or layout wrappers without explicit confirmation.
3. **Strict Page-Level Scope**: Confine all UI modifications strictly to the designated page/component. Do not modify global themes or adjacent pages.
4. **Context-Aware Design Standards**: Infer design patterns directly from neighboring components and maintain visual consistency across the entire page.
5. **Mandatory `design-taste-frontend` Skill**:
   - For all frontend UI development, redesigns, landing pages, or styling tasks, ALWAYS activate and follow `.agents/skills/design-taste-frontend/SKILL.md`.
   - Apply Brief Inference (page kind, vibe, audience, brand assets) and enforce anti-slop aesthetics.
6. **Defect-Targeted Fix Constraint**: Confine all UI repairs strictly to the minimal defect site. Preserve full hierarchy, padding, margin, and adjacent component layouts intact.

---

## 3. BACKEND & REST API INTEGRATION DIRECTIVES

1. **Frontend Isolation**: NEVER modify frontend/UI source files when performing backend or API integration tasks unless explicitly requested.
2. **Strict Endpoint Scope**: DO NOT create, modify, or extend API endpoints beyond the explicitly assigned scope.
3. **Targeted Context Isolation**: Restrict inspection strictly to the designated backend handlers, schemas, and endpoints.
