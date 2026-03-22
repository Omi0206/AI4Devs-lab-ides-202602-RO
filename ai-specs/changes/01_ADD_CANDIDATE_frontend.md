# Frontend Implementation Plan: 01_ADD_CANDIDATE Add Candidate to the ATS

## 1. Overview

This plan covers the recruiter-facing UI for **adding a candidate** to the ATS: a discoverable dashboard entry point, a multi-section form aligned with **Candidate**, **Education**, **WorkExperience**, and optional **Resume** (CV), client-side validation matching `data-model.md` / user story limits, orchestration of **`POST /upload`** then **`POST /candidates`**, explicit success feedback (including returned `id`), and resilient error handling (network, validation, duplicate email, upload failures).

**Architecture principles:** Component-based React with a **service layer** (`src/services/`) for HTTP; **local state** with hooks (`useState` / `useEffect`); **React Router** for `/` (dashboard) and add-candidate route; **React Bootstrap** for layout and forms; **TypeScript** for new code per `frontend-standards.mdc`. The current `frontend/` app is a minimal CRA template—this work introduces routing, API client, UI library, validation helpers, and tests as needed.

## 2. Architecture Context

| Area | Choice |
|------|--------|
| **Components** | `RecruiterDashboard` (primary CTA “Add candidate”); `AddCandidatePage` (or `AddCandidateForm`) composing sections: identity/contact, repeatable education (max 3), repeatable work experience, CV upload, submit |
| **Services** | `uploadService.ts` — `multipart/form-data` to `POST /upload`; `candidateService.ts` — `POST /candidates` with JSON `CreateCandidateRequest` |
| **Types** | `src/types/candidate.ts` (or similar) mirroring OpenAPI: `CreateCandidateRequest`, `CreateEducationRequest`, `CreateWorkExperienceRequest`, `CreateResumeRequest`, `FileUploadResponse`, `ErrorResponse`, `CreateCandidateResponse` |
| **Validation** | Pure functions in `src/utils/` or `src/validation/` (e.g. `candidateFormValidation.ts`) — unit-tested; field-level errors for UI |
| **Routing** | `BrowserRouter` in `App.tsx`: e.g. `/` → dashboard, `/candidates/new` → add form (path names are a project decision; keep RESTful and documented) |
| **State** | Component-local state for form draft, upload-in-progress, submit loading, global form/field errors, success banner; no global store |
| **Styling** | React Bootstrap + Bootstrap CSS; respect `src/index.css` project colors where applicable |

**Files referenced:** `ai-specs/us/01_ADD_CANDIDATE.md`, `ai-specs/specs/api-spec.yml` (`/upload`, `POST /candidates`, schemas), `ai-specs/specs/data-model.md`, `ai-specs/specs/frontend-standards.mdc`, `ai-specs/specs/documentation-standards.mdc`.

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch before any application code changes.
- **Branch naming**: Per `frontend-standards.mdc` (“descriptive suffix `-frontend`”): e.g. `feature/01-add-candidate-frontend` (kebab-case slug from story `01_ADD_CANDIDATE`).
- **Implementation steps**:
  1. Ensure base branch is up to date (`main` or `develop`, per team convention).
  2. `git pull origin <base-branch>`
  3. `git checkout -b feature/01-add-candidate-frontend`
  4. `git branch` to verify.
- **Notes**: First step; no code until branch exists.

---

### Step 1: Add Frontend Dependencies and Bootstrap Entry

- **Files**: `frontend/package.json`, `frontend/src/index.tsx` (or `index.css`)
- **Action**: Add runtime dependencies required by project standards: `react-router-dom`, `axios`, `react-bootstrap`, `bootstrap`. Add dev dependency for E2E: `cypress` (and wire npm scripts per `frontend-standards.mdc`: `cypress:open`, `cypress:run`). Install types if needed (`@types/react-router-dom` if not bundled).
- **Implementation steps**:
  1. From `frontend/`, install packages with exact versions consistent with React 18.
  2. Import Bootstrap CSS once globally (e.g. `import 'bootstrap/dist/css/bootstrap.min.css'` in `index.tsx`).
  3. Add `cypress` config folder (`cypress.config.ts` / `cypress/support/e2e.ts`) minimal scaffold if not present.
- **Dependencies**: npm packages above.
- **Notes**: `development_guide.md` references Cypress scripts; align `package.json` scripts with that guide when adding Cypress.

---

### Step 2: Environment and API Base URL

