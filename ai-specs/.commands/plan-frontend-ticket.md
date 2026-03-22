# Role

You are an expert frontend architect with extensive experience in React projects applying best practices.

# User story (Markdown)

**Parameter:** `$ARGUMENTS`

This must be the **path** to a Markdown file (`.md`) that contains the user story or frontend requirements (for example `ai-specs/us/01_ADD_CANDIDATE.md`).

- Read that file from the workspace and treat it as the single source of truth for scope and acceptance criteria.
- If the path is missing, invalid, or the file cannot be read, stop and report the error clearly; do not invent requirements.

# Goal

Produce a step-by-step frontend implementation plan that is ready to start coding, based **only** on the given user story Markdown file and the project specs under `/ai-specs/specs`.

# Process and rules

1. Adopt the role of `ai-specs/.agents/frontend-developer.md` (or `.claude/agents/frontend-developer.md` if present in the project).
2. **Analyze the user story** by reading the Markdown file at the path given in `$ARGUMENTS`. Do not use Jira, external ticket systems, or MCP to fetch ticket content.
3. Propose a step-by-step plan for the frontend part, taking into account everything stated in that user story and applying the project’s best practices and rules in `/ai-specs/specs`.
4. Apply the best practices of your role so the developer can be autonomous and implement the work end-to-end using only your plan.
5. Do not write application code yet; provide only the plan in the output format defined below.
6. If implementation is requested later, follow the workflow in `ai-specs/.commands/develop-frontend.md` (including creating a feature branch as described there).

# Output path and naming

Let **`story_basename`** be the filename of the user story file **without** the `.md` extension (e.g. `01_ADD_CANDIDATE` from `ai-specs/us/01_ADD_CANDIDATE.md`).

Write the plan to:

`ai-specs/changes/[story_basename]_frontend.md`

Use this same `story_basename` (or a short kebab-case slug derived from it) for branch naming references in the plan template, consistent with `ai-specs/specs/frontend-standards.mdc` “Development Workflow”.

# Output format

Markdown document at the path above, containing the complete implementation details.
Follow this template:

## Frontend Implementation Plan Template Structure

### 1. **Header**
- Title: `# Frontend Implementation Plan: [story_basename] [Feature Name]`

### 2. **Overview**
- Brief description of the feature and frontend architecture principles (component-based architecture, service layer, React patterns)

### 3. **Architecture Context**
- Components/services involved
- Files referenced
- Routing considerations (if applicable)
- State management approach

### 4. **Implementation Steps**
Detailed steps, typically:

#### **Step 0: Create Feature Branch**
- **Action**: Create and switch to a new feature branch following the development workflow. Check if it exists and if not, create it
- **Branch Naming**: Follow the project's branch naming convention (`feature/[story-slug]-frontend`; use a slug derived from `story_basename` so frontend work is separated from other concerns)
- **Implementation Steps**:
  1. Ensure you're on the latest `main` or `develop` branch (or appropriate base branch)
  2. Pull latest changes: `git pull origin [base-branch]`
  3. Create new branch: `git checkout -b [branch-name]`
  4. Verify branch creation: `git branch`
- **Notes**: This must be the FIRST step before any code changes. Refer to `ai-specs/specs/frontend-standards.mdc` section "Development Workflow" for specific branch naming conventions and workflow rules.

#### **Step N: [Action Name]**
- **File**: Target file path
- **Action**: What to implement
- **Function/Component Signature**: Code signature
- **Implementation Steps**: Numbered list
- **Dependencies**: Required imports
- **Implementation Notes**: Technical details

Common steps:
- **Step 1**: Update/Create Service Methods (API communication in `src/services/`)
- **Step 2**: Create/Update Components (React components in `src/components/`)
- **Step 3**: Update Routing (if new pages/routes needed in `src/App.js`)
- **Step 4**: Write Cypress E2E Tests (test files in `cypress/e2e/`)

#### **Step N+1: Update Technical Documentation**
- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes made during implementation
  2. **Identify Documentation Files**: Determine which documentation files need updates based on:
     - API endpoint changes → Update `ai-specs/specs/api-spec.yml`
     - UI/UX patterns or component patterns → Update `ai-specs/specs/frontend-standards.mdc`
     - Routing changes → Update routing documentation
     - New dependencies or configuration changes → Update `ai-specs/specs/frontend-standards.mdc`
     - Test patterns or Cypress changes → Update testing documentation
  3. **Update Documentation**: For each affected file:
     - Update content in English (as per `documentation-standards.mdc`)
     - Maintain consistency with existing documentation structure
     - Ensure proper formatting
  4. **Verify Documentation**: 
     - Confirm all changes are accurately reflected
     - Check that documentation follows established structure
  5. **Report Updates**: Document which files were updated and what changes were made
- **References**: 
  - Follow process described in `ai-specs/specs/documentation-standards.mdc`
  - All documentation must be written in English
- **Notes**: This step is MANDATORY before considering the implementation complete. Do not skip documentation updates.

### 5. **Implementation Order**
- Numbered list of steps in sequence (must start with Step 0: Create Feature Branch and end with documentation update step)

### 6. **Testing Checklist**
- Post-implementation verification checklist
- Cypress E2E test coverage
- Component functionality verification
- Error handling verification

### 7. **Error Handling Patterns**
- Error state management in components
- User-friendly error messages
- API error handling in services

### 8. **UI/UX Considerations** (if applicable)
- Bootstrap component usage
- Responsive design considerations
- Accessibility requirements
- Loading states and feedback

### 9. **Dependencies**
- External libraries and tools required
- React Bootstrap components used
- Third-party packages (if any)

### 10. **Notes**
- Important reminders and constraints
- Business rules
- Language requirements (English only)
- TypeScript vs JavaScript considerations

### 11. **Next Steps After Implementation**
- Post-implementation tasks (documentation is already covered in Step N+1, but may include integration, deployment, etc.)

### 12. **Implementation Verification**
- Final verification checklist:
  - Code Quality
  - Functionality
  - Testing
  - Integration
  - Documentation updates completed
