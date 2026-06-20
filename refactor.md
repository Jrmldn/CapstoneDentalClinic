I want you to scan this entire repository/workspace and perform a systemic refactor across all relevant files to drastically improve code readability, eliminate technical debt, and ensure consistent architectural patterns.

### SCOPE: WHOLE-CODEBASE / PROJECT-WIDE APPLICATION
- You must apply these refactoring directives globally across the entire project workspace.
- Traverse all directories, components, pages, custom hooks, context providers, API handlers, and utility files. 
- Ensure that architectural patterns, naming conventions, and code layouts are updated uniformly throughout the entire codebase, maintaining strict consistency across all files.

### CRITICAL CORE REQUIREMENT: PRESERVE EXACT FUNCTIONAL BEHAVIOR
- Do NOT alter, optimize, or guess the business logic, runtime behavior, or underlying functionality of the codebase. 
- The application must behave EXACTLY as it did before the refactor. 
- Every conditional outcome, state update, API payload structure, database sync interaction, and logical edge case must remain completely unchanged. Your sole focus is restructuring for *readability* and *cleanliness*, not changing *what* the code does.

### Architectural, Quality, & Readability Directives:

1. FLATTEN LOGIC (GUARD CLAUSES):
   - Traverse all functions, hooks, and components. Eliminate deep 'if/else' nesting and "pyramids of doom."
   - Convert them to clean early returns, handling error states, validation failures, and exit conditions at the very top of the function while preserving the exact original fallback states.

2. EXTRACT COMPLEX CONDITIONS & DECOUPLE BUSINESS LOGIC:
   - Identify brittle inline conditions (e.g., hardcoded arrays of status strings, multiple sequential logical operators, shifting `new Date()` snapshots in render loops).
   - Extract these into self-documenting, well-named boolean variables or pure utility functions without changing the evaluated logic.
   - If complex data filtering or formatting is heavily mixed into UI components, separate them into standalone utility files or custom React hooks.

3. INTENTIONAL & STRATEGIC NAMING:
   - Audit variable, function, component, and file names. Rename ambiguous or generic names (e.g., 'res', 'd', 'item', 'data', single-letter iterators) to names that explicitly convey domain meaning and context. Add units to variables where appropriate (e.g., 'delayMs').

4. ENFORCE VISUAL PARAGRAPHS (VERTICAL WHITESPACE):
   - Insert a single empty line between distinct logical steps within a function (e.g., separate guard clauses from data fetching, and separate fetching from state updates). 
   - Group related lines of code tightly together and give them breathing room from unrelated blocks to make scanning effortless.

5. ELIMINATE MAGIC NUMBERS & STRINGS:
   - Extract raw, unexplained numbers or recurring status strings into clearly named configuration constants, objects, or TypeScript enums at the top of the file (e.g., convert `86400000` to `MILLISECONDS_IN_A_DAY`).

6. PREFER OBJECT DESTRUCTURING:
   - Destructure objects and props at the top of functions or component declarations to avoid repeating long object paths (e.g., prefer `const { status, scheduled_at } = appointment` over repeating `appointment.status` everywhere).

7. CLEAN UP UI STYLING STRINGS:
   - If a component has long, sprawling utility class strings (e.g., Tailwind CSS), organize them cleanly.
   - Break long class strings into readable, multi-line layouts, or extract highly repetitive style combinations into descriptive variables at the top of the component file.

8. INTENTIONAL COMMENTING ("WHY", NOT "WHAT"):
   - Strip out redundant, noisy comments that simply restate what the code is doing (e.g., delete `// Filter upcoming appointments`).
   - Only use comments to explain non-obvious business decisions, complex algorithms, or workaround edge cases (the "why" behind the code).

9. COMPONENT SPLITTING & COMPACTNESS:
   - If a UI component becomes too large (e.g., exceeding 150 lines) or contains messy nested rendering functions, extract those sub-sections into small, focused sub-components within the same file or a dedicated subfolder.

10. STRICT TYPE SAFETY (NO 'ANY') & IMPORT INTEGRITY:
    - Maintain perfect TypeScript compliance. Eliminate any usage of the `any` type; replace them with explicit, strongly-typed interfaces, types, or generics. 
    - Do not use lazy type assertions (`as unknown as X`) unless absolutely necessary.
    - Automatically update and fix any broken import/export paths across files caused by moving logic into separate utilities.

11. REACT & HOOKS STANDARD COMPLIANCE:
    - Ensure all React Hooks (`useState`, `useEffect`, `useMemo`, etc.) are called strictly at the top level of components—never inside loops, conditions, or nested functions.
    - Audit dependency arrays for hooks to ensure they are accurately populated, preventing stale closures, memory leaks, or infinite re-render loops.

12. ROBUST & UNIFORM ERROR HANDLING:
    - Ensure every asynchronous operation (`async/await`) is safely wrapped in a `try/catch` block.
    - Ensure failed operations gracefully pass along their errors or trigger your defined UI fallback/error states instead of failing silently.

13. CODE HOUSEKEEPING & SANITIZATION (DRY):
    - Identify identical or highly similar helper logic duplicated across different components or modules and centralize them into shared, reusable files.
    - Strip out all abandoned or leftover `console.log()` statements used during previous debugging sessions.
    - Permanently remove dead, commented-out blocks of code and any unused imports.

### Execution Plan:
Do not refactor blindly. Follow these steps:
1. Scan the project and identify the modules or directories that will benefit most from this readability refactor (e.g., components, hooks, api handlers).
2. Present a high-level summary of the architectural improvements you plan to make before executing them.
3. Systematically apply the changes across the files, guaranteeing zero breaking changes to the runtime application logic.
4. Group your changes logically and provide suggested Git commit messages for each major piece of the refactor (e.g., "refactor: extract date utils", "style: flatten appointment component logic") so the code review process remains clean, transparent, and atomic.