- **Files**: `frontend/.env.example` (if repo uses it), `frontend/.env` (local, gitignored), service modules
- **Action**: Use `REACT_APP_API_URL` (default `http://localhost:3000` per `development_guide.md` / api-spec server) as the single base for `axios` instances or helper `getApiBaseUrl()`.
- **Implementation steps**:
  1. Document in plan/README or ensure `.env.example` lists `REACT_APP_API_URL=`.
  2. No secrets in client env; URL only.
- **Notes**: All service calls use this base; no hardcoded host in components.

---

### Step 3: TypeScript API Types

- **File**: `frontend/src/types/candidate.ts` (or split `upload.ts` if preferred)
- **Action**: Export interfaces matching `api-spec.yml`: `CreateCandidateRequest`, `CreateEducationRequest`, `CreateWorkExperienceRequest`, `CreateResumeRequest`, `FileUploadResponse`, `CreateCandidateResponse`, `ErrorResponse`. Use `date-time` fields as `string` (ISO) in payloads.
- **Signatures** (illustrative):

```typescript
export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  educations?: CreateEducationRequest[];
  workExperiences?: CreateWorkExperienceRequest[];
  cv?: CreateResumeRequest;
}
// ... plus other interfaces from OpenAPI
```

- **Implementation steps**:
  1. Map each nested schema from `components/schemas` in `api-spec.yml`.
  2. Export types used by services and form state.
- **Dependencies**: None beyond TypeScript.

---

### Step 4: HTTP Services — Upload and Create Candidate

- **Files**: `frontend/src/services/uploadService.ts`, `frontend/src/services/candidateService.ts`
- **Action**:
  - `uploadFile(file: File): Promise<FileUploadResponse>` — `POST /upload` with `multipart/form-data`, field name `file` per spec; handle non-2xx by throwing or returning structured error with `ErrorResponse` body when JSON.
  - `createCandidate(payload: CreateCandidateRequest): Promise<CreateCandidateResponse>` — `POST /candidates`, `Content-Type: application/json`.
- **Signatures**:

```typescript
// uploadService.ts
export async function uploadFile(file: File): Promise<FileUploadResponse>;

// candidateService.ts
export async function createCandidate(
  payload: CreateCandidateRequest
): Promise<CreateCandidateResponse>;
```

- **Implementation steps**:
  1. Create `axios` instance with `baseURL: process.env.REACT_APP_API_URL` (with fallback for dev).
  2. Upload: `FormData` append `file`.
  3. Parse error responses: read `message` / `error` from JSON for display mapping.
  4. Do not leak raw `filePath` in user-facing strings if product forbids it; success message can show candidate `id` only.
- **Dependencies**: `axios`, types from Step 3.
- **Notes**: Try/catch in services or let components catch—be consistent; propagate `AxiosError` with parsed `ErrorResponse`.

---

### Step 5: Validation Helpers (TDD)

- **Files**: `frontend/src/validation/candidateFormValidation.ts` (or `utils/validation/...`), `frontend/src/validation/candidateFormValidation.test.ts`
- **Action**: Pure functions validating user story rules:
  - Names: required, 2–100 chars, letters only (define regex per `data-model.md` / story).
  - Email: format (client); uniqueness is server-only—surface duplicate via API.
  - Phone: optional; if set, Spanish pattern `(6|7|9)XXXXXXXX`, max 15 chars.
  - Address: max 100.
  - Education: max **3** rows; each row: institution, title, startDate required; endDate optional; max lengths per story.
  - Work: company, position, startDate required; description max 200; endDate optional.
  - CV: optional; if file chosen—extension/MIME PDF or DOCX, max 10 MB **before** upload.
- **Signature** (illustrative):

```typescript
export type FieldErrors = Record<string, string | undefined>;

export function validateCandidateForm(state: AddCandidateFormState): {
  valid: boolean;
  errors: FieldErrors;
};
```

- **Implementation steps**:
  1. Write failing unit tests for each rule (Jest, existing `jest.config.js`).
  2. Implement helpers until tests pass.
- **Dependencies**: None for pure functions.
- **Notes**: Align date inputs with ISO strings sent to API (`date-time`).

---

### Step 6: Dashboard Component — Discoverability

- **File**: `frontend/src/components/RecruiterDashboard.tsx`
- **Action**: Main recruiter landing view with a **primary** Button (or clear link-styled control) labeled **Add candidate**, visible without scrolling on typical desktop, **`tabIndex` / natural tab order**, navigates to add-candidate route via `useNavigate()`.
- **Signature**:

```typescript
export function RecruiterDashboard(): JSX.Element;
```

- **Implementation steps**:
  1. Use React Bootstrap `Container`, `Button` (variant primary).
  2. `to="/candidates/new"` or chosen path with `<Link>` or `navigate(...)`.
  3. Optional `aria-label` if control is icon-only (prefer visible text per story).
