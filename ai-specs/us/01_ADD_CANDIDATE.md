# Add Candidate to the ATS

## User story

**As a** recruiter,  
**I want** to add candidates to the ATS from my workspace,  
**so that** I can manage their data and selection workflows efficiently.

## Problem and outcome

Recruiters need a single, discoverable path to register a candidate with complete profile data (contact, education, work history) and an optional CV file, with clear feedback on success or failure. The implementation must align with the documented domain model and REST contract so frontend and backend stay consistent.

## Scope

| In scope | Out of scope (unless pulled in by another story) |
|----------|---------------------------------------------------|
| Entry point on recruiter dashboard to start “Add candidate” | Bulk import of candidates |
| Multi-section form: identity, contact, education, work experience, CV | Editing an existing candidate (separate story) |
| Client- and server-side validation per model rules | Autocomplete for education/work experience (backlog; see Notes) |
| CV upload PDF/DOCX, size/type limits | Parsing CV content into structured fields |
| Success and error UX (network, validation, duplicate email) | Non-recruiter roles |

## Functional requirements and acceptance criteria

### 1. Discoverability (dashboard entry)

- The recruiter **main dashboard** exposes a **primary control** (button or equivalent link) labeled clearly (e.g. “Add candidate”) that navigates to the add-candidate flow.
- The control is visible without scrolling on typical desktop viewports and is reachable in the tab order for keyboard users.

### 2. Add-candidate form — fields and structure

The form captures data aligned with the **Candidate**, **Education**, **WorkExperience**, and **Resume** entities.

**Candidate (core)**

| Field | Required | Constraints (product + model) |
|-------|----------|----------------------------------|
| `firstName` | Yes | 2–100 characters; letters only (per data model) |
| `lastName` | Yes | Same as `firstName` |
| `email` | Yes | Valid email format; must be **unique** in the system |
| `phone` | No | If present: Spanish format `(6|7|9)XXXXXXXX`; max 15 characters |
| `address` | No | Max 100 characters |

**Education** (repeatable section, **max 3** records per candidate)

| Field | Required | Notes |
|-------|----------|--------|
| `institution` | Yes | Max 100 characters |
| `title` | Yes | Max 250 characters |
| `startDate` | Yes | Valid date |
| `endDate` | No | Optional; omit or null if ongoing |

**Work experience** (repeatable section)

| Field | Required | Notes |
|-------|----------|--------|
| `company` | Yes | Max 100 characters |
| `position` | Yes | Max 100 characters |
| `description` | No | Max 200 characters if provided |
| `startDate` | Yes | Valid date |
| `endDate` | No | Optional; omit or null if current |

**CV (resume file)**

- Optional upload: **PDF** or **DOCX** only, **max 10 MB** (per data model).
- User can remove/replace file before submit.

### 3. Validation

- **Client-side:** Block submit when required fields are empty or fail format rules; show field-level messages. Email format and uniqueness must be enforced **server-side** (unique constraint / 409 or 400 per API contract).
- **Server-side:** Same rules; return structured `ErrorResponse` (`message`, optional `error`) for 400-class failures; do not persist partial candidate on validation failure.

### 4. CV upload flow (aligned with API spec)

The OpenAPI contract defines:

1. **`POST /upload`** — `multipart/form-data` with binary `file`; response **`FileUploadResponse`**: `filePath`, `fileType`.
2. **`POST /candidates`** — JSON **`CreateCandidateRequest`** including optional **`cv`**: **`CreateResumeRequest`** `{ filePath, fileType }` referencing the uploaded file.

**Acceptance:** If the user attaches a CV, the client uploads first (or uses paths returned from a successful upload), then includes `cv` in the create payload. Reject wrong MIME/extension and oversize files at upload with a clear message.

### 5. Success confirmation

- On **`201`** from `POST /candidates`, show an explicit **success state** (toast, banner, or confirmation view) stating the candidate was added, including **identifier** (e.g. returned `id`) where useful for support.
- Optionally redirect to candidate detail or list per UX decision; behavior must be consistent and tested.

### 6. Errors and resilience

- **Network / server errors:** Surface a non-technical, actionable message; allow retry without losing already entered form data where feasible.
- **Duplicate email:** Map API error to a clear message (e.g. “A candidate with this email already exists”).
- **Upload failures:** Distinguish file type/size errors from server errors.

### 7. Accessibility and responsive behavior

- Form controls have associated labels; errors are announced appropriately (e.g. `aria-describedby` / live region pattern per frontend standards).
- Layout and touch targets work on common mobile widths; no horizontal-only reliance for core actions.

## API surface (contract reference)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/upload` | Upload CV binary; returns `filePath` + `fileType` |
| `POST` | `/candidates` | Create candidate; body `CreateCandidateRequest` |

**Base URL:** Development `http://localhost:3000` (see `api-spec.yml`).

**Required request body (create):** `firstName`, `lastName`, `email`; optional `phone`, `address`, `educations[]`, `workExperiences[]`, `cv`.

## Non-functional requirements

- **Security and privacy:** HTTPS in production; authenticate recruiter actions per product auth model; restrict file storage to intended paths; never expose internal paths in client-facing errors; validate file type by content/MIME where the stack allows.
- **Performance:** Upload and create should complete within acceptable UX bounds; avoid blocking UI without loading indicators.
- **Consistency:** Behavior and field limits must match **`data-model.md`** and **`api-spec.yml`**; update those docs if the implementation intentionally changes the contract.

## Implementation guidance (for autonomous delivery)

**Backend**

- Implement or extend the **`POST /candidates`** handler to persist Candidate + nested Education/WorkExperience + optional Resume per Prisma/schema.
- Implement **`POST /upload`** with size/type checks and secure storage path generation.
- Return **`CreateCandidateResponse`** (201) and **`ErrorResponse`** on failures.

**Frontend**

- Dashboard route/view: prominent “Add candidate” entry.
- Add-candidate page: form sections, repeatable blocks for education/experience with max three education rows, file input for CV, submit orchestration (upload then create, or disable submit until upload succeeds when CV is required by UX—CV remains optional per model).

**Tests**

- **Backend:** Unit/integration tests for validation, duplicate email, education count cap, file constraints, and successful create with/without CV.
- **Frontend:** Unit tests for validation helpers; E2E (e.g. Cypress) for happy path and error states per `development_guide.md`.

**Documentation**

- If behavior or schemas change, update `ai-specs/specs/data-model.md`, `ai-specs/specs/api-spec.yml`, and any recruiter-facing help text in-app.

## Definition of done

- [ ] Dashboard entry meets discoverability and keyboard criteria.
- [ ] Form implements all fields and limits above; education capped at three.
- [ ] `POST /upload` + `POST /candidates` flow works end-to-end with optional CV.
- [ ] Validation and error handling match acceptance criteria; success confirmation is explicit.
- [ ] Automated tests cover critical paths; docs updated if contract or model changed.

## Notes (backlog)

- **Autocomplete** for education and work experience from existing system data: treat as a follow-up once reference data or search APIs exist; not required for MVP of this story.
