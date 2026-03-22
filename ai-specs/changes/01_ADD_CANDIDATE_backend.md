# Backend Implementation Plan: 01_ADD_CANDIDATE Add Candidate to the ATS

## 1. Header

- **Story:** `01_ADD_CANDIDATE` (source: `ai-specs/us/01_ADD_CANDIDATE.md`)
- **Feature name:** Add Candidate to the ATS (backend scope: `POST /upload`, `POST /candidates`)

## 2. Overview

This document describes the backend work required to support **Add Candidate**: persisting a **Candidate** aggregate with optional nested **Education** (max 3), **WorkExperience**, and optional **Resume** (CV), plus a **file upload** endpoint that returns `filePath` and `fileType` for use in `POST /candidates`.

**Architecture:** Domain-Driven Design (DDD) with layered structure per `ai-specs/specs/backend-standards.mdc`: **Presentation** (Express controllers, routes, multipart handling), **Application** (services, centralized validation), **Domain** (entities, invariants, optional repository interfaces), **Infrastructure** (Prisma, filesystem storage for uploads). Business rules and field limits must match `ai-specs/specs/data-model.md` and `ai-specs/specs/api-spec.yml`.

**Current codebase note:** `backend/` today is a minimal Express app (`src/index.ts`) and Prisma schema with only `User`. This plan assumes introducing Candidate-related models, routes, and services aligned with the standards document.

---

## 3. Architecture Context

| Layer | Responsibility | Typical artifacts |
|-------|----------------|-------------------|
| **Presentation** | HTTP, multipart, status codes, thin delegation | `uploadController.ts`, `candidateController.ts`, `uploadRoutes.ts`, `candidateRoutes.ts`, `middleware/` (upload limits, optional auth placeholder) |
| **Application** | Orchestration, validation entry points | `candidateService.ts`, `fileUploadService.ts`, `validator.ts` (or split validators) |
| **Domain** | Entities, invariants, domain errors | `Candidate.ts`, `Education.ts`, `WorkExperience.ts`, `Resume.ts`, optional `ICandidateRepository` |
| **Infrastructure** | Prisma client, disk I/O | `prismaClient.ts`, upload directory config, Prisma transactions in service or repository |

**OpenAPI contract:** `POST /upload` → `FileUploadResponse`; `POST /candidates` → `CreateCandidateRequest` / `CreateCandidateResponse` (201).

---

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action:** Create and switch to a new feature branch before any code changes.
- **Branch naming:** `feature/01-add-candidate-backend` (kebab-case from story basename `01_ADD_CANDIDATE`, suffix `-backend` per Development Workflow in `backend-standards.mdc`).
- **Implementation steps:**
  1. Ensure you are on the latest base branch (`main` or `develop`, whichever the team uses).
  2. `git pull origin <base-branch>`
  3. `git checkout -b feature/01-add-candidate-backend`
  4. `git branch` (verify)
- **Notes:** If the branch already exists for collaborative work, check it out and merge/rebase from base as needed.

---

### Step 1: Prisma Schema and Migration (Candidate Aggregate)

- **Files:** `backend/prisma/schema.prisma`, new migration under `backend/prisma/migrations/`
- **Action:** Add models aligned with `data-model.md`: `Candidate`, `Education`, `WorkExperience`, `Resume` with relations and constraints.
- **Suggested model sketch (adjust field types to match Prisma conventions):**
  - `Candidate`: `id`, `firstName`, `lastName`, `email` **@unique**, optional `phone`, `address`; relations to educations, workExperiences, resumes.
  - `Education`: FK `candidateId`, `institution`, `title`, `startDate`, `endDate` optional.
  - `WorkExperience`: FK `candidateId`, `company`, `position`, optional `description`, `startDate`, `endDate` optional.
  - `Resume`: FK `candidateId`, `filePath`, `fileType`, `uploadDate` (default `now()`).
- **Implementation steps:**
  1. Define models and `@@index` on `email` if not already unique.
  2. Run `npx prisma migrate dev --name add_candidate_aggregate` (or equivalent).
  3. Run `npx prisma generate`.
- **Dependencies:** `DATABASE_URL`, PostgreSQL.
- **Notes:** Keep `User` model unless product decides to merge auth; no requirement in this story to remove it.

---

