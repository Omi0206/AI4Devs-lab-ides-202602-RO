Please analyze and enrich the following user story (pasted as plain text below). Do not use Jira or any external ticket system.

**User story (copy as text):**

$ARGUMENTS

Follow these steps:

1. Treat the text above as the full user story to refine. If it is empty or clearly incomplete as input, ask the user to paste the user story.
2. You will act as a product expert with technical knowledge.
3. Understand the problem described in the user story.
4. Decide whether or not the user story is completely detailed according to product best practices: include a full description of the functionality, a comprehensive list of fields to be updated, the structure and URLs of the necessary endpoints, the files to be modified according to the architecture and best practices, the steps required for the task to be considered complete, how to update any relevant documentation or create unit tests, and non-functional requirements related to security, performance, etc.
5. If the user story lacks the technical and specific detail necessary for a developer to be fully autonomous when completing it, produce an improved story that is clearer, more specific, and more concise in line with product best practices described in step 4. Use the technical context you will find in @documentation. If the pasted story is already sufficient, refine it only lightly for consistency and clarity. The deliverable is always the **enriched** user story in markdown—do not reproduce the original as a separate section.
6. **Output file (required):** Persist **only** the enriched user story as a single markdown file directly under `ai-specs/us/` (no subfolders). The **filename** is `{NN}_{DESCRIPTIVE_NAME}.md` where:
   - `{NN}` is a two-digit consecutive index (01, 02, …). List existing **files** in `ai-specs/us/` matching `^\d{2}_.+\.md$` and set `{NN}` to the next number (if none exist, use `01`).
   - `{DESCRIPTIVE_NAME}` is a short, clear identifier in `SCREAMING_SNAKE_CASE` derived from the story (for example `ADD_CANDIDATE`, `UPDATE_POSITION`).
   - **Full path example:** `ai-specs/us/02_UPDATE_POSITION.md`
7. The file content must be the enriched story only: no `## [original]` block, no copy of the pasted text as reference. Apply proper formatting so it is readable and visually clear, using appropriate structure (lists, code snippets, etc.).
