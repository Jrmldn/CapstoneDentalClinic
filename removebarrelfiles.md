You are refactoring a TypeScript/Next.js codebase to remove all barrel files (index.ts or index.js files that only re-export from other modules).

**Goal:** Replace every barrel file import with a direct import pointing to the actual source file. Do NOT change any runtime logic, types, function signatures, or component behavior — only import paths change.

---

**STEP 1 — Identify all barrel files**

A barrel file is any index.ts / index.js whose entire content consists of `export { ... } from '...'`, `export * from '...'`, or `export type { ... } from '...'` lines, and nothing else (no runtime logic, no default export of a real value, no side effects).

List every barrel file found with its path.

---

**STEP 2 — Build a re-export map**

For each barrel file, produce a map of every named export (and `export *`) to its real source file:

  barrelPath  →  { exportedName: realSourceFile }

If a barrel re-exports from another barrel, resolve transitively until you reach the real source file.

---

**STEP 3 — Find all import sites**

Scan every .ts, .tsx, .js, .jsx file (excluding node_modules and .next).

For each import that resolves to a barrel file, record:
  - importer file path
  - original import statement
  - each named import and which real source file it maps to (from Step 2)

Group named imports that share the same real source into one import statement.

---

**STEP 4 — Rewrite imports**

For each import site from Step 3, replace the barrel import with one or more direct imports.

Rules:
- Preserve the exact import specifiers (names, aliases, `type` modifier).
- If multiple names come from the same real source, merge them into one import line.
- Use relative paths from the importer to the real source (no path aliases unless the project already uses them consistently — if so, keep the same alias format).
- Do not add or remove any imports beyond what is needed to replace barrel references.
- Do not touch any non-import lines.

---

**STEP 5 — Delete barrel files**

After all import sites are rewritten, delete every barrel file identified in Step 1.

Do not delete an index.ts / index.js that contains real logic (e.g. a Next.js route handler, a utility function, a React component, or side-effect code) — only pure re-export files are barrels.

---

**STEP 6 — Verify**

For each changed file, confirm:
1. Every import still resolves to an existing exported symbol.
2. No import was silently dropped.
3. TypeScript types imported with `import type` still use `import type` after the rewrite.
4. No circular imports were introduced.

Report any import that could not be automatically resolved and needs manual review.

---

**Output format**

For each file you modify, show a unified diff. After all diffs, show a summary:
  - Barrel files deleted: N
  - Import sites rewritten: N
  - Files that need manual review (if any): list with reason