- **Dependencies**: `react-router-dom`, `react-bootstrap`.

---

### Step 7: Add Candidate Page — Form Sections and Submit Orchestration

- **File**: `frontend/src/components/AddCandidatePage.tsx` (split subcomponents if file grows: `EducationSection`, `WorkExperienceSection`, `CandidateIdentitySection`)
- **Action**:
  - Controlled inputs for all fields; repeatable lists: education (add/remove, cap 3), work experience (add/remove, reasonable max or unlimited per story—story says only education max 3).
  - CV: `<Form.Control type="file" accept="...">`; clear/replace file; local validation before upload.
  - Submit flow:
    1. Run client validation; if invalid, set field errors + `aria-describedby` / invalid feedback per `frontend-standards.mdc`.
    2. If valid and file present: `uploadFile` → store `filePath` + `fileType` for `cv: { filePath, fileType }`.
    3. If valid and no file: omit `cv` or omit `cv` key.
    4. `createCandidate` with JSON body; `educations` / `workExperiences` arrays omit empty rows or only include filled rows—be consistent and match API (empty arrays vs omitted).
  - Loading: disable submit and show `Spinner` during upload and/or create.
  - Success: on **201**, show Alert/toast with confirmation and **candidate id** from `CreateCandidateResponse`; optional `navigate` to detail route if exists (else stay on form with success banner—**pick one behavior and test it**).
- **Signature**:

```typescript
export function AddCandidatePage(): JSX.Element;
```

- **Implementation steps**:
  1. Build form state object matching `CreateCandidateRequest` shape.
  2. Map duplicate email / 400 errors to user-facing: “A candidate with this email already exists” when `message` or `error` indicates duplicate (coordinate string with backend).
  3. Network errors: non-technical message + retry without clearing form where possible.
  4. Upload errors: distinguish 400 (type/size) vs 500.
- **Dependencies**: services, validation, types, `react-bootstrap` Form/Alert/Spinner.

---

### Step 8: Routing and App Shell

- **Files**: `frontend/src/App.tsx`, `frontend/src/index.tsx` (wrap with `BrowserRouter` here or in `App.tsx`)
- **Action**: Replace default CRA placeholder with routes:
  - `/` → `RecruiterDashboard`
  - `/candidates/new` → `AddCandidatePage` (or chosen path; document in code comment)
- **Signature**: `App` exports default layout with `<Routes>` / `<Route>`.
- **Implementation steps**:
  1. Wrap app with `BrowserRouter`.
  2. Add a minimal nav skip link or heading for a11y if standards require.
- **Dependencies**: `react-router-dom`.

---

### Step 9: Unit Tests — Components and Integration Points

- **Files**: `frontend/src/tests/AddCandidatePage.test.tsx` (or co-located), extend `App.test.tsx` for routing smoke
- **Action**: React Testing Library: render dashboard CTA, render form, submit with mocked services, assert validation messages and success path.
- **Implementation steps**:
  1. Mock `axios` or services to avoid real HTTP.
  2. Cover duplicate email path with mocked 400 response body.
- **Notes**: Follow TDD where tests are written alongside or before implementation per project rules.

---

### Step 10: Cypress E2E Tests

- **Files**: `frontend/cypress/e2e/add-candidate.cy.ts` (or `.js`)
- **Action**: E2E per user story and `development_guide.md`:
  - Happy path: open dashboard → add candidate → fill required fields → submit → success visible (with backend running or `cy.intercept` for API).
  - Error: duplicate email / validation errors if stubbed.
- **Implementation steps**:
  1. `cy.visit` base URL (CRA default port may differ from backend—document `baseUrl` in Cypress config; align with `package.json` and dev guide `localhost:3001` for frontend).
  2. Use `data-testid` attributes sparingly on submit button and key fields for stable selectors.
- **Dependencies**: Cypress from Step 1.

---

### Step 11: Update Technical Documentation

- **Action**: Mandatory before marking work complete (per command template).
- **Implementation steps**:
  1. Review all code and config changes.
  2. If **only** frontend consumes existing API: update `ai-specs/specs/frontend-standards.mdc` only if new UI patterns (e.g. repeatable form blocks) should become standard; otherwise minimal churn.
  3. If routing or env vars change developer setup: ensure `development_guide.md` or frontend README reflects `REACT_APP_API_URL`, Cypress commands, and routes.
  4. Do **not** change `api-spec.yml` / `data-model.md` unless the implementation intentionally changes the contract (unlikely for pure frontend story).
  5. All doc updates in **English** per `documentation-standards.mdc`.