### Step 2: Environment and Upload Storage Configuration

- **Files:** `backend/.env.example`, config module or constants in `src/infrastructure/`
- **Action:** Define environment variables for upload directory, max file size (10 MB), allowed MIME/types (PDF, DOCX), and server `PORT` (align with `api-spec.yml` server URL `http://localhost:3000` — resolve mismatch with current hardcoded `3010` in `index.ts`).
- **Implementation steps:**
  1. `UPLOAD_DIR`, `MAX_UPLOAD_BYTES` (10485760), `ALLOWED_RESUME_MIME_TYPES` (and/or extension checks).
  2. Ensure upload directory exists at startup or on first upload (with safe permissions).
- **Notes:** Do not expose raw internal filesystem paths in client-facing error messages (NFR).

---

### Step 3: Domain Models and Domain Errors

- **Files:** `backend/src/domain/models/Candidate.ts`, `Education.ts`, `WorkExperience.ts`, `Resume.ts`; `backend/src/domain/errors/` (e.g. `ValidationError`, `DuplicateEmailError`)
- **Action:** TypeScript classes or factories that construct entities from validated DTOs; optional methods to enforce invariants (e.g. education count ≤ 3) before persistence.
- **Function signatures (illustrative):**
  - `Candidate.fromCreateRequest(data: CreateCandidateInput): Candidate`
  - `candidate.assertEducationLimit(): void` — throws if `educations.length > 3`
- **Implementation steps:**
  1. Map API/date strings to `Date` where needed.
  2. Keep domain free of Express types; Prisma usage may live in services/repositories per existing project patterns in `backend-standards.mdc`.
- **Dependencies:** None from Express.

---

### Step 4: Application Layer — Validation (`validator.ts`)

- **File:** `backend/src/application/validator.ts` (and/or `validators/candidateValidator.ts`)
- **Action:** Centralize rules from the user story and `data-model.md`:

| Field / rule | Validation |
|--------------|------------|
| `firstName`, `lastName` | Required, 2–100 chars, letters only (define regex consistent with product) |
| `email` | Required, valid email format |
| `phone` | Optional; if present: Spanish `(6|7|9)XXXXXXXX`, max 15 chars |
| `address` | Optional, max 100 chars |
| `educations` | Optional array; **max 3 items**; each item: `institution` max 100, `title` max 250, `startDate` required, `endDate` optional |
| `workExperiences` | Optional array; each: `company`/`position` max 100, `description` max 200 if present, `startDate` required, `endDate` optional |
| `cv` | Optional; if present both `filePath` and `fileType` required (`CreateResumeRequest`) |

- **Function signature (illustrative):**

```typescript
export function validateCreateCandidateRequest(body: unknown): CreateCandidateRequest;
```

- **Implementation steps:**
  1. Parse and narrow types; throw or return structured validation errors consumed by error middleware.
  2. Validate date ordering if required by product (e.g. `endDate >= startDate` when both present); document decision in tests.
- **Notes:** Server must reject requests with more than three education rows with **400** and clear `message` / optional `error` detail.

---

### Step 5: Application Layer — File Upload Service

- **File:** `backend/src/application/services/fileUploadService.ts` (or `infrastructure` if purely I/O)
- **Action:** Process uploaded buffer/stream: verify size ≤ 10 MB, type PDF or DOCX (extension + MIME/`file-type` or magic bytes if available), generate **opaque server-side** stored filename/path under `UPLOAD_DIR`, return `{ filePath, fileType }` matching `FileUploadResponse`.
- **Function signature (illustrative):**

```typescript
export async function saveUploadedResume(file: Express.Multer.File): Promise<FileUploadResponse>;
```

- **Implementation steps:**
  1. Integrate `multer` (memory or disk) in presentation layer; pass file to service.
  2. On invalid type/size, throw domain/application error mapped to **400**.
- **Dependencies:** `multer`, `path`, `fs/promises` or sync mkdir, optional `file-type` package.

---

### Step 6: Application Layer — Candidate Create Service

