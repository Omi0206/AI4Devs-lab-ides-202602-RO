# Develop backend from Markdown

**Parameter:** `$ARGUMENTS`

Path to a Markdown file (`.md`). Use one of:

- **User story** — e.g. `ai-specs/us/01_ADD_CANDIDATE.md`
- **Backend plan** — e.g. `ai-specs/changes/01_ADD_CANDIDATE_backend.md` (output of `plan-backend-ticket`)

If you pass a user story path, read `ai-specs/changes/[story_basename]_backend.md` when it exists (`story_basename` = filename without `.md`) and treat it as the implementation plan. If that file is missing, implement from the user story Markdown alone.

Do not use Jira or external ticket systems; scope comes only from these files and `/ai-specs/specs`.

---

Follow these steps:

1. **Understand the work** from the Markdown file(s) above and any linked specs under `ai-specs/specs`.
2. **Search the codebase** for relevant files and follow `ai-specs/.agents/backend-developer.md` (or `.claude/agents/backend-developer.md` if present) and backend standards.
3. **Create a branch** named from the story or plan, not a Jira ID — e.g. `feature/[story-slug]-backend`, where `story-slug` matches the basename (e.g. `01-add-candidate` from `01_ADD_CANDIDATE`). Follow `ai-specs/specs/backend-standards.mdc` for workflow.
4. **Implement** changes in the order described in the backend plan (or derived from the user story): tests where required, code, documentation updates (`data-model.md`, `api-spec.yml`, etc. per project rules).
5. **Verify** code passes linting and type checking.
6. **Commit** only files touched for this work; use a clear English commit message describing the change (no Jira key requirement).
7. **Push and open a PR** with the GitHub CLI (`gh`): title and body should describe the feature using the story/plan name (e.g. `01_ADD_CANDIDATE` / short feature title), not a Jira ticket id.

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