---

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/01-add-candidate-frontend`
2. **Step 1**: Dependencies (router, axios, react-bootstrap, bootstrap, Cypress) + scripts
3. **Step 2**: Environment variable for API URL
4. **Step 3**: TypeScript API types
5. **Step 4**: `uploadService` and `candidateService`
6. **Step 5**: Validation helpers + unit tests (TDD)
7. **Step 6**: `RecruiterDashboard`
8. **Step 7**: `AddCandidatePage` (form + orchestration)
9. **Step 8**: `App.tsx` / router wiring
10. **Step 9**: RTL unit tests for components
11. **Step 10**: Cypress E2E
12. **Step 11**: Documentation updates

---

## 5. Testing Checklist

- [ ] Unit tests pass for validation helpers (all field rules + education max 3).
- [ ] `RecruiterDashboard`: “Add candidate” visible, navigates to form, keyboard reachable.
- [ ] Form blocks submit when client validation fails; messages shown per field.
- [ ] With CV: upload then create called in order; `cv` payload matches `CreateResumeRequest`.
- [ ] Without CV: create without `cv`.
- [ ] 201: success UI shows and includes candidate **id**.
- [ ] Duplicate email: dedicated message, form data preserved.
- [ ] Network failure: user-friendly message, retry possible.
- [ ] Upload failure: type/size vs server error distinguished where API allows.
- [ ] Cypress: happy path + at least one error path.
- [ ] ESLint + TypeScript compile clean.

---

## 6. Error Handling Patterns

| Scenario | Behavior |
|----------|----------|
| **Axios network error** | Show generic actionable message; avoid raw stack traces |
| **400 validation** | Map `ErrorResponse.message` to Alert; field-level when API provides field hints (if not, show top Alert) |
| **Duplicate email** | Specific copy; set `email` field error if UX allows |
| **Upload 400** | Explain file type/size per spec |
| **500** | Generic server error; offer retry |

Services should normalize errors to a shape components can branch on (e.g. `{ kind: 'duplicate_email' | 'validation' | 'network' | 'server', message: string }`) if that reduces duplication.

---

## 7. UI/UX Considerations

- **React Bootstrap**: `Container`, `Row`, `Col`, `Card`, `Form`, `Button`, `Alert`, `Spinner` for consistent UI.
- **Responsive**: Stack sections on narrow viewports; touch targets per standards.
- **Accessibility**: Associate `<Form.Label>` with controls; `isInvalid` + `Form.Control.Feedback`; `aria-describedby` for errors; consider `role="alert"` or live region for submit errors/success per `frontend-standards.mdc`.
- **Loading**: Disable submit and show spinner during async work.
- **English**: All UI strings in English per project language rules.

---

## 8. Dependencies

| Package | Purpose |
|---------|---------|
| `react-router-dom` | Dashboard + add-candidate routes |
| `axios` | HTTP client for REST |
| `react-bootstrap` | UI components |
| `bootstrap` | CSS for react-bootstrap |
| `cypress` | E2E tests |
| Jest / RTL | Already in project for unit tests |

---

## 9. Notes

- **Backend dependency**: E2E and manual testing require `POST /upload` and `POST /candidates` implemented per `api-spec.yml`; coordinate with backend or use `cy.intercept` for isolated UI tests.
- **Ports**: Backend `3000`, frontend dev often `3001` in `development_guide.md`—configure Cypress `baseUrl` accordingly.
- **Date fields**: Use HTML date inputs or datetime as appropriate; serialize to ISO `date-time` strings for API.
- **Education empty rows**: UX: either require explicit “Add education” for first row or show one empty row—ensure submitted payload has no invalid partial rows.
- **Letters-only names**: Regex must match backend to avoid frustrating 400s—confirm against `data-model.md`.
- **Out of scope per story**: Bulk import, editing candidate, CV parsing, autocomplete—do not implement.

---

## 10. Next Steps After Implementation

- Run full `npm test` and `npm run cypress:run` in CI if pipeline exists.
- Product review on success navigation (stay vs redirect).
- Backend integration smoke test in staging.

---

## 11. Implementation Verification

- [ ] **Code quality**: Typed services and components; no `any` without justification; ESLint clean.
- [ ] **Functionality**: Matches acceptance criteria in `01_ADD_CANDIDATE.md`.
- [ ] **Testing**: Unit + E2E cover critical paths.
- [ ] **Integration**: Manual run against local API with and without CV.
- [ ] **Documentation**: Step 11 completed; env and scripts documented.

---

*Prepared from `ai-specs/us/01_ADD_CANDIDATE.md` and `/ai-specs/specs`. For implementation workflow after planning, follow `ai-specs/.commands/develop-frontend.md`.*