- **File:** `backend/src/application/services/candidateService.ts`
- **Action:** `createCandidate(validated: CreateCandidateRequest): Promise<CreateCandidateResponse>`
  1. Re-check business rules (education count, duplicate email handling).
  2. If `cv` present: verify `filePath` exists under allowed upload root and was issued by this app (path traversal prevention); reject with **400** if invalid.
  3. Use **Prisma transaction**: `candidate.create` with nested `create` for educations, workExperiences, and optionally one `Resume` linked to candidate.
  4. On unique constraint violation on email (`P2002`), map to **400** with message suitable for frontend copy e.g. “A candidate with this email already exists” (per `api-spec.yml` 400 for duplicate email).
- **Function signature (illustrative):**

```typescript
export async function createCandidate(data: CreateCandidateRequest): Promise<CreateCandidateResponse>;
```

- **Dependencies:** `PrismaClient`, validator output types.
- **Notes:** Do not persist partial candidate if validation fails — validate fully before transaction; transaction rolls back on failure.

---

### Step 7: Presentation — Upload Controller and Route

- **Files:** `backend/src/presentation/controllers/uploadController.ts`, `backend/src/routes/uploadRoutes.ts`
- **Action:** `POST /upload` multipart field `file`; respond **200** with `FileUploadResponse` on success; **400** for bad type/size; **500** for unexpected errors.
- **Implementation steps:**
  1. Configure `multer` limits (`fileSize: 10MB`).
  2. Delegate to `saveUploadedResume`.
  3. Pass errors to global error handler.
- **Route registration:** `app.use('/upload', uploadRoutes)` or `app.post('/upload', ...)`.

---

### Step 8: Presentation — Candidate Controller and Route

- **Files:** `backend/src/presentation/controllers/candidateController.ts`, `backend/src/routes/candidateRoutes.ts`
- **Action:** `POST /candidates` — `express.json()`, call `validateCreateCandidateRequest(req.body)`, then `createCandidate`, respond **201** with `CreateCandidateResponse` body matching OpenAPI (at minimum `id`, `firstName`, `lastName`, `email`, nullable `phone`, `address`).
- **Function signature (illustrative):**

```typescript
export async function postCandidate(req: Request, res: Response, next: NextFunction): Promise<void>;
```

- **Dependencies:** Services and validator.

---

### Step 9: Error Middleware and Error Response Mapping

- **File:** `backend/src/middleware/errorHandler.ts` (or extend `index.ts`)
- **Action:** Map errors to JSON matching `ErrorResponse`: `{ message: string, error?: string }` with appropriate HTTP codes:
  - Validation / duplicate email / bad upload / bad CV path: **400**
  - Unexpected: **500** (generic `message`, log details server-side)
- **Notes:** Align with `api-spec.yml`; avoid leaking stack traces in production responses.

---

### Step 10: Application Bootstrap

- **File:** `backend/src/index.ts`
- **Action:** Register `express.json()`, routes for `/upload` and `/candidates`, CORS if frontend is separate, error handler last. Use `process.env.PORT ?? 3000` to match API spec dev server.
- **Notes:** Optional: recruiter authentication middleware — story says “authenticate recruiter actions per product auth model”; if auth is not yet implemented, document a TODO and protect routes when auth lands.

---

### Step 11: Tests

- **Files:** `backend/src/**/*.test.ts` or `__tests__/` per project convention
- **Categories:**
  - **Successful cases:** Create candidate minimal fields; with educations (0–3), work experiences, with and without CV reference (mocked file on disk or temp dir).
  - **Validation errors:** Invalid names, email, phone, address length; education > 3; invalid nested fields; invalid dates.
  - **Duplicate email:** Simulate `P2002` or integration test with real DB — expect **400** and user-safe message.
  - **Upload:** Oversize file, wrong MIME/extension; success returns `filePath` + `fileType`.
  - **CV reference:** Create with `cv` pointing outside upload dir or non-existent file — **400**.
  - **Server errors:** Mock Prisma throw — **500** path.
- **Coverage:** Target 90% per `backend-standards.mdc` for new code.

---

### Step 12: Update Technical Documentation

- **Action:** Mandatory before considering work complete.
- **Implementation steps:**
  1. **Review** all code and schema changes.
  2. **Update** `ai-specs/specs/data-model.md` only if implementation intentionally diverges (prefer aligning code to existing doc).
  3. **Update** `ai-specs/specs/api-spec.yml` if request/response shapes or status codes change.
  4. **Update** `*-standards.mdc` only if new patterns are introduced.
  5. **Verify** English-only technical text per `documentation-standards.mdc`.
