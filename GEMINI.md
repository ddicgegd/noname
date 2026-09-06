# AGENT OPERATING CONTRACT & STRICT DIRECTIVES (AGENTS.md)

> **CRITICAL PROTOCOL — ZERO TOLERANCE FOR DEVIATION**
> All directives below are non-negotiable hard constraints. You MUST NOT ignore, bypass, forget, or override any directive or context defined in this document under any circumstance. Speculation, hallucination, or actions outside explicit user scope are strictly prohibited.

---

## 1. CORE OPERATING PRINCIPLES & SYSTEM SAFETY

### 1.1. DIRECT EXECUTION ONLY — STRICT BAN ON UNREQUESTED PLANNING
- **NO SPONTANEOUS PLANS**: NEVER generate plans, execution outlines, step-by-step roadmaps, or speculative preparation phases unless the user explicitly requests one (e.g., via `/plan`, "create a plan", "lên kế hoạch").
- **DEFAULT TO DIRECT ACTION**: Execute the requested task immediately and directly without unnecessary conversational overhead.

### 1.2. MANDATORY POST-TASK SERVICE RESTART & HEALTH CHECK
- **NO TASK IS COMPLETE WITHOUT RUNNING SERVER**: Running `npm run build` is ONLY a compile check. It is NOT the end of the task.
- **EXACT RESTART SEQUENCE (MANDATORY)**:
  1. Kill old process on port 3000: `fuser -k 3000/tcp 2>/dev/null || true`
  2. Launch dev server in background via `run_command`: `npm run dev`
  3. Verify health endpoint: `curl -s http://localhost:3000/api/health`
- **DEFINITION OF DONE**: The agent MUST NOT end the turn or claim completion until `http://localhost:3000/api/health` returns `{"status":"ok",...}`.

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
- **CONTEXT INDEPENDENCE**: Nếu phiên prompt sau không có thông tin liên quan tới phiên trước thì bắt buộc phải quên/loại bỏ ngữ cảnh trước đó trước khi thực thi.
- **EXPLICIT CONFIRMATION (NO GUESSING)**: Xác nhận cấu trúc và vị trí cần sửa rõ ràng qua prompt; TUYỆT ĐỐI CẤM việc tự đoán hoặc suy diễn vị trí/cấu trúc khi chưa có chỉ định rõ ràng.

---

## 2. FRONTEND & UI DEVELOPMENT DIRECTIVES

1. **Logic & Algorithm Preservation**: NEVER alter underlying business logic, state machines, or algorithmic code unless explicitly instructed.
2. **UI Component & Style Boundaries**: NEVER introduce unsolicited UI components, error modals, arbitrary palette changes, or layout wrappers without explicit confirmation.
3. **Strict Page-Level Scope**: Confine all UI modifications strictly to the designated page/component. Do not modify global themes or adjacent pages.
4. **Context-Aware Design Standards**: Infer design patterns directly from neighboring components and maintain visual consistency across the entire page.
5. **Mandatory `design-taste-frontend` Skill**:
   - For all frontend UI development, redesigns, landing pages, or styling tasks, ALWAYS activate and follow `.agents/skills/design-taste-frontend/SKILL.md`.
   - Apply Brief Inference (page kind, vibe, audience, brand assets) and enforce anti-slop aesthetics.

---

## 3. BACKEND & REST API INTEGRATION DIRECTIVES

1. **Frontend Isolation**: NEVER modify frontend/UI source files when performing backend or API integration tasks unless explicitly requested.
2. **Strict Endpoint Scope**: DO NOT create, modify, or extend API endpoints beyond the explicitly assigned scope.
3. **Targeted Context Isolation**: Restrict inspection strictly to the designated backend handlers, schemas, and endpoints.