- **References:** `ai-specs/specs/documentation-standards.mdc`

---

## 5. Implementation Order

1. Step 0: Create feature branch  
2. Step 1: Prisma schema and migration  
3. Step 2: Environment and upload configuration  
4. Step 3: Domain models and errors  
5. Step 4: Validator for `CreateCandidateRequest`  
6. Step 5: File upload service  
7. Step 6: Candidate create service (transaction + duplicate email)  
8. Step 7: Upload controller and route  
9. Step 8: Candidate controller and route  
10. Step 9: Error middleware  
11. Step 10: Bootstrap `index.ts` (port, CORS, routes)  
12. Step 11: Unit and integration tests  
13. Step 12: Documentation updates  

---

## 6. Testing Checklist

- [ ] `POST /candidates` returns **201** with `id` and core fields for minimal valid body.  
- [ ] Nested educations (0–3) and work experiences persist and appear on subsequent `GET /candidates/:id` if implemented in same effort (optional for this story if GET is pre-existing).  
- [ ] Fourth education row rejected with **400**.  
- [ ] Duplicate email returns **400** with clear message (frontend can map to “already exists”).  
- [ ] `POST /upload` accepts PDF/DOCX ≤ 10 MB; rejects over limit and wrong type with **400**.  
- [ ] Create with `cv` after upload succeeds; invalid `cv.filePath` rejected.  
- [ ] No partial DB rows after failed validation or failed transaction.  
- [ ] Error JSON shape matches `ErrorResponse` (`message` required).  
- [ ] `npm test` / `npm run test:coverage` meet project thresholds.

---

## 7. Error Response Format

Per `api-spec.yml` `ErrorResponse`:

```json
{
  "message": "Human-readable summary",
  "error": "Optional detail or code for debugging"
}
```

| Scenario | HTTP status | Example `message` |
|----------|-------------|-------------------|
| Body validation failed | 400 | Validation failed (field hints in `error` or dedicated structure if project extends) |
| Duplicate email | 400 | A candidate with this email already exists |
| Education count > 3 | 400 | Maximum of 3 education records allowed |
| Upload wrong type / size | 400 | Invalid file type or file exceeds maximum size |
| Invalid or unsafe `cv.filePath` | 400 | Invalid resume file reference |
| Unexpected server/DB failure | 500 | An unexpected error occurred |

---

## 8. Partial Update Support

**Not applicable** for this story: `POST /candidates` is a full create. Partial updates would be a separate `PATCH`/`PUT` story.

---

## 9. Dependencies

- **Runtime:** Node.js, Express, Prisma, PostgreSQL  
- **Likely npm packages:** `multer`, `dotenv`, `@prisma/client`  
- **Optional:** `file-type` (magic number detection), `cors`  
- **Dev:** Jest, TypeScript, Supertest (if HTTP integration tests)

---

## 10. Notes

- **Language:** All code, errors, logs, and technical docs in **English** (`CLAUDE.md` / `AGENTS.md`).  
- **Unique email:** Enforced in DB (`@unique`) and surfaced as **400** per OpenAPI for this project (not **409**), unless team updates `api-spec.yml`.  
- **Security:** Validate file content where feasible; restrict stored paths; sanitize filenames; HTTPS in production.  
- **Auth:** Recruiter-only access may require middleware later; scope for this story is backend contract + validation.  
- **Port:** Standardize on **3000** for local dev to match `api-spec.yml` or document the chosen port in specs.

---

## 11. Next Steps After Implementation

- Wire frontend to `POST /upload` then `POST /candidates` per user story.  
- Run E2E tests when frontend is ready.  
- Add authentication/authorization when product auth model is available.  
- Consider virus scanning or storage in S3 for production uploads (out of scope for MVP).

---

## 12. Implementation Verification

- [ ] **Code quality:** ESLint clean, TypeScript strict, no unjustified `any`.  
- [ ] **Functionality:** Matches acceptance criteria in `ai-specs/us/01_ADD_CANDIDATE.md`.  
- [ ] **Testing:** Coverage and critical paths covered.  
- [ ] **Integration:** Manual or automated call to both endpoints succeeds end-to-end.  
- [ ] **Documentation:** `data-model.md` / `api-spec.yml` updated if contract changed.
